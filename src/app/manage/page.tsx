"use client";

import React, { useState, useEffect, useRef } from "react";
import db, { TeamMember, Task, CandidateProfile } from "@/lib/db";

interface Voter {
  id: string;
  name: string;
  familyHead: string;
  booth: number;
  area: string;
  age: number;
  gender: "पुरुष" | "महिला";
  mobile: string;
  availability: "उपलब्ध" | "बाहर";
  contactStatus: "संपर्क हुआ" | "फिर संपर्क" | "घर पर नहीं मिले" | "मीटिंग तय";
  lastContact: string;
  nextAction: string;
  group?: string;
}

const NAV_SECTIONS = [
  {
    label: "उम्मीदवार",
    items: [{ name: "मेरा प्रोफाइल", icon: "🧑‍💼" }],
  },
  { label: "मुख्य", items: [{ name: "डैशबोर्ड", icon: "📊" }] },
  {
    label: "मतदाता",
    items: [
      { name: "वार्ड मैनेजमेंट", icon: "🏢" },
      { name: "मतदाता सूची", icon: "👥" },
    ],
  },
  {
    label: "संचालन",
    items: [
      { name: "कार्य योजना", icon: "📝" },
      { name: "टीम मैनेजमेंट", icon: "🤝" },
    ],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("मेरा प्रोफाइल");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState("वार्ड 07 - उत्तर नगर");
  const [selectedVoterIds, setSelectedVoterIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterBooth, setFilterBooth] = useState("सभी");
  const [filterArea, setFilterArea] = useState("सभी");
  const [filterAgeGroup, setFilterAgeGroup] = useState("सभी");
  const [filterGender, setFilterGender] = useState("सभी");
  const [filterAvail, setFilterAvail] = useState("सभी");
  const [filterContact, setFilterContact] = useState("सभी");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCol, setSortCol] = useState<keyof Voter | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editMobileId, setEditMobileId] = useState<string | null>(null);
  const [editMobileVal, setEditMobileVal] = useState("");
  const [editNextId, setEditNextId] = useState<string | null>(null);
  const [editNextVal, setEditNextVal] = useState("");
  const [editAreaId, setEditAreaId] = useState<string | null>(null);
  const [editAreaVal, setEditAreaVal] = useState("");
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [filterGroup, setFilterGroup] = useState("सभी");
  const [saveFlash, setSaveFlash] = useState<string | null>(null);

  // Team management
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [tmName, setTmName] = useState("");
  const [tmRole, setTmRole] = useState("");
  const [tmArea, setTmArea] = useState("");
  const [tmMobile, setTmMobile] = useState("");
  const [tmColor, setTmColor] = useState("#0f5e38");
  const teamNameRef = useRef<HTMLInputElement>(null);

  // Task management
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tkTitle, setTkTitle] = useState("");
  const [tkDesc, setTkDesc] = useState("");
  const [tkDue, setTkDue] = useState("");
  const [tkPriority, setTkPriority] = useState<Task["priority"]>("सामान्य");
  const [taskFilter, setTaskFilter] = useState<"सभी" | "लंबित" | "पूर्ण">("लंबित");
  const taskTitleRef = useRef<HTMLInputElement>(null);

  // Candidate profile
  const EMPTY_PROFILE: Omit<CandidateProfile, "id"> = {
    name: "", party: "", ward: "", constituency: "", mobile: "",
    email: "", slogan: "", dob: "", education: "", address: "",
    photoUrl: "", facebook: "", instagram: "", whatsapp: "", bio: "",
  };
  const [profile, setProfile] = useState<Omit<CandidateProfile, "id">>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const profileComplete = !!(profile.name && profile.party && profile.ward && profile.mobile);

  // Win calculator sliders
  const [obcSupport, setObcSupport] = useState(62);
  const [genSupport, setGenSupport] = useState(48);
  const [scSupport, setScSupport] = useState(71);
  const [stSupport, setStSupport] = useState(55);
  const [turnoutPct, setTurnoutPct] = useState(75);

  useEffect(() => {
    db.voters.getAll().then(rows => {
      setVoters(rows.map(v => ({
        id:            v.id,
        name:          v.name,
        familyHead:    v.familyHead,
        booth:         v.booth,
        area:          v.area,
        age:           v.age,
        gender:        v.gender,
        mobile:        v.mobile ?? "",
        availability:  v.availability ?? "उपलब्ध",
        contactStatus: v.contactStatus ?? "फिर संपर्क",
        lastContact:   v.lastContact ?? "",
        nextAction:    v.nextAction ?? "",
      })));
    }).catch(console.error).finally(() => setLoading(false));
    db.candidateProfile.get().then(p => {
      if (p) {
        const loaded = { name: p.name, party: p.party, ward: p.ward, constituency: p.constituency, mobile: p.mobile, email: p.email, slogan: p.slogan, dob: p.dob, education: p.education, address: p.address, photoUrl: p.photoUrl, facebook: p.facebook, instagram: p.instagram, whatsapp: p.whatsapp, bio: p.bio };
        setProfile(loaded);
        const complete = !!(p.name && p.party && p.ward && p.mobile);
        if (complete) setActiveTab("डैशबोर्ड");
      }
      setProfileLoaded(true);
    }).catch(() => setProfileLoaded(true));
  }, []);

  useEffect(() => {
    if (activeTab === "टीम मैनेजमेंट" && teamList.length === 0) {
      setTeamLoading(true);
      db.teamMembers.getAll().then(setTeamList).catch(console.error).finally(() => setTeamLoading(false));
    }
    if (activeTab === "कार्य योजना" && taskList.length === 0) {
      setTaskLoading(true);
      db.tasks.getAll().then(setTaskList).catch(console.error).finally(() => setTaskLoading(false));
    }
  }, [activeTab]);

  const TEAM_COLORS = ["#0f5e38","#3b82f6","#ec4899","#8b5cf6","#d97706","#10b981","#ef4444","#0891b2"];

  const handleProfileSave = async () => {
    if (!profile.name.trim() || !profile.party.trim() || !profile.ward.trim() || !profile.mobile.trim()) return;
    setProfileSaving(true);
    try {
      await db.candidateProfile.save(profile);
      setProfileSaved(true);
      setTimeout(() => {
        setProfileSaved(false);
        setActiveTab("डैशबोर्ड");
        // profileComplete re-derives as true from profile state → gate unmounts automatically
      }, 1500);
    } catch (e) { console.error(e); }
    finally { setProfileSaving(false); }
  };

  const openAddMember = () => {
    setEditingMember(null);
    setTmName(""); setTmRole(""); setTmArea(""); setTmMobile(""); setTmColor(TEAM_COLORS[teamList.length % TEAM_COLORS.length]);
    setShowTeamModal(true);
    setTimeout(() => teamNameRef.current?.focus(), 80);
  };

  const openEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setTmName(m.name); setTmRole(m.role); setTmArea(m.area); setTmMobile(m.mobile); setTmColor(m.color);
    setShowTeamModal(true);
    setTimeout(() => teamNameRef.current?.focus(), 80);
  };

  const saveTeamMember = () => {
    if (!tmName.trim()) return;
    const member: TeamMember = {
      id:     editingMember?.id ?? `tm_${Date.now()}`,
      name:   tmName.trim(),
      role:   tmRole.trim(),
      area:   tmArea.trim(),
      mobile: tmMobile.trim(),
      color:  tmColor,
    };
    setTeamList(prev => editingMember ? prev.map(m => m.id === member.id ? member : m) : [...prev, member]);
    db.teamMembers.upsert(member).catch(console.error);
    setShowTeamModal(false);
  };

  const deleteTeamMember = (id: string) => {
    setTeamList(prev => prev.filter(m => m.id !== id));
    db.teamMembers.delete(id).catch(console.error);
  };

  const openAddTask = () => {
    setEditingTask(null);
    setTkTitle(""); setTkDesc(""); setTkDue(""); setTkPriority("सामान्य");
    setShowTaskModal(true);
    setTimeout(() => taskTitleRef.current?.focus(), 80);
  };

  const openEditTask = (t: Task) => {
    setEditingTask(t);
    setTkTitle(t.title); setTkDesc(t.description); setTkDue(t.dueDate); setTkPriority(t.priority);
    setShowTaskModal(true);
    setTimeout(() => taskTitleRef.current?.focus(), 80);
  };

  const saveTask = () => {
    if (!tkTitle.trim()) return;
    const task: Task = {
      id:          editingTask?.id ?? `tk_${Date.now()}`,
      title:       tkTitle.trim(),
      description: tkDesc.trim(),
      dueDate:     tkDue,
      priority:    tkPriority,
      done:        editingTask?.done ?? false,
    };
    setTaskList(prev => editingTask ? prev.map(t => t.id === task.id ? task : t) : [...prev, task]);
    db.tasks.upsert(task).catch(console.error);
    setShowTaskModal(false);
  };

  const toggleTaskDone = (id: string) => {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    const task = taskList.find(t => t.id === id);
    if (task) db.tasks.toggleDone(id, !task.done).catch(console.error);
  };

  const deleteTask = (id: string) => {
    setTaskList(prev => prev.filter(t => t.id !== id));
    db.tasks.delete(id).catch(console.error);
  };

  const flash = (id: string) => {
    setSaveFlash(id);
    setTimeout(() => setSaveFlash(s => s === id ? null : s), 1400);
  };

  const updateSingleVoter = (
    id: string,
    fields: Partial<Pick<Voter, "contactStatus" | "availability" | "mobile" | "nextAction" | "lastContact" | "area" | "group">>
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const extra: Partial<Voter> = {};
    if (fields.contactStatus && (fields.contactStatus === "संपर्क हुआ" || fields.contactStatus === "मीटिंग तय")) {
      extra.lastContact = today;
    }
    const merged = { ...fields, ...extra };
    setVoters(prev => prev.map(v => v.id === id ? { ...v, ...merged } : v));
    db.voters.updateCRM(id, {
      contactStatus: merged.contactStatus,
      availability: merged.availability,
      mobile: merged.mobile,
      nextAction: merged.nextAction,
      lastContact: merged.lastContact,
    }).then(() => flash(id)).catch(console.error);
  };

  const handleBulkStatusChange = (status: Voter["contactStatus"]) => {
    const today = new Date().toISOString().slice(0, 10);
    const ids = Object.keys(selectedVoterIds).filter(id => selectedVoterIds[id]);
    setVoters(voters.map(v => ids.includes(v.id) ? { ...v, contactStatus: status, lastContact: today } : v));
    ids.forEach(id => db.voters.updateCRM(id, { contactStatus: status, lastContact: today }).catch(console.error));
    setSelectedVoterIds({});
  };
  const handleBulkFollowup = () => {
    const ids = Object.keys(selectedVoterIds).filter(id => selectedVoterIds[id]);
    setVoters(voters.map(v => ids.includes(v.id) ? { ...v, nextAction: "फॉलो-अप" } : v));
    ids.forEach(id => db.voters.updateCRM(id, { nextAction: "फॉलो-अप" }).catch(console.error));
    setSelectedVoterIds({});
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    const name = groupName.trim();
    const ids = Object.keys(selectedVoterIds).filter(id => selectedVoterIds[id]);
    setVoters(prev => prev.map(v => ids.includes(v.id) ? { ...v, group: name } : v));
    ids.forEach(id => db.voters.updateCRM(id, { group: name }).catch(console.error));
    setSelectedVoterIds({});
    setGroupName("");
    setShowGroupInput(false);
  };
  const handleSelectAll = (checked: boolean) => {
    const sel: Record<string, boolean> = {};
    if (checked) currentItems.forEach(v => { sel[v.id] = true; });
    setSelectedVoterIds(sel);
  };
  const handleSelectVoter = (id: string, checked: boolean) =>
    setSelectedVoterIds(prev => ({ ...prev, [id]: checked }));

  const filteredVoters = voters.filter(v => {
    if (filterBooth !== "सभी" && v.booth !== Number(filterBooth)) return false;
    if (filterArea !== "सभी" && v.area !== filterArea) return false;
    if (filterGender !== "सभी" && v.gender !== filterGender) return false;
    if (filterAvail !== "सभी" && v.availability !== filterAvail) return false;
    if (filterContact !== "सभी" && v.contactStatus !== filterContact) return false;
    if (filterGroup !== "सभी" && v.group !== filterGroup) return false;
    if (filterAgeGroup !== "सभी") {
      if (filterAgeGroup === "18-25" && !(v.age >= 18 && v.age <= 25)) return false;
      if (filterAgeGroup === "26-45" && !(v.age >= 26 && v.age <= 45)) return false;
      if (filterAgeGroup === "46-60" && !(v.age >= 46 && v.age <= 60)) return false;
      if (filterAgeGroup === "60+" && v.age <= 60) return false;
    }
    const q = searchTerm.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.mobile.includes(q);
  });

  const sortedVoters = sortCol
    ? [...filteredVoters].sort((a, b) => {
        const av = a[sortCol] ?? ""; const bv = b[sortCol] ?? "";
        const cmp = typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "hi");
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filteredVoters;

  const totalPages = Math.ceil(sortedVoters.length / itemsPerPage);
  const currentItems = sortedVoters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const selectedCount = Object.values(selectedVoterIds).filter(Boolean).length;

  const toggleSort = (col: keyof Voter) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setCurrentPage(1);
  };
  const sortIcon = (col: keyof Voter) =>
    sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅";

  const totalCount   = voters.length;
  const availCount   = voters.filter(v => v.availability === "उपलब्ध").length;
  const contactedCount  = voters.filter(v => v.contactStatus === "संपर्क हुआ").length;
  const notFoundCount   = voters.filter(v => v.contactStatus === "घर पर नहीं मिले").length;
  const pendingCount    = voters.filter(v => v.contactStatus === "फिर संपर्क").length;
  const meetingCount    = voters.filter(v => v.contactStatus === "मीटिंग तय").length;
  const followUpCount   = voters.filter(v => v.nextAction === "फॉलो-अप").length;
  const maleCount       = voters.filter(v => v.gender === "पुरुष").length;
  const femaleCount     = voters.filter(v => v.gender === "महिला").length;
  const supporterCount  = contactedCount + meetingCount;

  const boothCounts = voters.reduce<Record<number, number>>((acc, v) => { acc[v.booth] = (acc[v.booth] || 0) + 1; return acc; }, {});
  const areaCounts  = voters.reduce<Record<string, number>>((acc, v) => { if (v.area) acc[v.area] = (acc[v.area] || 0) + 1; return acc; }, {});

  const daysLeft = Math.max(0, Math.ceil(
    (new Date("2026-10-20").getTime() - (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })()) / 86400000
  ));

  const reloadVoters = () => {
    setLoading(true);
    db.voters.getAll().then(rows => {
      setVoters(rows.map(v => ({
        id: v.id, name: v.name, familyHead: v.familyHead,
        booth: v.booth, area: v.area, age: v.age, gender: v.gender,
        mobile: v.mobile ?? "", availability: v.availability ?? "उपलब्ध",
        contactStatus: v.contactStatus ?? "फिर संपर्क",
        lastContact: v.lastContact ?? "", nextAction: v.nextAction ?? "",
      })));
    }).catch(console.error).finally(() => setLoading(false));
  };

  const navChange = (name: string) => {
    if (!profileComplete && name !== "मेरा प्रोफाइल") return;
    setActiveTab(name);
    setCurrentPage(1);
  };

  // Win calculator
  const winVotes = Math.round(
    totalCount * 0.45 * (obcSupport / 100) +
    totalCount * 0.35 * (genSupport / 100) +
    totalCount * 0.12 * (scSupport / 100) +
    totalCount * 0.08 * (stSupport / 100)
  );
  const winPct = Math.min(99, Math.round((winVotes / totalCount) * 100));

  const exportCSV = () => {
    const rows = ["वोटर आईडी,नाम,क्षेत्र,बूथ,लिंग",
      ...filteredVoters.map(v => `${v.id},${v.name},${v.area},${v.booth},${v.gender}`)].join("\n");
    const link = Object.assign(document.createElement("a"), {
      href: encodeURI("data:text/csv;charset=utf-8," + rows),
      download: "मतदाता_सूची.csv",
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Full-screen profile setup gate ── */
  if (!profileLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "1rem" }}>⏳ लोड हो रहा है…</div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>

        {/* Brand header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-forest)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "1.3rem" }}>ख</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>निर्दलीय शक्ति मंच</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>खेजरोली नगर पालिका 2026</div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 560, background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: 18, padding: "32px 32px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🧑‍💼</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>उम्मीदवार प्रोफाइल सेट करें</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 6 }}>डैशबोर्ड एक्सेस करने से पहले अपनी जानकारी भरें</p>
          </div>

          {profileSaved && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✅</span>
              <span style={{ fontWeight: 600, color: "#15803d", fontSize: "0.88rem" }}>प्रोफाइल सेव हो गई! डैशबोर्ड खुल रहा है…</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "पूरा नाम *", key: "name", placeholder: "राम कुमार शर्मा", type: "text" },
              { label: "पार्टी / दल *", key: "party", placeholder: "निर्दलीय / भाजपा / कांग्रेस…", type: "text" },
              { label: "वार्ड संख्या *", key: "ward", placeholder: "वार्ड 20", type: "text" },
              { label: "मोबाइल नंबर *", key: "mobile", placeholder: "9876543210", type: "tel" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>{field.label}</label>
                <input
                  type={field.type}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-card)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  placeholder={field.placeholder}
                  value={(profile as Record<string, string>)[field.key]}
                  onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>क्षेत्र / निर्वाचन क्षेत्र</label>
            <input type="text" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-card)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} placeholder="खेजरोली नगर पालिका" value={profile.constituency} onChange={e => setProfile(p => ({ ...p, constituency: e.target.value }))} />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>चुनावी नारा</label>
            <input type="text" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-card)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} placeholder="जन सेवा ही धर्म है" value={profile.slogan} onChange={e => setProfile(p => ({ ...p, slogan: e.target.value }))} />
          </div>

          <button
            style={{ marginTop: 22, width: "100%", padding: "12px", borderRadius: 10, background: (profile.name && profile.party && profile.ward && profile.mobile) ? "var(--color-forest)" : "#9ca3af", color: "#fff", fontWeight: 700, fontSize: "1rem", border: "none", cursor: (profile.name && profile.party && profile.ward && profile.mobile) ? "pointer" : "not-allowed", transition: "background 0.2s" }}
            onClick={handleProfileSave}
            disabled={profileSaving || !profile.name || !profile.party || !profile.ward || !profile.mobile}
          >
            {profileSaving ? "⏳ सेव हो रहा है…" : "💾 प्रोफाइल सेव करें और डैशबोर्ड खोलें →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 12, marginBottom: 0 }}>* चिह्नित फील्ड जरूरी हैं। बाकी जानकारी बाद में प्रोफाइल टैब से भर सकते हैं।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">

      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="sidebar-brand">
              <div className="sidebar-brand-icon">ख</div>
              <div>
                <div className="sidebar-brand-name">निर्दलीय शक्ति मंच</div>
                <div className="sidebar-brand-sub">खेजरोली नगर पालिका 2026</div>
              </div>
            </div>
          </div>

          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              <ul className="sidebar-menu">
                {section.items.map(item => {
                  const locked = !profileComplete && item.name !== "मेरा प्रोफाइल";
                  return (
                    <li
                      key={item.name}
                      className={`sidebar-item ${activeTab === item.name ? "active" : ""} ${locked ? "sidebar-item-locked" : ""}`}
                      onClick={() => navChange(item.name)}
                      title={locked ? "पहले प्रोफाइल पूरी करें" : undefined}
                      style={locked ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" } : undefined}
                    >
                      <span className="sidebar-icon">{item.icon}</span>
                      {item.name}
                      {locked && <span style={{ marginLeft: "auto", fontSize: "0.7rem" }}>🔒</span>}
                      {!locked && item.name === "मतदाता सूची" && (
                        <span className="sidebar-badge">{totalCount}</span>
                      )}
                      {!locked && item.name === "कार्य योजना" && followUpCount > 0 && (
                        <span className="sidebar-badge">{followUpCount}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <div className="sidebar-bottom-widget">
            <div style={{ fontSize: "0.75rem", color: "#fff", marginBottom: "8px", fontWeight: 600 }}>
              चुनाव 2026 — 25 वार्ड
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>
              <span>सक्रिय: 25/25</span><span>100%</span>
            </div>
            <div className="chart-bar-widget">
              <div className="chart-bar-fill-green" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="sidebar-footer">
            📞 1800-123-4567<br />
            📧 support@nirdaliya.in
          </div>
        </div>
      </aside>

      {/* ── Main Column ── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <span className="header-ward-label">वार्ड चयन</span>
            <select
              className="form-select"
              style={{ width: 190 }}
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
            >
              <option>वार्ड 07 - उत्तर नगर</option>
              <option>वार्ड 08 - दक्षिण नगर</option>
              <option>वार्ड 09 - शास्त्री सर्कल</option>
            </select>
          </div>

          <div className="header-search">
            <span className="header-search-icon">🔍</span>
            <input
              type="text"
              placeholder="नाम / वोटर आईडी / मोबाइल खोजें..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="header-right">
            <button className="header-icon-btn" title="सूचनाएं">
              🔔
              <span className="header-notif-dot" />
            </button>
            <button className="header-icon-btn" title="रिफ्रेश" onClick={reloadVoters}>🔄</button>
            <div className="header-vdivider" />
            <div className="header-user">
              <div className="header-avatar">रा</div>
              <div>
                <div className="header-user-name">राकेश शर्मा</div>
                <div className="header-user-role">वार्ड प्रभारी</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="app-content">
          <main className="main-workspace">

            {/* ════ मतदाता सूची ════ */}
            {activeTab === "मतदाता सूची" && (
              <>
                {loading && (
                  <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "1rem" }}>
                    ⏳ मतदाता डेटा लोड हो रहा है…
                  </div>
                )}
                {!loading && (<>
                <div className="page-header">
                  <div className="page-title">
                    <h2>मतदाता सूची</h2>
                    <p>वार्ड अनुसार मतदाताओं की सूची — फ़िल्टर, खोज और संपर्क प्रबंधन</p>
                  </div>
                  <div className="page-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      setFilterBooth("सभी"); setFilterArea("सभी"); setFilterAgeGroup("सभी");
                      setFilterGender("सभी"); setFilterAvail("सभी"); setFilterContact("सभी");
                      setSearchTerm(""); setCurrentPage(1);
                    }}>↺ रीसेट</button>
                    <button className="btn btn-primary btn-sm" onClick={exportCSV}>📥 CSV डाउनलोड</button>
                  </div>
                </div>

                {/* Metric Cards */}
                <div className="metrics-row">
                  {[
                    { label: "कुल मतदाता", value: filteredVoters.length, icon: "👥", bg: "#eff6ff", fg: "#3b82f6", cls: "mc-blue" },
                    { label: "उपलब्ध मतदाता", value: availCount, icon: "🏡", bg: "#fef3c7", fg: "#d97706", cls: "mc-amber" },
                    { label: "संपर्कित", value: contactedCount, icon: "🤝", bg: "#f5f3ff", fg: "#8b5cf6", cls: "mc-purple" },
                    { label: "लंबित संपर्क", value: pendingCount, icon: "⏳", bg: "#fee2e2", fg: "#ef4444", cls: "mc-red" },
                    { label: "मीटिंग तय", value: meetingCount, icon: "📅", bg: "#d1fae5", fg: "#10b981", cls: "mc-green" },
                  ].map(c => (
                    <div key={c.label} className={`metric-card ${c.cls}`}>
                      <div className="metric-top">
                        <div className="metric-icon" style={{ backgroundColor: c.bg, color: c.fg }}>{c.icon}</div>
                        <span className="metric-trend up">
                          {Math.round((c.value / Math.max(totalCount, 1)) * 100)}%
                        </span>
                      </div>
                      <div>
                        <div className="metric-value">{c.value.toLocaleString("hi-IN")}</div>
                        <div className="metric-label">{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters — dynamic options from real data */}
                {(() => {
                  const uniqueBooths = [...new Set(voters.map(v => v.booth))].sort((a,b) => a-b);
                  const uniqueAreas  = [...new Set(voters.map(v => v.area).filter(a => a && a.length > 1 && a.length < 40))].sort();
                  const uniqueGroups = [...new Set(voters.map(v => v.group).filter(Boolean) as string[])].sort();
                  const boothOpts: [string,string][] = [["सभी","सभी बूथ"], ...uniqueBooths.map(b => [String(b), `बूथ ${b}`] as [string,string])];
                  const areaOpts:  [string,string][] = [["सभी","सभी क्षेत्र"], ...uniqueAreas.map(a => [a, a.length > 20 ? a.slice(0,20)+"…" : a] as [string,string])];
                  const groupOpts: [string,string][] = [["सभी","सभी ग्रुप"], ...uniqueGroups.map(g => [g, g] as [string,string])];
                  return (
                <div className="panel-card">
                  <div className="panel-card-title">🔎 फ़िल्टर करें</div>
                  <div className="filters-grid">
                    {[
                      { label: "बूथ नंबर", val: filterBooth, set: setFilterBooth, opts: boothOpts },
                      { label: "क्षेत्र", val: filterArea, set: setFilterArea, opts: areaOpts },
                      { label: "आयु वर्ग", val: filterAgeGroup, set: setFilterAgeGroup, opts: [["सभी","सभी आयु"],["18-25","18–25"],["26-45","26–45"],["46-60","46–60"],["60+","60+"]] },
                      { label: "लिंग", val: filterGender, set: setFilterGender, opts: [["सभी","सभी"],["पुरुष","पुरुष"],["महिला","महिला"]] },
                      { label: "उपलब्धता", val: filterAvail, set: setFilterAvail, opts: [["सभी","सभी"],["उपलब्ध","उपलब्ध"],["बाहर","बाहर"]] },
                      { label: "संपर्क स्थिति", val: filterContact, set: setFilterContact, opts: [["सभी","सभी"],["संपर्क हुआ","संपर्क हुआ"],["फिर संपर्क","फिर संपर्क"],["घर पर नहीं मिले","घर पर नहीं मिले"],["मीटिंग तय","मीटिंग तय"]] },
                      { label: "ग्रुप", val: filterGroup, set: setFilterGroup, opts: groupOpts },
                    ].map(f => (
                      <div className="form-group" key={f.label} style={{ margin: 0 }}>
                        <label className="form-label">{f.label}</label>
                        <select className="form-select" value={f.val} onChange={e => { f.set(e.target.value); setCurrentPage(1); }}>
                          {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                  );
                })()}

                {/* Table */}
                <div className="panel-card" style={{ padding: 0 }}>
                  <div className="voter-table-container">
                    <table className="voter-table">
                      <thead>
                        <tr>
                          <th>
                            <input type="checkbox"
                              checked={currentItems.length > 0 && currentItems.every(v => selectedVoterIds[v.id])}
                              onChange={e => handleSelectAll(e.target.checked)} />
                          </th>
                          <th>#</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("id")}>वोटर आईडी{sortIcon("id")}</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("name")}>नाम{sortIcon("name")}</th>
                          <th>परिवार प्रमुख</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("booth")}>बूथ{sortIcon("booth")}</th>
                          <th>क्षेत्र</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("age")}>आयु{sortIcon("age")}</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("gender")}>लिंग{sortIcon("gender")}</th>
                          <th>ग्रुप</th>
                          <th>मोबाइल</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("availability")}>उपलब्धता{sortIcon("availability")}</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("contactStatus")}>संपर्क{sortIcon("contactStatus")}</th>
                          <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("lastContact")}>अंतिम संपर्क{sortIcon("lastContact")}</th>
                          <th>अगला कार्य</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((v, i) => (
                          <tr key={v.id} style={{ background: saveFlash === v.id ? "rgba(16,185,129,0.07)" : undefined, transition: "background 0.5s" }}>
                            <td>
                              <input type="checkbox" checked={!!selectedVoterIds[v.id]}
                                onChange={e => handleSelectVoter(v.id, e.target.checked)} />
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                              {(currentPage - 1) * itemsPerPage + i + 1}
                              {saveFlash === v.id && <span style={{ color: "#10b981", marginLeft: 4, fontSize: "0.65rem" }}>✓</span>}
                            </td>
                            <td style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>{v.id}</td>
                            <td><span style={{ fontWeight: 600 }}>{v.name}</span></td>
                            <td style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{v.familyHead}</td>
                            <td>
                              <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "2px 7px", borderRadius: "var(--radius-full)", fontSize: "0.7rem", fontWeight: 600 }}>
                                {v.booth}
                              </span>
                            </td>
                            {/* Area — inline edit */}
                            <td style={{ maxWidth: 120 }}>
                              {editAreaId === v.id ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={editAreaVal}
                                  onChange={e => setEditAreaVal(e.target.value)}
                                  onBlur={() => { updateSingleVoter(v.id, { area: editAreaVal }); setEditAreaId(null); }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") { updateSingleVoter(v.id, { area: editAreaVal }); setEditAreaId(null); }
                                    if (e.key === "Escape") setEditAreaId(null);
                                  }}
                                  style={{ width: 100, fontSize: "0.78rem", padding: "2px 6px", border: "1.5px solid var(--primary)", borderRadius: 4, outline: "none" }}
                                />
                              ) : (
                                <span
                                  onClick={() => { setEditAreaId(v.id); setEditAreaVal(v.area ?? ""); }}
                                  title="क्लिक करके बदलें"
                                  style={{
                                    cursor: "pointer",
                                    color: v.area ? "var(--text-secondary)" : "#cbd5e1",
                                    fontSize: "0.78rem",
                                    borderBottom: "1px dashed #cbd5e1",
                                    display: "inline-block", maxWidth: 110,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}
                                >
                                  {v.area ? (v.area.length > 14 ? v.area.slice(0, 14) + "…" : v.area) : "+ क्षेत्र"}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>{v.age}</td>
                            <td>{v.gender}</td>

                            {/* Group badge */}
                            <td>
                              {v.group ? (
                                <span style={{
                                  background: "#f0fdf4", color: "#15803d",
                                  border: "1px solid #bbf7d0",
                                  fontSize: "0.68rem", fontWeight: 600,
                                  padding: "2px 7px", borderRadius: 20,
                                  whiteSpace: "nowrap", display: "inline-block",
                                  maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis",
                                }} title={v.group}>
                                  🏷️ {v.group}
                                </span>
                              ) : (
                                <span style={{ color: "#e2e8f0", fontSize: "0.72rem" }}>—</span>
                              )}
                            </td>

                            {/* Mobile — inline edit */}
                            <td>
                              {editMobileId === v.id ? (
                                <input
                                  autoFocus
                                  type="tel"
                                  value={editMobileVal}
                                  maxLength={10}
                                  onChange={e => setEditMobileVal(e.target.value.replace(/\D/g, ""))}
                                  onBlur={() => { updateSingleVoter(v.id, { mobile: editMobileVal }); setEditMobileId(null); }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") { updateSingleVoter(v.id, { mobile: editMobileVal }); setEditMobileId(null); }
                                    if (e.key === "Escape") setEditMobileId(null);
                                  }}
                                  style={{ width: 90, fontSize: "0.75rem", padding: "2px 4px", border: "1px solid var(--color-forest)", borderRadius: 4 }}
                                />
                              ) : (
                                <span
                                  onClick={() => { setEditMobileId(v.id); setEditMobileVal(v.mobile || ""); }}
                                  title="क्लिक करें — मोबाइल जोड़ें/बदलें"
                                  style={{ cursor: "pointer", color: v.mobile ? "var(--text-secondary)" : "var(--color-forest)", fontSize: "0.78rem", borderBottom: "1px dashed currentColor" }}
                                >
                                  {v.mobile || "+ जोड़ें"}
                                </span>
                              )}
                            </td>

                            {/* Availability — click to toggle */}
                            <td>
                              <button
                                onClick={() => updateSingleVoter(v.id, { availability: v.availability === "उपलब्ध" ? "बाहर" : "उपलब्ध" })}
                                title="क्लिक करें — उपलब्धता बदलें"
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                              >
                                <span className={`status-pill ${v.availability === "उपलब्ध" ? "status-avail-green" : "status-avail-red"}`}>
                                  {v.availability === "उपलब्ध" ? "● " : "○ "}{v.availability}
                                </span>
                              </button>
                            </td>

                            {/* Contact Status — inline select */}
                            <td>
                              <select
                                value={v.contactStatus}
                                onChange={e => updateSingleVoter(v.id, { contactStatus: e.target.value as Voter["contactStatus"] })}
                                style={{
                                  fontSize: "0.72rem", padding: "2px 4px", borderRadius: 6, border: "1px solid var(--border-color)",
                                  background: v.contactStatus === "संपर्क हुआ" ? "#d1fae5" :
                                              v.contactStatus === "मीटिंग तय"  ? "#ede9fe" :
                                              v.contactStatus === "घर पर नहीं मिले" ? "#fee2e2" : "#fef9c3",
                                  color: v.contactStatus === "संपर्क हुआ" ? "#065f46" :
                                         v.contactStatus === "मीटिंग तय"  ? "#4c1d95" :
                                         v.contactStatus === "घर पर नहीं मिले" ? "#991b1b" : "#78350f",
                                  fontWeight: 600, cursor: "pointer", maxWidth: 130,
                                }}
                              >
                                <option value="संपर्क हुआ">✅ संपर्क हुआ</option>
                                <option value="फिर संपर्क">🔄 फिर संपर्क</option>
                                <option value="घर पर नहीं मिले">🚪 नहीं मिले</option>
                                <option value="मीटिंग तय">📅 मीटिंग तय</option>
                              </select>
                            </td>

                            {/* Last Contact — auto-filled, read-only */}
                            <td style={{ color: "var(--text-secondary)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                              {v.lastContact || "—"}
                            </td>

                            {/* अगला कार्य — inline edit */}
                            <td>
                              {editNextId === v.id ? (
                                <input
                                  autoFocus
                                  value={editNextVal}
                                  onChange={e => setEditNextVal(e.target.value)}
                                  onBlur={() => { updateSingleVoter(v.id, { nextAction: editNextVal }); setEditNextId(null); }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") { updateSingleVoter(v.id, { nextAction: editNextVal }); setEditNextId(null); }
                                    if (e.key === "Escape") setEditNextId(null);
                                  }}
                                  style={{ width: 110, fontSize: "0.75rem", padding: "2px 4px", border: "1px solid var(--color-forest)", borderRadius: 4 }}
                                />
                              ) : (
                                <span
                                  onClick={() => { setEditNextId(v.id); setEditNextVal(v.nextAction || ""); }}
                                  title="क्लिक करें — अगला कार्य संपादित करें"
                                  style={{ cursor: "pointer", fontWeight: v.nextAction ? 600 : "normal", color: v.nextAction ? "var(--color-saffron)" : "var(--text-muted)", borderBottom: "1px dashed currentColor", fontSize: "0.78rem" }}
                                >
                                  {v.nextAction || "+ जोड़ें"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {currentItems.length === 0 && (
                          <tr>
                            <td colSpan={14} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                              कोई मतदाता नहीं मिला
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer: pagination + per-page */}
                  <div className="table-footer">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>प्रति पेज:</span>
                      <select className="form-select" style={{ width: 70, padding: "4px 8px" }}
                        value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span style={{ marginLeft: 10, color: "var(--text-secondary)" }}>
                        कुल <strong style={{ color: "var(--text-primary)" }}>{sortedVoters.length}</strong> मतदाता
                      </span>
                    </div>
                    <div className="pagination">
                      <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
                      <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
                        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                        const p = start + k;
                        return p <= totalPages ? (
                          <button key={p} className={`pagination-btn ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                        ) : null;
                      })}
                      <button className="pagination-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                      <button className="pagination-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}>»</button>
                    </div>
                  </div>

                  {/* Bulk actions */}
                  <div className="table-bulk">
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginRight: 4 }}>
                      चयनित: <strong style={{ color: "var(--color-saffron)" }}>{selectedCount}</strong>
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={handleBulkFollowup} disabled={selectedCount === 0}>
                      📋 फॉलो-अप जोड़ें
                    </button>
                    <select className="form-select" style={{ width: 170, padding: "5px 10px", fontSize: "0.78rem" }}
                      defaultValue="" disabled={selectedCount === 0}
                      onChange={e => { if (e.target.value) { handleBulkStatusChange(e.target.value as Voter["contactStatus"]); e.target.value = ""; } }}>
                      <option value="" disabled>स्थिति बदलें…</option>
                      <option value="संपर्क हुआ">संपर्क हुआ</option>
                      <option value="फिर संपर्क">फिर संपर्क</option>
                      <option value="घर पर नहीं मिले">घर पर नहीं मिले</option>
                      <option value="मीटिंग तय">मीटिंग तय</option>
                    </select>

                    {/* Group create */}
                    {showGroupInput ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="ग्रुप का नाम…"
                          value={groupName}
                          onChange={e => setGroupName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleCreateGroup(); if (e.key === "Escape") setShowGroupInput(false); }}
                          style={{ padding: "4px 10px", fontSize: "0.78rem", border: "1.5px solid var(--primary)", borderRadius: 6, outline: "none", width: 140 }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleCreateGroup} disabled={!groupName.trim() || selectedCount === 0}>
                          बनाएं
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setShowGroupInput(false); setGroupName(""); }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowGroupInput(true)} disabled={selectedCount === 0}
                        style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                        🏷️ ग्रुप बनाएं
                      </button>
                    )}
                  </div>
                </div>
                </>)}
              </>
            )}

            {/* ════ मेरा प्रोफाइल ════ */}
            {activeTab === "मेरा प्रोफाइल" && (
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: 24 }}>
                  <div className="page-title">
                    <h2>🧑‍💼 उम्मीदवार प्रोफाइल</h2>
                    <p>चुनाव लड़ने से पहले अपनी पूरी जानकारी भरें</p>
                  </div>
                </div>

                {/* Incomplete banner */}
                {profileLoaded && !profileComplete && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#c2410c", fontSize: "0.9rem" }}>प्रोफाइल अधूरी है</div>
                      <div style={{ fontSize: "0.8rem", color: "#78350f" }}>नाम, पार्टी, वार्ड और मोबाइल नंबर भरना जरूरी है।</div>
                    </div>
                  </div>
                )}

                {/* Success flash */}
                {profileSaved && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.3rem" }}>✅</span>
                    <div style={{ fontWeight: 600, color: "#15803d", fontSize: "0.9rem" }}>प्रोफाइल सेव हो गई!</div>
                  </div>
                )}

                {/* Preview card */}
                {profileComplete && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                      {profile.photoUrl ? <img src={profile.photoUrl} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🧑"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--text-primary)" }}>{profile.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>{profile.party} · {profile.ward}</div>
                      {profile.slogan && <div style={{ marginTop: 6, fontSize: "0.82rem", color: "var(--color-saffron)", fontStyle: "italic" }}>"{profile.slogan}"</div>}
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      <span className="badge badge-brand" style={{ background: "rgba(77,101,60,0.12)", color: "var(--color-forest)", fontSize: "0.75rem" }}>✅ प्रोफाइल पूर्ण</span>
                      {profile.mobile && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>📱 {profile.mobile}</span>}
                    </div>
                  </div>
                )}

                {/* Form */}
                <div className="panel-card" style={{ borderRadius: 14 }}>
                  <div className="panel-card-title" style={{ marginBottom: 16 }}>व्यक्तिगत जानकारी</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {[
                      { label: "पूरा नाम *", key: "name", placeholder: "राम कुमार शर्मा", type: "text" },
                      { label: "पार्टी / दल *", key: "party", placeholder: "निर्दलीय / भाजपा / कांग्रेस…", type: "text" },
                      { label: "वार्ड संख्या *", key: "ward", placeholder: "वार्ड 20", type: "text" },
                      { label: "क्षेत्र / निर्वाचन क्षेत्र", key: "constituency", placeholder: "खेजरोली नगर पालिका", type: "text" },
                      { label: "मोबाइल नंबर *", key: "mobile", placeholder: "9876543210", type: "tel" },
                      { label: "ईमेल", key: "email", placeholder: "candidate@email.com", type: "email" },
                      { label: "जन्म तिथि", key: "dob", placeholder: "", type: "date" },
                      { label: "शैक्षिक योग्यता", key: "education", placeholder: "स्नातक, B.A., M.A.…", type: "text" },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>{field.label}</label>
                        <input
                          type={field.type}
                          className="filter-select"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8 }}
                          placeholder={field.placeholder}
                          value={(profile as Record<string, string>)[field.key]}
                          onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>पता</label>
                    <input type="text" className="filter-select" style={{ width: "100%", padding: "8px 10px", borderRadius: 8 }} placeholder="मकान नंबर, मोहल्ला, खेजरोली, अलवर, राजस्थान" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>चुनावी नारा</label>
                    <input type="text" className="filter-select" style={{ width: "100%", padding: "8px 10px", borderRadius: 8 }} placeholder="जैसे: जन सेवा ही धर्म है" value={profile.slogan} onChange={e => setProfile(p => ({ ...p, slogan: e.target.value }))} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>परिचय / Bio</label>
                    <textarea className="filter-select" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, minHeight: 80, resize: "vertical" }} placeholder="अपने बारे में संक्षिप्त जानकारी…" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                  </div>

                  <div className="panel-card-title" style={{ marginTop: 20, marginBottom: 12 }}>सोशल मीडिया</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                    {[
                      { label: "📘 Facebook", key: "facebook", placeholder: "facebook.com/…" },
                      { label: "📸 Instagram", key: "instagram", placeholder: "@username" },
                      { label: "💬 WhatsApp", key: "whatsapp", placeholder: "9876543210" },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>{field.label}</label>
                        <input type="text" className="filter-select" style={{ width: "100%", padding: "8px 10px", borderRadius: 8 }} placeholder={field.placeholder} value={(profile as Record<string, string>)[field.key]} onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>फोटो URL</label>
                    <input type="url" className="filter-select" style={{ width: "100%", padding: "8px 10px", borderRadius: 8 }} placeholder="https://…/photo.jpg" value={profile.photoUrl} onChange={e => setProfile(p => ({ ...p, photoUrl: e.target.value }))} />
                  </div>

                  <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
                    <button className="btn btn-primary" style={{ minWidth: 140 }} onClick={handleProfileSave} disabled={profileSaving || !profile.name || !profile.party || !profile.ward || !profile.mobile}>
                      {profileSaving ? "⏳ सेव हो रहा है…" : "💾 प्रोफाइल सेव करें"}
                    </button>
                    {!profileComplete && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>* चिह्नित फील्ड जरूरी हैं</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ════ डैशबोर्ड ════ */}
            {activeTab === "डैशबोर्ड" && (
              <>
                {loading && (
                  <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "1rem" }}>
                    ⏳ डेटा लोड हो रहा है…
                  </div>
                )}
                {!loading && (<>
                <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                  <div className="page-title">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span className="badge badge-brand" style={{ background: "rgba(77, 101, 60, 0.1)", color: "var(--color-forest)", fontSize: "0.8rem" }}>
                        🗳️ नगर पालिका परिषद चुनाव 2026
                      </span>
                      <span className="badge badge-saffron" style={{ fontSize: "0.8rem", background: "var(--bg-card-cream)", color: "var(--color-terracotta)" }}>
                        चेयरमैन व वार्ड पार्षद पद
                      </span>
                    </div>
                    <h2>चुनाव डैशबोर्ड</h2>
                    <p>वार्ड-वार मतदाता विवरण, लक्ष्य प्रगति और लाइव विश्लेषण आंकड़े</p>
                  </div>
                  
                  {/* Countdown Timer */}
                  <div className="custom-card" style={{ padding: "12px 24px", background: "var(--bg-card-cream)", border: "1px dashed var(--color-terracotta)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.75rem" }}>⏳</span>
                    <div>
                      <h4 style={{ fontSize: "0.85rem", color: "var(--color-terracotta)", margin: 0, fontWeight: 700 }}>मतदान उल्टी गिनती</h4>
                      <p style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                        20 अक्टूबर 2026 (<span style={{ color: "var(--color-terracotta)" }}>{daysLeft} दिन शेष</span>)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile incomplete banner */}
                {profileLoaded && !profileComplete && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navChange("मेरा प्रोफाइल")}>
                    <span style={{ fontSize: "1.4rem" }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#c2410c", fontSize: "0.88rem" }}>पहले अपनी प्रोफाइल पूरी करें</div>
                      <div style={{ fontSize: "0.78rem", color: "#78350f" }}>नाम, पार्टी, वार्ड और मोबाइल नंबर भरना जरूरी है।</div>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ea580c", border: "1px solid #fed7aa", borderRadius: 6, padding: "4px 10px", background: "#ffedd5" }}>प्रोफाइल भरें →</span>
                  </div>
                )}

                {/* Metrics Cards Row */}
                <div className="metrics-row">
                  {[
                    { label: "कुल मतदाता", value: totalCount, icon: "👥", bg: "#eff6ff", fg: "#3b82f6", cls: "mc-blue" },
                    { label: "उपलब्ध", value: availCount, icon: "🏡", bg: "#fef3c7", fg: "#d97706", cls: "mc-amber" },
                    { label: "समर्थक संपर्क", value: supporterCount, icon: "🤝", bg: "#f5f3ff", fg: "#8b5cf6", cls: "mc-purple" },
                    { label: "मीटिंग तय", value: meetingCount, icon: "📅", bg: "#d1fae5", fg: "#10b981", cls: "mc-green" },
                  ].map(c => (
                    <div key={c.label} className={`metric-card ${c.cls}`}>
                      <div className="metric-top">
                        <div className="metric-icon" style={{ backgroundColor: c.bg, color: c.fg }}>{c.icon}</div>
                      </div>
                      <div>
                        <div className="metric-value">{c.value.toLocaleString("hi-IN")}</div>
                        <div className="metric-label">{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gender + Availability mini-row */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                  {[
                    { label: "पुरुष मतदाता", value: maleCount, icon: "👨", color: "#3b82f6" },
                    { label: "महिला मतदाता", value: femaleCount, icon: "👩", color: "#ec4899" },
                    { label: "बाहर (अनुपस्थित)", value: totalCount - availCount, icon: "🚌", color: "#f59e0b" },
                    { label: "फॉलो-अप बाकी", value: followUpCount, icon: "📋", color: "#8b5cf6" },
                  ].map(c => (
                    <div key={c.label} style={{ flex: "1 1 140px", padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.4rem" }}>{c.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: c.color }}>{c.value.toLocaleString("hi-IN")}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advanced Row 1: Victory Target Calculator & Voter Sentiment */}
                <div className="grid-2" style={{ marginBottom: "20px" }}>
                  
                  {/* Victory Target Calculator */}
                  <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🏆 जीत का लक्ष्य (Victory Target Calculator)</h3>
                      <span className="badge badge-brand" style={{ background: "rgba(77, 101, 60, 0.1)", color: "var(--color-forest)" }}>सत्यापित विश्लेषण</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                      {/* Slider Control */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                          <span>अनुमानित मतदान प्रतिशत (Estimated Turnout):</span>
                          <strong style={{ color: "var(--color-terracotta)" }}>{turnoutPct}%</strong>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={turnoutPct}
                          onChange={(e) => setTurnoutPct(Number(e.target.value))}
                          style={{ width: "100%", accentColor: "var(--color-terracotta)" }}
                        />
                      </div>

                      {/* Calculations Panel */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem", padding: "12px", background: "#fcfaf4", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                        <div>कुल मतदाता: <strong>{totalCount}</strong></div>
                        <div>अनुमानित मतदान: <strong>{Math.round(totalCount * (turnoutPct / 100))}</strong></div>
                        <div style={{ borderTop: "1px solid #ede8dc", paddingTop: "8px", marginTop: "8px" }}>जीत के लिए आवश्यक (50% + 1): <strong style={{ color: "var(--color-forest)" }}>{Math.round(totalCount * (turnoutPct / 100) / 2) + 1}</strong></div>
                        <div style={{ borderTop: "1px solid #ede8dc", paddingTop: "8px", marginTop: "8px" }}>निश्चित समर्थक (संपर्कित): <strong>{contactedCount}</strong></div>
                      </div>

                      {/* Resulting Gap Indicator */}
                      {(() => {
                        const estVotes = Math.round(totalCount * (turnoutPct / 100));
                        const targetToWin = Math.round(estVotes / 2) + 1;
                        const gap = targetToWin - contactedCount;
                        return (
                          <div style={{ padding: "12px", borderRadius: "8px", fontSize: "0.85rem", textAlign: "center", background: gap > 0 ? "rgba(190, 113, 61, 0.1)" : "rgba(77, 101, 60, 0.1)", border: `1px solid ${gap > 0 ? "var(--color-terracotta)" : "var(--color-forest)"}` }}>
                            {gap > 0 ? (
                              <span>जीत सुनिश्चित करने के लिए अभी <strong style={{ color: "var(--color-terracotta)", fontSize: "1rem" }}>{gap}</strong> अतिरिक्त वोटों का समर्थन प्राप्त करना आवश्यक है।</span>
                            ) : (
                              <span style={{ color: "var(--color-forest)" }}>🎯 <strong>जीत का लक्ष्य पूर्ण!</strong> वर्तमान समर्थन स्तर पर जीत सुनिश्चित है (+{Math.abs(gap)} अतिरिक्त वोट)।</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Voter Sentiment Analysis — real data */}
                  <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ fontSize: "1.1rem", margin: 0 }}>📊 संपर्क स्थिति (Contact Status)</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", justifyContent: "center", flex: 1 }}>
                      {[
                        { label: "✅ समर्थक (संपर्क हुआ + मीटिंग तय)", count: supporterCount, color: "var(--color-forest)" },
                        { label: "🔄 फिर संपर्क करना है", count: pendingCount, color: "var(--color-yellow)" },
                        { label: "🚪 घर पर नहीं मिले", count: notFoundCount, color: "var(--color-red)" },
                      ].map((item) => {
                        const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                        return (
                          <div key={item.label} style={{ fontSize: "0.85rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600 }}>{item.label}</span>
                              <strong>{item.count} ({pct}%)</strong>
                            </div>
                            <div className="chart-bar-bg" style={{ height: "10px" }}>
                              <div className="chart-bar-fill" style={{ width: `${Math.max(pct, 1)}%`, background: item.color, height: "100%", borderRadius: "5px" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalCount > 0 && supporterCount === 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "8px", background: "var(--bg-card-cream)", borderRadius: "8px" }}>
                        अभी किसी से संपर्क नहीं हुआ — मतदाता सूची में जाकर संपर्क स्थिति अपडेट करें
                      </div>
                    )}
                  </div>

                </div>

                {/* Advanced Row 2: Booth Performance Leaderboard (Full Width for 1st Phase) */}
                <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🗳️ बूथ प्रदर्शन लीडरबोर्ड (Booth Rankings)</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>कवरेज प्रतिशत के आधार पर</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginTop: "8px" }}>
                    {(() => {
                      // Dynamically calculate booth statistics and sort by contact rate
                      const boothList = Object.entries(boothCounts).map(([booth, count]) => {
                        const boothNo = Number(booth);
                        const contacted = voters.filter(v => v.booth === boothNo && v.contactStatus === "संपर्क हुआ").length;
                        const pct = count > 0 ? Math.round((contacted / count) * 100) : 0;
                        return { booth: boothNo, count, contacted, pct };
                      }).sort((a, b) => b.pct - a.pct); // Sort descending

                      return boothList.map((item, index) => {
                        let statusLabel = "सामान्य";
                        let labelColor = "var(--text-secondary)";
                        let badgeBg = "rgba(0,0,0,0.03)";
                        
                        if (index === 0) {
                          statusLabel = "सुरक्षित बूथ (Strong)";
                          labelColor = "var(--color-forest)";
                          badgeBg = "var(--bg-card-green)";
                        } else if (index === boothList.length - 1 || item.pct < 30) {
                          statusLabel = "कमजोर (Critical - Focus)";
                          labelColor = "var(--color-terracotta)";
                          badgeBg = "var(--bg-card-cream)";
                        }

                        return (
                          <div key={item.booth} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fcfaf4", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "0.85rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: labelColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                                {index + 1}
                              </span>
                              <strong>बूथ {item.booth}</strong>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                              <span>{item.contacted}/{item.count} संपर्कित ({item.pct}%)</span>
                              <span className="badge" style={{ backgroundColor: badgeBg, color: labelColor, fontSize: "0.65rem", padding: "2px 6px" }}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                </>)}
              </>
            )}

            {/* ════ वार्ड मैनेजमेंट ════ */}
            {activeTab === "वार्ड मैनेजमेंट" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>वार्ड मैनेजमेंट</h2>
                    <p>अपलोड किए गए वार्डों का संपर्क कवरेज और बूथ विवरण</p>
                  </div>
                </div>
                {(() => {
                  const wardGroups = voters.reduce<Record<string, Voter[]>>((acc, v) => {
                    const key = v.booth > 0 ? `बूथ ${v.booth}` : "अज्ञात";
                    (acc[key] = acc[key] || []).push(v);
                    return acc;
                  }, {});
                  const rows = Object.entries(wardGroups).sort(([a],[b]) => a.localeCompare(b));
                  return rows.length === 0 ? (
                    <div className="coming-soon">
                      <div className="coming-soon-emoji">📂</div>
                      <h3 style={{ fontSize: "1.1rem" }}>कोई वार्ड डेटा नहीं</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Admin panel से PDF अपलोड करके वार्ड जोड़ें।</p>
                    </div>
                  ) : (
                    <div className="panel-card" style={{ padding: 0 }}>
                      <table className="ward-table">
                        <thead>
                          <tr>
                            <th>बूथ</th>
                            <th>कुल मतदाता</th>
                            <th>पुरुष</th>
                            <th>महिला</th>
                            <th>समर्थक संपर्क</th>
                            <th>बाकी</th>
                            <th>कवरेज</th>
                            <th>स्थिति</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(([label, vs]) => {
                            const total = vs.length;
                            const male = vs.filter(v => v.gender === "पुरुष").length;
                            const female = vs.filter(v => v.gender === "महिला").length;
                            const supported = vs.filter(v => v.contactStatus === "संपर्क हुआ" || v.contactStatus === "मीटिंग तय").length;
                            const pending = total - supported;
                            const pct = total > 0 ? Math.round((supported / total) * 100) : 0;
                            return (
                              <tr key={label}>
                                <td><strong>{label}</strong></td>
                                <td><strong>{total}</strong></td>
                                <td style={{ color: "#3b82f6" }}>{male}</td>
                                <td style={{ color: "#ec4899" }}>{female}</td>
                                <td><span style={{ color: "#10b981", fontWeight: 600 }}>{supported}</span></td>
                                <td style={{ color: "var(--text-secondary)" }}>{pending}</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div className="chart-bar-bg" style={{ flex: 1, height: 7 }}>
                                      <div className="chart-bar-fill" style={{ width: `${Math.max(pct, 1)}%`, background: pct > 70 ? "#10b981" : pct > 30 ? "#f59e0b" : "#ef4444" }} />
                                    </div>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 700, width: 32, textAlign: "right" }}>{pct}%</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`status-pill ${pct > 70 ? "status-avail-green" : pct > 30 ? "status-contact-yellow" : "status-avail-red"}`}>
                                    {pct > 70 ? "सक्रिय" : pct > 30 ? "प्रगति" : "ध्यान दें"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ════ जाति एवं जनसांख्यिकी ════ */}
            {activeTab === "जाति एवं जनसांख्यिकी" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>जाति एवं जनसांख्यिकी</h2>
                    <p>वार्ड की सामाजिक संरचना एवं समूह विवरण (अनुमानित)</p>
                  </div>
                </div>
                <div className="panel-card">
                  <div className="panel-card-title">📊 जातिगत वितरण</div>
                  <div className="chart-container">
                    {[
                      { label: "ओबीसी — कुमावत, सैनी, चौधरी", pct: 45, color: "#10b981" },
                      { label: "सामान्य — शर्मा, राजपूत, मिश्रा", pct: 35, color: "#3b82f6" },
                      { label: "अनुसूचित जाति — वर्मा, बैरवा", pct: 12, color: "#f59e0b" },
                      { label: "अनुसूचित जनजाति — मीणा", pct: 8, color: "#ef4444" },
                    ].map(item => (
                      <div className="chart-row" key={item.label}>
                        <div className="chart-header">
                          <span style={{ fontWeight: 500 }}>{item.label}</span>
                          <strong style={{ color: item.color }}>{Math.round(totalCount * item.pct / 100)} ({item.pct}%)</strong>
                        </div>
                        <div className="chart-bar-bg">
                          <div className="chart-bar-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════ उम्र समूह विश्लेषण ════ */}
            {activeTab === "उम्र समूह विश्लेषण" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>आयु समूह विश्लेषण</h2>
                    <p>युवा एवं वरिष्ठ मतदाताओं का सांख्यिकीय वितरण</p>
                  </div>
                </div>
                <div className="panel-card">
                  <div className="panel-card-title">⏳ आयु वर्ग वितरण</div>
                  <div className="chart-container">
                    {[
                      { label: "18–25 वर्ष (युवा मतदाता)", color: "#8b5cf6", count: voters.filter(v => v.age <= 25).length },
                      { label: "26–45 वर्ष (वयस्क मतदाता)", color: "#3b82f6", count: voters.filter(v => v.age >= 26 && v.age <= 45).length },
                      { label: "46–60 वर्ष (मध्यम आयु)", color: "#10b981", count: voters.filter(v => v.age >= 46 && v.age <= 60).length },
                      { label: "60+ वर्ष (वरिष्ठ नागरिक)", color: "#f59e0b", count: voters.filter(v => v.age > 60).length },
                    ].map(item => {
                      const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                      return (
                        <div className="chart-row" key={item.label}>
                          <div className="chart-header">
                            <span style={{ fontWeight: 500 }}>{item.label}</span>
                            <strong style={{ color: item.color }}>{item.count} ({pct}%)</strong>
                          </div>
                          <div className="chart-bar-bg">
                            <div className="chart-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ════ उपलब्धता स्थिति ════ */}
            {activeTab === "उपलब्धता स्थिति" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>उपलब्धता स्थिति</h2>
                    <p>क्षेत्र-वार मतदाता उपलब्धता और बाहर गए मतदाताओं का विवरण</p>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="panel-card">
                    <div className="panel-card-title">📍 क्षेत्र-वार उपलब्धता</div>
                    <div className="chart-container">
                      {Object.entries(areaCounts).map(([area, count]) => {
                        const avail = voters.filter(v => v.area === area && v.availability === "उपलब्ध").length;
                        const pct = Math.round((avail / count) * 100);
                        return (
                          <div className="chart-row" key={area}>
                            <div className="chart-header">
                              <span style={{ fontWeight: 500 }}>{area}</span>
                              <span>{avail}/{count} उपलब्ध <strong style={{ color: "#10b981" }}>({pct}%)</strong></span>
                            </div>
                            <div className="chart-bar-bg">
                              <div className="chart-bar-fill" style={{ width: `${pct}%`, background: "#10b981" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="panel-card">
                    <div className="panel-card-title">🚌 बाहर गए मतदाता</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {Object.entries(areaCounts).map(([area, count]) => {
                        const away = voters.filter(v => v.area === area && v.availability === "बाहर").length;
                        return (
                          <div className="stat-row" key={area}>
                            <span style={{ color: "var(--text-secondary)" }}>{area}</span>
                            <span className="status-pill status-avail-red">{away} बाहर</span>
                          </div>
                        );
                      })}
                      <div className="stat-row" style={{ borderTop: "2px solid var(--border-color)", marginTop: 4, paddingTop: 8, borderBottom: "none" }}>
                        <strong>कुल बाहर</strong>
                        <strong style={{ color: "var(--color-red)" }}>{totalCount - availCount}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ जीत की गणना ════ */}
            {activeTab === "जीत की गणना" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>जीत की गणना</h2>
                    <p>अनुमानित वोट प्रतिशत के आधार पर जीत की संभावना</p>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", justifyContent: "center", padding: 32 }}>
                    <div className="win-percent-display">{winPct}%</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: winPct >= 50 ? "#059669" : "#dc2626" }}>
                      {winPct >= 50 ? "🏆 जीत की संभावना प्रबल" : "⚠️ और मेहनत जरूरी"}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center" }}>
                      अनुमानित वोट: <strong>{winVotes.toLocaleString("hi-IN")}</strong> / {totalCount}
                    </div>
                    <div className="chart-bar-bg" style={{ width: "100%", height: 14 }}>
                      <div className="chart-bar-fill" style={{ width: `${winPct}%`, background: winPct >= 50 ? "linear-gradient(90deg,#10b981,#34d399)" : "linear-gradient(90deg,#ef4444,#f87171)" }} />
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>जीत के लिए न्यूनतम 50% वोट आवश्यक</div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-card-title">🎚️ समर्थन अनुमान</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {[
                        { label: "ओबीसी समर्थन", val: obcSupport, set: setObcSupport, color: "#10b981", share: "45%" },
                        { label: "सामान्य समर्थन", val: genSupport, set: setGenSupport, color: "#3b82f6", share: "35%" },
                        { label: "अनुसूचित जाति", val: scSupport, set: setScSupport, color: "#f59e0b", share: "12%" },
                        { label: "अनुसूचित जनजाति", val: stSupport, set: setStSupport, color: "#8b5cf6", share: "8%" },
                      ].map(s => (
                        <div key={s.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600 }}>{s.label} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({s.share})</span></span>
                            <strong style={{ color: s.color }}>{s.val}%</strong>
                          </div>
                          <input type="range" min={0} max={100} value={s.val}
                            onChange={e => s.set(Number(e.target.value))}
                            style={{ width: "100%", accentColor: s.color, cursor: "pointer" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ कार्य योजना ════ */}
            {activeTab === "कार्य योजना" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>कार्य योजना</h2>
                    <p>चुनाव प्रचार की प्राथमिक कार्यसूची और अगले कदम</p>
                  </div>
                  <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={openAddTask}>+ कार्य जोड़ें</button>
                  </div>
                </div>

                {/* Add / Edit Task Modal */}
                {showTaskModal && (
                  <div className="panel-card" style={{ marginBottom: 16, border: "2px solid var(--accent)", background: "var(--bg-elevated)" }}>
                    <div className="panel-card-title">{editingTask ? "✏️ कार्य संपादित करें" : "➕ नया कार्य जोड़ें"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>कार्य शीर्षक *</label>
                        <input ref={taskTitleRef} className="voter-search-input" value={tkTitle} onChange={e => setTkTitle(e.target.value)}
                          placeholder="कार्य का नाम लिखें" style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>विवरण</label>
                        <input className="voter-search-input" value={tkDesc} onChange={e => setTkDesc(e.target.value)}
                          placeholder="विस्तार से लिखें (वैकल्पिक)" style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>अंतिम तिथि</label>
                        <input type="date" className="voter-search-input" value={tkDue} onChange={e => setTkDue(e.target.value)}
                          style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>प्राथमिकता</label>
                        <select className="voter-search-input" value={tkPriority} onChange={e => setTkPriority(e.target.value as Task["priority"])}
                          style={{ width: "100%", fontSize: "0.82rem" }}>
                          <option value="उच्च">🔴 उच्च</option>
                          <option value="सामान्य">🟡 सामान्य</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveTask} disabled={!tkTitle.trim()}>
                        {editingTask ? "✓ अपडेट करें" : "✓ जोड़ें"}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowTaskModal(false)}>रद्द करें</button>
                    </div>
                  </div>
                )}

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {(["लंबित", "सभी", "पूर्ण"] as const).map(f => (
                    <button key={f} onClick={() => setTaskFilter(f)}
                      className={`btn btn-sm ${taskFilter === f ? "btn-primary" : "btn-secondary"}`}>
                      {f === "लंबित" ? `⏳ लंबित (${taskList.filter(t => !t.done).length})` :
                       f === "पूर्ण"  ? `✅ पूर्ण (${taskList.filter(t => t.done).length})` : "सभी"}
                    </button>
                  ))}
                </div>

                {taskLoading ? (
                  <div className="panel-card" style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    लोड हो रहा है...
                  </div>
                ) : (() => {
                  const filtered = taskList.filter(t =>
                    taskFilter === "लंबित" ? !t.done :
                    taskFilter === "पूर्ण"  ? t.done : true
                  );
                  const high   = filtered.filter(t => t.priority === "उच्च");
                  const normal = filtered.filter(t => t.priority === "सामान्य");

                  if (filtered.length === 0) return (
                    <div className="panel-card" style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {taskFilter === "लंबित" ? "कोई लंबित कार्य नहीं 🎉" : taskFilter === "पूर्ण" ? "कोई पूर्ण कार्य नहीं" : 'कोई कार्य नहीं — ऊपर "+ कार्य जोड़ें" पर क्लिक करें'}
                    </div>
                  );

                  const TaskCard = ({ t }: { t: Task }) => (
                    <div className="task-item" key={t.id} style={{
                      opacity: t.done ? 0.55 : 1,
                      background: t.done ? "var(--bg-secondary)" : undefined,
                      borderRadius: 8, padding: "10px 12px", marginBottom: 6,
                    }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)}
                        style={{ marginRight: 10, width: 16, height: 16, cursor: "pointer", accentColor: "#10b981", flexShrink: 0 }} />
                      <div className="task-content" style={{ flex: 1, minWidth: 0 }}>
                        <h6 style={{ textDecoration: t.done ? "line-through" : "none", marginBottom: 2 }}>{t.title}</h6>
                        {t.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: 2 }}>{t.description}</p>}
                        {t.dueDate && <p style={{ fontSize: "0.7rem", color: "var(--color-saffron)", fontWeight: 600 }}>📅 {t.dueDate}</p>}
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditTask(t)} style={{ marginLeft: 6 }}>✏️</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { if (confirm(`"${t.title}" हटाएं?`)) deleteTask(t.id); }}
                        style={{ marginLeft: 4, color: "#ef4444" }}>🗑</button>
                    </div>
                  );

                  return (
                    <div className="grid-2">
                      <div className="panel-card">
                        <div className="panel-card-title">🔴 उच्च प्राथमिकता ({high.length})</div>
                        {high.length === 0
                          ? <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "12px 0" }}>कोई उच्च प्राथमिकता कार्य नहीं</div>
                          : high.map(t => <TaskCard key={t.id} t={t} />)}
                      </div>
                      <div className="panel-card">
                        <div className="panel-card-title">🟡 सामान्य प्राथमिकता ({normal.length})</div>
                        {normal.length === 0
                          ? <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "12px 0" }}>कोई सामान्य प्राथमिकता कार्य नहीं</div>
                          : normal.map(t => <TaskCard key={t.id} t={t} />)}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ════ टीम मैनेजमेंट ════ */}
            {activeTab === "टीम मैनेजमेंट" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>टीम मैनेजमेंट</h2>
                    <p>चुनाव प्रचार दल — सदस्य, जिम्मेदारी और क्षेत्र</p>
                  </div>
                  <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={openAddMember}>+ सदस्य जोड़ें</button>
                  </div>
                </div>

                {/* Add / Edit Modal */}
                {showTeamModal && (
                  <div className="panel-card" style={{ marginBottom: 16, border: "2px solid var(--accent)", background: "var(--bg-elevated)" }}>
                    <div className="panel-card-title">{editingMember ? "✏️ सदस्य संपादित करें" : "➕ नया सदस्य जोड़ें"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>नाम *</label>
                        <input ref={teamNameRef} className="voter-search-input" value={tmName} onChange={e => setTmName(e.target.value)}
                          placeholder="सदस्य का नाम" style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>भूमिका</label>
                        <input className="voter-search-input" value={tmRole} onChange={e => setTmRole(e.target.value)}
                          placeholder="जैसे: वार्ड प्रभारी" style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>क्षेत्र</label>
                        <input className="voter-search-input" value={tmArea} onChange={e => setTmArea(e.target.value)}
                          placeholder="जैसे: बूथ 45–46" style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>मोबाइल</label>
                        <input className="voter-search-input" value={tmMobile} onChange={e => setTmMobile(e.target.value)}
                          placeholder="10 अंक" style={{ width: "100%", fontSize: "0.82rem" }} />
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>रंग चुनें</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {TEAM_COLORS.map(c => (
                            <div key={c} onClick={() => setTmColor(c)} style={{
                              width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                              border: tmColor === c ? "3px solid var(--text-primary)" : "3px solid transparent",
                              boxSizing: "border-box",
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm" onClick={saveTeamMember} disabled={!tmName.trim()}>
                        {editingMember ? "✓ अपडेट करें" : "✓ जोड़ें"}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowTeamModal(false)}>रद्द करें</button>
                    </div>
                  </div>
                )}

                <div className="panel-card">
                  <div className="panel-card-title">👥 टीम सदस्य ({teamLoading ? "..." : teamList.length})</div>
                  {teamLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>लोड हो रहा है...</div>
                  ) : teamList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      कोई सदस्य नहीं — ऊपर "+ सदस्य जोड़ें" पर क्लिक करें
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {teamList.map(m => (
                        <div className="team-card" key={m.id}>
                          <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}aa)` }}>
                            {m.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{m.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                              {[m.role, m.area].filter(Boolean).join(" — ")}
                            </div>
                          </div>
                          {m.mobile && <a href={`tel:${m.mobile}`} className="btn btn-secondary btn-sm" style={{ marginRight: 4 }}>📞</a>}
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditMember(m)} title="संपादित करें">✏️</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => { if (confirm(`"${m.name}" को हटाएं?`)) deleteTeamMember(m.id); }}
                            title="हटाएं" style={{ color: "#ef4444" }}>🗑</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ════ SMS / संदेश ════ */}
            {activeTab === "SMS / संदेश" && (
              <>
                <div className="page-header">
                  <div className="page-title">
                    <h2>SMS / संदेश</h2>
                    <p>मतदाताओं को भेजने के लिए तैयार संदेश टेम्पलेट</p>
                  </div>
                </div>
                <div className="panel-card">
                  <div className="panel-card-title">💬 संदेश टेम्पलेट (क्लिक करें और कॉपी करें)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { title: "जनसंपर्क संदेश", body: "नमस्ते [नाम] जी, आपके क्षेत्र में विकास कार्यों के लिए हमारी टीम जल्द आपसे मिलने आएगी। आपका सहयोग अपेक्षित है। — निर्दलीय शक्ति मंच, खेजरोली" },
                      { title: "मीटिंग निमंत्रण", body: "आदरणीय [नाम] जी, दिनांक [तारीख] को शाम 6 बजे सामुदायिक भवन में जनसभा है। आपकी उपस्थिति अनिवार्य है। — राकेश शर्मा" },
                      { title: "मतदान प्रोत्साहन", body: "प्रिय मतदाता, आपका एक वोट खेजरोली का भविष्य तय करेगा। मतदान जरूर करें और सही उम्मीदवार चुनें। जय खेजरोली! 🙏" },
                      { title: "फॉलो-अप संदेश", body: "नमस्ते [नाम] जी, हमारी टीम पिछली बार आपसे नहीं मिल पाई। क्या हम [दिन] को आपसे 10 मिनट बात कर सकते हैं? — शुक्रिया" },
                    ].map(t => (
                      <div key={t.title}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.title}</div>
                        <div className="msg-template" onClick={() => navigator.clipboard?.writeText(t.body)}>
                          {t.body}
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 6 }}>क्लिक करके कॉपी करें</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════ सेटिग्स ════ */}
            {activeTab === "सेटिग्स" && (
              <div className="coming-soon">
                <div className="coming-soon-emoji">⚙️</div>
                <div className="coming-soon-badge">जल्द आ रहा है</div>
                <h3 style={{ fontSize: "1.2rem" }}>सेटिग्स</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: 300, textAlign: "center" }}>
                  अकाउंट सेटिग्स, अनुमतियां और कॉन्फ़िगरेशन जल्द उपलब्ध होंगी।
                </p>
              </div>
            )}

          </main>

          {/* ── Right Widgets ── */}
          <aside className="widget-sidebar">

            <div className="panel-card">
              <div className="panel-card-title">📅 आज का फॉलो-अप</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--color-saffron)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {followUpCount}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>कुल फॉलो-अप</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>आज की प्राथमिक कार्यसूची</div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-card-title">🗳️ बूथ-वार सारांश</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {Object.entries(boothCounts).map(([booth, count]) => (
                  <div className="stat-row" key={booth}>
                    <span style={{ color: "var(--text-secondary)" }}>बूथ {booth}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-card-title">📍 क्षेत्रवार संख्या</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {Object.entries(areaCounts).map(([area, count]) => (
                  <div className="stat-row" key={area}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{area}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-card-title">📞 त्वरित संपर्क</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="tel:18001234567" className="btn btn-secondary" style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}>
                  📞 कार्यालय — 1800-123-4567
                </a>
                <a href="https://wa.me/" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}>
                  💬 WhatsApp ग्रुप
                </a>
                <button className="btn btn-primary" style={{ width: "100%" }}
                  onClick={() => navChange("मतदाता सूची")}>
                  👥 मतदाता देखें
                </button>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
