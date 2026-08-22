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
  caste?: string;
}

const NAV_ITEMS = [
  { name: "डैशबोर्ड",      icon: "🏠", label: "Dashboard" },
  { name: "वार्ड मैनेजमेंट",icon: "🏘️", label: "Ward Management" },
  { name: "मतदाता सूची",   icon: "👤", label: "Mere Voter" },
  { name: "समर्थक",        icon: "👥", label: "Supporters" },
  { name: "ग्रुप",          icon: "🏷️", label: "Groups" },
  { name: "टीम मैनेजमेंट", icon: "🤝", label: "Volunteers" },
  { name: "कार्य योजना",   icon: "📅", label: "Karyakram" },
  { name: "संदेश",         icon: "💬", label: "Sandesh" },
  { name: "रिपोर्ट",       icon: "📊", label: "Reports" },
];

const SURNAME_CASTE: Record<string, string> = {
  // ब्राह्मण
  "शर्मा": "ब्राह्मण", "जोशी": "ब्राह्मण", "पारीक": "ब्राह्मण", "पुरोहित": "ब्राह्मण",
  "व्यास": "ब्राह्मण", "त्रिवेदी": "ब्राह्मण", "द्विवेदी": "ब्राह्मण", "चतुर्वेदी": "ब्राह्मण",
  "तिवारी": "ब्राह्मण", "मिश्रा": "ब्राह्मण", "पाण्डेय": "ब्राह्मण", "पांडेय": "ब्राह्मण",
  "उपाध्याय": "ब्राह्मण", "शास्त्री": "ब्राह्मण", "आचार्य": "ब्राह्मण", "दीक्षित": "ब्राह्मण",
  "ओझा": "ब्राह्मण", "गौड़": "ब्राह्मण", "गौर": "ब्राह्मण", "दवे": "ब्राह्मण",
  "भारद्वाज": "ब्राह्मण", "गर्ग": "ब्राह्मण",
  // राजपूत
  "सिंह": "राजपूत", "राजपूत": "राजपूत", "राठौर": "राजपूत", "चौहान": "राजपूत",
  "शेखावत": "राजपूत", "तंवर": "राजपूत", "हाड़ा": "राजपूत", "सिसोदिया": "राजपूत",
  "भाटी": "राजपूत", "झाला": "राजपूत", "गहलोत": "राजपूत", "पंवार": "राजपूत",
  "सोलंकी": "राजपूत", "देवड़ा": "राजपूत", "चौहाण": "राजपूत", "राव": "राजपूत",
  "कछवाहा": "राजपूत", "परमार": "राजपूत",
  // जाट
  "जाट": "जाट", "गोदारा": "जाट", "सारण": "जाट", "बेनीवाल": "जाट",
  "पिलानिया": "जाट", "जाखड़": "जाट", "ढाका": "जाट", "मोर": "जाट",
  "पूनिया": "जाट", "सांगवान": "जाट", "मलिक": "जाट", "अंतिल": "जाट",
  "दहिया": "जाट", "देशवाल": "जाट", "नैन": "जाट", "रोर": "जाट",
  // मीना (ST)
  "मीना": "मीना", "मिना": "मीना", "मीणा": "मीना",
  // गुर्जर
  "गुर्जर": "गुर्जर", "गूजर": "गुर्जर", "बैंसला": "गुर्जर",
  // SC
  "जाटव": "जाटव", "मेघवाल": "मेघवाल", "बैरवा": "बैरवा", "कोली": "कोली",
  "बलाई": "बलाई", "रेगर": "रेगर", "चमार": "चमार", "धोबी": "धोबी",
  "वाल्मीकि": "वाल्मीकि", "खटीक": "खटीक", "बावरी": "बावरी",
  // माली / सैनी / कुमावत
  "माली": "माली", "सैनी": "सैनी", "कुमावत": "कुमावत",
  // यादव
  "यादव": "यादव", "अहीर": "यादव",
  // कुम्हार
  "कुम्हार": "कुम्हार", "प्रजापत": "कुम्हार", "कुंभार": "कुम्हार",
  // सुथार / लोहार / नाई / दर्जी / तेली
  "सुथार": "सुथार", "लोहार": "लोहार", "नाई": "नाई", "दर्जी": "दर्जी", "तेली": "तेली",
  // बनिया
  "गुप्ता": "बनिया", "अग्रवाल": "बनिया", "बंसल": "बनिया",
  "मित्तल": "बनिया", "गोयल": "बनिया", "महेश्वरी": "बनिया", "खंडेलवाल": "बनिया",
  // बिश्नोई
  "बिश्नोई": "बिश्नोई",
  // मुस्लिम
  "खान": "मुस्लिम", "शेख": "मुस्लिम", "अंसारी": "मुस्लिम", "कुरेशी": "मुस्लिम",
  "सिद्दीकी": "मुस्लिम", "पठान": "मुस्लिम", "मिर्जा": "मुस्लिम", "मंसूरी": "मुस्लिम",
  "सैयद": "मुस्लिम",
};

function detectCasteFromName(name: string): string | null {
  const parts = name.trim().split(/\s+/);
  // check last word first, then second-to-last (some names: "राम लाल शर्मा")
  for (let i = parts.length - 1; i >= 0; i--) {
    const word = parts[i];
    if (word && SURNAME_CASTE[word]) return SURNAME_CASTE[word];
  }
  return null;
}

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
  const [editCasteId, setEditCasteId] = useState<string | null>(null);
  const [editCasteVal, setEditCasteVal] = useState("");
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [filterGroup, setFilterGroup] = useState("सभी");
  const [saveFlash, setSaveFlash] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Groups tab state
  const [selectedGroup,   setSelectedGroup]   = useState<string | null>(null);
  const [groupSearch,     setGroupSearch]      = useState("");
  const [editGroupName,   setEditGroupName]    = useState("");
  const [renamingGroup,   setRenamingGroup]    = useState<string | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName,    setNewGroupName]     = useState("");
  const [newGroupSearch,  setNewGroupSearch]   = useState("");
  const [newGroupSel,     setNewGroupSel]      = useState<Record<string, boolean>>({});

  // Supporters tab filters
  const [suppSearch, setSuppSearch] = useState("");
  const [suppFilter, setSuppFilter] = useState<"सभी" | "पक्के" | "संपर्क">("सभी");
  const [suppArea,   setSuppArea]   = useState("सभी");
  const [suppSort,   setSuppSort]   = useState<"name" | "area" | "age">("name");

  // Win calculator sliders
  const [obcSupport, setObcSupport] = useState(62);
  const [genSupport, setGenSupport] = useState(48);
  const [scSupport, setScSupport] = useState(71);
  const [stSupport, setStSupport] = useState(55);
  const [turnoutPct, setTurnoutPct] = useState(75);

  // Extract numeric ward from profile.ward (handles "20", "वार्ड 20", "Ward 20")
  const wardNum = (w: string) => /\d+/.exec(w)?.[0] ?? "";

  useEffect(() => {
    db.candidateProfile.get().then(p => {
      let ward = "";
      if (p) {
        const loaded = { name: p.name, party: p.party, ward: p.ward, constituency: p.constituency, mobile: p.mobile, email: p.email, slogan: p.slogan, dob: p.dob, education: p.education, address: p.address, photoUrl: p.photoUrl, facebook: p.facebook, instagram: p.instagram, whatsapp: p.whatsapp, bio: p.bio };
        setProfile(loaded);
        ward = wardNum(p.ward);
        const complete = !!(p.name && p.party && p.ward && p.mobile);
        if (complete) setActiveTab("डैशबोर्ड");
      }
      setProfileLoaded(true);
      return db.voters.getAll(ward || undefined);
    }).then(rows => {
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
        caste:         v.caste ?? "",
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "टीम मैनेजमेंट" && teamList.length === 0) {
      setTeamLoading(true);
      db.teamMembers.getAll().then(setTeamList).catch(console.error).finally(() => setTeamLoading(false));
    }
    if ((activeTab === "कार्य योजना" || activeTab === "डैशबोर्ड") && taskList.length === 0) {
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
    fields: Partial<Pick<Voter, "contactStatus" | "availability" | "mobile" | "nextAction" | "lastContact" | "area" | "group" | "caste">>
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
      area: merged.area,
      group: merged.group,
      caste: merged.caste,
    }).then(() => flash(id)).catch(console.error);
  };

  const [casteDetectFlash, setCasteDetectFlash] = useState<string | null>(null);

  const autoDetectCaste = async () => {
    const updates: { id: string; caste: string }[] = [];
    voters.forEach(v => {
      if (v.caste) return; // skip already filled
      const detected = detectCasteFromName(v.name);
      if (detected) updates.push({ id: v.id, caste: detected });
    });
    if (updates.length === 0) {
      setCasteDetectFlash("कोई नया match नहीं मिला");
      setTimeout(() => setCasteDetectFlash(null), 2500);
      return;
    }
    setVoters(prev => prev.map(v => {
      const u = updates.find(u => u.id === v.id);
      return u ? { ...v, caste: u.caste } : v;
    }));
    await Promise.all(updates.map(u => db.voters.updateCRM(u.id, { caste: u.caste }).catch(console.error)));
    setCasteDetectFlash(`${updates.length} मतदाताओं की जाति भरी`);
    setTimeout(() => setCasteDetectFlash(null), 3000);
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
    db.voters.getAll(wardNum(profile.ward) || undefined).then(rows => {
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
    setSidebarOpen(false);
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

  const BOTTOM_NAV = [
    { name: "डैशबोर्ड",    icon: "🏠" },
    { name: "मतदाता सूची", icon: "👤" },
    { name: "समर्थक",      icon: "👥" },
    { name: "ग्रुप",        icon: "🏷️" },
    { name: "कार्य योजना", icon: "📅" },
  ];

  return (
    <div className="app-layout">

      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`app-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        {/* Top: Logo + Nav */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="sidebar-brand">
              <div className="sidebar-brand-icon">🌳</div>
              <div>
                <div className="sidebar-brand-name">Khejroli</div>
                <div className="sidebar-brand-sub">Janta Party</div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <ul className="sidebar-menu" style={{ marginTop: 8, flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const locked = !profileComplete && item.name !== "मेरा प्रोफाइल";
              const isActive = activeTab === item.name;
              return (
                <li
                  key={item.name}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  onClick={() => locked ? navChange("मेरा प्रोफाइल") : navChange(item.name)}
                  style={locked ? { opacity: 0.45 } : undefined}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {!locked && item.name === "मतदाता सूची" && totalCount > 0 && (
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

        {/* Bottom: Profile card */}
        <div style={{ flexShrink: 0 }}>
          {/* Divider */}
          <div style={{ height: 1, background: "#e5e7eb", margin: "0 12px" }} />

          {/* Profile card */}
          <div
            onClick={() => navChange("मेरा प्रोफाइल")}
            style={{
              margin: "10px 10px 6px",
              padding: "12px 13px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f9fafb")}
          >
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: profileComplete ? "#16a34a" : "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "1rem",
              color: profileComplete ? "#fff" : "#9ca3af",
              border: profileComplete ? "2px solid #86efac" : "2px solid #d1d5db",
            }}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
            </div>

            {/* Info */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{
                fontWeight: 700, fontSize: "0.83rem", color: "#111827",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {profile.name || "प्रोफाइल अधूरी"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 1 }}>
                {wardNum(profile.ward) ? `वार्ड ${wardNum(profile.ward)}` : "वार्ड नहीं चुना"}
                {profile.party ? ` · ${profile.party}` : ""}
              </div>
            </div>

            {/* Edit icon */}
            <div style={{ fontSize: "0.85rem", color: "#9ca3af", flexShrink: 0 }}>✏️</div>
          </div>

          {/* Feedback button */}
          <div style={{ padding: "4px 10px 12px" }}>
            <button
              onClick={() => navChange("मेरा प्रोफाइल")}
              style={{
                width: "100%", padding: "8px 0",
                background: "#16a34a", color: "#fff", border: "none",
                borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
              }}
            >
              💬 Feedback Dein
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Column ── */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Header */}
        <header className="app-header">
          {/* Hamburger — mobile only */}
          <button
            className="mobile-hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="मेनू खोलें"
          >
            <span /><span /><span />
          </button>

          <div className="header-left">
            <div className="header-search">
              <span className="header-search-icon">🔍</span>
              <input
                type="text"
                placeholder="नाम / वोटर आईडी खोजें..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="header-right">
            {/* Date — hidden on mobile */}
            <div className="header-date-chip">
              📅 <span>{new Date().toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" })}</span> <span style={{ color: "#9ca3af" }}>▾</span>
            </div>

            {/* Notification bell */}
            <button className="header-icon-btn" title="सूचनाएं" style={{ position: "relative" }}>
              🔔
              <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "1.5px solid white" }} />
            </button>

            <button className="header-icon-btn header-refresh-btn" title="रिफ्रेश" onClick={reloadVoters}>🔄</button>
            <div className="header-vdivider header-vdivider-desktop" />

            {/* User */}
            <div className="header-user">
              <div className="header-avatar" style={{ background: "#16a34a", color: "#fff", fontWeight: 700 }}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="header-user-text">
                <div className="header-user-name">{profile.name || "उम्मीदवार"}</div>
                <div className="header-user-role">अभियान प्रभारी</div>
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
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={autoDetectCaste}
                      title="surname से जाति auto-fill करें"
                      style={{ position: "relative" }}
                    >
                      🔍 जाति Auto-detect
                      {casteDetectFlash && (
                        <span style={{
                          position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)",
                          background: "#1e293b", color: "#fff", fontSize: "0.7rem",
                          padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 10,
                        }}>{casteDetectFlash}</span>
                      )}
                    </button>
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
                  const boothOpts: [string,string][] = [["सभी","सभी बूथ"], ...uniqueBooths.map(b => [String(b), `बूथ ${b}`] as [string,string])];
                  const areaOpts:  [string,string][] = [["सभी","सभी क्षेत्र"], ...uniqueAreas.map(a => [a, a.length > 20 ? a.slice(0,20)+"…" : a] as [string,string])];
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
                          <th>मोबाइल</th>
                          <th>जाति</th>
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

                            {/* Group badge removed — managed in Groups tab */}
                            {false && <td>
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
                            </td>}

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

                            {/* Caste — inline edit */}
                            <td style={{ maxWidth: 100 }}>
                              {editCasteId === v.id ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={editCasteVal}
                                  onChange={e => setEditCasteVal(e.target.value)}
                                  onBlur={() => { updateSingleVoter(v.id, { caste: editCasteVal }); setEditCasteId(null); }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") { updateSingleVoter(v.id, { caste: editCasteVal }); setEditCasteId(null); }
                                    if (e.key === "Escape") setEditCasteId(null);
                                  }}
                                  style={{ width: 80, fontSize: "0.78rem", padding: "2px 6px", border: "1.5px solid var(--primary)", borderRadius: 4, outline: "none" }}
                                />
                              ) : (
                                <span
                                  onClick={() => { setEditCasteId(v.id); setEditCasteVal(v.caste ?? ""); }}
                                  title="क्लिक करके जाति भरें"
                                  style={{
                                    cursor: "pointer",
                                    color: v.caste ? "var(--text-secondary)" : "#cbd5e1",
                                    fontSize: "0.78rem",
                                    borderBottom: "1px dashed #cbd5e1",
                                    display: "inline-block",
                                  }}
                                >
                                  {v.caste || "+ जाति"}
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

                  </div>
                </div>
                </>)}
              </>
            )}

            {/* ════ मेरा प्रोफाइल ════ */}
            {activeTab === "मेरा प्रोफाइल" && (
              <div style={{ maxWidth: 860, margin: "0 auto" }}>

                {/* Success flash */}
                {profileSaved && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.2rem" }}>✅</span>
                    <span style={{ fontWeight: 600, color: "#15803d", fontSize: "0.88rem" }}>प्रोफाइल सेव हो गई!</span>
                  </div>
                )}

                {/* Incomplete banner */}
                {profileLoaded && !profileComplete && (
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#c2410c", fontSize: "0.85rem" }}>प्रोफाइल अधूरी है</div>
                      <div style={{ fontSize: "0.78rem", color: "#78350f" }}>नाम, पार्टी, वार्ड और मोबाइल नंबर भरना जरूरी है।</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>

                  {/* ── Left: Profile hero card ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Avatar card */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
                      {/* Avatar */}
                      <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
                        background: profileComplete ? "#16a34a" : "#e5e7eb",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", fontWeight: 800,
                        color: profileComplete ? "#fff" : "#9ca3af",
                        border: profileComplete ? "3px solid #86efac" : "3px solid #d1d5db",
                        overflow: "hidden", flexShrink: 0 }}>
                        {profile.photoUrl
                          ? <img src={profile.photoUrl} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : (profile.name ? profile.name.charAt(0).toUpperCase() : "?")}
                      </div>

                      {/* Name */}
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 4 }}>
                        {profile.name || "नाम नहीं भरा"}
                      </div>

                      {/* Party + Ward badges */}
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 10 }}>
                        {profile.party && (
                          <span style={{ padding: "2px 10px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #bfdbfe" }}>
                            🏛️ {profile.party}
                          </span>
                        )}
                        {wardNum(profile.ward) && (
                          <span style={{ padding: "2px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontSize: "0.72rem", fontWeight: 700, border: "1px solid #86efac" }}>
                            📍 वार्ड {wardNum(profile.ward)}
                          </span>
                        )}
                      </div>

                      {/* Slogan */}
                      {profile.slogan && (
                        <div style={{ fontSize: "0.78rem", color: "#f59e0b", fontStyle: "italic", padding: "8px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", marginBottom: 10 }}>
                          "{profile.slogan}"
                        </div>
                      )}

                      {/* Status */}
                      <div style={{ marginTop: 6 }}>
                        {profileComplete
                          ? <span style={{ padding: "4px 14px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontSize: "0.73rem", fontWeight: 700, border: "1px solid #86efac" }}>✅ प्रोफाइल पूर्ण</span>
                          : <span style={{ padding: "4px 14px", borderRadius: 20, background: "#fff7ed", color: "#c2410c", fontSize: "0.73rem", fontWeight: 700, border: "1px solid #fed7aa" }}>⚠️ अधूरी प्रोफाइल</span>
                        }
                      </div>
                    </div>

                    {/* Quick info card */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "16px 18px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>संपर्क जानकारी</div>
                      {[
                        { icon: "📱", label: profile.mobile || "—", sub: "मोबाइल" },
                        { icon: "📍", label: wardNum(profile.ward) ? `वार्ड ${wardNum(profile.ward)}` : "—", sub: "वार्ड" },
                        { icon: "🏛️", label: profile.party || "—", sub: "पार्टी" },
                      ].map(r => (
                        <div key={r.sub} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                          <span style={{ fontSize: "0.9rem", marginTop: 1 }}>{r.icon}</span>
                          <div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500, wordBreak: "break-all" }}>{r.label}</div>
                            <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{r.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Right: Edit form ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Section: Basic info */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px 22px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
                        🧑‍💼 व्यक्तिगत जानकारी
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {[
                          { label: "पूरा नाम", key: "name", placeholder: "राम कुमार शर्मा", type: "text", required: true },
                          { label: "पार्टी / दल", key: "party", placeholder: "निर्दलीय / भाजपा / कांग्रेस", type: "text", required: true },
                          { label: "वार्ड संख्या", key: "ward", placeholder: "20", type: "text", required: true },
                          { label: "मोबाइल नंबर", key: "mobile", placeholder: "9876543210", type: "tel", required: true },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 5 }}>
                              {f.label}<span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
                            </label>
                            <input type={f.type} placeholder={f.placeholder}
                              value={(profile as Record<string, string>)[f.key]}
                              onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", background: "var(--bg-body)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                              onFocus={e => (e.target.style.borderColor = "#16a34a")}
                              onBlur={e => (e.target.style.borderColor = "#d1d5db")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section: Campaign */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px 22px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
                        🏆 चुनाव अभियान
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 5 }}>चुनावी नारा</label>
                          <input type="text" placeholder="जैसे: जन सेवा ही धर्म है"
                            value={profile.slogan}
                            onChange={e => setProfile(p => ({ ...p, slogan: e.target.value }))}
                            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", background: "var(--bg-body)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                            onFocus={e => (e.target.style.borderColor = "#16a34a")}
                            onBlur={e => (e.target.style.borderColor = "#d1d5db")}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: 5 }}>फोटो URL</label>
                          <input type="url" placeholder="https://…/photo.jpg"
                            value={profile.photoUrl}
                            onChange={e => setProfile(p => ({ ...p, photoUrl: e.target.value }))}
                            style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", background: "var(--bg-body)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                            onFocus={e => (e.target.style.borderColor = "#16a34a")}
                            onBlur={e => (e.target.style.borderColor = "#d1d5db")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save button */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 8 }}>
                      <button
                        onClick={handleProfileSave}
                        disabled={profileSaving || !profile.name || !profile.party || !profile.ward || !profile.mobile}
                        style={{ padding: "11px 28px", background: (!profile.name || !profile.party || !profile.ward || !profile.mobile) ? "#d1d5db" : "#16a34a", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.88rem", cursor: (!profile.name || !profile.party || !profile.ward || !profile.mobile) ? "not-allowed" : "pointer" }}>
                        {profileSaving ? "⏳ सेव हो रहा है…" : "💾 प्रोफाइल सेव करें"}
                      </button>
                      {!profileComplete && (
                        <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>* चिह्नित फील्ड जरूरी हैं</span>
                      )}
                    </div>
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
                {!loading && (() => {
                  // Donut chart helper
                  const CX = 110, CY = 110, RO = 80, RI = 52;
                  const toXY = (cx: number, cy: number, r: number, deg: number) => {
                    const rad = (deg - 90) * Math.PI / 180;
                    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
                  };
                  const arc = (start: number, end: number, color: string, key: string) => {
                    if (end - start >= 360) end = start + 359.9;
                    const s = toXY(CX, CY, RO, start), e = toXY(CX, CY, RO, end);
                    const si = toXY(CX, CY, RI, end), ei = toXY(CX, CY, RI, start);
                    const lg = end - start > 180 ? 1 : 0;
                    return <path key={key} d={`M${s.x} ${s.y} A${RO} ${RO} 0 ${lg} 1 ${e.x} ${e.y} L${si.x} ${si.y} A${RI} ${RI} 0 ${lg} 0 ${ei.x} ${ei.y}Z`} fill={color} />;
                  };
                  const donutSegs = totalCount > 0 ? [
                    { val: meetingCount,   color: "#16a34a", label: "पक्के समर्थक" },
                    { val: contactedCount, color: "#3b82f6", label: "झुकाव है" },
                    { val: pendingCount,   color: "#f59e0b", label: "संपर्क बाकी" },
                    { val: notFoundCount,  color: "#9ca3af", label: "विरोधी/अनिश्चित" },
                  ] : [{ val: 1, color: "#e5e7eb", label: "" }];
                  let deg = 0;
                  const paths = donutSegs.map((s, i) => {
                    const sweep = totalCount > 0 ? (s.val / totalCount) * 360 : 360;
                    const p = arc(deg, deg + sweep, s.color, String(i));
                    deg += sweep;
                    return p;
                  });

                  // Top 5 areas by voter count
                  const top5Areas = Object.entries(areaCounts)
                    .sort(([,a],[,b]) => b - a).slice(0, 5);
                  const maxArea = top5Areas[0]?.[1] || 1;

                  // Sampark progress — last 7 data points ending at supporterCount
                  const progTotal = Math.max(supporterCount, 1);
                  const progPoints = [0.12,0.28,0.42,0.56,0.68,0.82,1].map(f => Math.round(f * progTotal));
                  const W = 440, H = 120, PAD = 24;
                  const px = (i: number) => PAD + (i / 6) * (W - PAD * 2);
                  const py = (v: number) => H - PAD - ((v / progTotal) * (H - PAD * 2));
                  const polyline = progPoints.map((v,i) => `${px(i)},${py(v)}`).join(" ");
                  const areaPath = `M${px(0)},${py(0)} ` + progPoints.map((v,i) => `L${px(i)},${py(v)}`).join(" ") + ` L${px(6)},${H-PAD} L${px(0)},${H-PAD}Z`;

                  const allContacted = contactedCount + meetingCount + notFoundCount;
                  const contactPct = totalCount > 0 ? Math.round((allContacted / totalCount) * 100) : 0;
                  const supportPct = totalCount > 0 ? Math.round((supporterCount / totalCount) * 100) : 0;
                  const meetingPct = totalCount > 0 ? Math.round((meetingCount / totalCount) * 100) : 0;

                  return (<>
                  {/* Greeting */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
                        नमस्ते, {profile.name.split(" ")[0] || "मित्र"}! 👋
                      </h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
                        यह है आपके वार्ड {wardNum(profile.ward) || "—"} की चुनाव यात्रा का हाल।
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "8px 16px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      📅 मतदान 20 अक्टूबर 2026 &nbsp;·&nbsp; <strong style={{ color: "var(--color-terracotta)" }}>{daysLeft} दिन शेष</strong>
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

                  {/* 4 Stat Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                    {[
                      { label: "कुल मतदाता (Voter)", value: totalCount, sub: "100% Total Voter", icon: "👥", iconBg: "#eff6ff", iconFg: "#3b82f6", accent: "#3b82f6" },
                      { label: "समर्थक (Supporters)", value: supporterCount, sub: `${supportPct}% of total voters`, icon: "🤝", iconBg: "#fff7ed", iconFg: "#f59e0b", accent: "#f59e0b" },
                      { label: "संपर्क किए गए", value: allContacted, sub: `${contactPct}% of total voters`, icon: "🙋", iconBg: "#fef9c3", iconFg: "#ca8a04", accent: "#ca8a04" },
                      { label: "पक्का समर्थन", value: meetingCount, sub: `${meetingPct}% of total voters`, icon: "✅", iconBg: "#f5f3ff", iconFg: "#7c3aed", accent: "#7c3aed" },
                    ].map(c => (
                      <div key={c.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px 20px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.accent, borderRadius: "14px 14px 0 0" }} />
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iconBg, color: c.iconFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: 12 }}>{c.icon}</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{c.value.toLocaleString("hi-IN")}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>{c.label}</div>
                        <div style={{ fontSize: "0.72rem", color: c.accent, fontWeight: 600, marginTop: 6 }}>{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Middle row: Donut | Ward Overview | Top 5 Areas */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>

                    {/* Donut Chart */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 14, color: "var(--text-primary)" }}>
                        वार्ड {wardNum(profile.ward) || "—"} — समर्थन की स्थिति
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <svg viewBox="0 0 220 220" width={110} height={110} style={{ flexShrink: 0 }}>
                          {paths}
                          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--text-primary)">{totalCount}</text>
                          <text x={CX} y={CY + 14} textAnchor="middle" fontSize={9} fill="var(--text-muted)">कुल मतदाता</text>
                        </svg>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.75rem" }}>
                          {[
                            { label: "पक्के समर्थक", val: meetingCount, color: "#16a34a" },
                            { label: "झुकाव है", val: contactedCount, color: "#3b82f6" },
                            { label: "संपर्क बाकी", val: pendingCount, color: "#f59e0b" },
                            { label: "विरोधी/अनिश्चित", val: notFoundCount, color: "#9ca3af" },
                          ].map(s => (
                            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                              <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                              <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--text-primary)" }}>
                                {s.val}&nbsp;<span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({totalCount > 0 ? Math.round(s.val/totalCount*100) : 0}%)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ward Overview */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 14, color: "var(--text-primary)" }}>मेरे वार्ड का संक्षिप्त ओवरव्यू</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[
                          { icon: "🏠", label: "कुल मतदाता", val: totalCount, sub: null, color: "#16a34a" },
                          { icon: "👥", label: "संपर्क किए गए", val: allContacted, sub: `${contactPct}%`, color: "#3b82f6" },
                          { icon: "✅", label: "समर्थन मिला", val: supporterCount, sub: `${supportPct}%`, color: "#7c3aed" },
                          { icon: "⏳", label: "अभी संपर्क बाकी", val: totalCount - allContacted, sub: `${100 - contactPct}%`, color: "#f59e0b" },
                        ].map(r => (
                          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg-secondary, #f8fafc)", borderRadius: 8 }}>
                            <span style={{ fontSize: "1.1rem" }}>{r.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.label}</div>
                              <div style={{ fontWeight: 700, fontSize: "1rem", color: r.color }}>{r.val.toLocaleString("hi-IN")}</div>
                            </div>
                            {r.sub && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: r.color, background: `${r.color}18`, borderRadius: 6, padding: "2px 7px" }}>{r.sub}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top 5 Areas */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>शीर्ष 5 क्षेत्र (मतदाता)</div>
                        <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, cursor: "pointer" }} onClick={() => navChange("मतदाता सूची")}>विस्तार देखें →</span>
                      </div>
                      {top5Areas.length === 0 ? (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", paddingTop: 20 }}>क्षेत्र डेटा उपलब्ध नहीं</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {top5Areas.map(([area, count]) => {
                            const pct = Math.round((count / maxArea) * 100);
                            const contacted = voters.filter(v => v.area === area && (v.contactStatus === "संपर्क हुआ" || v.contactStatus === "मीटिंग तय")).length;
                            const cPct = count > 0 ? Math.round((contacted / count) * 100) : 0;
                            return (
                              <div key={area}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 3 }}>
                                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{area}</span>
                                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{cPct}%</span>
                                </div>
                                <div style={{ height: 6, background: "var(--border-color)", borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: cPct > 60 ? "#16a34a" : cPct > 30 ? "#3b82f6" : "#f59e0b", borderRadius: 4, transition: "width 0.4s" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Progress Chart | Aaj ke Karyakram */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 20 }}>

                    {/* Sampark Progress Line Chart */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>संपर्क प्रगति</div>
                      </div>
                      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
                        {/* Grid lines */}
                        {[0,1,2,3].map(i => {
                          const y = PAD + (i / 3) * (H - PAD * 2);
                          return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border-color)" strokeWidth={0.8} />;
                        })}
                        {/* Area fill */}
                        <defs>
                          <linearGradient id="prog" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#prog)" />
                        {/* Line */}
                        <polyline points={polyline} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                        {/* Dots + labels */}
                        {progPoints.map((v, i) => (
                          <g key={i}>
                            <circle cx={px(i)} cy={py(v)} r={4} fill="#16a34a" stroke="white" strokeWidth={2} />
                            <text x={px(i)} y={py(v) - 9} textAnchor="middle" fontSize={8.5} fill="var(--text-secondary)" fontWeight={600}>{v}</text>
                          </g>
                        ))}
                      </svg>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                        <span style={{ fontSize: "0.8rem", color: "#166534" }}>आपका संपर्क दर:</span>
                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#16a34a" }}>{supportPct}% ({supporterCount}/{totalCount})</span>
                        <span style={{ fontSize: "0.75rem", color: "#16a34a", cursor: "pointer", fontWeight: 600 }} onClick={() => navChange("मतदाता सूची")}>संपर्क बढ़ाएं →</span>
                      </div>
                    </div>

                    {/* Aaj ke Karyakram */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 14, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>आज के कार्यक्रम</div>
                        <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, cursor: "pointer" }} onClick={() => navChange("कार्य योजना")}>पूरा Calendar देखें →</span>
                      </div>
                      {taskLoading ? (
                        <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: "0.8rem" }}>⏳ लोड हो रहा है…</div>
                      ) : taskList.filter(t => !t.done).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>📋</div>
                          कोई कार्यक्रम नहीं है<br />
                          <span style={{ color: "#16a34a", cursor: "pointer", fontWeight: 600 }} onClick={() => navChange("कार्य योजना")}>+ कार्यक्रम जोड़ें</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {taskList.filter(t => !t.done).slice(0, 4).map(t => (
                            <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "var(--bg-secondary, #f8fafc)", borderRadius: 10, border: "1px solid var(--border-color)" }}>
                              <div style={{ width: 34, height: 34, borderRadius: 8, background: t.priority === "उच्च" ? "#fef2f2" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                                {t.priority === "उच्च" ? "🔴" : "📌"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                                {t.description && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>}
                              </div>
                              {t.dueDate && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0, fontWeight: 600 }}>{t.dueDate}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer tagline */}
                  <div style={{ textAlign: "center", padding: "14px 20px", background: "var(--bg-secondary, #f8fafc)", borderRadius: 10, border: "1px solid var(--border-color)", fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    ❝ एकजुट गाँव, मजबूत विकास — वार्ड {wardNum(profile.ward) || "—"} के साथ, हर कदम आगे। ❞ &nbsp; 🚩
                  </div>
                  </>);
                })()}
              </>
            )}

            {/* ════ ग्रुप ════ */}
            {activeTab === "ग्रुप" && (() => {
              // Build groups map from voters
              const groupMap = voters.reduce<Record<string, Voter[]>>((acc, v) => {
                const g = v.group?.trim();
                if (!g) return acc;
                if (!acc[g]) acc[g] = [];
                acc[g].push(v);
                return acc;
              }, {});
              const groupNames = Object.keys(groupMap).sort();
              const ungrouped  = voters.filter(v => !v.group?.trim());

              // If a group is selected → show members
              if (selectedGroup && groupMap[selectedGroup]) {
                const members = groupMap[selectedGroup].filter(v =>
                  !groupSearch || v.name.includes(groupSearch) || (v.mobile || "").includes(groupSearch)
                );
                return (
                  <>
                    <div className="page-header">
                      <div className="page-title">
                        <h2>🏷️ {selectedGroup}</h2>
                        <p>{groupMap[selectedGroup].length} सदस्य</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Rename */}
                        {renamingGroup === selectedGroup ? (
                          <>
                            <input value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && editGroupName.trim() && editGroupName.trim() !== selectedGroup) {
                                  const newName = editGroupName.trim();
                                  const ids = groupMap[selectedGroup].map(v => v.id);
                                  setVoters(prev => prev.map(v => ids.includes(v.id) ? { ...v, group: newName } : v));
                                  ids.forEach(id => db.voters.updateCRM(id, { group: newName }).catch(console.error));
                                  setSelectedGroup(newName);
                                  setRenamingGroup(null);
                                }
                                if (e.key === "Escape") setRenamingGroup(null);
                              }}
                              autoFocus
                              style={{ padding: "6px 10px", border: "1px solid var(--border-color)", borderRadius: 7, fontSize: "0.83rem", background: "var(--bg-body)", color: "var(--text-primary)", width: 160 }}
                            />
                            <button className="btn-primary btn-sm" onClick={() => {
                              const newName = editGroupName.trim();
                              if (!newName || newName === selectedGroup) { setRenamingGroup(null); return; }
                              const ids = groupMap[selectedGroup].map(v => v.id);
                              setVoters(prev => prev.map(v => ids.includes(v.id) ? { ...v, group: newName } : v));
                              ids.forEach(id => db.voters.updateCRM(id, { group: newName }).catch(console.error));
                              setSelectedGroup(newName);
                              setRenamingGroup(null);
                            }}>सेव</button>
                            <button className="btn-secondary btn-sm" onClick={() => setRenamingGroup(null)}>रद्द</button>
                          </>
                        ) : (
                          <button className="btn-secondary" onClick={() => { setRenamingGroup(selectedGroup); setEditGroupName(selectedGroup); }}>✏️ Rename</button>
                        )}
                        {/* Delete group */}
                        <button className="btn-secondary" style={{ color: "#ef4444", borderColor: "#fca5a5" }} onClick={() => {
                          if (!confirm(`"${selectedGroup}" ग्रुप हटाएं?`)) return;
                          const ids = groupMap[selectedGroup].map(v => v.id);
                          setVoters(prev => prev.map(v => ids.includes(v.id) ? { ...v, group: undefined } : v));
                          ids.forEach(id => db.voters.updateCRM(id, { group: "" }).catch(console.error));
                          setSelectedGroup(null);
                        }}>🗑️ Delete Group</button>
                        <button className="btn-secondary" onClick={() => { setSelectedGroup(null); setGroupSearch(""); }}>← वापस</button>
                      </div>
                    </div>

                    {/* Search */}
                    <div style={{ marginBottom: 16 }}>
                      <input type="text" placeholder="नाम / मोबाइल खोजें..."
                        value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                        style={{ padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.83rem", width: 280, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                    </div>

                    {/* Members grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))", gap: 12 }}>
                      {members.map(v => (
                        <div key={v.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#16a34a", fontSize: "1rem", flexShrink: 0 }}>
                            {v.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{v.area} · {v.gender} · {v.age} वर्ष</div>
                            {v.mobile && <div style={{ fontSize: "0.75rem", color: "#0891b2", marginTop: 2 }}>{v.mobile}</div>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {v.mobile && (
                              <a href={`https://wa.me/91${v.mobile}`} target="_blank" rel="noreferrer"
                                style={{ padding: "4px 8px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", fontSize: "0.72rem", fontWeight: 600, textDecoration: "none", border: "1px solid #86efac" }}>
                                💬
                              </a>
                            )}
                            <button onClick={() => {
                              if (!confirm(`"${v.name}" को ग्रुप से हटाएं?`)) return;
                              setVoters(prev => prev.map(vv => vv.id === v.id ? { ...vv, group: undefined } : vv));
                              db.voters.updateCRM(v.id, { group: "" }).catch(console.error);
                            }} style={{ padding: "4px 8px", borderRadius: 6, background: "#fef2f2", color: "#ef4444", fontSize: "0.72rem", fontWeight: 600, border: "1px solid #fca5a5", cursor: "pointer" }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              }

              // Groups overview
              return (
                <>
                  <div className="page-header">
                    <div className="page-title">
                      <h2>🏷️ ग्रुप मैनेजमेंट</h2>
                      <p>मतदाताओं के ग्रुप बनाएं और प्रबंधित करें</p>
                    </div>
                    <button className="btn-primary" onClick={() => {
                      setNewGroupName(""); setNewGroupSearch(""); setNewGroupSel({});
                      setShowNewGroupModal(true);
                    }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      🏷️ + नया ग्रुप
                    </button>
                  </div>

                  {/* Summary stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
                    {[
                      { label: "कुल ग्रुप",        value: groupNames.length, icon: "🏷️", color: "#7c3aed", bg: "#f5f3ff" },
                      { label: "ग्रुप में मतदाता",  value: voters.length - ungrouped.length, icon: "👥", color: "#16a34a", bg: "#f0fdf4" },
                      { label: "बिना ग्रुप",         value: ungrouped.length, icon: "👤", color: "#9ca3af", bg: "#f9fafb" },
                    ].map(c => (
                      <div key={c.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{c.icon}</div>
                        <div>
                          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>{c.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hint if no groups */}
                  {groupNames.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                      <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏷️</div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>कोई ग्रुप नहीं बना</div>
                      <div style={{ fontSize: "0.83rem" }}>मतदाता सूची में कई मतदाता चुनें → "ग्रुप बनाएं" बटन दबाएं</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16 }}>
                      {groupNames.map(g => {
                        const members = groupMap[g];
                        const withMobile = members.filter(v => v.mobile).length;
                        const colors = ["#7c3aed","#16a34a","#0891b2","#f59e0b","#ec4899","#ef4444","#8b5cf6","#10b981"];
                        const color = colors[Math.abs(g.split("").reduce((a,c) => a + c.charCodeAt(0), 0)) % colors.length];
                        return (
                          <div key={g} onClick={() => { setSelectedGroup(g); setGroupSearch(""); }}
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, cursor: "pointer", transition: "box-shadow 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                            {/* Icon + name */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>🏷️</div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>{g}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{members.length} सदस्य</div>
                              </div>
                            </div>
                            {/* Member avatars */}
                            <div style={{ display: "flex", marginBottom: 12 }}>
                              {members.slice(0, 5).map((v, i) => (
                                <div key={v.id} style={{ width: 30, height: 30, borderRadius: "50%", background: color + "25", border: "2px solid var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color, marginLeft: i > 0 ? -8 : 0 }}>
                                  {v.name.charAt(0)}
                                </div>
                              ))}
                              {members.length > 5 && (
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e5e7eb", border: "2px solid var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#6b7280", marginLeft: -8, fontWeight: 700 }}>
                                  +{members.length - 5}
                                </div>
                              )}
                            </div>
                            {/* Stats row */}
                            <div style={{ display: "flex", gap: 12, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              <span>📞 {withMobile} मोबाइल</span>
                              <span>👉 देखें</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            {/* ════ समर्थक ════ */}
            {activeTab === "समर्थक" && (() => {
              const supporters = voters.filter(v =>
                v.contactStatus === "संपर्क हुआ" || v.contactStatus === "मीटिंग तय"
              );
              const confirmed  = supporters.filter(v => v.contactStatus === "मीटिंग तय");
              const contacted  = supporters.filter(v => v.contactStatus === "संपर्क हुआ");

              const areas = ["सभी", ...Array.from(new Set(supporters.map(v => v.area).filter(Boolean))).sort()];

              const list = supporters
                .filter(v => suppFilter === "सभी" ? true : suppFilter === "पक्के" ? v.contactStatus === "मीटिंग तय" : v.contactStatus === "संपर्क हुआ")
                .filter(v => suppArea === "सभी" || v.area === suppArea)
                .filter(v => !suppSearch || v.name.includes(suppSearch) || (v.mobile || "").includes(suppSearch) || v.area.includes(suppSearch))
                .sort((a, b) => suppSort === "area" ? a.area.localeCompare(b.area) : suppSort === "age" ? a.age - b.age : a.name.localeCompare(b.name));

              return (
                <>
                  {/* Header */}
                  <div className="page-header">
                    <div className="page-title">
                      <h2>👥 समर्थक सूची</h2>
                      <p>संपर्क किए गए और पक्के समर्थकों की जानकारी</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-secondary" onClick={() => {
                        const csvRows = [["नाम","क्षेत्र","आयु","लिंग","मोबाइल","स्थिति"].join(","),
                          ...list.map(v => [v.name, v.area, v.age, v.gender, v.mobile, v.contactStatus].join(","))];
                        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = "supporters.csv"; a.click();
                      }}>📥 CSV Export</button>
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
                    {[
                      { label: "कुल समर्थक",    value: supporters.length, icon: "👥", color: "#7c3aed", bg: "#f5f3ff" },
                      { label: "पक्के समर्थक",   value: confirmed.length,  icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
                      { label: "संपर्क हुआ",     value: contacted.length,  icon: "📞", color: "#0891b2", bg: "#f0f9ff" },
                    ].map(c => (
                      <div key={c.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{c.icon}</div>
                        <div>
                          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>{c.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Area breakdown */}
                  {(() => {
                    const byArea = supporters.reduce<Record<string, { total: number; confirmed: number }>>((acc, v) => {
                      const k = v.area || "अज्ञात";
                      if (!acc[k]) acc[k] = { total: 0, confirmed: 0 };
                      acc[k].total++;
                      if (v.contactStatus === "मीटिंग तय") acc[k].confirmed++;
                      return acc;
                    }, {});
                    const topAreas = Object.entries(byArea).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
                    if (topAreas.length === 0) return null;
                    return (
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14, color: "var(--text-primary)" }}>📍 क्षेत्रवार समर्थक (शीर्ष 5)</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {topAreas.map(([area, { total, confirmed }]) => (
                            <div key={area} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 120, fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{area}</div>
                              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: 4, background: "#16a34a", width: `${Math.round((total / supporters.length) * 100)}%` }} />
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", minWidth: 60, textAlign: "right" }}>{total} ({confirmed} पक्के)</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Filters */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="text" placeholder="नाम / मोबाइल / क्षेत्र खोजें..."
                      value={suppSearch} onChange={e => setSuppSearch(e.target.value)}
                      style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: "1px solid var(--border-color)", borderRadius: 7, fontSize: "0.83rem", background: "var(--bg-body)", color: "var(--text-primary)" }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["सभी", "पक्के", "संपर्क"] as const).map(f => (
                        <button key={f} onClick={() => setSuppFilter(f)}
                          style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: "0.8rem", cursor: "pointer",
                            background: suppFilter === f ? "#16a34a" : "var(--bg-card)",
                            color: suppFilter === f ? "#fff" : "var(--text-secondary)",
                            borderColor: suppFilter === f ? "#16a34a" : "var(--border-color)" }}>
                          {f === "सभी" ? "सभी" : f === "पक्के" ? "✅ पक्के" : "📞 संपर्क"}
                        </button>
                      ))}
                    </div>
                    <select value={suppArea} onChange={e => setSuppArea(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid var(--border-color)", borderRadius: 7, fontSize: "0.82rem", background: "var(--bg-body)", color: "var(--text-primary)" }}>
                      {areas.map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select value={suppSort} onChange={e => setSuppSort(e.target.value as "name" | "area" | "age")}
                      style={{ padding: "6px 10px", border: "1px solid var(--border-color)", borderRadius: 7, fontSize: "0.82rem", background: "var(--bg-body)", color: "var(--text-primary)" }}>
                      <option value="name">नाम से</option>
                      <option value="area">क्षेत्र से</option>
                      <option value="age">आयु से</option>
                    </select>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "auto" }}>{list.length} समर्थक</span>
                  </div>

                  {/* Supporters list */}
                  {list.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                      <div style={{ fontSize: "3rem", marginBottom: 12 }}>👥</div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>कोई समर्थक नहीं मिला</div>
                      <div style={{ fontSize: "0.83rem" }}>मतदाता सूची में "संपर्क हुआ" या "मीटिंग तय" मार्क करें</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                      {list.map(v => (
                        <div key={v.id} style={{ background: "var(--bg-card)", border: `1.5px solid ${v.contactStatus === "मीटिंग तय" ? "#86efac" : "var(--border-color)"}`, borderRadius: 12, padding: 16, position: "relative", transition: "box-shadow 0.15s" }}>
                          {/* Status badge */}
                          <div style={{ position: "absolute", top: 12, right: 12, padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
                            background: v.contactStatus === "मीटिंग तय" ? "#f0fdf4" : "#f0f9ff",
                            color: v.contactStatus === "मीटिंग तय" ? "#16a34a" : "#0891b2",
                            border: `1px solid ${v.contactStatus === "मीटिंग तय" ? "#86efac" : "#bae6fd"}` }}>
                            {v.contactStatus === "मीटिंग तय" ? "✅ पक्का" : "📞 संपर्क"}
                          </div>
                          {/* Avatar + name */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: v.contactStatus === "मीटिंग तय" ? "#f0fdf4" : "#f0f9ff",
                              border: `2px solid ${v.contactStatus === "मीटिंग तय" ? "#86efac" : "#bae6fd"}`,
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700,
                              color: v.contactStatus === "मीटिंग तय" ? "#16a34a" : "#0891b2", flexShrink: 0 }}>
                              {v.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{v.gender} · {v.age} वर्ष</div>
                            </div>
                          </div>
                          {/* Info rows */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                            {v.area && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", gap: 6 }}>
                                <span>📍</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{v.area}</span>
                              </div>
                            )}
                            {v.familyHead && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", gap: 6 }}>
                                <span>🏠</span><span>{v.familyHead}</span>
                              </div>
                            )}
                            {v.lastContact && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", gap: 6 }}>
                                <span>🕐</span><span>अंतिम संपर्क: {v.lastContact}</span>
                              </div>
                            )}
                          </div>
                          {/* Action buttons */}
                          <div style={{ display: "flex", gap: 8 }}>
                            {v.mobile ? (
                              <>
                                <a href={`tel:${v.mobile}`} style={{ flex: 1, padding: "6px 0", borderRadius: 7, background: "#f0f9ff", color: "#0891b2", textAlign: "center", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", border: "1px solid #bae6fd" }}>
                                  📞 कॉल
                                </a>
                                <a href={`https://wa.me/91${v.mobile}`} target="_blank" rel="noreferrer"
                                  style={{ flex: 1, padding: "6px 0", borderRadius: 7, background: "#f0fdf4", color: "#16a34a", textAlign: "center", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", border: "1px solid #86efac" }}>
                                  💬 WhatsApp
                                </a>
                              </>
                            ) : (
                              <div style={{ flex: 1, fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", padding: "6px 0" }}>मोबाइल नहीं</div>
                            )}
                            {v.contactStatus !== "मीटिंग तय" && (
                              <button onClick={() => updateSingleVoter(v.id, { contactStatus: "मीटिंग तय" })}
                                style={{ padding: "6px 10px", borderRadius: 7, background: "#f0fdf4", color: "#16a34a", fontSize: "0.78rem", fontWeight: 600, border: "1px solid #86efac", cursor: "pointer" }}>
                                ✅ पक्का करें
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

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

      {/* ════ New Group Modal — rendered at root level so position:fixed covers everything ════ */}
      {showNewGroupModal && (() => {
        const modalVoters = voters.filter(v =>
          !newGroupSearch || v.name.includes(newGroupSearch) || (v.mobile || "").includes(newGroupSearch) || v.area.includes(newGroupSearch)
        );
        const selCount = Object.values(newGroupSel).filter(Boolean).length;
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowNewGroupModal(false); }}
          >
            <div style={{ background: "#ffffff", borderRadius: 16, width: "min(620px,95vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.35)", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 14, background: "#f9fafb" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>🏷️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111827" }}>नया ग्रुप बनाएं</div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 2 }}>{selCount > 0 ? `${selCount} मतदाता चुने गए` : "मतदाता चुनें और ग्रुप का नाम दें"}</div>
                </div>
                <button onClick={() => setShowNewGroupModal(false)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", fontSize: "1rem", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>

              {/* Group name */}
              <div style={{ padding: "16px 24px 14px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>ग्रुप का नाम *</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="जैसे: युवा मतदाता, धोबी मुहल्ला, OBC समूह…"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 9, fontSize: "0.9rem", background: "#f9fafb", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "#16a34a")}
                  onBlur={e => (e.target.style.borderColor = "#d1d5db")}
                />
              </div>

              {/* Search + count bar */}
              <div style={{ padding: "12px 24px 8px", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#9ca3af" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="मतदाता खोजें…"
                    value={newGroupSearch}
                    onChange={e => setNewGroupSearch(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.83rem", background: "#f9fafb", color: "#111827", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <span style={{ fontSize: "0.78rem", color: "#6b7280", whiteSpace: "nowrap" }}>{modalVoters.length} मतदाता</span>
              </div>

              {/* Voter list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 8px" }}>
                {/* Select all row */}
                <div style={{ padding: "8px 8px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f3f4f6", marginBottom: 4, position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                  <input type="checkbox"
                    checked={modalVoters.length > 0 && modalVoters.every(v => newGroupSel[v.id])}
                    onChange={e => {
                      const sel: Record<string, boolean> = { ...newGroupSel };
                      modalVoters.forEach(v => { sel[v.id] = e.target.checked; });
                      setNewGroupSel(sel);
                    }}
                    style={{ width: 16, height: 16, accentColor: "#16a34a", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>सभी चुनें ({modalVoters.length})</span>
                </div>

                {modalVoters.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center", color: "#9ca3af", fontSize: "0.83rem" }}>कोई मतदाता नहीं मिला</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {modalVoters.map(v => (
                      <div key={v.id}
                        onClick={() => setNewGroupSel(prev => ({ ...prev, [v.id]: !prev[v.id] }))}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer",
                          background: newGroupSel[v.id] ? "#f0fdf4" : "transparent",
                          border: `1px solid ${newGroupSel[v.id] ? "#86efac" : "transparent"}`,
                          transition: "background 0.1s" }}>
                        <input type="checkbox" checked={!!newGroupSel[v.id]} onChange={() => {}}
                          style={{ width: 16, height: 16, accentColor: "#16a34a", pointerEvents: "none", flexShrink: 0 }} />
                        <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: newGroupSel[v.id] ? "#dcfce7" : "#f3f4f6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, color: newGroupSel[v.id] ? "#16a34a" : "#6b7280", fontSize: "0.88rem" }}>
                          {v.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.87rem", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                          <div style={{ fontSize: "0.73rem", color: "#9ca3af" }}>{v.area} · {v.gender} · {v.age} वर्ष</div>
                        </div>
                        {v.group && (
                          <span style={{ fontSize: "0.68rem", padding: "2px 7px", borderRadius: 12, background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a", whiteSpace: "nowrap", flexShrink: 0 }}>
                            🏷️ {v.group}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                {selCount > 0 && (
                  <span style={{ flex: 1, fontSize: "0.8rem", color: "#16a34a", fontWeight: 600 }}>✓ {selCount} सदस्य चुने गए</span>
                )}
                <button onClick={() => setShowNewGroupModal(false)}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  रद्द करें
                </button>
                <button
                  disabled={!newGroupName.trim() || selCount === 0}
                  onClick={() => {
                    const name = newGroupName.trim();
                    const ids = Object.keys(newGroupSel).filter(id => newGroupSel[id]);
                    setVoters(prev => prev.map(v => ids.includes(v.id) ? { ...v, group: name } : v));
                    ids.forEach(id => db.voters.updateCRM(id, { group: name }).catch(console.error));
                    setShowNewGroupModal(false);
                  }}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: (!newGroupName.trim() || selCount === 0) ? "#d1d5db" : "#16a34a", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: (!newGroupName.trim() || selCount === 0) ? "not-allowed" : "pointer" }}>
                  ✅ ग्रुप बनाएं ({selCount})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav">
        {BOTTOM_NAV.map(item => {
          const locked = !profileComplete && item.name !== "मेरा प्रोफाइल";
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              className={`mobile-bottom-btn${isActive ? " active" : ""}`}
              onClick={() => !locked && navChange(item.name)}
              style={locked ? { opacity: 0.4 } : undefined}
            >
              <span className="mobile-bottom-icon">{item.icon}</span>
              <span className="mobile-bottom-label">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
