import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

const ENV = {
  ...process.env,
  PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
};

/* ── Fast pdftotext fallback parser ─────────────────────────────────────── */

const EPIC_RE    = /\b(\d{1,3})\s+([A-Z]{2,4}\d{5,10}|[A-Z]{2}\/\d{2}\/\d{3}\/\d{6})\b/g;
const HOUSE_RE   = /(?:मकपन|मकान)\s+(?:सनखखप|संख्या)[:\s]+(\d+)/g;
const AGE_GEN_RE = /(?:आखप|आयु)[:\s]+(\d+)\s+(?:ललग|लिंग)[ः:\s]*(सल|पपरष|स्त्री|पुरूष)/g;

function parseLayoutText(text: string) {
  const wardM = text.match(/(?:वपरर|वार्ड)\s+(?:सनखखप|संख्या)\s*[:]\s*(\d+)/);
  const partM = text.match(/(?:मपग|भाग)\s+(?:सनखखप|संख्या)\s*[:]\s*(\d+)/);
  const ward  = wardM?.[1] ?? "";
  const part  = partM?.[1] ?? "";

  const lines = text.split("\n");
  const voters: Array<{
    id: string; serial: number; name: string; familyHead: string;
    age: number; gender: "पुरुष" | "महिला"; house: string; area: string;
    ward: string; part: string; booth: number;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const pairs: { serial: number; epic: string }[] = [];
    EPIC_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = EPIC_RE.exec(line)) !== null)
      pairs.push({ serial: parseInt(m[1]), epic: m[2] });
    if (!pairs.length) continue;

    const window = lines.slice(i + 1, i + 8).join("\n");
    const houses: string[] = [];
    HOUSE_RE.lastIndex = 0;
    while ((m = HOUSE_RE.exec(window)) !== null) houses.push(m[1]);

    const ageGens: { age: number; gender: "पुरुष" | "महिला" }[] = [];
    AGE_GEN_RE.lastIndex = 0;
    while ((m = AGE_GEN_RE.exec(window)) !== null) {
      const age = parseInt(m[1]);
      const gender: "पुरुष" | "महिला" =
        m[2] === "सल" || m[2] === "स्त्री" ? "महिला" : "पुरुष";
      ageGens.push({ age: isNaN(age) ? 35 : age, gender });
    }

    for (let j = 0; j < pairs.length; j++) {
      const { serial, epic } = pairs[j];
      const ag = ageGens[j] ?? { age: 35, gender: "पुरुष" as const };
      voters.push({
        id: epic, serial,
        name: `मतदाता ${serial}`,
        familyHead: "",
        age: ag.age, gender: ag.gender,
        house: houses[j] ?? "", area: "",
        ward, part,
        booth: part ? (parseInt(part) || 1) : 1,
      });
    }
  }

  return { voters, ward, part };
}

/* ── Route handler ─────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "कोई फ़ाइल नहीं मिली" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".pdf"))
    return NextResponse.json({ error: "केवल PDF फ़ाइलें स्वीकार हैं" }, { status: 400 });

  const tmpId  = randomBytes(8).toString("hex");
  const tmpPdf = join(tmpdir(), `voter_${tmpId}.pdf`);

  try {
    writeFileSync(tmpPdf, Buffer.from(await file.arrayBuffer()));

    /* ── Try Python OCR script first (accurate names) ── */
    const scriptPath = join(process.cwd(), "scripts", "extract_voters.py");
    if (existsSync(scriptPath)) {
      try {
        const json = execSync(
          `python3 "${scriptPath}" "${tmpPdf}"`,
          { timeout: 180_000, maxBuffer: 16 * 1024 * 1024, encoding: "utf-8", env: ENV }
        ) as string;

        const ocrVoters = JSON.parse(json.trim()) as Array<{
          id: string; serial: number; name: string; familyHead: string;
          relation: string; age: number; gender: string;
          ward: string; part: string; house: string; area: string; booth: number;
        }>;

        if (ocrVoters.length > 0) {
          const ward = ocrVoters[0].ward;
          const part = ocrVoters[0].part;
          return NextResponse.json({
            voters: ocrVoters.map(v => ({
              id:         v.id,
              serial:     v.serial,
              name:       v.name,
              familyHead: v.familyHead,
              age:        v.age,
              gender:     v.gender === "महिला" ? "महिला" : "पुरुष",
              house:      v.house,
              area:       v.area,
              ward:       v.ward,
              part:       v.part,
              booth:      v.booth,
            })),
            ward, part,
            namesGarbled: false,
            message: `✅ ${ocrVoters.length} मतदाता OCR से extract हुए — नाम सही हैं।`,
          });
        }
      } catch {
        // OCR failed — fall through to pdftotext fallback
      }
    }

    /* ── Fallback: pdftotext only (garbled names) ── */
    let layoutText = "";
    try {
      layoutText = execSync(
        `pdftotext -layout "${tmpPdf}" -`,
        { timeout: 20_000, maxBuffer: 8 * 1024 * 1024, encoding: "utf-8", env: ENV }
      ) as string;
    } catch { /* pdftotext not found */ }

    if (layoutText && layoutText.trim().length > 100) {
      const { voters, ward, part } = parseLayoutText(layoutText);
      if (voters.length > 0) {
        return NextResponse.json({
          voters, ward, part,
          namesGarbled: true,
          message: `⚠️ OCR script नहीं चला — ${voters.length} मतदाता मिले लेकिन नाम placeholder हैं।`,
        });
      }
    }

    return NextResponse.json({
      voters: [],
      message: "PDF से data नहीं निकला।",
      rawText: layoutText.slice(0, 3000),
    });

  } finally {
    if (existsSync(tmpPdf)) unlinkSync(tmpPdf);
  }
}
