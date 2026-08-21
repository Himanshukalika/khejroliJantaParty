#!/usr/bin/env python3
"""
Fix area/mohalla for all voters using known serial ranges from the PDF.

Uses pdftotext only (fast, no OCR) to extract serial→EPIC mapping, then
assigns the correct mohalla based on the known serial boundaries, and prints
SQL UPDATE statements to stdout — paste them into the Supabase SQL Editor.

Usage:
  python3 scripts/fix_voter_areas.py <pdf_path>
  python3 scripts/fix_voter_areas.py <pdf_path> > fix_areas.sql
"""

import sys, re, subprocess
from collections import defaultdict

SERIAL_EPIC = re.compile(
    r'\b(\d{1,3})\s+([A-Z]{2,4}\d{5,10}|[A-Z]{2}/\d{2}/\d{3}/\d{6})\b'
)

# Known mohalla serial boundaries (Ward 20, Part 1)
MOHALLA_RANGES = [
    (1,   18,  'मौहल्ला खुमारान'),
    (19,  95,  'बावड़ी ढाणी'),
    (96,  453, 'कालिका ढाणी छोटी'),
    (454, 621, 'बुरोला'),
]


def pdftotext(pdf_path: str) -> str:
    res = subprocess.run(
        ['pdftotext', '-layout', pdf_path, '-'],
        capture_output=True, text=True, encoding='utf-8', errors='replace',
    )
    return res.stdout


def get_mohalla(serial: int) -> str:
    for start, end, name in MOHALLA_RANGES:
        if start <= serial <= end:
            return name
    return ''


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 fix_voter_areas.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    text = pdftotext(pdf_path)

    serial_to_epic: dict[int, str] = {}
    for line in text.splitlines():
        for serial_s, epic in SERIAL_EPIC.findall(line):
            serial = int(serial_s)
            if serial not in serial_to_epic:
                serial_to_epic[serial] = epic

    print(f"Found {len(serial_to_epic)} voter IDs via pdftotext.", file=sys.stderr)

    mohalla_ids: dict[str, list[str]] = defaultdict(list)
    missing = []
    for serial in sorted(serial_to_epic):
        epic = serial_to_epic[serial]
        mohalla = get_mohalla(serial)
        if mohalla:
            mohalla_ids[mohalla].append(epic)
        else:
            missing.append((serial, epic))

    if missing:
        print(f"Warning: {len(missing)} serials outside known ranges: {missing[:5]}…",
              file=sys.stderr)

    print("-- ============================================================")
    print("-- Fix voter क्षेत्र — auto-generated from PDF serial ranges")
    print("-- Paste into Supabase Dashboard → SQL Editor → New Query")
    print("-- ============================================================\n")

    for mohalla, ids in mohalla_ids.items():
        # Split into chunks of 200 IDs to stay within query length limits
        chunk_size = 200
        for i in range(0, len(ids), chunk_size):
            chunk = ids[i:i + chunk_size]
            id_list = ", ".join(f"'{v}'" for v in chunk)
            print(f"-- {mohalla}  ({len(ids)} voters total, chunk {i//chunk_size + 1})")
            print(f"UPDATE voters SET area = '{mohalla}' WHERE id IN ({id_list});\n")

    total = sum(len(v) for v in mohalla_ids.values())
    print(f"-- Total: {total} voter rows will be updated.", file=sys.stderr)


if __name__ == "__main__":
    main()
