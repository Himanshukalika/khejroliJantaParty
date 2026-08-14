"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

// Types
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

// Initial Mock Data in pure Hindi
const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    name: "राम लाल शर्मा",
    ward: 4,
    category: "पेयजल",
    title: "वार्ड 4 में पेयजल पाइपलाइन का विस्तार आवश्यक है",
    description: "गर्मियों के दिनों में पानी की आपूर्ति काफी अनियमित हो जाती है। हमें नियमित पाइपलाइन कनेक्शन की जरूरत है।",
    upvotes: 34,
    date: "2026-08-12",
  },
  {
    id: "s2",
    name: "सीता देवी",
    ward: 9,
    category: "स्वच्छता",
    title: "मुख्य बाजार के पास कचरा पात्र स्थापित करने का अनुरोध",
    description: "बाजार का सारा कचरा खुले स्थानों पर फेंक दिया जाता है। नियमित डस्टबिन लगाने से बाजार साफ और स्वच्छ रहेगा।",
    upvotes: 21,
    date: "2026-08-13",
  },
  {
    id: "s3",
    name: "विक्रम सिंह",
    ward: 12,
    category: "सड़क व बिजली",
    title: "राजकीय उच्च विद्यालय के पास बंद पड़ी स्ट्रीटलाइट",
    description: "शाम को यहाँ काफी अंधेरा हो जाता है जिससे कोचिंग से लौटने वाली छात्राओं को परेशानी होती है। स्ट्रीटलाइट जल्द ठीक करवाई जाए।",
    upvotes: 15,
    date: "2026-08-11",
  },
  {
    id: "s4",
    name: "अज्ञात नागरिक",
    ward: 2,
    category: "चिकित्सा",
    title: "प्राथमिक स्वास्थ्य केंद्र में डॉक्टर की नियमित उपस्थिति",
    description: "वर्तमान में डॉक्टर सप्ताह में केवल दो बार आते हैं। आपातकालीन मामलों के लिए यहाँ एक स्थायी नर्स और डॉक्टर होना आवश्यक है।",
    upvotes: 28,
    date: "2026-08-10",
  },
  {
    id: "s5",
    name: "दीपक कुमार",
    ward: 7,
    category: "शिक्षा",
    title: "सरकारी स्कूल की लाइब्रेरी के बुनियादी ढांचे में सुधार",
    description: "लाइब्रेरी में पुस्तकों की संख्या बहुत कम है। स्थानीय युवाओं के लिए प्रतियोगी परीक्षाओं की तैयारी की किताबें उपलब्ध कराई जाएं।",
    upvotes: 19,
    date: "2026-08-14",
  },
];

export default function Home() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("सभी");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [upvotedItems, setUpvotedItems] = useState<Record<string, boolean>>({});

  // Form State
  const [name, setName] = useState("");
  const [ward, setWard] = useState<number>(1);
  const [category, setCategory] = useState<Suggestion["category"]>("पेयजल");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("khejroli_suggestions");
      if (stored) {
        setSuggestions(JSON.parse(stored));
      } else {
        setSuggestions(INITIAL_SUGGESTIONS);
        localStorage.setItem("khejroli_suggestions", JSON.stringify(INITIAL_SUGGESTIONS));
      }

      const storedVotes = localStorage.getItem("khejroli_upvotes");
      if (storedVotes) {
        setUpvotedItems(JSON.parse(storedVotes));
      }
    } catch (e) {
      console.error("Error loading local storage:", e);
      setSuggestions(INITIAL_SUGGESTIONS);
    }
  }, []);

  // Save to localStorage helper
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
      ward: Number(ward),
      category,
      title: title.trim(),
      description: description.trim(),
      upvotes: 0,
      date: new Date().toISOString().split("T")[0],
    };

    const updated = [newSuggestion, ...suggestions];
    saveSuggestions(updated);

    // Reset Form
    setName("");
    setWard(1);
    setCategory("पेयजल");
    setTitle("");
    setDescription("");
    setSubmitStatus("success");

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSubmitStatus("idle");
    }, 5000);
  };

  const scrollToForm = () => {
    const element = document.getElementById("suggestion-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Calculate stats
  const totalSuggestions = suggestions.length;
  const categoryCounts = suggestions.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesList: Suggestion["category"][] = ["पेयजल", "स्वच्छता", "सड़क व बिजली", "चिकित्सा", "शिक्षा", "अन्य"];

  // Filtered Suggestions
  const filteredSuggestions = suggestions.filter((s) => {
    const matchesFilter = activeFilter === "सभी" || s.category === activeFilter;
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `वार्ड ${s.ward}`.includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Background Soft circles */}
      <div className="bg-shape-1" />
      <div className="bg-shape-2" />

      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        ग्राम पंचायत खेजरोली • चेयरमैन चुनाव 2026 • उम्मीदवारी एवं जन-सुझाव के आवेदन खुले हैं
      </div>

      {/* Header */}
      <header style={{ padding: "16px 0", background: "transparent", borderBottom: "1px solid var(--border-color)", zIndex: 10 }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="logo-badge">ख</div>
            <div>
              <h1 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                खेजरोली जनता पार्टी
              </h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                Khejroli Janta Party
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul className="nav-menu">
              <li><a href="#vision" className="nav-link">हमारा उद्देश्य</a></li>
              <li><a href="#manifesto" className="nav-link">घोषणापत्र</a></li>
              <li><a href="#suggestion-form-section" className="nav-link">सुझाव दर्ज करें</a></li>
              <li><a href="#analytics" className="nav-link">लाइव विश्लेषण</a></li>
              <li><a href="#contact" className="nav-link">संपर्क</a></li>
            </ul>
          </nav>

          {/* CTA button */}
          <button className="btn btn-primary" onClick={scrollToForm}>
            सुझाव दें
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "60px 0 40px 0", zIndex: 5 }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: "center", gap: "48px" }}>
            
            {/* Hero Left Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <span className="badge badge-brand" style={{ width: "max-content", fontWeight: 700 }}>
                गाँव का उम्मीदवार • गाँव की पसंद
              </span>
              <h2 style={{ fontSize: "3.25rem", lineHeight: "1.15", fontWeight: 800, color: "var(--text-primary)" }}>
                गाँव तय करेगा, गाँव का चेयरमैन कौन बनेगा
              </h2>
              <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: "1.65" }}>
                खेजरोली जनता पार्टी किसी एक परिवार या रसूख की पार्टी नहीं है। हम गाँव से ही एक ईमानदार, पढ़ा-लिखा और उपलब्ध उम्मीदवार चुनेंगे — और उसका पूरा चुनावी खर्च पार्टी उठाएगी, ताकि जीतने के बाद वह गाँव को जवाब दे, किसी पैसे वाले को नहीं।
              </p>
              
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
                <button className="btn btn-primary" onClick={scrollToForm}>
                  उम्मीदवारी के लिए आवेदन करें
                </button>
                <a href="#manifesto" className="btn btn-secondary">
                  घोषणापत्र पढ़ें
                </a>
              </div>
            </div>

            {/* Hero Right Visuals & Twin Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Main Image Card */}
              <div style={{ position: "relative", width: "100%", height: "320px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)" }}>
                <Image
                  src="/village_discussion.jpg"
                  alt="खेजरोली चौपाल चर्चा बरगद के पेड़ के नीचे"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>

              {/* Twin Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ backgroundColor: "var(--bg-card-cream)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-terracotta)" }}>
                  <h3 style={{ fontSize: "2rem", color: "var(--color-terracotta)", marginBottom: "4px" }}>0</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, lineHeight: "1.4" }}>
                    रुपया उम्मीदवार की जेब से — पूरा खर्च पार्टी का
                  </p>
                </div>
                <div style={{ backgroundColor: "var(--bg-card-green)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-forest)" }}>
                  <h3 style={{ fontSize: "2rem", color: "var(--color-forest)", marginBottom: "4px" }}>15</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, lineHeight: "1.4" }}>
                    वार्डों में खुली बैठक, फिर उम्मीदवार का चयन
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Suggestion Form and Analytics Dashboard */}
      <section id="suggestion-form-section" style={{ padding: "60px 0", background: "#f5efe0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", zIndex: 5 }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="badge badge-saffron" style={{ marginBottom: "10px" }}>जन-भागीदारी मंच</span>
            <h3 style={{ fontSize: "2.25rem", color: "var(--text-primary)" }}>खेजरोली विकास चौपाल</h3>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>आपके सुझाव ही हमारे गांव को आदर्श नगर पालिका का रूप देंगे।</p>
          </div>

          <div className="grid-2" style={{ gap: "40px" }}>
            {/* Form Card */}
            <div className="custom-card" style={{ background: "#ffffff" }}>
              <h4 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>📢 अपना महत्वपूर्ण सुझाव दें</h4>
              
              {submitStatus === "success" && (
                <div style={{ background: "var(--bg-card-green)", border: "1px solid var(--color-forest)", color: "var(--color-forest)", padding: "16px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "16px" }}>
                  ✓ <strong>सुझाव दर्ज हो गया है!</strong> आपका सुझाव हमारे लाइव विश्लेषण डैशबोर्ड में शामिल कर लिया गया है।
                </div>
              )}

              {submitStatus === "error" && (
                <div style={{ background: "var(--bg-card-cream)", border: "1px solid var(--color-terracotta)", color: "var(--color-terracotta)", padding: "16px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "16px" }}>
                  ✗ <strong>त्रुटि!</strong> कृपया सुझाव का शीर्षक और विवरण भरें।
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">आपका नाम (वैकल्पिक)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="उदा. राम लाल (खाली छोड़ने पर अनाम नागरिक)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">वार्ड नंबर (Ward No.)</label>
                    <select
                      className="form-control"
                      value={ward}
                      onChange={(e) => setWard(Number(e.target.value))}
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          वार्ड {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">श्रेणी (Category)</label>
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
                  <label className="form-label">मुख्य शीर्षक (Title)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="उदा. वार्ड 4 में पीने के पानी की समस्या"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">विस्तृत सुझाव (Description)</label>
                  <textarea
                    className="form-control"
                    placeholder="अपनी मांग या सुझाव को विस्तार से बताएं..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                  सुझाव साझा करें (Submit Feedback)
                </button>
              </form>
            </div>

            {/* Live Analytics Dashboard */}
            <div className="custom-card" id="analytics" style={{ background: "#ffffff", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h4 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>📊 जन-मांग लाइव विश्लेषण</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>खेजरोली के लोगों द्वारा प्रस्तुत सुझावों का रीयल-टाइम श्रेणीवार विश्लेषण:</p>
              </div>

              <div className="chart-container" style={{ flex: 1, display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "space-between" }}>
                {categoriesList.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const pct = totalSuggestions > 0 ? Math.round((count / totalSuggestions) * 100) : 0;
                  
                  const getColors = (c: string) => {
                    switch(c) {
                      case "पेयजल": return { fill: "linear-gradient(90deg, #be713d, #a25c2d)", text: "var(--color-terracotta)" };
                      case "स्वच्छता": return { fill: "linear-gradient(90deg, #4d653c, #3b4f2e)", text: "var(--color-forest)" };
                      case "सड़क व बिजली": return { fill: "linear-gradient(90deg, #d4a373, #be713d)", text: "#d4a373" };
                      case "चिकित्सा": return { fill: "linear-gradient(90deg, #e76f51, #f4a261)", text: "#e76f51" };
                      case "शिक्षा": return { fill: "linear-gradient(90deg, #457b9d, #1d3557)", text: "#457b9d" };
                      default: return { fill: "linear-gradient(90deg, #6c757d, #495057)", text: "#6c757d" };
                    }
                  };

                  const colors = getColors(cat);

                  return (
                    <div key={cat} className="chart-row">
                      <div className="chart-header">
                        <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors.text }} />
                          {cat}
                        </span>
                        <span style={{ color: colors.text, fontWeight: 700 }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="chart-bar-bg">
                        <div
                          className="chart-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: colors.fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "16px", padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>
                💡 नागरिकों द्वारा प्रस्तुत हर नया फ़ॉर्म इस ग्राफ़ में वास्तविक समय में जुड़ जाता है।
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Suggestions Feed */}
      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
            <div>
              <span className="badge badge-brand">लाइव फीडबैक</span>
              <h3 style={{ fontSize: "2rem", marginTop: "8px" }}>💬 नागरिकों के नवीनतम सुझाव</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>वार्ड-वार आ रहे जन-सुझावों को पढ़ें एवं महत्वपूर्ण मांगों को अपना समर्थन (Upvote) दें।</p>
            </div>

            {/* Filters and Search Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <input
                type="text"
                placeholder="🔎 शीर्षक, वर्णन, या वार्ड नंबर द्वारा सुझाव खोजें..."
                className="form-control"
                style={{ width: "100%", padding: "14px 20px", borderRadius: "30px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                {["सभी", ...categoriesList].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`btn ${activeFilter === filter ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "6px 18px", fontSize: "0.85rem", borderRadius: "30px" }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions List */}
          {filteredSuggestions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {filteredSuggestions.map((item) => {
                const isUpvoted = !!upvotedItems[item.id];

                const getBadge = (cat: Suggestion["category"]) => {
                  switch (cat) {
                    case "पेयजल": return <span className="badge badge-brand" style={{ background: "rgba(77, 101, 60, 0.1)", color: "var(--color-forest)" }}>पेयजल</span>;
                    case "स्वच्छता": return <span className="badge badge-brand" style={{ background: "rgba(77, 101, 60, 0.1)", color: "var(--color-forest)" }}>स्वच्छता</span>;
                    case "सड़क व बिजली": return <span className="badge badge-brand" style={{ background: "rgba(190, 113, 61, 0.1)", color: "var(--color-terracotta)" }}>सड़क व बिजली</span>;
                    case "चिकित्सा": return <span className="badge badge-brand" style={{ background: "rgba(231, 111, 81, 0.1)", color: "#e76f51" }}>चिकित्सा</span>;
                    case "शिक्षा": return <span className="badge badge-brand" style={{ background: "rgba(69, 123, 157, 0.1)", color: "#457b9d" }}>शिक्षा</span>;
                    default: return <span className="badge badge-saffron">{cat}</span>;
                  }
                };

                return (
                  <div key={item.id} className="feed-item" style={{ borderLeftColor: isUpvoted ? "var(--color-terracotta)" : "var(--color-forest)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {getBadge(item.category)}
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          • वार्ड {item.ward}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          • {item.date}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUpvote(item.id)}
                        className={`upvote-btn ${isUpvoted ? "active" : ""}`}
                      >
                        👍 {item.upvotes} समर्थन (Upvotes)
                      </button>
                    </div>

                    <h4 style={{ fontSize: "1.2rem", marginBottom: "10px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "0.95rem", marginBottom: "16px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      {item.description}
                    </p>

                    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      <span>प्रस्तुतकर्ता: <strong>{item.name}</strong></span>
                      <span>सत्यापित मांग ✓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="custom-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              📭 कोई सुझाव नहीं मिला। आप पहला सुझाव सबमिट करके चर्चा शुरू कर सकते हैं!
            </div>
          )}
        </div>
      </section>

      {/* Manifesto & Goals */}
      <section id="manifesto" style={{ padding: "60px 0", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-color)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span className="badge badge-brand">खेजरोली जन संकल्प</span>
            <h3 style={{ fontSize: "2.25rem", marginTop: "10px" }}>खेजरोली जनता पार्टी घोषणापत्र</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>गाँव के प्रत्येक नागरिक को बुनियादी और आधुनिक सुविधाएं प्रदान करने का हमारा विज़न।</p>
          </div>

          <div className="grid-3">
            {/* Goal 1 */}
            <div className="custom-card" style={{ borderTop: "4px solid var(--color-terracotta)" }}>
              <h4 style={{ fontSize: "1.2rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                🚰 शुद्ध पेयजल संकल्प
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                खेजरोली के सभी 15 वार्डों में नए बोरवेल एवं जल पाइपलाइनों का पूर्ण जाल बिछाया जायेगा। पेयजल आपूर्ति का समय निश्चित होगा और पानी नियमित रूप से साफ़ एवं पीने योग्य होगा।
              </p>
            </div>
            
            {/* Goal 2 */}
            <div className="custom-card" style={{ borderTop: "4px solid var(--color-forest)" }}>
              <h4 style={{ fontSize: "1.2rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                🧹 स्वच्छ खेजरोली
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                प्रत्येक गली और चौराहे पर कचरा संग्रहण पात्र स्थापित किए जाएंगे। नगर पालिका की कचरा संग्रहण गाड़ियां प्रतिदिन हर वार्ड में कूड़ा उठाने के लिए नियमित रूप से उपलब्ध होंगी।
              </p>
            </div>

            {/* Goal 3 */}
            <div className="custom-card" style={{ borderTop: "4px solid var(--color-terracotta)" }}>
              <h4 style={{ fontSize: "1.2rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                🏥 स्वास्थ्य एवं सुरक्षा
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                स्थानीय सरकारी अस्पताल को सुदृढ़ किया जाएगा जिसमें 24/7 प्राथमिक चिकित्सा सुविधाएं और दवाएं उपलब्ध होंगी। सभी प्रमुख सड़कों पर सुरक्षा हेतु स्ट्रीटलाइट्स की मरम्मत की जाएगी।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{ background: "var(--color-forest)", color: "#ffffff", padding: "48px 0 32px 0", borderTop: "1px solid var(--border-color)", zIndex: 5 }}>
        <div className="container">
          <div className="footer-flex" style={{ gap: "32px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "32px", marginBottom: "32px" }}>
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "1.35rem", marginBottom: "8px" }}>खेजरोली जनता पार्टी</h4>
              <p style={{ fontSize: "0.85rem", color: "#d1e2c9" }}>हमारा लक्ष्य—खेजरोली को आदर्श नगर पालिका बनाना।</p>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <button className="btn btn-secondary" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)", borderRadius: "30px" }} onClick={scrollToForm}>
                सुझाव सबमिट करें
              </button>
            </div>
          </div>

          <div className="footer-flex" style={{ gap: "16px", fontSize: "0.8rem", color: "#d1e2c9" }}>
            <span>© 2026 खेजरोली जनता पार्टी। सर्वाधिकार सुरक्षित। नागरिकों की सक्रिय भागीदारी के लिए निर्मित।</span>
            <span>ग्राम पंचायत खेजरोली, राजस्थान</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
