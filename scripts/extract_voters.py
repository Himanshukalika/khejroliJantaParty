#!/usr/bin/env python3
"""
ECI Voter List PDF Extractor — Hybrid (pdftotext + OCR)
Gives accurate Hindi names via tesseract OCR.

Usage:
  python3 scripts/extract_voters.py <pdf_path>              → JSON to stdout
  python3 scripts/extract_voters.py <pdf_path> output.csv   → CSV file
"""

import sys, re, json, subprocess, csv, os
from pathlib import Path

# ── pdftotext helpers ──────────────────────────────────────────────────────

EPIC_RE   = re.compile(r'\b([A-Z]{2,4}\d{5,10}|[A-Z]{2}/\d{2}/\d{3}/\d{6})\b')
HOUSE_RE  = re.compile(r'(?:मकपन|मकान)\s+(?:सनखखप|संख्या)[:\s]+(\d+)')
AGE_GEN_RE= re.compile(r'(?:आखप|आयु)[:\s]+(\d+)\s+(?:ललग|लिंग)[ः:\s]*(सल|पपरष|स्त्री|पुरूष)')
WARD_RE   = re.compile(r'(?:वपरर|वार्ड)\s+(?:सनखखप|संख्या)\s*[:]\s*(\d+)')
PART_RE   = re.compile(r'(?:मपग|भाग)\s+(?:सनखखप|संख्या)\s*[:]\s*(\d+)')
SERIAL_EPIC= re.compile(r'\b(\d{1,3})\s+([A-Z]{2,4}\d{5,10}|[A-Z]{2}/\d{2}/\d{3}/\d{6})\b')

def pdftotext_layout(pdf_path):
    res = subprocess.run(
        ['pdftotext', '-layout', pdf_path, '-'],
        capture_output=True, text=True, encoding='utf-8', errors='replace'
    )
    return res.stdout

def parse_pdftotext(text):
    """Extract EPICs, houses, ages, genders in sequential voter order."""
    ward = WARD_RE.search(text)
    ward = ward.group(1) if ward else ""
    part = PART_RE.search(text)
    part = part.group(1) if part else ""

    voters = []
    lines = text.split('\n')

    for i, line in enumerate(lines):
        # A "serial + EPIC" line has at least one serial-EPIC pair
        row_pairs = SERIAL_EPIC.findall(line)
        if not row_pairs:
            continue

        # Scan next 7 lines for house + age/gender
        window = lines[i+1 : i+8]
        house_row = next((l for l in window if HOUSE_RE.search(l)), "")
        age_row   = next((l for l in window if AGE_GEN_RE.search(l)), "")

        houses = HOUSE_RE.findall(house_row)
        ages   = AGE_GEN_RE.findall(age_row)

        for j, (serial_s, epic) in enumerate(row_pairs):
            house = houses[j] if j < len(houses) else ""
            if j < len(ages):
                age_s, gen_s = ages[j]
                age = int(age_s) if age_s.isdigit() else 35
                gender = "महिला" if gen_s in ("सल", "स्त्री") else "पुरुष"
            else:
                age, gender = 35, "पुरुष"
            voters.append({
                "serial": int(serial_s),
                "id":     epic,
                "house":  house,
                "age":    age,
                "gender": gender,
            })

    return voters, ward, part


# ── OCR helpers ──────────────────────────────────────────────────────────

def clean_name(s: str) -> str:
    """Extract clean Devanagari name — strip OCR noise (Photo is Available etc.)."""
    # Cut at first Latin noise word
    s = re.sub(
        r'(?i)\s+(?:photo|noe|pole|polo|pote|vate|vana|vanable|vananle|'
        r'available|variable|vattable|vatlable|{Vailable|{allable|{Vallable|able|'
        r'Pa\b|Mi\b|re\b|er\b|at\b|af\b|ATA:).*$',
        '', s
    )
    # Strip trailing relation keywords
    s = re.sub(r'\s+(?:पति|पिता|माता)\s+का\s*$', '', s).strip()
    # Keep only Devanagari + spaces
    dev = re.sub(r'[^ऀ-ॿ\s]', ' ', s)
    dev = re.sub(r'\s+', ' ', dev).strip()
    # Remove lone single-char artifacts
    dev = re.sub(r'(?<!\S)\S(?!\S)', '', dev).strip()
    # Require at least 3 Devanagari chars — otherwise treat as empty
    if len(dev.replace(' ', '')) < 3:
        return ''
    return dev

def clean_text(s: str) -> str:
    """Generic text cleaner (for non-name fields)."""
    s = re.sub(r'[|{}\[\]_^"\'`\\/<>]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

VAILABLE_RE = re.compile(
    r'\s*(?:{Vailable|{allable|{Vallable|Available|variable|vattable|vatlable)\s*', re.I
)

def split3(line, marker):
    """Split a line by a keyword marker, return up to 3 Devanagari-cleaned segments."""
    parts = re.split(marker, line)
    return [clean_name(p) for p in parts[1:4]]

def extract_mohalla(line):
    """Try to extract mohalla area name from OCR line."""
    m = re.search(r'(?:मौहल्ला|बावड़[^\s,]*|मोहल्ला)\s*([^,\[\]\d\|]+)', line)
    if m:
        return re.sub(r'\s+', ' ', m.group(0)).strip()
    return line.strip()

def parse_ocr_page(text):
    """Parse one page's OCR text, return list of voter dicts with names."""
    voters = []
    mohalla = ""
    lines = text.split('\n')

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect mohalla header
        if 'मौहल्ला' in line or 'बावड़' in line or 'मोहल्ला' in line:
            mohalla = extract_mohalla(line)
            i += 1
            continue

        # Detect name row
        if 'नाम:' in line:
            names = split3(line, r'नाम:\s*')
            names = [n for n in names if len(n) > 1]

            # Look ahead for relation line
            rel_line = ""
            for j in range(i+1, min(i+5, len(lines))):
                if re.search(r'पति\s+का\s+नाम|पिता\s+का\s+नाम|माता\s+का\s+नाम', lines[j]):
                    rel_line = lines[j].strip()
                    break

            # Parse relations: (type, name) triplets
            rel_pattern = re.compile(r'(पति|पिता|माता)\s+का\s+नाम:\s*')
            rel_parts = rel_pattern.split(rel_line)
            relations = []
            ri = 1
            while ri + 1 < len(rel_parts):
                rtype = rel_parts[ri].strip()
                rname = clean_name(VAILABLE_RE.sub('', rel_parts[ri+1]))
                relations.append((rtype, rname))
                ri += 2

            for k, name in enumerate(names[:3]):
                rel_type = relations[k][0] if k < len(relations) else ""
                rel_name = relations[k][1] if k < len(relations) else ""
                voters.append({
                    "name":          name,
                    "familyHead":    rel_name or name,
                    "relation":      rel_type,
                    "mohalla":       mohalla,
                })
        i += 1

    return voters


# ── Main merge ────────────────────────────────────────────────────────────

def extract_voters(pdf_path, first_voter_page=3):
    """Hybrid extraction: pdftotext for IDs/numbers, OCR for names."""
    from pdf2image import convert_from_path
    import pytesseract

    print("Step 1/2: pdftotext extraction…", file=sys.stderr)
    layout_text = pdftotext_layout(pdf_path)
    epic_data, ward, part = parse_pdftotext(layout_text)
    print(f"  Found {len(epic_data)} voters via pdftotext (ward={ward}, part={part})", file=sys.stderr)

    print("Step 2/2: OCR extraction (may take 60-90s for 30 pages)…", file=sys.stderr)
    images = convert_from_path(pdf_path, dpi=150, first_page=first_voter_page)
    ocr_voters = []
    for idx, img in enumerate(images):
        page_text = pytesseract.image_to_string(img, lang='hin+eng', config='--psm 6')
        page_voters = parse_ocr_page(page_text)
        ocr_voters.extend(page_voters)
        print(f"  Page {idx + first_voter_page}: {len(page_voters)} names", file=sys.stderr)

    print(f"  Total OCR names: {len(ocr_voters)}", file=sys.stderr)

    # Merge by position
    n = min(len(epic_data), len(ocr_voters))
    if n < len(epic_data) * 0.8:
        print(f"⚠ OCR count ({len(ocr_voters)}) much lower than pdftotext ({len(epic_data)}). Using pdftotext order.", file=sys.stderr)

    merged = []
    for i in range(n):
        e  = epic_data[i]
        nm = ocr_voters[i]
        merged.append({
            "id":         e["id"],
            "serial":     e["serial"],
            "name":       nm["name"],
            "familyHead": nm["familyHead"],
            "relation":   nm["relation"],
            "age":        e["age"],
            "gender":     e["gender"],
            "ward":       ward,
            "part":       part,
            "house":      e["house"],
            "area":       nm["mohalla"],
            "booth":      int(part) if part.isdigit() else 1,
        })

    # If OCR short, append remaining with placeholder names
    for i in range(n, len(epic_data)):
        e = epic_data[i]
        merged.append({
            "id":         e["id"],
            "serial":     e["serial"],
            "name":       f"मतदाता {e['serial']}",
            "familyHead": "",
            "relation":   "",
            "age":        e["age"],
            "gender":     e["gender"],
            "ward":       ward,
            "part":       part,
            "house":      e["house"],
            "area":       "",
            "booth":      int(part) if part.isdigit() else 1,
        })

    return merged, ward, part


# ── CLI entry point ───────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract_voters.py <pdf_path> [output.csv]", file=sys.stderr)
        sys.exit(1)

    pdf_path   = sys.argv[1]
    output_csv = sys.argv[2] if len(sys.argv) > 2 else None

    voters, ward, part = extract_voters(pdf_path)
    print(f"\n✅ {len(voters)} मतदाता extracted — Ward {ward}, Part {part}", file=sys.stderr)

    if output_csv:
        fields = ["id","serial","name","familyHead","relation","age","gender","ward","part","house","area","booth"]
        with open(output_csv, 'w', newline='', encoding='utf-8-sig') as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
            w.writeheader()
            w.writerows(voters)
        print(f"Saved to {output_csv}", file=sys.stderr)
    else:
        print(json.dumps(voters, ensure_ascii=False, indent=2))
