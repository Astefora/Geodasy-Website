import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiExternalLink,
  FiArrowRight,
  FiBookOpen,
  FiGlobe,
  FiRadio,
  FiActivity,
  FiLayers,
  FiDatabase,
  FiX,
  FiSend,
  FiUser,
} from "react-icons/fi";

/* ── Static data ───────────────────────────────────────────────────────────── */
const TABS = ["Overview", "Research", "Publications", "Team", "Contact"];

const ACTIVITIES = [
  {
    icon: "🛰️",
    title: "Satellite Geodesy",
    desc: "InSAR and GPS measurements to track ground deformation at millimeter precision across volcanic, seismic, and landslide-prone zones.",
  },
  {
    icon: "🌋",
    title: "Volcano Monitoring",
    desc: "Continuous tracking of surface deformation at Ethiopian rift volcanoes using Sentinel-1 SAR data and COMET portal integration.",
  },
  {
    icon: "🌍",
    title: "Earthquake Analysis",
    desc: "Real-time seismic monitoring and post-event analysis using USGS feeds and local ground truth data.",
  },
  {
    icon: "🔥",
    title: "Fire Detection",
    desc: "Near-real-time fire hotspot detection using NASA FIRMS VIIRS data to track wildfires across Ethiopian landscapes.",
  },
  {
    icon: "🌊",
    title: "Flood & Drought",
    desc: "Monitoring of land surface temperature, soil moisture and rainfall anomalies using MODIS and Sentinel satellites.",
  },
  {
    icon: "📡",
    title: "Data Sharing",
    desc: "Publishing open datasets and peer-reviewed research through our LEO member portal to support national and international collaborations.",
  },
];

const PUBLICATIONS = [
  {
    year: "2024",
    title:
      "InSAR-based Ground Deformation Monitoring of the Main Ethiopian Rift",
    authors: "Geodesy & Geodynamics Dept., SSGI",
    journal: "Ethiopian Journal of Earth Sciences",
    doi: "#",
    type: "Journal Article",
  },
  {
    year: "2023",
    title:
      "Near-Real-Time Flood Mapping Using Sentinel-1 SAR in the Awash Basin",
    authors: "Geodesy & Geodynamics Dept., SSGI",
    journal: "Remote Sensing Applications",
    doi: "#",
    type: "Journal Article",
  },
  {
    year: "2023",
    title: "GPS Velocity Field of Ethiopia: Implications for Seismic Hazard",
    authors: "Geodesy & Geodynamics Dept., SSGI",
    journal: "Geophysical Research Letters",
    doi: "#",
    type: "Journal Article",
  },
  {
    year: "2022",
    title:
      "Landslide Susceptibility Mapping Using Multi-Source Remote Sensing Data",
    authors: "Geodesy & Geodynamics Dept., SSGI",
    journal: "Natural Hazards and Earth System Sciences",
    doi: "#",
    type: "Journal Article",
  },
  {
    year: "2022",
    title: "Volcanic Unrest Detection at Afar Using InSAR Time Series Analysis",
    authors: "Geodesy & Geodynamics Dept., SSGI",
    journal: "Journal of Volcanology and Geothermal Research",
    doi: "#",
    type: "Journal Article",
  },
  {
    year: "2021",
    title: "National Geodetic Reference Frame for Ethiopia",
    authors: "Geodesy & Geodynamics Dept., SSGI",
    journal: "Journal of Geodesy",
    doi: "#",
    type: "Technical Report",
  },
];

/* Mock team — always shown; dynamic researchers appended below */
const MOCK_TEAM = [
  {
    name: "Dr. Yohannes Tadesse",
    role: "Head of Department",
    field: "Satellite Geodesy & InSAR",
    initials: "YT",
  },
  {
    name: "Dr. Selamawit Bekele",
    role: "Senior Researcher",
    field: "Volcano Monitoring & Geodynamics",
    initials: "SB",
  },
  {
    name: "Engr. Abebe Worku",
    role: "Geodetic Engineer",
    field: "GPS Networks & Reference Frames",
    initials: "AW",
  },
  {
    name: "Dr. Tigist Haile",
    role: "Remote Sensing Specialist",
    field: "Flood & Drought Analysis",
    initials: "TH",
  },
  {
    name: "Engr. Dawit Girma",
    role: "Data Systems Engineer",
    field: "GIS & Spatial Data Infrastructure",
    initials: "DG",
  },
  {
    name: "Dr. Meseret Alemu",
    role: "Researcher",
    field: "Earthquake Seismology",
    initials: "MA",
  },
];

const STATS = [
  { value: "25+", label: "Active Volcanoes Monitored" },
  { value: "6", label: "Hazard Domains" },
  { value: "15+", label: "Publications" },
  { value: "10+", label: "Years of Research" },
];

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "28px",
        transition: "box-shadow 0.2s, transform 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(31,79,216,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      {label && (
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-orange)",
            margin: "0 0 8px",
          }}
        >
          {label}
        </p>
      )}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
          fontWeight: 800,
          color: "var(--text-primary)",
          margin: "0 0 10px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "15px",
            lineHeight: 1.7,
            margin: 0,
            maxWidth: "600px",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function About() {
  const [activeTab, setActiveTab] = useState("Overview");

  /* Contact modal */
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sendStatus, setSendStatus] = useState("idle"); // idle | sending | sent | error
  const [sendError, setSendError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setSendStatus("sending");
    setSendError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      setSendStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => {
        setShowContact(false);
        setSendStatus("idle");
      }, 3000);
    } catch (err) {
      setSendError(err.message);
      setSendStatus("error");
    }
  };

  /* Dynamic researchers from DB */
  const [dbResearchers, setDbResearchers] = useState([]);
  useEffect(() => {
    fetch("/api/users?role=member&status=approved")
      .then((r) => (r.ok ? r.json() : []))
      .then((users) => {
        const filtered = (users || []).filter(
          (u) => u.designation === "Researcher" || u.designation === "Faculty",
        );
        setDbResearchers(filtered);
      })
      .catch(() => {});
  }, []);

  const allTeam = [
    ...MOCK_TEAM,
    ...dbResearchers.map((u) => ({
      name: u.fullName,
      role: u.designation,
      field: u.department || "Geodesy & Geodynamics",
      initials:
        u.fullName
          ?.split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "??",
      dynamic: true,
    })),
  ];
  const handleButtonEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.18)";
  };

  const handleButtonLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{ minHeight: "100vh", paddingTop: "100px", paddingBottom: "24px" }}
    >
      {/* ── Contact modal ─────────────────────────────────────────────────── */}
      {showContact && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowContact(false)}
          />
          <div
            style={{
              position: "relative",
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: "20px",
              padding: "32px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 800,
                    fontSize: "18px",
                    margin: 0,
                  }}
                >
                  Send a Message
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    margin: "4px 0 0",
                  }}
                >
                  Message goes directly to the department email.
                </p>
              </div>
              <button
                onClick={() => setShowContact(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <FiX size={18} />
              </button>
            </div>

            {sendStatus === "sent" ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <p
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "16px",
                    margin: "0 0 4px",
                  }}
                >
                  Message sent!
                </p>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      padding: "10px 13px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    style={{
                      padding: "10px 13px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <input
                  placeholder="Subject (optional)"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  style={{
                    padding: "10px 13px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Your message…"
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  style={{
                    padding: "10px 13px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                {sendStatus === "error" && (
                  <p style={{ color: "#ef4444", fontSize: "12px", margin: 0 }}>
                    ⚠ {sendError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sendStatus === "sending"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "var(--accent-blue)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor:
                      sendStatus === "sending" ? "not-allowed" : "pointer",
                    opacity: sendStatus === "sending" ? 0.7 : 1,
                  }}
                >
                  <FiSend size={14} />{" "}
                  {sendStatus === "sending" ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 60px" }}
      >
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 16px",
              borderRadius: "999px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-card)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "20px",
            }}
          >
            <FiGlobe size={11} /> Ethiopian Space Science &amp; Geospatial
            Institute
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            <span style={{ color: "var(--accent-blue)" }}>
              Geodesy &amp; Geodynamics
            </span>
            <br />
            <span style={{ color: "var(--accent-orange)" }}>Department</span>
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              maxWidth: "680px",
              margin: "0 auto 36px",
            }}
          >
            Monitoring Earth's dynamic processes and natural hazards across
            Ethiopia using advanced satellite geodesy, InSAR, GPS, and remote
            sensing technologies.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "14px 24px",
                  borderRadius: "12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  textAlign: "center",
                  minWidth: "120px",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "var(--accent-orange)",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ──────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "48px",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={isActive ? "about-tab-active" : ""}
                style={{
                  padding: "9px 20px",
                  borderRadius: "9px",
                  border: isActive
                    ? "1.5px solid var(--accent-blue)"
                    : "1.5px solid var(--border-light)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  transition: "all 0.18s",
                  background: isActive
                    ? "var(--accent-blue)"
                    : "var(--bg-card)",
                  color:
                    activeTab === tab ? "#ffffff" : "var(--text-secondary)",
                  flexShrink: 0,
                  boxShadow: isActive
                    ? "0 2px 8px rgba(31,79,216,0.25)"
                    : "0 1px 3px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.color = "var(--accent-blue)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(31,79,216,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.06)";
                  }
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === "Overview" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "48px",
              }}
            >
              {[
                {
                  icon: "🎯",
                  title: "Mission",
                  color: "var(--accent-orange)",
                  text: "To monitor, analyze, and communicate geophysical hazards and Earth deformation across Ethiopia using state-of-the-art satellite geodesy, InSAR, GPS, and remote sensing — supporting disaster risk reduction and sustainable development.",
                },
                {
                  icon: "🔭",
                  title: "Vision",
                  color: "var(--accent-blue)",
                  text: "To be the leading center of excellence in geodetic research and near-real-time hazard monitoring in East Africa, bridging the gap between scientific observation and actionable disaster preparedness.",
                },
                {
                  icon: "🏛️",
                  title: "About SSGI",
                  color: "#10b981",
                  text: "SSGI is Ethiopia's premier institution for space science, geodesy, and geospatial research — coordinating satellite operations, Earth observation programs, and geoscience education across the Horn of Africa.",
                },
              ].map(({ icon, title, color, text }) => (
                <Card key={title}>
                  <div style={{ fontSize: "32px", marginBottom: "14px" }}>
                    {icon}
                  </div>
                  <h3
                    style={{
                      color,
                      marginBottom: "10px",
                      fontSize: "18px",
                      fontWeight: 700,
                      margin: "0 0 10px",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: 1.7,
                      margin: 0,
                      fontSize: "14px",
                    }}
                  >
                    {text}
                  </p>
                </Card>
              ))}
            </div>
            <SectionHeading
              label="Our Work"
              title="What We Do"
              subtitle="Six major research and monitoring domains covering Ethiopia's most critical natural hazards."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {ACTIVITIES.map(({ icon, title, desc }) => (
                <Card key={title} style={{ padding: "20px" }}>
                  <div style={{ fontSize: "26px", marginBottom: "10px" }}>
                    {icon}
                  </div>
                  <h4
                    style={{
                      color: "var(--accent-blue)",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: 700,
                      margin: "0 0 8px",
                    }}
                  >
                    {title}
                  </h4>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: 0,
                      fontSize: "13px",
                    }}
                  >
                    {desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── RESEARCH ─────────────────────────────────────────────────────── */}
        {activeTab === "Research" && (
          <div>
            <SectionHeading
              label="Research Areas"
              title="Active Research Programs"
              subtitle="Ongoing scientific programs using the latest satellite and geodetic technologies."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {[
                {
                  icon: <FiLayers size={22} />,
                  title: "InSAR Time Series Analysis",
                  tag: "Active",
                  desc: "Multi-temporal InSAR analysis of the Main Ethiopian Rift to detect slow ground deformation, magma intrusion, and fault creep at sub-centimeter precision.",
                  color: "#1f4fd8",
                },
                {
                  icon: <FiActivity size={22} />,
                  title: "GPS Velocity Field",
                  tag: "Active",
                  desc: "Maintaining a continuous GPS network across Ethiopia to derive the national velocity field and contribute to the AFREF African reference frame.",
                  color: "#f97316",
                },
                {
                  icon: <FiDatabase size={22} />,
                  title: "National Geospatial Database",
                  tag: "Ongoing",
                  desc: "Building Ethiopia's first open-access geospatial hazard database integrating satellite, GPS, and field data for use by researchers and policy makers.",
                  color: "#10b981",
                },
                {
                  icon: <FiRadio size={22} />,
                  title: "Early Warning System",
                  tag: "Development",
                  desc: "Developing automated alert pipelines using satellite data to provide near-real-time warnings for volcanic unrest, floods, and seismic events.",
                  color: "#a855f7",
                },
              ].map(({ icon, title, tag, desc, color }) => (
                <Card key={title}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: `${color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color,
                      }}
                    >
                      {icon}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: `${color}18`,
                        color,
                      }}
                    >
                      {tag}
                    </span>
                  </div>
                  <h3
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 700,
                      fontSize: "15px",
                      margin: "0 0 10px",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── PUBLICATIONS ─────────────────────────────────────────────────── */}
        {activeTab === "Publications" && (
          <div>
            <SectionHeading
              label="Academic Output"
              title="Publications & Reports"
              subtitle="Peer-reviewed articles, technical reports and conference proceedings from the department."
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {PUBLICATIONS.map((pub) => (
                <div
                  key={pub.title}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-start",
                    transition: "box-shadow 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(31,79,216,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: "52px",
                      height: "52px",
                      borderRadius: "10px",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "var(--accent-orange)",
                        lineHeight: 1,
                      }}
                    >
                      {pub.year}
                    </span>
                    <FiBookOpen
                      size={12}
                      style={{ color: "var(--text-muted)", marginTop: "3px" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "rgba(31,79,216,0.10)",
                          color: "var(--accent-blue)",
                        }}
                      >
                        {pub.type}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        {pub.journal}
                      </span>
                    </div>
                    <h4
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "14px",
                        margin: "0 0 4px",
                        lineHeight: 1.4,
                      }}
                    >
                      {pub.title}
                    </h4>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        margin: "0 0 8px",
                      }}
                    >
                      {pub.authors}
                    </p>
                    <a
                      href={pub.doi}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        color: "var(--accent-blue)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.textDecoration = "underline")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.textDecoration = "none")
                      }
                    >
                      View Publication <FiExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEAM ─────────────────────────────────────────────────────────── */}
        {activeTab === "Team" && (
          <div>
            <SectionHeading
              label="Our People"
              title="Research Team"
              subtitle={`Expert scientists and engineers dedicated to geodetic research and hazard monitoring.${dbResearchers.length > 0 ? ` Includes ${dbResearchers.length} registered researcher(s) from the platform.` : ""}`}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {allTeam.map(({ name, role, field, initials, dynamic }) => (
                <Card
                  key={name}
                  style={{
                    textAlign: "center",
                    padding: "28px 20px",
                    position: "relative",
                  }}
                >
                  {dynamic && (
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: "rgba(16,185,129,0.12)",
                        color: "#10b981",
                      }}
                    >
                      Platform
                    </span>
                  )}
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: dynamic
                        ? "linear-gradient(135deg,#10b981,#059669)"
                        : "linear-gradient(135deg,#1f4fd8,#00aaff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {initials}
                  </div>
                  <h3
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 700,
                      fontSize: "15px",
                      margin: "0 0 4px",
                    }}
                  >
                    {name}
                  </h3>
                  <p
                    style={{
                      color: "var(--accent-orange)",
                      fontSize: "12px",
                      fontWeight: 600,
                      margin: "0 0 8px",
                    }}
                  >
                    {role}
                  </p>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {field}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTACT ─────────────────────────────────────────────────────── */}
        {activeTab === "Contact" && (
          <div>
            <SectionHeading
              label="Get in Touch"
              title="Contact Information"
              subtitle="Reach out for research collaboration, data requests, or general inquiries."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              {[
                {
                  icon: FiMapPin,
                  label: "Address",
                  value:
                    "Ethiopian Space Science and Geospatial Institute (SSGI)\nAddis Ababa, Ethiopia",
                  color: "#1f4fd8",
                },
                {
                  icon: FiPhone,
                  label: "Phone",
                  value: "+251 (0) 11 XXX XXXX\n+251 (0) 11 XXX XXXX",
                  color: "#f97316",
                },
                {
                  icon: FiMail,
                  label: "Email",
                  value: "geodesy@ssgi.gov.et\ngeodynamics@ssgi.gov.et",
                  color: "#10b981",
                },
                {
                  icon: FiGlobe,
                  label: "Web Portal",
                  value:
                    "https://disaster.ssgi.gov.et\nNational Geospatial Portal",
                  color: "#a855f7",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label} style={{ padding: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: `${color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          margin: "0 0 6px",
                        }}
                      >
                        {label}
                      </p>
                      {value.split("\n").map((line, i) => (
                        <p
                          key={i}
                          style={{
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            margin: "0 0 2px",
                            lineHeight: 1.5,
                          }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
              <h3
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontSize: "18px",
                  margin: "0 0 10px",
                }}
              >
                Send Us a Message
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  margin: "0 0 24px",
                }}
              >
                Your message will be delivered directly to the Geodesy &amp;
                Geodynamics Department email inbox.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setShowContact(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "11px 24px",
                    borderRadius: "10px",
                    background: "var(--accent-blue)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <FiMail size={14} /> Send Email
                </button>
                <a
                  href="https://disaster.ssgi.gov.et/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "11px 24px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--border-color)",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  <FiGlobe size={14} /> Geoportal <FiExternalLink size={12} />
                </a>
              </div>
            </Card>
          </div>
        )}

        {/* ── CTA bottom bar — all inline colors, no CSS class overrides ──── */}
        <div
          style={{
            marginTop: "60px",
            padding: "28px 32px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #1f4fd8 0%, #1d4ed8 100%)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "12px",
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Ready to explore?
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Access our hazard monitoring dashboard
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              to="/hazards"
              onMouseEnter={handleButtonEnter}
              onMouseLeave={handleButtonLeave}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "9px",
                background: "#ffffff",
                color: "#1f4fd8",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "13px",
                transition:
                  "transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              Explore Hazards <FiArrowRight size={13} />
            </Link>
            <Link
              to="/research"
              className="research-cta-button"
              onMouseEnter={handleButtonEnter}
              onMouseLeave={handleButtonLeave}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "9px",
                border: "1.5px solid rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "13px",
                transition:
                  "transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              Research Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
