"use client";

import React, { useState, useEffect, useRef } from "react";
import db from "@/lib/db";

/* ── Types ─────────────────────────────────────── */
interface Election {
  id: string;
  name: string;
  type: "नगर पालिका वार्ड" | "नगर पालिका पूर्ण" | "विधान सभा" | "लोक सभा" | "पंचायत";
  date: string;
  constituency: string;
  state: string;
  status: "आगामी" | "सक्रिय" | "समाप्त";
  voterCount: number;
  candidateCount: number;
}

interface Party {
  id: string;
  name: string;
  abbreviation: string;
  symbol: string;
  color: string;
  candidates: string[];
}

interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
  category: "सामान्य" | "चुनाव" | "घोषणा" | "परिणाम";
  published: boolean;
}

interface Voter {
  id: string;
  name: string;
  familyHead: string;
  booth: number;
  area: string;
  age: number;
  gender: "पुरुष" | "महिला";
  ward?: string;
  part?: string;
  relation?: string;
  electionId?: string;
}


/* ── CSV helpers ──────────────────────────────── */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/* ── CSV parser ────────────────────────────────── */
function parseCSV(raw: string): Voter[] {
  const lines = raw.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  // Detect ECI-extracted format (our voter_list_extractor.py output)
  const isECI = /EPIC/i.test(firstLine) && /मोहल्ला|mohalla/i.test(firstLine);

  if (isECI) {
    const header = parseCSVLine(firstLine);
    const ci = (names: string[]) => {
      for (const n of names) {
        const i = header.findIndex(h => h.includes(n));
        if (i >= 0) return i;
      }
      return -1;
    };
    const epicIdx   = ci(["EPIC"]);
    const nameIdx   = ci(["नाम"]);
    const relIdx    = ci(["संबंधी का नाम"]);
    const areaIdx   = ci(["मोहल्ला"]);
    const boothIdx  = ci(["भाग"]);
    const ageIdx    = ci(["आयु"]);
    const genderIdx = ci(["लिंग"]);

    return lines.slice(1).map((line, i) => {
      const c = parseCSVLine(line);
      const ageVal = parseFloat(c[ageIdx] ?? "35");
      const age = isNaN(ageVal) || ageVal < 18 ? 35 : Math.round(ageVal);
      const rawG = c[genderIdx] ?? "";
      const gender: "पुरुष" | "महिला" = rawG.includes("पुरुष") ? "पुरुष" : "महिला";
      return {
        id: (epicIdx >= 0 && c[epicIdx]) ? c[epicIdx] : `ECI-${Date.now()}-${i}`,
        name: (nameIdx >= 0 ? c[nameIdx] : "") || `मतदाता ${i + 1}`,
        familyHead: (relIdx >= 0 ? c[relIdx] : "") || "-",
        booth: boothIdx >= 0 ? parseInt(c[boothIdx] ?? "1") || 1 : 1,
        area: (areaIdx >= 0 ? c[areaIdx] : "") || "आयातित",
        age,
        gender,
      };
    });
  }

  // Generic CSV fallback (क्र, नाम, पिता, आयु, लिंग)
  const skipFirst = /क्र|serial|name|नाम/i.test(firstLine);
  return (skipFirst ? lines.slice(1) : lines).map((line, i) => {
    const c = parseCSVLine(line);
    const age = parseInt(c[3] ?? "35", 10);
    return {
      id: `IMP-${Date.now()}-${i}`,
      name: c[1] || `मतदाता ${i + 1}`,
      familyHead: c[2] || "-",
      booth: 1,
      area: "आयातित",
      age: isNaN(age) || age < 18 ? 35 : age,
      gender: (c[4] || "").includes("म") ? "महिला" : "पुरुष",
    };
  });
}

/* ── Sidebar items ─────────────────────────────── */
const NAV = [
  { name: "डैशबोर्ड",         icon: "📊" },
  { name: "चुनाव प्रबंधन",    icon: "🗳️" },
  { name: "पार्टी / उम्मीदवार",icon: "🏛️" },
  { name: "मतदाता सूची",       icon: "📤" },
  { name: "मतदाता प्रबंधन",   icon: "👥" },
  { name: "समाचार",            icon: "📰" },
  { name: "रिपोर्ट",           icon: "📈" },
];


/* ── Styles (admin-specific overrides) ──────────── */
const SB = "#0F172A";          // sidebar bg
const SB_ACTIVE = "#1E40AF";   // active item
const SB_HOVER  = "#1E293B";
const ACCENT    = "#3B82F6";

export default function AdminPage() {
  const [tab, setTab] = useState("डैशबोर्ड");

  /* Elections */
  const [elections, setElections] = useState<Election[]>([]);
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [newElec, setNewElec] = useState<Partial<Election>>({ type:"नगर पालिका वार्ड", status:"आगामी", state:"राजस्थान" });

  /* Parties */
  const [parties, setParties] = useState<Party[]>([]);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [newParty, setNewParty] = useState<Partial<Party>>({ symbol:"⭐", color:"#6366F1", candidates:[] });
  const [candidateInput, setCandidateInput] = useState("");

  /* News */
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newNews, setNewNews] = useState<Partial<NewsItem>>({ category:"सामान्य", published:false });
  const [editNewsId, setEditNewsId] = useState<string | null>(null);

  /* Voter import */
  const [pasteText, setPasteText] = useState("");
  const [importRows, setImportRows] = useState<Voter[]>([]);
  const [importStep, setImportStep] = useState<"upload"|"preview"|"done">("upload");
  const [importElecId, setImportElecId] = useState("");
  const [importBooth, setImportBooth] = useState(1);
  const [importArea, setImportArea] = useState("");
  const [totalImported, setTotalImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef  = useRef<HTMLInputElement>(null);

  /* PDF OCR state */
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfRawText, setPdfRawText] = useState("");

  /* Voter list mode toggle */
  const [voterMode, setVoterMode] = useState<"csv"|"ward">("ward");

  /* Ward management */
  const [totalWards, setTotalWards] = useState(25);
  const [wardCounts, setWardCounts] = useState<Record<string, number>>({});
  const [activeWard, setActiveWard] = useState<number>(1);
  const [wardRows, setWardRows] = useState<Voter[]>([]);
  const [wardStep, setWardStep] = useState<"upload"|"preview"|"done">("upload");
  const [wardSaving, setWardSaving] = useState(false);
  const [wardPdfProcessing, setWardPdfProcessing] = useState(false);
  const [wardPdfMsg, setWardPdfMsg] = useState("");
  const [wardRawText, setWardRawText] = useState("");
  const wardFileRef = useRef<HTMLInputElement>(null);

  /* Election expand — voter search inside election */
  const [expandedElecId, setExpandedElecId] = useState<string|null>(null);
  const [elecVl, setElecVl] = useState<import("@/lib/db").Voter[]>([]);
  const [elecVlTotal, setElecVlTotal] = useState(0);
  const [elecVlPage, setElecVlPage] = useState(1);
  const [elecVlLoading, setElecVlLoading] = useState(false);
  const [elecVlSearch, setElecVlSearch] = useState("");
  const [elecVlWard, setElecVlWard] = useState("");
  const ELEC_PER_PAGE = 15;

  const loadElecVl = async (elecId: string, pg = 1, search = "", ward = "") => {
    setElecVlLoading(true);
    try {
      const { data, total } = await db.voters.getPage({
        page: pg, perPage: ELEC_PER_PAGE,
        electionId: elecId,
        search: search || undefined,
        ward: ward || undefined,
      });
      setElecVl(data); setElecVlTotal(total); setElecVlPage(pg);
    } catch { /* ignore */ } finally { setElecVlLoading(false); }
  };

  const toggleElec = (id: string) => {
    if (expandedElecId === id) { setExpandedElecId(null); return; }
    setExpandedElecId(id);
    setElecVlSearch(""); setElecVlWard(""); setElecVlPage(1);
    loadElecVl(id, 1, "", "");
  };

  /* Ward PDF election selector */
  const [wardElecId, setWardElecId] = useState("");

  /* Voter management list */
  const [vl, setVl] = useState<import("@/lib/db").Voter[]>([]);
  const [vlTotal, setVlTotal] = useState(0);
  const [vlPage, setVlPage] = useState(1);
  const [vlPerPage] = useState(20);
  const [vlLoading, setVlLoading] = useState(false);
  const [vlSearch, setVlSearch] = useState("");
  const [vlWard, setVlWard] = useState("");
  const [vlAvail, setVlAvail] = useState("");
  const [vlContact, setVlContact] = useState("");
  const [vlSelected, setVlSelected] = useState<Record<string,boolean>>({});

  const loadVl = async (pg = vlPage, search = vlSearch, ward = vlWard, avail = vlAvail, contact = vlContact) => {
    setVlLoading(true);
    try {
      const { data, total } = await db.voters.getPage({ page: pg, perPage: vlPerPage, ward: ward||undefined, search: search||undefined, availability: avail||undefined, contactStatus: contact||undefined });
      setVl(data); setVlTotal(total);
    } catch { /* ignore */ } finally { setVlLoading(false); }
  };

  const vlTotalPages = Math.max(1, Math.ceil(vlTotal / vlPerPage));
  const vlSelectedIds = Object.keys(vlSelected).filter(k => vlSelected[k]);

  const vlBulkStatus = async (status: string) => {
    await Promise.all(vlSelectedIds.map(id => db.voters.updateCRM(id, { contactStatus: status as import("@/lib/db").Voter["contactStatus"], lastContact: new Date().toISOString().slice(0,10) })));
    setVlSelected({});
    loadVl();
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [el, pa, ne, vc, wc] = await Promise.all([
          db.elections.getAll(),
          db.parties.getAll(),
          db.news.getAll(),
          db.voters.countAll(),
          db.voters.countByWard(),
        ]);
        setElections(el as Election[]);
        setParties(pa as Party[]);
        setNews(ne as NewsItem[]);
        setTotalImported(vc);
        setWardCounts(wc);
      } catch (err) {
        console.error("Supabase load error:", err);
      }
    };
    load();
  }, []);

  // Optimistic state update + async Supabase sync
  const saveElections = (d: Election[]) => {
    setElections(d);
    // upsert is called per-operation in the action handlers
  };
  const saveParties = (d: Party[]) => { setParties(d); };
  const saveNews    = (d: NewsItem[]) => { setNews(d); };

  /* ── Election CRUD ── */
  const addElection = () => {
    if (!newElec.name || !newElec.date || !newElec.constituency) return;
    const e: Election = { id:`e${Date.now()}`, name:newElec.name||"", type:newElec.type||"नगर पालिका वार्ड", date:newElec.date||"", constituency:newElec.constituency||"", state:newElec.state||"राजस्थान", status:newElec.status||"आगामी", voterCount:0, candidateCount:0 };
    setElections(prev => [e, ...prev]);
    void db.elections.upsert(e);
    setNewElec({ type:"नगर पालिका वार्ड", status:"आगामी", state:"राजस्थान" });
    setShowElectionForm(false);
  };
  const deleteElection = (id: string) => {
    setElections(prev => prev.filter(e => e.id !== id));
    void db.elections.delete(id);
  };
  const cycleStatus = (id: string) => {
    const order: Election["status"][] = ["आगामी","सक्रिय","समाप्त"];
    setElections(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, status: order[(order.indexOf(e.status)+1)%3] };
      void db.elections.upsert(updated);
      return updated;
    }));
  };

  /* ── Party CRUD ── */
  const addParty = () => {
    if (!newParty.name || !newParty.abbreviation) return;
    const p: Party = { id:`p${Date.now()}`, name:newParty.name||"", abbreviation:newParty.abbreviation||"", symbol:newParty.symbol||"⭐", color:newParty.color||"#6366F1", candidates:newParty.candidates||[] };
    setParties(prev => [...prev, p]);
    void db.parties.upsert(p);
    setNewParty({ symbol:"⭐", color:"#6366F1", candidates:[] });
    setCandidateInput("");
    setShowPartyForm(false);
  };
  const deleteParty = (id: string) => {
    setParties(prev => prev.filter(p => p.id !== id));
    void db.parties.delete(id);
  };
  const addCandidateToNew = () => {
    if (!candidateInput.trim()) return;
    setNewParty(prev => ({ ...prev, candidates:[...(prev.candidates||[]), candidateInput.trim()] }));
    setCandidateInput("");
  };
  const removeCandidateFromNew = (name: string) =>
    setNewParty(prev => ({ ...prev, candidates:(prev.candidates||[]).filter(c=>c!==name) }));

  /* ── News CRUD ── */
  const submitNews = () => {
    if (!newNews.title || !newNews.body) return;
    if (editNewsId) {
      setNews(prev => prev.map(n => {
        if (n.id !== editNewsId) return n;
        const updated = { ...n, ...newNews, id:editNewsId, date:newNews.date||n.date } as NewsItem;
        void db.news.upsert(updated);
        return updated;
      }));
      setEditNewsId(null);
    } else {
      const n: NewsItem = { id:`n${Date.now()}`, title:newNews.title||"", body:newNews.body||"", date:new Date().toISOString().slice(0,10), category:newNews.category||"सामान्य", published:newNews.published||false };
      setNews(prev => [n, ...prev]);
      void db.news.upsert(n);
    }
    setNewNews({ category:"सामान्य", published:false });
    setShowNewsForm(false);
  };
  const togglePublish = (id: string) => {
    setNews(prev => prev.map(n => {
      if (n.id !== id) return n;
      const updated = { ...n, published: !n.published };
      void db.news.upsert(updated);
      return updated;
    }));
  };
  const deleteNews = (id: string) => {
    setNews(prev => prev.filter(n => n.id !== id));
    void db.news.delete(id);
  };
  const editNews = (n: NewsItem) => { setNewNews(n); setEditNewsId(n.id); setShowNewsForm(true); };

  /* ── Voter import ── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { const rows = parseCSV(ev.target?.result as string); setImportRows(rows); setImportStep("preview"); };
    r.readAsText(f, "utf-8");
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPdfProcessing(true); setPdfMessage(""); setPdfRawText("");
    const fd = new FormData(); fd.append("file", f);
    try {
      const res = await fetch("/api/parse-pdf", { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) { setPdfMessage(data.error || "PDF process error"); return; }
      setPdfMessage(data.message || "");
      if (data.voters && data.voters.length > 0) {
        const rows: Voter[] = data.voters.map((v: {serial:number;name:string;relation:string;age:number;gender:string}, i: number) => ({
          id: `PDF-${Date.now()}-${i}`,
          name: v.name,
          familyHead: v.relation,
          booth: importBooth,
          area: importArea || "PDF आयात",
          age: v.age || 35,
          gender: v.gender === "महिला" ? "महिला" : "पुरुष",
        }));
        setImportRows(rows); setImportStep("preview");
      } else if (data.rawText) {
        setPdfRawText(data.rawText);
      }
    } catch { setPdfMessage("Server से connect नहीं हो पाया।"); }
    finally { setPdfProcessing(false); if (pdfRef.current) pdfRef.current.value = ""; }
  };
  const handlePastePreview = () => {
    if (!pasteText.trim()) return;
    setImportRows(parseCSV(pasteText)); setImportStep("preview");
  };
  const confirmImport = async () => {
    const enriched = importRows.map(v => ({
      ...v,
      area: importArea || v.area,
      booth: importBooth || v.booth,
      electionId: importElecId || undefined,
    }));
    try {
      const inserted = await db.voters.bulkInsert(enriched);
      const newTotal = totalImported + inserted;
      setTotalImported(newTotal);
      if (importElecId) {
        await db.elections.incrementVoterCount(importElecId, inserted);
        setElections(prev => prev.map(e =>
          e.id === importElecId ? { ...e, voterCount: e.voterCount + inserted } : e
        ));
      }
    } catch (err) {
      console.error("Import error:", err);
    }
    setImportStep("done");
  };
  const resetImport = () => { setImportStep("upload"); setImportRows([]); setPasteText(""); };

  /* ── Ward management handlers ── */
  const handleWardPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (wardFileRef.current) wardFileRef.current.value = "";
    setWardPdfProcessing(true);
    setWardPdfMsg("");
    const fd = new FormData(); fd.append("file", f);
    try {
      const res  = await fetch("/api/parse-pdf", { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) { setWardPdfMsg(data.error || "PDF पढ़ने में समस्या"); return; }
      if (data.voters && data.voters.length > 0) {
        const ward = data.ward || String(activeWard);
        const part = data.part || "";
        const rows: Voter[] = data.voters.map((v: {
          id:string; serial:number; name:string; familyHead:string;
          age:number; gender:string; house:string; area:string;
          ward:string; part:string; booth:number;
        }) => ({
          id:         v.id || `PDF-${Date.now()}-${v.serial}`,
          name:       v.name,
          familyHead: v.familyHead || "",
          booth:      v.booth || (part ? (parseInt(part)||1) : 1),
          area:       v.area || "",
          age:        v.age || 35,
          gender:     v.gender === "महिला" ? "महिला" : "पुरुष",
          ward,
          part,
        }));
        setWardRows(rows);
        setWardStep("preview");
        setWardPdfMsg(data.namesGarbled
          ? "⚠️ EPIC, आयु, लिंग सही हैं। नाम garbled हो सकते हैं (font encoding)।"
          : "");
        setWardRawText("");
      } else {
        setWardPdfMsg(data.message || "कोई मतदाता नहीं मिला।");
        setWardRawText(data.rawText || "");
      }
    } catch { setWardPdfMsg("Server से connect नहीं हो पाया।"); }
    finally { setWardPdfProcessing(false); }
  };

  const confirmWardImport = async () => {
    if (!activeWard) return;
    setWardSaving(true);
    try {
      const rowsWithElec = wardElecId
        ? wardRows.map(v => ({ ...v, electionId: wardElecId }))
        : wardRows;
      const inserted = await db.voters.bulkInsert(rowsWithElec);
      if (wardElecId) {
        await db.elections.incrementVoterCount(wardElecId, inserted);
        setElections(prev => prev.map(e => e.id === wardElecId ? { ...e, voterCount: e.voterCount + inserted } : e));
      }
      setTotalImported(prev => prev + inserted);
      setWardCounts(prev => ({
        ...prev,
        [String(activeWard)]: (prev[String(activeWard)] || 0) + inserted,
      }));
      setWardStep("done");
    } catch (err) {
      console.error("Ward import error:", err);
    } finally {
      setWardSaving(false);
    }
  };

  const resetWard = () => {
    setWardRows([]);
    setWardStep("upload");
  };

  /* ── Derived ── */
  const activeCount    = elections.filter(e=>e.status==="सक्रिय").length;
  const upcomingCount  = elections.filter(e=>e.status==="आगामी").length;
  const totalVoters    = elections.reduce((s,e)=>s+e.voterCount,0);
  const publishedNews  = news.filter(n=>n.published).length;

  const statusColor = (s: Election["status"]) => s==="सक्रिय"?{bg:"#d1fae5",fg:"#059669"}: s==="आगामी"?{bg:"#fef3c7",fg:"#d97706"}:{bg:"#f3f4f6",fg:"#6b7280"};
  const catColor = (c: NewsItem["category"]) => c==="चुनाव"?{bg:"#eff6ff",fg:"#2563eb"}: c==="घोषणा"?{bg:"#fef3c7",fg:"#d97706"}: c==="परिणाम"?{bg:"#d1fae5",fg:"#059669"}:{bg:"#f3f4f6",fg:"#6b7280"};

  /* ── Shared field style ── */
  const fld: React.CSSProperties = { width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:"0.85rem", color:"#111827", background:"#fff", outline:"none" };
  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6b7280", marginBottom:5 }}>{children}</div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#F8FAFC", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>

      {/* ══ Sidebar ══════════════════════════════ */}
      <aside style={{ width:220, background:SB, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

        {/* Brand */}
        <div style={{ padding:"20px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", fontWeight:900, color:"#fff" }}>A</div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:"0.88rem", lineHeight:1.2 }}>ChunaoManch</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.65rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px", overflow:"auto" }}>
          {NAV.map(item => {
            const active = tab === item.name;
            return (
              <button key={item.name} onClick={() => setTab(item.name)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 12px", borderRadius:7, marginBottom:2, border:"none", cursor:"pointer", background: active ? SB_ACTIVE : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: active ? 700 : 500, fontSize:"0.83rem", textAlign:"left", transition:"all 0.15s" }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = SB_HOVER; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <span style={{ fontSize:"1rem" }}>{item.icon}</span>
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>H</div>
            <div>
              <div style={{ color:"#fff", fontSize:"0.75rem", fontWeight:600 }}>Himanshu</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.65rem" }}>Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══ Main ═════════════════════════════════ */}
      <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <header style={{ height:52, background:"#fff", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", padding:"0 24px", gap:12, flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#0F172A" }}>{tab}</div>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:"0.75rem", padding:"4px 10px", borderRadius:20, background:"#F1F5F9", color:"#64748B", fontWeight:600 }}>v1.0 · Beta</span>
            <div style={{ width:30, height:30, borderRadius:"50%", background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>H</div>
          </div>
        </header>

        <div style={{ flex:1, padding:"24px", overflow:"auto" }}>

          {/* ════ डैशबोर्ड ════ */}
          {tab === "डैशबोर्ड" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={{ fontSize:"1.5rem", fontWeight:900, color:"#0F172A", letterSpacing:"-0.03em" }}>नमस्ते, Himanshu 👋</div>
                <div style={{ fontSize:"0.85rem", color:"#64748B", marginTop:4 }}>ChunaoManch Admin Panel — प्लेटफ़ॉर्म का पूरा नियंत्रण</div>
              </div>

              {/* Stat cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14 }}>
                {[
                  { label:"कुल चुनाव", value:elections.length, icon:"🗳️", color:ACCENT, bg:"#EFF6FF" },
                  { label:"सक्रिय चुनाव", value:activeCount, icon:"✅", color:"#059669", bg:"#D1FAE5" },
                  { label:"आगामी चुनाव", value:upcomingCount, icon:"📅", color:"#D97706", bg:"#FEF3C7" },
                  { label:"कुल पार्टियां", value:parties.length, icon:"🏛️", color:"#7C3AED", bg:"#F5F3FF" },
                  { label:"आयातित मतदाता", value:totalImported, icon:"👥", color:"#0369A1", bg:"#E0F2FE" },
                  { label:"प्रकाशित समाचार", value:publishedNews, icon:"📰", color:"#BE185D", bg:"#FCE7F3" },
                ].map(c => (
                  <div key={c.label} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>{c.icon}</div>
                    <div style={{ fontSize:"1.8rem", fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                    <div style={{ fontSize:"0.75rem", color:"#64748B", fontWeight:600 }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent elections */}
              <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", fontWeight:700, fontSize:"0.85rem", color:"#0F172A", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  🗳️ हाल के चुनाव
                  <button onClick={() => setTab("चुनाव प्रबंधन")} style={{ fontSize:"0.75rem", color:ACCENT, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>सभी देखें →</button>
                </div>
                {elections.slice(0,3).map(e => {
                  const sc = statusColor(e.status);
                  return (
                    <div key={e.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 18px", borderBottom:"1px solid #F8FAFC" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:"0.85rem", color:"#0F172A" }}>{e.name}</div>
                        <div style={{ fontSize:"0.75rem", color:"#94A3B8", marginTop:2 }}>{e.date} · {e.state}</div>
                      </div>
                      <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"3px 10px", borderRadius:20, background:sc.bg, color:sc.fg }}>{e.status}</span>
                      <span style={{ fontSize:"0.72rem", color:"#94A3B8" }}>{e.voterCount} मतदाता</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
                {[
                  { label:"+ नया चुनाव जोड़ें", goto:"चुनाव प्रबंधन", color:ACCENT },
                  { label:"+ पार्टी जोड़ें", goto:"पार्टी / उम्मीदवार", color:"#7C3AED" },
                  { label:"📤 मतदाता सूची अपलोड", goto:"मतदाता सूची", color:"#059669" },
                  { label:"📰 समाचार लिखें", goto:"समाचार", color:"#BE185D" },
                ].map(a => (
                  <button key={a.label} onClick={() => setTab(a.goto)}
                    style={{ padding:"13px 16px", borderRadius:10, border:`2px solid ${a.color}20`, background:`${a.color}08`, color:a.color, fontWeight:700, fontSize:"0.83rem", cursor:"pointer", textAlign:"left" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ════ चुनाव प्रबंधन ════ */}
          {tab === "चुनाव प्रबंधन" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>चुनाव प्रबंधन</div>
                  <div style={{ fontSize:"0.82rem", color:"#64748B", marginTop:3 }}>नए चुनाव बनाएं, स्थिति बदलें और मतदाता संख्या प्रबंधित करें</div>
                </div>
                <button onClick={() => setShowElectionForm(!showElectionForm)}
                  style={{ padding:"9px 16px", borderRadius:8, border:"none", background:ACCENT, color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
                  {showElectionForm ? "✕ रद्द करें" : "+ नया चुनाव"}
                </button>
              </div>

              {/* New election form */}
              {showElectionForm && (
                <div style={{ background:"#fff", border:`2px solid ${ACCENT}30`, borderRadius:12, padding:20, display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A" }}>नया चुनाव जोड़ें</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div><Lbl>चुनाव का नाम *</Lbl><input style={fld} placeholder="जैसे: खेजरोली वार्ड 10" value={newElec.name||""} onChange={e=>setNewElec(p=>({...p,name:e.target.value}))} /></div>
                    <div><Lbl>चुनाव प्रकार</Lbl>
                      <select style={fld} value={newElec.type||"नगर पालिका वार्ड"} onChange={e=>setNewElec(p=>({...p,type:e.target.value as Election["type"]}))}>
                        {["नगर पालिका वार्ड","नगर पालिका पूर्ण","विधान सभा","लोक सभा","पंचायत"].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><Lbl>क्षेत्र / निर्वाचन क्षेत्र *</Lbl><input style={fld} placeholder="जैसे: वार्ड 10, पूर्वी बस्ती" value={newElec.constituency||""} onChange={e=>setNewElec(p=>({...p,constituency:e.target.value}))} /></div>
                    <div><Lbl>राज्य</Lbl><input style={fld} placeholder="राजस्थान" value={newElec.state||""} onChange={e=>setNewElec(p=>({...p,state:e.target.value}))} /></div>
                    <div><Lbl>मतदान तिथि *</Lbl><input style={fld} type="date" value={newElec.date||""} onChange={e=>setNewElec(p=>({...p,date:e.target.value}))} /></div>
                    <div><Lbl>प्रारंभिक स्थिति</Lbl>
                      <select style={fld} value={newElec.status||"आगामी"} onChange={e=>setNewElec(p=>({...p,status:e.target.value as Election["status"]}))}>
                        {["आगामी","सक्रिय","समाप्त"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                    <button onClick={()=>setShowElectionForm(false)} style={{ padding:"8px 16px", borderRadius:7, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.82rem" }}>रद्द</button>
                    <button onClick={addElection} style={{ padding:"8px 20px", borderRadius:7, border:"none", background:ACCENT, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>✅ सहेजें</button>
                  </div>
                </div>
              )}

              {/* Elections list */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {elections.map(e => {
                  const sc = statusColor(e.status);
                  const isExpanded = expandedElecId === e.id;
                  return (
                    <div key={e.id} style={{ background:"#fff", border:`1px solid ${isExpanded?"#BFDBFE":"#E2E8F0"}`, borderRadius:12, overflow:"hidden" }}>
                      {/* Card header */}
                      <div style={{ padding:"16px 18px", display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ width:42, height:42, borderRadius:10, background:sc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0 }}>🗳️</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#0F172A" }}>{e.name}</div>
                          <div style={{ fontSize:"0.75rem", color:"#94A3B8", marginTop:3 }}>
                            {e.type} · {e.constituency} · {e.state} · तिथि: {e.date}
                          </div>
                          <div style={{ display:"flex", gap:12, marginTop:6, fontSize:"0.72rem", color:"#64748B" }}>
                            <span>👥 {e.voterCount.toLocaleString("hi-IN")} मतदाता</span>
                            <span>🏛️ {e.candidateCount} उम्मीदवार</span>
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                          <button onClick={()=>cycleStatus(e.id)} style={{ fontSize:"0.7rem", fontWeight:700, padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", background:sc.bg, color:sc.fg }}>
                            {e.status} ▾
                          </button>
                          <button onClick={() => toggleElec(e.id)}
                            style={{ fontSize:"0.72rem", fontWeight:700, padding:"5px 12px", borderRadius:8, border:"1px solid #BFDBFE", background: isExpanded?"#EFF6FF":"#fff", color:"#2563EB", cursor:"pointer" }}>
                            {isExpanded ? "▲ बंद करें" : "👥 मतदाता देखें"}
                          </button>
                          <button onClick={()=>deleteElection(e.id)} style={{ fontSize:"0.7rem", color:"#EF4444", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>हटाएं</button>
                        </div>
                      </div>

                      {/* Expanded voter search panel */}
                      {isExpanded && (
                        <div style={{ borderTop:"1px solid #EFF6FF", background:"#F8FAFC", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                            <input value={elecVlSearch} onChange={ev => setElecVlSearch(ev.target.value)}
                              onKeyDown={ev => ev.key==="Enter" && loadElecVl(e.id, 1, elecVlSearch, elecVlWard)}
                              placeholder="नाम / EPIC खोजें…"
                              style={{ padding:"7px 12px", border:"1px solid #E2E8F0", borderRadius:8, fontSize:"0.8rem", flex:"1 1 180px", background:"#fff" }} />
                            <input value={elecVlWard} onChange={ev => setElecVlWard(ev.target.value)}
                              placeholder="वार्ड नंबर"
                              style={{ padding:"7px 10px", border:"1px solid #E2E8F0", borderRadius:8, fontSize:"0.8rem", width:100, background:"#fff" }} />
                            <button onClick={() => loadElecVl(e.id, 1, elecVlSearch, elecVlWard)}
                              style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#2563EB", color:"#fff", fontWeight:700, fontSize:"0.78rem", cursor:"pointer" }}>खोजें</button>
                            <span style={{ fontSize:"0.75rem", color:"#64748B", marginLeft:"auto" }}>
                              कुल <strong>{elecVlTotal.toLocaleString("hi-IN")}</strong> मतदाता
                            </span>
                          </div>

                          {elecVlLoading ? (
                            <div style={{ textAlign:"center", padding:"20px", color:"#64748B", fontSize:"0.82rem" }}>⏳ लोड हो रहा है…</div>
                          ) : elecVl.length === 0 ? (
                            <div style={{ textAlign:"center", padding:"20px", color:"#94A3B8", fontSize:"0.82rem" }}>
                              इस चुनाव में कोई मतदाता नहीं जोड़ा गया।<br/>
                              <span style={{ fontSize:"0.72rem" }}>मतदाता सूची → PDF अपलोड करते समय यह चुनाव select करें।</span>
                            </div>
                          ) : (
                            <>
                              <div style={{ overflowX:"auto", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff" }}>
                                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.78rem", minWidth:700 }}>
                                  <thead>
                                    <tr style={{ background:"#F1F5F9" }}>
                                      {["#","EPIC","नाम","परिवार प्रमुख","वार्ड","बूथ","आयु","लिंग","संपर्क"].map(h=>(
                                        <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontWeight:700, color:"#64748B", fontSize:"0.67rem", textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {elecVl.map((v, i) => {
                                      const csBg = v.contactStatus==="संपर्क हुआ"?"#D1FAE5":v.contactStatus==="मीटिंग तय"?"#EDE9FE":v.contactStatus==="घर पर नहीं मिले"?"#FEE2E2":"#FEF3C7";
                                      const csFg = v.contactStatus==="संपर्क हुआ"?"#065F46":v.contactStatus==="मीटिंग तय"?"#4C1D95":v.contactStatus==="घर पर नहीं मिले"?"#991B1B":"#92400E";
                                      return (
                                        <tr key={v.id} style={{ borderTop:"1px solid #F1F5F9" }}>
                                          <td style={{ padding:"8px 12px", color:"#CBD5E1" }}>{(elecVlPage-1)*ELEC_PER_PAGE+i+1}</td>
                                          <td style={{ padding:"8px 12px", fontFamily:"monospace", fontSize:"0.7rem", color:"#94A3B8" }}>{v.id}</td>
                                          <td style={{ padding:"8px 12px", fontWeight:600, color:"#0F172A" }}>{v.name||"—"}</td>
                                          <td style={{ padding:"8px 12px", color:"#64748B" }}>{v.familyHead||"—"}</td>
                                          <td style={{ padding:"8px 12px" }}>
                                            <span style={{ background:"#F0FDF4", color:"#166534", padding:"2px 8px", borderRadius:20, fontSize:"0.7rem", fontWeight:700 }}>वार्ड {v.ward||"—"}</span>
                                          </td>
                                          <td style={{ padding:"8px 12px", color:"#64748B" }}>{v.booth||"—"}</td>
                                          <td style={{ padding:"8px 12px" }}>{v.age||"—"}</td>
                                          <td style={{ padding:"8px 12px" }}>
                                            <span style={{ background:v.gender==="महिला"?"#FDF2F8":"#EFF6FF", color:v.gender==="महिला"?"#BE185D":"#2563EB", padding:"2px 7px", borderRadius:20, fontSize:"0.68rem", fontWeight:700 }}>{v.gender}</span>
                                          </td>
                                          <td style={{ padding:"8px 12px" }}>
                                            <select value={v.contactStatus||"फिर संपर्क"}
                                              onChange={async ev => { await db.voters.updateCRM(v.id, { contactStatus: ev.target.value as import("@/lib/db").Voter["contactStatus"], lastContact: new Date().toISOString().slice(0,10) }); loadElecVl(e.id, elecVlPage, elecVlSearch, elecVlWard); }}
                                              style={{ fontSize:"0.7rem", padding:"3px 6px", borderRadius:6, border:`1px solid ${csBg}`, background:csBg, color:csFg, cursor:"pointer", fontWeight:700 }}>
                                              {["संपर्क हुआ","फिर संपर्क","घर पर नहीं मिले","मीटिंग तय"].map(s=><option key={s}>{s}</option>)}
                                            </select>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              {/* Pagination */}
                              {elecVlTotal > ELEC_PER_PAGE && (
                                <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
                                  {[["‹", elecVlPage-1],["›", elecVlPage+1]].map(([lbl,pg]) => (
                                    <button key={lbl} disabled={Number(pg)<1||Number(pg)>Math.ceil(elecVlTotal/ELEC_PER_PAGE)}
                                      onClick={() => loadElecVl(e.id, Number(pg), elecVlSearch, elecVlWard)}
                                      style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", fontSize:"0.82rem" }}>
                                      {lbl}
                                    </button>
                                  ))}
                                  <span style={{ fontSize:"0.75rem", color:"#64748B", padding:"5px 8px" }}>
                                    पेज {elecVlPage} / {Math.ceil(elecVlTotal/ELEC_PER_PAGE)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ पार्टी / उम्मीदवार ════ */}
          {tab === "पार्टी / उम्मीदवार" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>पार्टी एवं उम्मीदवार</div>
                  <div style={{ fontSize:"0.82rem", color:"#64748B", marginTop:3 }}>राजनीतिक दल जोड़ें और उम्मीदवार असाइन करें</div>
                </div>
                <button onClick={()=>setShowPartyForm(!showPartyForm)}
                  style={{ padding:"9px 16px", borderRadius:8, border:"none", background:"#7C3AED", color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
                  {showPartyForm ? "✕ रद्द करें" : "+ पार्टी जोड़ें"}
                </button>
              </div>

              {/* New party form */}
              {showPartyForm && (
                <div style={{ background:"#fff", border:"2px solid #7C3AED30", borderRadius:12, padding:20, display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A" }}>नई पार्टी / निर्दलीय जोड़ें</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 100px", gap:12, alignItems:"end" }}>
                    <div><Lbl>पार्टी का नाम *</Lbl><input style={fld} placeholder="जैसे: भारतीय जनता पार्टी" value={newParty.name||""} onChange={e=>setNewParty(p=>({...p,name:e.target.value}))} /></div>
                    <div><Lbl>संक्षिप्त नाम *</Lbl><input style={fld} placeholder="BJP" value={newParty.abbreviation||""} onChange={e=>setNewParty(p=>({...p,abbreviation:e.target.value}))} /></div>
                    <div><Lbl>चिह्न</Lbl><input style={fld} placeholder="⭐" value={newParty.symbol||""} onChange={e=>setNewParty(p=>({...p,symbol:e.target.value}))} /></div>
                    <div><Lbl>रंग</Lbl><input style={{ ...fld, padding:"5px 8px", height:38 }} type="color" value={newParty.color||"#6366F1"} onChange={e=>setNewParty(p=>({...p,color:e.target.value}))} /></div>
                  </div>
                  {/* Candidates */}
                  <div>
                    <Lbl>उम्मीदवार जोड़ें</Lbl>
                    <div style={{ display:"flex", gap:8 }}>
                      <input style={{ ...fld, flex:1 }} placeholder="उम्मीदवार का नाम" value={candidateInput} onChange={e=>setCandidateInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCandidateToNew()} />
                      <button onClick={addCandidateToNew} style={{ padding:"8px 14px", borderRadius:7, border:"none", background:"#7C3AED", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>+ जोड़ें</button>
                    </div>
                    {(newParty.candidates||[]).length > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                        {(newParty.candidates||[]).map(c => (
                          <span key={c} style={{ fontSize:"0.75rem", padding:"4px 10px", borderRadius:20, background:"#F1F5F9", color:"#0F172A", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                            {c}
                            <button onClick={()=>removeCandidateFromNew(c)} style={{ background:"none", border:"none", color:"#94A3B8", cursor:"pointer", fontSize:"0.75rem" }}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                    <button onClick={()=>setShowPartyForm(false)} style={{ padding:"8px 16px", borderRadius:7, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.82rem" }}>रद्द</button>
                    <button onClick={addParty} style={{ padding:"8px 20px", borderRadius:7, border:"none", background:"#7C3AED", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>✅ सहेजें</button>
                  </div>
                </div>
              )}

              {/* Parties grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
                {parties.map(p => (
                  <div key={p.id} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                    <div style={{ height:5, background:p.color }} />
                    <div style={{ padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:`${p.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" }}>{p.symbol}</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#0F172A" }}>{p.name}</div>
                          <div style={{ fontSize:"0.7rem", color:"#94A3B8", fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase" }}>{p.abbreviation}</div>
                        </div>
                      </div>
                      {p.candidates.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                          {p.candidates.map(c => (
                            <span key={c} style={{ fontSize:"0.72rem", padding:"3px 8px", borderRadius:20, background:`${p.color}15`, color:p.color, fontWeight:600 }}>{c}</span>
                          ))}
                        </div>
                      )}
                      {p.candidates.length === 0 && (
                        <div style={{ fontSize:"0.75rem", color:"#CBD5E1", marginBottom:10 }}>कोई उम्मीदवार नहीं</div>
                      )}
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <button onClick={()=>deleteParty(p.id)} style={{ fontSize:"0.72rem", color:"#EF4444", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>हटाएं</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ मतदाता सूची ════ */}
          {tab === "मतदाता सूची" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>मतदाता सूची</div>
                  <div style={{ fontSize:"0.82rem", color:"#64748B", marginTop:3 }}>वार्ड-वार PDF अपलोड करें या CSV/Text से bulk import करें</div>
                </div>
                <div style={{ fontSize:"0.78rem", color:"#94A3B8", background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"6px 12px" }}>
                  कुल आयातित: <strong style={{ color:"#059669" }}>{totalImported}</strong> मतदाता
                </div>
              </div>

              {/* Mode toggle */}
              <div style={{ display:"flex", background:"#F1F5F9", borderRadius:10, padding:4, gap:4 }}>
                {([["ward","🗺️ वार्ड-वार PDF अपलोड"],["csv","📁 CSV / Text Import"]] as const).map(([mode,label])=>(
                  <button key={mode} onClick={()=>setVoterMode(mode)}
                    style={{ flex:1, padding:"9px 0", borderRadius:7, border:"none", cursor:"pointer", fontWeight:700, fontSize:"0.82rem",
                      background: voterMode===mode ? "#fff" : "transparent",
                      color: voterMode===mode ? "#1E40AF" : "#64748B",
                      boxShadow: voterMode===mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      transition:"all 0.15s" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ════ MODE: Ward-wise PDF ════ */}
              {voterMode === "ward" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Ward settings */}
                  <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"16px 20px", display:"flex", gap:20, alignItems:"flex-end" }}>
                    <div>
                      <Lbl>कुल वार्ड</Lbl>
                      <input type="number" min={1} max={100} value={totalWards}
                        onChange={e => { const v = parseInt(e.target.value)||1; setTotalWards(v); if(activeWard>v) setActiveWard(1); }}
                        style={{ ...fld, width:90 }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <Lbl>वार्ड चुनें</Lbl>
                      <select value={activeWard}
                        onChange={e => { setActiveWard(Number(e.target.value)); setWardRows([]); setWardStep("upload"); setWardPdfMsg(""); setWardRawText(""); }}
                        style={fld}>
                        {Array.from({ length: totalWards }, (_, i) => i + 1).map(w => (
                          <option key={w} value={w}>
                            वार्ड {String(w).padStart(2,"0")}
                            {wardCounts[String(w)] ? ` — ${wardCounts[String(w)].toLocaleString("hi-IN")} मतदाता ✓` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {wardCounts[String(activeWard)] ? (
                        <span style={{ fontSize:"0.72rem", background:"#DCFCE7", color:"#059669", padding:"6px 12px", borderRadius:20, fontWeight:700 }}>
                          ✓ {wardCounts[String(activeWard)].toLocaleString("hi-IN")} मतदाता
                        </span>
                      ) : (
                        <span style={{ fontSize:"0.72rem", background:"#FEF3C7", color:"#D97706", padding:"6px 12px", borderRadius:20, fontWeight:700 }}>बाकी है</span>
                      )}
                    </div>
                  </div>

                  {/* Upload card */}
                  {wardStep === "upload" && (
                    <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:20 }}>
                      <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A", marginBottom:14 }}>
                        वार्ड {String(activeWard).padStart(2,"0")} — मतदाता सूची PDF अपलोड करें
                      </div>
                      <input type="file" ref={wardFileRef} accept=".pdf" style={{ display:"none" }} onChange={handleWardPdf} />
                      {/* Election selector for ward upload */}
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#374151", marginBottom:4 }}>चुनाव से जोड़ें (optional)</div>
                        <select value={wardElecId} onChange={e => setWardElecId(e.target.value)}
                          style={{ width:"100%", padding:"8px 10px", border:"1px solid #E2E8F0", borderRadius:8, fontSize:"0.82rem", color:"#374151", background:"#fff" }}>
                          <option value="">— कोई चुनाव नहीं (बाद में जोड़ें) —</option>
                          {elections.map(e => <option key={e.id} value={e.id}>{e.name} · {e.date}</option>)}
                        </select>
                      </div>

                      <button onClick={() => wardFileRef.current?.click()} disabled={wardPdfProcessing}
                        style={{ width:"100%", background: wardPdfProcessing?"#F1F5F9":"#EFF6FF", color: wardPdfProcessing?"#94A3B8":"#2563EB", border:"2px dashed #BFDBFE", borderRadius:10, padding:"24px 20px", fontSize:"0.9rem", fontWeight:700, cursor: wardPdfProcessing?"default":"pointer" }}>
                        {wardPdfProcessing ? "⏳ OCR चल रहा है — नाम निकाल रहे हैं (1-2 मिनट)…" : "📄 PDF फ़ाइल चुनें (ECI Voter List)"}
                      </button>
                      <div style={{ fontSize:"0.72rem", color:"#94A3B8", marginTop:8 }}>PDF से text निकालकर structured table बनाई जाएगी → फिर Supabase में save होगी</div>

                      {wardPdfMsg && (
                        <div style={{ marginTop:14 }}>
                          <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"10px 14px", fontSize:"0.78rem", color:"#C2410C", marginBottom:10 }}>
                            ⚠️ {wardPdfMsg}
                          </div>
                          {wardRawText && (
                            <>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                                <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#64748B" }}>PDF से निकला raw text (पहले 2000 अक्षर):</span>
                                <button onClick={() => navigator.clipboard.writeText(wardRawText)}
                                  style={{ background:"none", border:"1px solid #CBD5E1", borderRadius:6, padding:"3px 12px", fontSize:"0.7rem", cursor:"pointer", color:"#64748B" }}>
                                  📋 Copy
                                </button>
                              </div>
                              <textarea readOnly value={wardRawText.slice(0, 2000)}
                                style={{ width:"100%", height:160, fontSize:"0.72rem", fontFamily:"monospace", border:"1px solid #E2E8F0", borderRadius:8, padding:10, resize:"vertical", color:"#374151", background:"#F8FAFC", boxSizing:"border-box" }} />
                              <div style={{ fontSize:"0.7rem", color:"#94A3B8", marginTop:6 }}>
                                यह text copy करके मुझे भेजें — मैं parser ठीक कर दूंगा ताकि अगली बार automatically table बन जाए।
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview — structured table */}
                  {wardStep === "preview" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ fontSize:"2rem", fontWeight:900, color:"#2563EB" }}>{wardRows.length.toLocaleString("hi-IN")}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, color:"#1E40AF" }}>मतदाता मिले — वार्ड {String(activeWard).padStart(2,"0")}</div>
                          <div style={{ fontSize:"0.75rem", color:"#3B82F6" }}>नीचे सभी मतदाताओं की सूची देखें, फिर Supabase में save करें</div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={resetWard} style={{ padding:"8px 14px", borderRadius:7, border:"1px solid #BFDBFE", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.8rem" }}>रद्द</button>
                          <button onClick={confirmWardImport} disabled={wardSaving}
                            style={{ padding:"8px 20px", borderRadius:7, border:"none", background: wardSaving?"#93C5FD":"#2563EB", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>
                            {wardSaving ? "⏳ सहेज रहे हैं…" : `✅ ${wardRows.length} मतदाता Supabase में जोड़ें`}
                          </button>
                        </div>
                      </div>

                      {wardPdfMsg && (
                        <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"10px 14px", fontSize:"0.78rem", color:"#C2410C" }}>
                          {wardPdfMsg}
                          <div style={{ marginTop:6, fontSize:"0.72rem", color:"#78350F" }}>
                            सटीक नाम के लिए terminal में चलाएं: <code style={{ background:"#FEF3C7", padding:"1px 6px", borderRadius:4 }}>python3 scripts/extract_voters.py &quot;PDF_PATH&quot; output.csv</code>
                          </div>
                        </div>
                      )}

                      {/* Structured table */}
                      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.8rem" }}>
                          <thead>
                            <tr style={{ background:"#F8FAFC" }}>
                              {["#","नाम","संबंधी का नाम","आयु","लिंग","EPIC / ID"].map(h=>(
                                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#64748B", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {wardRows.map((v,i)=>(
                              <tr key={i} style={{ borderTop:"1px solid #F1F5F9", background: i%2===0?"#fff":"#FAFBFC" }}>
                                <td style={{ padding:"9px 14px", color:"#CBD5E1", fontVariantNumeric:"tabular-nums" }}>{i+1}</td>
                                <td style={{ padding:"9px 14px", fontWeight:600, color:"#0F172A" }}>{v.name||"—"}</td>
                                <td style={{ padding:"9px 14px", color:"#64748B" }}>{v.familyHead||"—"}</td>
                                <td style={{ padding:"9px 14px", color:"#64748B", fontVariantNumeric:"tabular-nums" }}>{v.age||"—"}</td>
                                <td style={{ padding:"9px 14px" }}>
                                  <span style={{ fontSize:"0.68rem", padding:"2px 8px", borderRadius:20, fontWeight:700,
                                    background: v.gender==="महिला" ? "#FDF2F8" : "#EFF6FF",
                                    color: v.gender==="महिला" ? "#BE185D" : "#2563EB" }}>
                                    {v.gender}
                                  </span>
                                </td>
                                <td style={{ padding:"9px 14px", color:"#94A3B8", fontSize:"0.72rem", fontFamily:"monospace" }}>{v.id||"—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Done */}
                  {wardStep === "done" && (
                    <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:40, display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center" }}>
                      <div style={{ fontSize:"3rem" }}>✅</div>
                      <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>
                        {wardCounts[String(activeWard)]?.toLocaleString("hi-IN")} मतदाता सफलतापूर्वक जोड़े गए
                      </div>
                      <div style={{ fontSize:"0.85rem", color:"#64748B" }}>वार्ड {String(activeWard).padStart(2,"0")} — Supabase में save हो गया</div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={() => { setWardStep("upload"); setWardRows([]); setWardPdfMsg(""); setWardRawText(""); }}
                          style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.83rem" }}>
                          और वार्ड अपलोड करें
                        </button>
                        <button onClick={()=>setTab("डैशबोर्ड")} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:ACCENT, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.83rem" }}>डैशबोर्ड →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════ MODE: CSV / Text Import ════ */}
              {voterMode === "csv" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Step 1: Election selector */}
                  <div style={{ background:"#fff", border: importElecId ? `2px solid ${ACCENT}` : "2px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                    <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", background: importElecId ? ACCENT : "#E2E8F0", color: importElecId ? "#fff" : "#94A3B8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:800, flexShrink:0 }}>1</div>
                      <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A" }}>चुनाव चुनें <span style={{ color:"#EF4444" }}>*</span></div>
                      {importElecId && <span style={{ fontSize:"0.7rem", background:"#D1FAE5", color:"#059669", padding:"2px 8px", borderRadius:20, fontWeight:700, marginLeft:"auto" }}>✓ चुना गया</span>}
                    </div>
                    <div style={{ padding:14, display:"flex", flexDirection:"column", gap:8 }}>
                      {elections.map(e => {
                        const selected = importElecId === e.id;
                        const sc = statusColor(e.status);
                        return (
                          <button key={e.id} onClick={() => setImportElecId(selected ? "" : e.id)}
                            style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:10, border: selected ? `2px solid ${ACCENT}` : "2px solid #F1F5F9", background: selected ? `${ACCENT}08` : "#F8FAFC", cursor:"pointer", textAlign:"left" }}>
                            <div style={{ width:36, height:36, borderRadius:8, background: selected ? `${ACCENT}20` : "#E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>🗳️</div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:"0.85rem", color: selected ? "#1E40AF" : "#0F172A" }}>{e.name}</div>
                              <div style={{ fontSize:"0.72rem", color:"#94A3B8", marginTop:2 }}>{e.type} · {e.constituency} · {e.date}</div>
                            </div>
                            <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"2px 8px", borderRadius:20, background:sc.bg, color:sc.fg }}>{e.status}</span>
                          </button>
                        );
                      })}
                      {elections.length === 0 && (
                        <div style={{ padding:"20px", textAlign:"center", color:"#94A3B8", fontSize:"0.82rem" }}>
                          कोई चुनाव नहीं — <button onClick={()=>setTab("चुनाव प्रबंधन")} style={{ background:"none", border:"none", color:ACCENT, cursor:"pointer", fontWeight:700 }}>पहले चुनाव बनाएं</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Area + Booth */}
                  {importElecId && importStep === "upload" && (
                    <div style={{ background:"#fff", border:"2px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                      <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", background:"#E2E8F0", color:"#64748B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:800, flexShrink:0 }}>2</div>
                        <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A" }}>क्षेत्र विवरण भरें</div>
                      </div>
                      <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div><Lbl>मोहल्ला / क्षेत्र</Lbl><input style={fld} placeholder="जैसे: शांति नगर" value={importArea} onChange={e=>setImportArea(e.target.value)} /></div>
                        <div><Lbl>बूथ नंबर</Lbl><input style={fld} type="number" min={1} value={importBooth} onChange={e=>setImportBooth(Number(e.target.value))} /></div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Upload */}
                  {importElecId && importStep === "upload" && (
                    <div style={{ background:"#fff", border:"2px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                      <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", background:"#E2E8F0", color:"#64748B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:800, flexShrink:0 }}>3</div>
                        <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A" }}>मतदाता डेटा अपलोड करें</div>
                      </div>
                      <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          <div style={{ fontWeight:700, fontSize:"0.82rem", color:"#0F172A" }}>📁 CSV फ़ाइल</div>
                          <div style={{ fontSize:"0.72rem", color:"#94A3B8" }}>ECI फॉर्मेट (EPIC,नाम,भाग,मोहल्ला…) या सामान्य (क्र,नाम,पिता,आयु,लिंग)</div>
                          <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display:"none" }} onChange={handleFile} />
                          <button onClick={()=>fileRef.current?.click()}
                            style={{ padding:"14px", borderRadius:8, border:`2px dashed ${ACCENT}40`, background:`${ACCENT}06`, color:ACCENT, fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
                            📤 CSV / TXT फ़ाइल चुनें
                          </button>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          <div style={{ fontWeight:700, fontSize:"0.82rem", color:"#0F172A" }}>📋 Text पेस्ट करें</div>
                          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
                            placeholder={"1,राम प्रसाद,शिव कुमार,52,पुरुष\n2,सीता देवी,मोहन लाल,45,महिला"}
                            style={{ flex:1, minHeight:100, padding:"8px 10px", border:"1px solid #E2E8F0", borderRadius:8, fontSize:"0.72rem", fontFamily:"monospace", resize:"vertical", color:"#0F172A", outline:"none" }} />
                          <button onClick={handlePastePreview} disabled={!pasteText.trim()}
                            style={{ padding:"9px", borderRadius:8, border:"none", background:pasteText.trim()?ACCENT:"#E2E8F0", color:pasteText.trim()?"#fff":"#94A3B8", fontWeight:700, fontSize:"0.82rem", cursor:pasteText.trim()?"pointer":"default" }}>
                            👁 प्रीव्यू देखें
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!importElecId && importStep === "upload" && (
                    <div style={{ background:"#F8FAFC", border:"2px dashed #E2E8F0", borderRadius:12, padding:"28px 20px", textAlign:"center" }}>
                      <div style={{ fontSize:"2rem", marginBottom:8 }}>☝️</div>
                      <div style={{ fontWeight:700, color:"#64748B", fontSize:"0.88rem" }}>पहले ऊपर से चुनाव चुनें</div>
                    </div>
                  )}

                  {importStep === "preview" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      <div style={{ background:"#D1FAE5", border:"1px solid #6EE7B7", borderRadius:10, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ fontSize:"1.8rem", fontWeight:900, color:"#059669" }}>{importRows.length}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, color:"#065F46" }}>मतदाता मिले — प्रीव्यू</div>
                          <div style={{ fontSize:"0.78rem", color:"#047857" }}>पहले 10 नीचे दिखाए जा रहे हैं</div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={resetImport} style={{ padding:"8px 14px", borderRadius:7, border:"1px solid #D1FAE5", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.8rem" }}>रद्द</button>
                          <button onClick={confirmImport} style={{ padding:"8px 20px", borderRadius:7, border:"none", background:"#059669", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>✅ {importRows.length} जोड़ें</button>
                        </div>
                      </div>
                      <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
                          <thead><tr style={{ background:"#F8FAFC" }}>
                            {["#","नाम","पिता/पति","आयु","लिंग"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#64748B", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {importRows.slice(0,10).map((v,i)=>(
                              <tr key={i} style={{ borderTop:"1px solid #F1F5F9" }}>
                                <td style={{ padding:"10px 14px", color:"#CBD5E1" }}>{i+1}</td>
                                <td style={{ padding:"10px 14px", fontWeight:600, color:"#0F172A" }}>{v.name}</td>
                                <td style={{ padding:"10px 14px", color:"#64748B" }}>{v.familyHead}</td>
                                <td style={{ padding:"10px 14px", color:"#64748B" }}>{v.age}</td>
                                <td style={{ padding:"10px 14px", color:"#64748B" }}>{v.gender}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {importRows.length>10&&<div style={{ padding:"10px 16px", fontSize:"0.75rem", color:"#94A3B8", borderTop:"1px solid #F1F5F9" }}>… और {importRows.length-10} मतदाता</div>}
                      </div>
                    </div>
                  )}

                  {importStep === "done" && (
                    <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:48, display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center" }}>
                      <div style={{ fontSize:"3rem" }}>✅</div>
                      <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>{importRows.length} मतदाता सफलतापूर्वक जोड़े गए</div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={resetImport} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.83rem" }}>और आयात करें</button>
                        <button onClick={()=>setTab("डैशबोर्ड")} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:ACCENT, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.83rem" }}>डैशबोर्ड →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ════ समाचार ════ */}
          {tab === "समाचार" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>समाचार एवं घोषणाएं</div>
                  <div style={{ fontSize:"0.82rem", color:"#64748B", marginTop:3 }}>नागरिक पोर्टल पर दिखने वाले समाचार प्रबंधित करें</div>
                </div>
                <button onClick={()=>{setShowNewsForm(!showNewsForm);setEditNewsId(null);setNewNews({category:"सामान्य",published:false});}}
                  style={{ padding:"9px 16px", borderRadius:8, border:"none", background:"#BE185D", color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" }}>
                  {showNewsForm&&!editNewsId ? "✕ रद्द" : "+ नया समाचार"}
                </button>
              </div>

              {/* News form */}
              {showNewsForm && (
                <div style={{ background:"#fff", border:"2px solid #BE185D30", borderRadius:12, padding:20, display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A" }}>{editNewsId ? "समाचार संपादित करें" : "नया समाचार लिखें"}</div>
                  <div><Lbl>शीर्षक *</Lbl><input style={fld} placeholder="समाचार का शीर्षक" value={newNews.title||""} onChange={e=>setNewNews(p=>({...p,title:e.target.value}))} /></div>
                  <div><Lbl>विवरण *</Lbl>
                    <textarea value={newNews.body||""} onChange={e=>setNewNews(p=>({...p,body:e.target.value}))}
                      placeholder="समाचार का पूरा विवरण..."
                      style={{ ...fld, minHeight:100, resize:"vertical" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div><Lbl>श्रेणी</Lbl>
                      <select style={fld} value={newNews.category||"सामान्य"} onChange={e=>setNewNews(p=>({...p,category:e.target.value as NewsItem["category"]}))}>
                        {["सामान्य","चुनाव","घोषणा","परिणाम"].map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex", alignItems:"flex-end" }}>
                      <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:"0.85rem", color:"#0F172A", fontWeight:600 }}>
                        <input type="checkbox" checked={!!newNews.published} onChange={e=>setNewNews(p=>({...p,published:e.target.checked}))} />
                        तुरंत प्रकाशित करें
                      </label>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                    <button onClick={()=>{setShowNewsForm(false);setEditNewsId(null);}} style={{ padding:"8px 16px", borderRadius:7, border:"1px solid #E2E8F0", background:"#fff", color:"#64748B", cursor:"pointer", fontWeight:600, fontSize:"0.82rem" }}>रद्द</button>
                    <button onClick={submitNews} style={{ padding:"8px 20px", borderRadius:7, border:"none", background:"#BE185D", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>✅ {editNewsId?"अपडेट करें":"प्रकाशित करें"}</button>
                  </div>
                </div>
              )}

              {/* News list */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {news.map(n => {
                  const cc = catColor(n.category);
                  return (
                    <div key={n.id} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"16px 18px" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                            <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"2px 8px", borderRadius:20, background:cc.bg, color:cc.fg }}>{n.category}</span>
                            <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"2px 8px", borderRadius:20, background:n.published?"#D1FAE5":"#F1F5F9", color:n.published?"#059669":"#94A3B8" }}>
                              {n.published?"● प्रकाशित":"○ ड्राफ्ट"}
                            </span>
                            <span style={{ fontSize:"0.7rem", color:"#CBD5E1" }}>{n.date}</span>
                          </div>
                          <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#0F172A", marginBottom:4 }}>{n.title}</div>
                          <div style={{ fontSize:"0.8rem", color:"#64748B", lineHeight:1.5 }}>{n.body}</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                          <button onClick={()=>togglePublish(n.id)}
                            style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", color:"#0F172A", cursor:"pointer", fontWeight:600, fontSize:"0.72rem", whiteSpace:"nowrap" }}>
                            {n.published ? "📴 ड्राफ्ट में" : "📢 प्रकाशित करें"}
                          </button>
                          <button onClick={()=>editNews(n)}
                            style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", color:ACCENT, cursor:"pointer", fontWeight:600, fontSize:"0.72rem" }}>
                            ✏️ संपादित
                          </button>
                          <button onClick={()=>deleteNews(n.id)}
                            style={{ padding:"5px 12px", borderRadius:6, border:"none", background:"none", color:"#EF4444", cursor:"pointer", fontWeight:600, fontSize:"0.72rem" }}>
                            🗑️ हटाएं
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {tab === "रिपोर्ट" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#0F172A" }}>प्लेटफ़ॉर्म रिपोर्ट</div>
                <div style={{ fontSize:"0.82rem", color:"#64748B", marginTop:3 }}>चुनाव-वार सारांश, मतदाता आंकड़े और गतिविधि</div>
              </div>

              {/* Summary cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                {[
                  { label:"कुल आयोजित चुनाव", value:elections.length, sub:`${activeCount} सक्रिय · ${upcomingCount} आगामी`, icon:"🗳️", color:"#2563EB" },
                  { label:"पंजीकृत पार्टियां", value:parties.length, sub:`${parties.reduce((s,p)=>s+p.candidates.length,0)} उम्मीदवार`, icon:"🏛️", color:"#7C3AED" },
                  { label:"कुल मतदाता (EC)", value:elections.reduce((s,e)=>s+e.voterCount,0), sub:"Election Commission से", icon:"👥", color:"#059669" },
                  { label:"प्लेटफ़ॉर्म में आयातित", value:totalImported, sub:"CSV द्वारा जोड़े गए", icon:"📤", color:"#0369A1" },
                  { label:"प्रकाशित समाचार", value:publishedNews, sub:`${news.length-publishedNews} ड्राफ्ट में`, icon:"📰", color:"#BE185D" },
                ].map(c=>(
                  <div key={c.label} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"18px 20px" }}>
                    <div style={{ fontSize:"1.4rem", marginBottom:8 }}>{c.icon}</div>
                    <div style={{ fontSize:"2rem", fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                    <div style={{ fontSize:"0.8rem", fontWeight:700, color:"#0F172A", marginTop:4 }}>{c.label}</div>
                    <div style={{ fontSize:"0.72rem", color:"#94A3B8", marginTop:2 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Elections table */}
              <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", fontWeight:700, fontSize:"0.85rem", color:"#0F172A" }}>🗳️ चुनाव-वार विवरण</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
                  <thead><tr style={{ background:"#F8FAFC" }}>
                    {["चुनाव","प्रकार","तिथि","मतदाता","उम्मीदवार","स्थिति"].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:700, color:"#64748B", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {elections.map(e=>{
                      const sc = statusColor(e.status);
                      return (
                        <tr key={e.id} style={{ borderTop:"1px solid #F1F5F9" }}>
                          <td style={{ padding:"12px 16px", fontWeight:600, color:"#0F172A" }}>{e.name}</td>
                          <td style={{ padding:"12px 16px", color:"#64748B", fontSize:"0.78rem" }}>{e.type}</td>
                          <td style={{ padding:"12px 16px", color:"#64748B" }}>{e.date}</td>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"#0F172A" }}>{e.voterCount.toLocaleString("hi-IN")}</td>
                          <td style={{ padding:"12px 16px", color:"#64748B" }}>{e.candidateCount}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"3px 10px", borderRadius:20, background:sc.bg, color:sc.fg }}>{e.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Parties table */}
              <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", fontWeight:700, fontSize:"0.85rem", color:"#0F172A" }}>🏛️ पार्टी-वार उम्मीदवार</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
                  <thead><tr style={{ background:"#F8FAFC" }}>
                    {["पार्टी","संक्षिप्त","चिह्न","उम्मीदवार संख्या","उम्मीदवार"].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:700, color:"#64748B", fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {parties.map(p=>(
                      <tr key={p.id} style={{ borderTop:"1px solid #F1F5F9" }}>
                        <td style={{ padding:"12px 16px", fontWeight:600, color:"#0F172A" }}>{p.name}</td>
                        <td style={{ padding:"12px 16px" }}><span style={{ fontSize:"0.72rem", fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${p.color}18`, color:p.color }}>{p.abbreviation}</span></td>
                        <td style={{ padding:"12px 16px", fontSize:"1.2rem" }}>{p.symbol}</td>
                        <td style={{ padding:"12px 16px", fontWeight:700, color:p.candidates.length>0?"#0F172A":"#CBD5E1" }}>{p.candidates.length}</td>
                        <td style={{ padding:"12px 16px", color:"#64748B", fontSize:"0.78rem" }}>{p.candidates.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ मतदाता प्रबंधन ════ */}
          {tab === "मतदाता प्रबंधन" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#0F172A" }}>👥 मतदाता प्रबंधन</div>
                  <div style={{ fontSize:"0.78rem", color:"#64748B", marginTop:2 }}>कुल {vlTotal.toLocaleString("hi-IN")} मतदाता · संपर्क स्थिति अपडेट करें</div>
                </div>
                <button onClick={() => loadVl(1, vlSearch, vlWard, vlAvail, vlContact)}
                  style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:"#2563EB", cursor:"pointer", fontWeight:700, fontSize:"0.8rem" }}>
                  🔄 रिफ्रेश
                </button>
              </div>

              {/* Filters row */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <input value={vlSearch} onChange={e => setVlSearch(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && (setVlPage(1), loadVl(1, vlSearch, vlWard, vlAvail, vlContact))}
                  placeholder="नाम / EPIC / मोबाइल खोजें…"
                  style={{ padding:"8px 12px", border:"1px solid #E2E8F0", borderRadius:8, fontSize:"0.8rem", flex:"1 1 200px", minWidth:0 }} />
                <input value={vlWard} onChange={e => setVlWard(e.target.value)}
                  placeholder="वार्ड नंबर"
                  style={{ padding:"8px 10px", border:"1px solid #E2E8F0", borderRadius:8, fontSize:"0.8rem", width:100 }} />
                {[["", "उपलब्धता"], ["उपलब्ध","✅ उपलब्ध"], ["बाहर","🔴 बाहर"]].map(([v,l]) => (
                  <button key={v} onClick={() => { setVlAvail(v); setVlPage(1); loadVl(1, vlSearch, vlWard, v, vlContact); }}
                    style={{ padding:"7px 12px", borderRadius:8, border:"1px solid", borderColor: vlAvail===v?"#2563EB":"#E2E8F0", background: vlAvail===v?"#EFF6FF":"#fff", color: vlAvail===v?"#1E40AF":"#64748B", cursor:"pointer", fontSize:"0.75rem", fontWeight: vlAvail===v?700:400 }}>
                    {l}
                  </button>
                ))}
                {[["","संपर्क"],["संपर्क हुआ","✅"],["फिर संपर्क","🔁"],["घर पर नहीं मिले","🏠"],["मीटिंग तय","📅"]].map(([v,l]) => (
                  <button key={v} onClick={() => { setVlContact(v); setVlPage(1); loadVl(1, vlSearch, vlWard, vlAvail, v); }}
                    style={{ padding:"7px 12px", borderRadius:8, border:"1px solid", borderColor: vlContact===v?"#7C3AED":"#E2E8F0", background: vlContact===v?"#F5F3FF":"#fff", color: vlContact===v?"#5B21B6":"#64748B", cursor:"pointer", fontSize:"0.75rem", fontWeight: vlContact===v?700:400 }}>
                    {l} {v}
                  </button>
                ))}
                <button onClick={() => { setVlPage(1); loadVl(1, vlSearch, vlWard, vlAvail, vlContact); }}
                  style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#2563EB", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.8rem" }}>
                  खोजें
                </button>
              </div>

              {/* Bulk action bar */}
              {vlSelectedIds.length > 0 && (
                <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#1E40AF" }}>{vlSelectedIds.length} चुने गए</span>
                  {["संपर्क हुआ","फिर संपर्क","घर पर नहीं मिले","मीटिंग तय"].map(s => (
                    <button key={s} onClick={() => vlBulkStatus(s)}
                      style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #BFDBFE", background:"#fff", color:"#1E40AF", cursor:"pointer", fontSize:"0.75rem", fontWeight:600 }}>
                      {s}
                    </button>
                  ))}
                  <button onClick={() => setVlSelected({})} style={{ marginLeft:"auto", padding:"6px 10px", borderRadius:7, border:"1px solid #BFDBFE", background:"transparent", color:"#64748B", cursor:"pointer", fontSize:"0.75rem" }}>✕ रद्द</button>
                </div>
              )}

              {/* Table */}
              {vl.length === 0 && !vlLoading ? (
                <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:48, textAlign:"center", color:"#94A3B8" }}>
                  <div style={{ fontSize:"2.5rem", marginBottom:12 }}>👥</div>
                  <div style={{ fontWeight:700, fontSize:"0.9rem" }}>कोई मतदाता नहीं मिला</div>
                  <div style={{ fontSize:"0.78rem", marginTop:4 }}>पहले मतदाता सूची में PDF अपलोड करें, या खोज/फिल्टर बदलें</div>
                  <button onClick={() => loadVl(1)}
                    style={{ marginTop:16, padding:"10px 20px", borderRadius:8, border:"none", background:"#2563EB", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:"0.82rem" }}>
                    सभी मतदाता लोड करें
                  </button>
                </div>
              ) : (
                <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, overflow:"auto" }}>
                  {vlLoading && (
                    <div style={{ padding:"20px", textAlign:"center", color:"#64748B", fontSize:"0.85rem" }}>⏳ लोड हो रहा है…</div>
                  )}
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.78rem", minWidth:900 }}>
                    <thead>
                      <tr style={{ background:"#F8FAFC" }}>
                        <th style={{ padding:"10px 12px" }}>
                          <input type="checkbox"
                            checked={vl.length>0 && vl.every(v=>vlSelected[v.id])}
                            onChange={e => { const m: Record<string,boolean>={}; if(e.target.checked) vl.forEach(v=>{m[v.id]=true;}); setVlSelected(m); }} />
                        </th>
                        {["#","वोटर आईडी","नाम","परिवार प्रमुख","बूथ","क्षेत्र","आयु","लिंग","मोबाइल","उपलब्धता","संपर्क","अंतिम संपर्क","अगला कार्य"].map(h=>(
                          <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:"#64748B", fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vl.map((v,i) => {
                        const csBg = v.contactStatus==="संपर्क हुआ"?"#D1FAE5":v.contactStatus==="फिर संपर्क"?"#FEF3C7":v.contactStatus==="मीटिंग तय"?"#EDE9FE":"#FEE2E2";
                        const csFg = v.contactStatus==="संपर्क हुआ"?"#065F46":v.contactStatus==="फिर संपर्क"?"#92400E":v.contactStatus==="मीटिंग तय"?"#4C1D95":"#991B1B";
                        return (
                          <tr key={v.id} style={{ borderTop:"1px solid #F1F5F9", background: i%2===0?"#fff":"#FAFBFC" }}>
                            <td style={{ padding:"9px 12px" }}>
                              <input type="checkbox" checked={!!vlSelected[v.id]}
                                onChange={e => setVlSelected(s => ({ ...s, [v.id]: e.target.checked }))} />
                            </td>
                            <td style={{ padding:"9px 12px", color:"#CBD5E1" }}>{(vlPage-1)*vlPerPage+i+1}</td>
                            <td style={{ padding:"9px 12px", fontFamily:"monospace", fontSize:"0.7rem", color:"#64748B" }}>{v.id}</td>
                            <td style={{ padding:"9px 12px", fontWeight:600, color:"#0F172A", whiteSpace:"nowrap" }}>{v.name||"—"}</td>
                            <td style={{ padding:"9px 12px", color:"#64748B" }}>{v.familyHead||"—"}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <span style={{ background:"#EFF6FF", color:"#3B82F6", padding:"2px 8px", borderRadius:20, fontSize:"0.7rem", fontWeight:700 }}>{v.booth||"—"}</span>
                            </td>
                            <td style={{ padding:"9px 12px", color:"#64748B", fontSize:"0.75rem" }}>{v.area||"—"}</td>
                            <td style={{ padding:"9px 12px" }}>{v.age||"—"}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <span style={{ background:v.gender==="महिला"?"#FDF2F8":"#EFF6FF", color:v.gender==="महिला"?"#BE185D":"#2563EB", padding:"2px 8px", borderRadius:20, fontSize:"0.68rem", fontWeight:700 }}>{v.gender}</span>
                            </td>
                            <td style={{ padding:"9px 12px", color:"#64748B", fontFamily:"monospace", fontSize:"0.75rem" }}>{v.mobile||"—"}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <span style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.68rem", fontWeight:700, background:v.availability==="उपलब्ध"?"#D1FAE5":"#FEE2E2", color:v.availability==="उपलब्ध"?"#065F46":"#991B1B" }}>
                                {v.availability==="उपलब्ध"?"● उपलब्ध":"○ बाहर"}
                              </span>
                            </td>
                            <td style={{ padding:"9px 12px" }}>
                              <select value={v.contactStatus||"फिर संपर्क"}
                                onChange={async e => { await db.voters.updateCRM(v.id, { contactStatus: e.target.value as import("@/lib/db").Voter["contactStatus"], lastContact: new Date().toISOString().slice(0,10) }); loadVl(); }}
                                style={{ fontSize:"0.72rem", padding:"3px 6px", borderRadius:7, border:`1px solid ${csBg}`, background:csBg, color:csFg, cursor:"pointer", fontWeight:700 }}>
                                {["संपर्क हुआ","फिर संपर्क","घर पर नहीं मिले","मीटिंग तय"].map(s=><option key={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding:"9px 12px", color:"#94A3B8", fontSize:"0.72rem" }}>{v.lastContact||"—"}</td>
                            <td style={{ padding:"9px 12px" }}>
                              <span style={{ color:v.nextAction&&v.nextAction!=="-"?"#D97706":"#CBD5E1", fontWeight:v.nextAction&&v.nextAction!=="-"?700:400, fontSize:"0.75rem" }}>
                                {v.nextAction||"—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid #F1F5F9", flexWrap:"wrap", gap:8 }}>
                    <span style={{ fontSize:"0.78rem", color:"#64748B" }}>
                      कुल <strong style={{ color:"#0F172A" }}>{vlTotal.toLocaleString("hi-IN")}</strong> मतदाता · पेज {vlPage}/{vlTotalPages}
                    </span>
                    <div style={{ display:"flex", gap:4 }}>
                      {[["«",1],["‹",vlPage-1],["›",vlPage+1],["»",vlTotalPages]].map(([lbl,pg])=>(
                        <button key={lbl} disabled={Number(pg)<1||Number(pg)>vlTotalPages||Number(pg)===vlPage}
                          onClick={() => { const p=Number(pg); setVlPage(p); loadVl(p); }}
                          style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", color:"#374151", fontSize:"0.8rem", opacity:(Number(pg)<1||Number(pg)>vlTotalPages)?0.4:1 }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
