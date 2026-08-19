"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

// Types matching shared database structure
interface Suggestion {
  id: string;
  name: string;
  ward: number;
  category: "पेयजल" | "स्वच्छता" | "सड़क व बिजली" | "चिकित्सा" | "शिक्षा" | "अन्य";
  title: string;
  description: string;
  upvotes: number;
  date: string;
}

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
}

// Development projects mock data per ward
interface Project {
  id: string;
  name: string;
  status: "पूर्ण" | "प्रगति पर" | "नियोजित" | "समीक्षा के अधीन";
  progress: number; // percentage
  targetDate: string;
}

const WARD_PROJECTS_MOCK: Record<number, Project[]> = {
  4: [
    { id: "p1", name: "वार्ड 4 पेयजल पाइपलाइन विस्तार कार्य", status: "प्रगति पर", progress: 75, targetDate: "15 सितंबर 2026" },
    { id: "p2", name: "राजकीय प्राथमिक स्कूल मरम्मत व पेंटिंग", status: "पूर्ण", progress: 100, targetDate: "पूर्ण" },
    { id: "p3", name: "स्कूल मार्ग पर 10 नए कचरा पात्र स्थापना", status: "नियोजित", progress: 0, targetDate: "10 अक्टूबर 2026" },
  ],
  7: [
    { id: "p4", name: "जयपुरिया मोहल्ला मुख्य मार्ग डामरीकरण", status: "प्रगति पर", progress: 40, targetDate: "30 सितंबर 2026" },
    { id: "p5", name: "सामुदायिक केंद्र वाई-फाई व डिजिटल लाइब्रेरी", status: "समीक्षा के अधीन", progress: 10, targetDate: "समीक्षा में" },
    { id: "p6", name: "गली नंबर 3 में नई एलईडी स्ट्रीटलाइट्स लगाना", status: "पूर्ण", progress: 100, targetDate: "पूर्ण" },
  ],
  9: [
    { id: "p7", name: "बाजार क्षेत्र में भूमिगत नाली सफाई अभियान", status: "पूर्ण", progress: 100, targetDate: "पूर्ण" },
    { id: "p8", name: "वार्ड 9 मुख्य चौक पर कचरा ट्रांसफर स्टेशन", status: "नियोजित", progress: 0, targetDate: "15 नवंबर 2026" },
  ],
  12: [
    { id: "p9", name: "हाई स्कूल रोड बंद पड़े स्ट्रीटलाइट्स की मरम्मत", status: "प्रगति पर", progress: 90, targetDate: "20 अगस्त 2026" },
    { id: "p10", name: "वार्ड 12 नए नलकूप (बोरवेल) की स्थापना", status: "समीक्षा के अधीन", progress: 5, targetDate: "बजट पेंडिंग" },
  ],
};

// Default projects for other wards
const DEFAULT_PROJECTS: Project[] = [
  { id: "pd1", name: "आंतरिक गलियों की सफाई एवं स्वच्छता अभियान", status: "पूर्ण", progress: 100, targetDate: "पूर्ण" },
  { id: "pd2", name: "सड़कों व नालियों की मरम्मत", status: "प्रगति पर", progress: 50, targetDate: "15 अक्टूबर 2026" },
  { id: "pd3", name: "एलईडी स्ट्रीटलाइट स्थापना", status: "नियोजित", progress: 0, targetDate: "1 दिसंबर 2026" },
];

export default function CitizenDashboard() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [upvotedItems, setUpvotedItems] = useState<Record<string, boolean>>({});
  const [activeWard, setActiveWard] = useState<number>(4);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("सभी");

  // Voter check states (Find Polling Booth)
  const [searchVoterId, setSearchVoterId] = useState("");
  const [searchedVoter, setSearchedVoter] = useState<Voter | null>(null);
  const [voterSearchError, setVoterSearchError] = useState("");

  // Suggestion Form states
  const [name, setName] = useState("");
  const [formWard, setFormWard] = useState<number>(4);
  const [category, setCategory] = useState<Suggestion["category"]>("पेयजल");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Load shared suggestions & upvotes
  useEffect(() => {
    try {
      const stored = localStorage.getItem("khejroli_suggestions");
      if (stored) {
        setSuggestions(JSON.parse(stored));
      }
      const storedVotes = localStorage.getItem("khejroli_upvotes");
      if (storedVotes) {
        setUpvotedItems(JSON.parse(storedVotes));
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, []);

  const saveSuggestions = (updated: Suggestion[]) => {
    setSuggestions(updated);
    try {
      localStorage.setItem("khejroli_suggestions", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving suggestions:", e);
    }
  };

  // Upvote Handler
  const handleUpvote = (id: string) => {
    const hasVoted = upvotedItems[id];
    const newUpvotedItems = { ...upvotedItems, [id]: !hasVoted };
    setUpvotedItems(newUpvotedItems);
    try {
      localStorage.setItem("khejroli_upvotes", JSON.stringify(newUpvotedItems));
    } catch (e) {
      console.error("Error saving upvotes:", e);
    }

    const updated = suggestions.map((s) => {
      if (s.id === id) {
        return { ...s, upvotes: hasVoted ? s.upvotes - 1 : s.upvotes + 1 };
      }
      return s;
    });
    saveSuggestions(updated);
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setSubmitStatus("error");
      return;
    }

    const newSuggestion: Suggestion = {
      id: `s-${Date.now()}`,
      name: name.trim() || "अज्ञात नागरिक",
      ward: Number(formWard),
      category,
      title: title.trim(),
      description: description.trim(),
      upvotes: 0,
      date: new Date().toISOString().split("T")[0],
    };

    const updated = [newSuggestion, ...suggestions];
    saveSuggestions(updated);

    setName("");
    setFormWard(4);
    setCategory("पेयजल");
    setTitle("");
    setDescription("");
    setSubmitStatus("success");

    setTimeout(() => {
      setSubmitStatus("idle");
    }, 5000);
  };

  // Voter Search Handler
  const handleVoterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedVoter(null);
    setVoterSearchError("");

    if (!searchVoterId.trim()) {
      setVoterSearchError("कृपया वोटर आईडी दर्ज करें।");
      return;
    }

    try {
      const stored = localStorage.getItem("khejroli_voters");
      if (stored) {
        const votersList: Voter[] = JSON.parse(stored);
        const match = votersList.find((v) => v.id.toLowerCase() === searchVoterId.trim().toLowerCase());
        if (match) {
          setSearchedVoter(match);
        } else {
          setVoterSearchError("मतदाता रिकॉर्ड नहीं मिला। कृपया वोटर आईडी जांचें।");
        }
      } else {
        setVoterSearchError("डेटाबेस लोड नहीं हो सका। कृपया बाद में प्रयास करें।");
      }
    } catch (e) {
      setVoterSearchError("सर्वर त्रुटि।");
    }
  };

  // Get active projects for selected ward
  const activeProjects = WARD_PROJECTS_MOCK[activeWard] || DEFAULT_PROJECTS;

  // Filtered live suggestions
  const filteredSuggestions = suggestions.filter((s) => {
    return activeCategoryFilter === "सभी" || s.category === activeCategoryFilter;
  });

  const categoriesList: Suggestion["category"][] = ["पेयजल", "स्वच्छता", "सड़क व बिजली", "चिकित्सा", "शिक्षा", "अन्य"];

  // Calculate dynamic stats
  const totalCount = suggestions.length;
  const categoryCounts = suggestions.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ background: "#fbf8ee", minHeight: "100vh" }}>
      {/* Top Notification Bar */}
      <div className="announcement-bar">
        खेजरोली नगर पालिका नागरिक मंच • अपने वार्ड के विकास कार्यों को ट्रैक करें व सुझाव दें
      </div>

      {/* Header */}
      <header style={{ padding: "16px 0", background: "#ffffff", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0 }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="logo-badge">ख</div>
            <div>
              <h1 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 800 }}>खेजरोली जन-भागीदारी</h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                Citizen Engagement Portal
              </p>
            </div>
          </div>

          <nav>
            <ul className="nav-menu" style={{ display: "flex", gap: "24px" }}>
              <li><a href="#projects" className="nav-link">विकास योजनाएं</a></li>
              <li><a href="#booth-finder" className="nav-link">बूथ खोजें</a></li>
              <li><a href="#suggestion-form" className="nav-link">सुझाव दें</a></li>
              <li><a href="#live-feed" className="nav-link">जन-आकांक्षाएं</a></li>
            </ul>
          </nav>

          <span className="badge badge-brand" style={{ fontWeight: 700 }}>नागरिक पोर्टल</span>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "50px 0", background: "linear-gradient(to bottom, #ffffff, #fbf8ee)" }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <span className="badge badge-saffron" style={{ width: "max-content", alignSelf: "center" }}>
              सजग नागरिक • समृद्ध खेजरोली
            </span>
            <h2 style={{ fontSize: "3rem", lineHeight: "1.2" }}>
              खेजरोली का विकास, <span className="gradient-text">आपके हाथों में!</span>
            </h2>
            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
              खेजरोली को आदर्श नगर पालिका बनाने के लिए अपने वार्ड के विकास कार्यों को ट्रैक करें, अपनी बुनियादी आवश्यकताओं के सुझाव साझा करें, और मतदाता पंजीकरण में सहायता प्राप्त करें।
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="container" style={{ paddingBottom: "60px" }}>
        <div className="grid-2" style={{ gap: "32px", alignItems: "start" }}>

          {/* LEFT SIDE: WARD TRACKER & VOTER FINDER */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Widget 1: Ward Project Tracker */}
            <div className="custom-card" id="projects" style={{ background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "1.35rem" }}>🏢 वार्ड विकास प्रगति ट्रैकर</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>वार्ड के विकास कार्यों की रीयल-टाइम स्थिति देखें</p>
                </div>
                
                {/* Ward selector */}
                <select
                  className="form-select"
                  style={{ width: "120px" }}
                  value={activeWard}
                  onChange={(e) => setActiveWard(Number(e.target.value))}
                >
                  <option value={4}>वार्ड 4</option>
                  <option value={7}>वार्ड 7</option>
                  <option value={9}>वार्ड 9</option>
                  <option value={12}>वार्ड 12</option>
                </select>
              </div>

              {/* Projects Checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activeProjects.map((project) => (
                  <div
                    key={project.id}
                    style={{ padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "#fafafa" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <strong style={{ fontSize: "0.9rem" }}>{project.name}</strong>
                      <span className={`status-pill ${
                        project.status === "पूर्ण" ? "status-avail-green" :
                        project.status === "प्रगति पर" ? "status-contact-yellow" : "status-contact-purple"
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      <span>प्रगति: <strong>{project.progress}%</strong></span>
                      <span>• लक्षित तिथि: <strong>{project.targetDate}</strong></span>
                    </div>

                    <div className="chart-bar-bg" style={{ height: "8px" }}>
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: project.status === "पूर्ण" ? "var(--color-forest)" : "var(--color-terracotta)",
                          height: "100%",
                          borderRadius: "4px"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Polling Booth Finder */}
            <div className="custom-card" id="booth-finder" style={{ background: "#ffffff" }}>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "6px" }}>🗳️ मतदाता सहायता (बूथ खोजक)</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                अपनी वोटर आईडी (Voter ID) दर्ज करें और अपना मतदान बूथ नंबर और क्षेत्र जानें।
              </p>

              <form onSubmit={handleVoterSearch} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="उदा. RJ07A1234567"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={searchVoterId}
                  onChange={(e) => setSearchVoterId(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: "var(--radius-sm)" }}>
                  खोजें
                </button>
              </form>

              {/* Search result panel */}
              {searchedVoter && (
                <div style={{ padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-forest)", background: "var(--bg-card-green)" }}>
                  <h4 style={{ fontSize: "1rem", color: "var(--color-forest)", marginBottom: "12px" }}>✓ मतदाता रिकॉर्ड मिल गया!</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
                    <div>मतदाता नाम: <strong>{searchedVoter.name}</strong></div>
                    <div>परिवार प्रमुख: {searchedVoter.familyHead}</div>
                    <div>बूथ संख्या: <strong style={{ color: "var(--color-terracotta)" }}>बूथ {searchedVoter.booth}</strong></div>
                    <div>वार्ड क्षेत्र: {searchedVoter.area}</div>
                  </div>
                </div>
              )}

              {voterSearchError && (
                <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-terracotta)", background: "var(--bg-card-cream)", fontSize: "0.85rem", color: "var(--color-terracotta)" }}>
                  {voterSearchError}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: SUGGESTIONS FORM & STATS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {/* Widget 3: Suggestion Form */}
            <div className="custom-card" id="suggestion-form" style={{ background: "#ffffff" }}>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "6px" }}>📢 नया विकास सुझाव साझा करें</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "20px" }}>आपके सुझाव सीधे वार्ड प्रबंधन टीम के डैशबोर्ड में जोड़े जाएंगे।</p>

              {submitStatus === "success" && (
                <div style={{ background: "var(--bg-card-green)", border: "1px solid var(--color-forest)", color: "var(--color-forest)", padding: "16px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
                  ✓ <strong>सुझाव दर्ज हो गया है!</strong> आपका फीडबैक लाइव चार्ट और फीड में शामिल हो गया है।
                </div>
              )}

              {submitStatus === "error" && (
                <div style={{ background: "var(--bg-card-cream)", border: "1px solid var(--color-terracotta)", color: "var(--color-terracotta)", padding: "16px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
                  ✗ <strong>त्रुटि!</strong> कृपया शीर्षक और विवरण पूरा भरें।
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">आपका नाम (वैकल्पिक)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="उदा. अमित कुमार"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">वार्ड नंबर</label>
                    <select
                      className="form-control"
                      value={formWard}
                      onChange={(e) => setFormWard(Number(e.target.value))}
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          वार्ड {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">श्रेणी</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Suggestion["category"])}
                    >
                      {categoriesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">विषय / मांग शीर्षक</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="उदा. नए नलकूप की आवश्यकता"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">विस्तृत विवरण</label>
                  <textarea
                    className="form-control"
                    placeholder="सुझाव को विस्तार से बताएं..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  सुझाव साझा करें
                </button>
              </form>
            </div>

            {/* Widget 4: Community Demands Live Analytics */}
            <div className="custom-card" style={{ background: "#ffffff" }}>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "8px" }}>📊 जन-मांग लाइव विश्लेषण</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                नागरिकों द्वारा साझा किए गए सुझावों का श्रेणीवार वितरण:
              </p>

              <div className="chart-container">
                {categoriesList.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  
                  return (
                    <div key={cat} className="chart-row" style={{ gap: "4px" }}>
                      <div className="chart-header" style={{ fontSize: "0.8rem" }}>
                        <span>{cat}</span>
                        <strong>{count} ({pct}%)</strong>
                      </div>
                      <div className="chart-bar-bg" style={{ height: "8px" }}>
                        <div
                          className="chart-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: "var(--color-terracotta)",
                            height: "100%",
                            borderRadius: "4px"
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Live suggestions feed for upvoting */}
        <section id="live-feed" style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span className="badge badge-brand">लोकप्रिय जन-सुझाव</span>
              <h3 style={{ fontSize: "1.75rem", marginTop: "8px" }}>💬 नागरिकों के नवीनतम सुझाव</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                वार्ड-वार उठ रही जन-मांगों को समर्थन (Upvote) दें ताकि उन्हें प्राथमिकता मिल सके।
              </p>
            </div>

            {/* Category tabs filters */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["सभी", ...categoriesList].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveCategoryFilter(filter)}
                  className={`btn ${activeCategoryFilter === filter ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "30px" }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions List feed */}
          {filteredSuggestions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {filteredSuggestions.map((item) => {
                const isUpvoted = !!upvotedItems[item.id];

                return (
                  <div
                    key={item.id}
                    className="feed-item"
                    style={{ borderLeftColor: isUpvoted ? "var(--color-terracotta)" : "var(--color-forest)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "0.8rem" }}>
                        <span className="badge badge-brand" style={{ background: "rgba(77, 101, 60, 0.1)", color: "var(--color-forest)" }}>
                          {item.category}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                          • वार्ड {item.ward}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          • {item.date}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUpvote(item.id)}
                        className={`upvote-btn ${isUpvoted ? "active" : ""}`}
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        👍 {item.upvotes} समर्थन
                      </button>
                    </div>

                    <h4 style={{ fontSize: "1.1rem", marginBottom: "8px", fontWeight: 700 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      {item.description}
                    </p>

                    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      नागरिक: <strong>{item.name}</strong> • सत्यापित मांग ✓
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="custom-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              📭 इस श्रेणी में वर्तमान में कोई सुझाव नहीं है। आप पहला सुझाव सबमिट कर सकते हैं!
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer style={{ background: "var(--color-forest)", color: "#ffffff", padding: "32px 0", borderTop: "1px solid var(--border-color)", textAlign: "center", fontSize: "0.85rem" }}>
        <div className="container">
          <p>© 2026 खेजरोली जनता पार्टी। सर्वाधिकार सुरक्षित। सजग नागरिक, समृद्ध गांव।</p>
        </div>
      </footer>
    </div>
  );
}
