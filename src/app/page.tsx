"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const election = new Date("2026-10-20");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDaysLeft(Math.max(0, Math.ceil((election.getTime() - today.getTime()) / 86400000)));
  }, []);

  const features = [
    {
      icon: "👥",
      title: "मतदाता प्रबंधन",
      desc: "621 मतदाताओं की पूरी सूची — खोज, फ़िल्टर, संपर्क स्थिति, और मोबाइल नंबर एक ही जगह।",
      color: "#0f5e38",
    },
    {
      icon: "📊",
      title: "लाइव डैशबोर्ड",
      desc: "वास्तविक समय में संपर्क प्रगति, जीत का लक्ष्य, और बूथ-वार विश्लेषण।",
      color: "#3b82f6",
    },
    {
      icon: "🤝",
      title: "टीम कोऑर्डिनेशन",
      desc: "टीम सदस्यों को जोड़ें, भूमिकाएं असाइन करें, और क्षेत्र-वार जिम्मेदारी तय करें।",
      color: "#8b5cf6",
    },
    {
      icon: "📝",
      title: "कार्य योजना",
      desc: "उच्च और सामान्य प्राथमिकता के कार्य — जोड़ें, पूर्ण करें, और ट्रैक करें।",
      color: "#f97316",
    },
  ];

  const stats = [
    { value: "621", label: "मतदाता" },
    { value: "48", label: "मोहल्ले" },
    { value: String(daysLeft), label: "दिन शेष" },
    { value: "07", label: "वार्ड नंबर" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: "#0f5e38",
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #fbbf24)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>न</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.1 }}>निर्दलीय शक्ति मंच</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.65rem" }}>खेजरोली नगर पालिका • चुनाव 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/manage" style={{
            color: "#fff", textDecoration: "none", fontSize: "0.82rem",
            padding: "6px 16px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.3)",
            transition: "background 0.2s",
          }}>डैशबोर्ड</Link>
          <Link href="/admin" style={{
            background: "#f97316", color: "#fff", textDecoration: "none",
            fontSize: "0.82rem", padding: "6px 16px", borderRadius: 6,
            fontWeight: 600,
          }}>Admin Panel</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg, #0f5e38 0%, #1a7a4a 50%, #0d4f30 100%)",
        padding: "80px 32px 70px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(249,115,22,0.12)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(249,115,22,0.2)",
            border: "1px solid rgba(249,115,22,0.4)",
            color: "#fbbf24",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
            padding: "4px 14px", borderRadius: 20, marginBottom: 20,
            textTransform: "uppercase",
          }}>चुनाव प्रबंधन सॉफ्टवेयर</div>

          <h1 style={{
            color: "#fff",
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 18,
          }}>
            खेजरोली का चुनाव —<br />
            <span style={{ color: "#fbbf24" }}>डेटा से जीतें</span>
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            lineHeight: 1.65,
            marginBottom: 36,
            maxWidth: 520, margin: "0 auto 36px",
          }}>
            वार्ड 07 के सभी 621 मतदाताओं का डिजिटल प्रबंधन — संपर्क ट्रैकिंग,
            टीम कोऑर्डिनेशन, और लाइव जीत विश्लेषण एक ही प्लेटफ़ॉर्म पर।
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/manage" style={{
              background: "#f97316",
              color: "#fff", textDecoration: "none",
              padding: "14px 32px", borderRadius: 10,
              fontWeight: 700, fontSize: "1rem",
              boxShadow: "0 4px 15px rgba(249,115,22,0.4)",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              🗳️ मतदाता डैशबोर्ड खोलें
            </Link>
            <Link href="/admin" style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", textDecoration: "none",
              padding: "14px 32px", borderRadius: 10,
              fontWeight: 600, fontSize: "1rem",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              ⚙️ Admin Panel
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center",
              padding: "28px 16px",
              borderRight: i < 3 ? "1px solid #e5e7eb" : "none",
            }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f5e38", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "60px 32px" }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
          fontWeight: 700, color: "#111827", marginBottom: 8,
        }}>एक प्लेटफ़ॉर्म — सब कुछ</h2>
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: "0.9rem", marginBottom: 40 }}>
          चुनाव जीतने के लिए जरूरी हर टूल यहाँ है
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: "#fff",
              borderRadius: 14,
              padding: "28px 22px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${f.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, marginBottom: 14,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Election Countdown CTA ── */}
      <section style={{
        background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        padding: "50px 32px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(249,115,22,0.2)",
          border: "1px solid rgba(249,115,22,0.4)",
          color: "#fbbf24", fontSize: "0.72rem", fontWeight: 700,
          padding: "4px 14px", borderRadius: 20, marginBottom: 16,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>20 अक्टूबर 2026 — मतदान दिवस</div>

        <div style={{ color: "#fff", fontSize: "3.5rem", fontWeight: 800, lineHeight: 1 }}>{daysLeft}</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", marginBottom: 28 }}>दिन शेष हैं</div>

        <Link href="/manage" style={{
          background: "#f97316",
          color: "#fff", textDecoration: "none",
          padding: "14px 36px", borderRadius: 10,
          fontWeight: 700, fontSize: "1rem",
          boxShadow: "0 4px 15px rgba(249,115,22,0.35)",
          display: "inline-block",
        }}>
          अभी शुरू करें →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: "#0f5e38",
        padding: "24px 32px",
        textAlign: "center",
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
          © 2026 निर्दलीय शक्ति मंच — खेजरोली नगर पालिका वार्ड 07 &nbsp;|&nbsp;
          <Link href="/admin" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Admin Panel</Link>
        </div>
      </footer>
    </div>
  );
}
