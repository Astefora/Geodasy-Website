import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
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
  FiChevronRight,
  FiAward,
  FiTarget,
  FiEye,
  FiCrosshair,
  FiAlertTriangle,
  FiZap,
  FiWind,
  FiDroplet,
  FiShare2,
} from "react-icons/fi";

/* ─── Static data ────────────────────────────────────────────────────────────── */
const TABS = ["Overview", "Research", "Publications", "Team", "Contact"];

const ACTIVITIES = [
  {
    Icon: FiCrosshair,
    title: "Satellite Geodesy",
    desc: "InSAR and GPS measurements to track ground deformation at millimeter precision across volcanic, seismic, and landslide-prone zones.",
    accent: "#1f4fd8",
  },
  {
    Icon: FiActivity,
    title: "Volcano Monitoring",
    desc: "Continuous tracking of surface deformation at Ethiopian rift volcanoes using Sentinel-1 SAR data and COMET portal integration.",
    accent: "#ef4444",
  },
  {
    Icon: FiZap,
    title: "Earthquake Analysis",
    desc: "Real-time seismic monitoring and post-event analysis using USGS feeds and local ground truth data.",
    accent: "#f97316",
  },
  {
    Icon: FiAlertTriangle,
    title: "Fire Detection",
    desc: "Near-real-time fire hotspot detection using NASA FIRMS VIIRS data to track wildfires across Ethiopian landscapes.",
    accent: "#dc2626",
  },
  {
    Icon: FiDroplet,
    title: "Flood & Drought",
    desc: "Monitoring of land surface temperature, soil moisture and rainfall anomalies using MODIS and Sentinel satellites.",
    accent: "#0ea5e9",
  },
  {
    Icon: FiShare2,
    title: "Data Sharing",
    desc: "Publishing open datasets and peer-reviewed research through our LEO member portal to support national and international collaborations.",
    accent: "#10b981",
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

const MOCK_TEAM = [
  {
    name: "Dr. Yohannes Tadesse",
    role: "Head of Department",
    field: "Satellite Geodesy & InSAR",
    initials: "YT",
    gradient: "linear-gradient(135deg,#1f4fd8,#00aaff)",
  },
  {
    name: "Dr. Selamawit Bekele",
    role: "Senior Researcher",
    field: "Volcano Monitoring & Geodynamics",
    initials: "SB",
    gradient: "linear-gradient(135deg,#7c3aed,#a855f7)",
  },
  {
    name: "Engr. Abebe Worku",
    role: "Geodetic Engineer",
    field: "GPS Networks & Reference Frames",
    initials: "AW",
    gradient: "linear-gradient(135deg,#0891b2,#06b6d4)",
  },
  {
    name: "Dr. Tigist Haile",
    role: "Remote Sensing Specialist",
    field: "Flood & Drought Analysis",
    initials: "TH",
    gradient: "linear-gradient(135deg,#0369a1,#0ea5e9)",
  },
  {
    name: "Engr. Dawit Girma",
    role: "Data Systems Engineer",
    field: "GIS & Spatial Data Infrastructure",
    initials: "DG",
    gradient: "linear-gradient(135deg,#059669,#10b981)",
  },
  {
    name: "Dr. Meseret Alemu",
    role: "Researcher",
    field: "Earthquake Seismology",
    initials: "MA",
    gradient: "linear-gradient(135deg,#b45309,#f97316)",
  },
];

const STATS = [
  { value: "25+", label: "Active Volcanoes", sub: "Monitored" },
  { value: "6", label: "Hazard Domains", sub: "Covered" },
  { value: "15+", label: "Publications", sub: "Peer-reviewed" },
  { value: "10+", label: "Years", sub: "of Research" },
];

/* ─── Research badge colors ─────────────────────────────────────────────────── */
const TAG_STYLES = {
  Active: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  Ongoing: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  Development: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
};

/* ─── GlassCard ──────────────────────────────────────────────────────────────── */
function GlassCard({ children, style = {}, accent = "rgba(31,79,216,0.15)" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="about-glass-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: hovered
          ? "1px solid rgba(31,79,216,0.32)"
          : "1px solid var(--border-light)",
        borderRadius: "18px",
        padding: "26px",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.28s, transform 0.28s, border-color 0.28s",
        boxShadow: hovered
          ? `0 20px 50px ${accent}, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 1px 6px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        ...style,
      }}
    >
      {/* top-highlight shimmer line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: "1px",
          background:
            "linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

/* ─── SectionLabel ───────────────────────────────────────────────────────────── */
function SectionLabel({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      {label && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px 4px 8px",
            borderRadius: "999px",
            background: "rgba(242,140,40,0.10)",
            border: "1px solid rgba(242,140,40,0.22)",
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent-orange,#f97316)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "var(--accent-orange,#f97316)",
            }}
          >
            {label}
          </span>
        </div>
      )}
      <h2
        style={{
          fontSize: "clamp(1.45rem,2.4vw,1.95rem)",
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
            fontSize: "14.5px",
            lineHeight: 1.72,
            margin: 0,
            maxWidth: "580px",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── Section panel wrapper ─────────────────────────────────────────────────── */
function Section({ children }) {
  return (
    <div className="about-tab-panel" style={{ padding: "32px 28px" }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════════ */
export default function About() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [entered, setEntered] = useState(false);

  /* Contact modal */
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sendStatus, setSendStatus] = useState("idle");
  const [sendError, setSendError] = useState("");

  /* Fade-in on mount */
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  /* Lock body scroll when contact modal is open */
  useEffect(() => {
    if (showContact) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showContact]);

  /* Dynamic researchers */
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
      gradient: "linear-gradient(135deg,#10b981,#059669)",
      dynamic: true,
    })),
  ];

  /* Contact send */
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
      }, 3200);
    } catch (err) {
      setSendError(err.message);
      setSendStatus("error");
    }
  };

  /* CTA button hover helpers */
  const onExploreEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.22)";
  };
  const onExploreLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
  };
  const onResearchEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.background = "rgba(255,255,255,0.16)";
    e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.15)";
  };
  const onResearchLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "96px",
        paddingBottom: "32px",
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
      }}
    >
      {/* ── Contact modal ────────────────────────────────────────────────── */}
      {showContact
        ? createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                background: "rgba(0,0,0,0.60)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                overflowY: "auto",
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowContact(false);
              }}
            >
              <div
                style={{
                  position: "relative",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "22px",
                  padding: "24px 20px",
                  width: "100%",
                  maxWidth: "496px",
                  maxHeight: "90dvh",
                  overflowY: "auto",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
                  margin: "auto",
                }}
              >
                {/* Modal header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "26px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "9px",
                          background: "rgba(31,79,216,0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FiMail size={15} style={{ color: "#1f4fd8" }} />
                      </div>
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
                    </div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "12.5px",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Delivered directly to the department email inbox.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowContact(false)}
                    style={{
                      background: "var(--bg-card-alt,rgba(0,0,0,0.04))",
                      border: "1px solid var(--border-light)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FiX size={15} />
                  </button>
                </div>

                {sendStatus === "sent" ? (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "rgba(16,185,129,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        fontSize: "30px",
                      }}
                    >
                      ✅
                    </div>
                    <p
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "17px",
                        margin: "0 0 6px",
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
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
                        gap: "10px",
                      }}
                    >
                      {[
                        {
                          key: "name",
                          placeholder: "Your name",
                          type: "text",
                          required: true,
                        },
                        {
                          key: "email",
                          placeholder: "Email address",
                          type: "email",
                          required: true,
                        },
                      ].map(({ key, placeholder, type, required }) => (
                        <input
                          key={key}
                          required={required}
                          type={type}
                          placeholder={placeholder}
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                          style={{
                            padding: "10px 13px",
                            borderRadius: "10px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-input)",
                            color: "var(--text-primary)",
                            fontSize: "13px",
                            outline: "none",
                            transition: "border-color 0.18s",
                          }}
                        />
                      ))}
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
                      <p
                        style={{
                          color: "#ef4444",
                          fontSize: "12px",
                          margin: 0,
                        }}
                      >
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
                        borderRadius: "11px",
                        background: "linear-gradient(135deg,#1f4fd8,#3b82f6)",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor:
                          sendStatus === "sending" ? "not-allowed" : "pointer",
                        opacity: sendStatus === "sending" ? 0.7 : 1,
                        transition: "opacity 0.18s",
                      }}
                    >
                      <FiSend size={14} />
                      {sendStatus === "sending" ? "Sending…" : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ── Page wrapper ─────────────────────────────────────────────────── */}
      <div
        style={{ maxWidth: "100%", margin: "0 auto", padding: "0 24px 72px" }}
      >
        {/* ════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          {/* Institute badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 20px 6px 10px",
              borderRadius: "999px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-card)",
              marginBottom: "26px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#1f4fd8,#00aaff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FiGlobe size={12} style={{ color: "#ffffff" }} />
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.11em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Ethiopian Space Science &amp; Geospatial Institute
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(2.1rem,4.2vw,3.2rem)",
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            <span style={{ color: "var(--accent-blue)" }}>
              Geodesy &amp; Geodynamics
            </span>
          </h1>
          <h2
            style={{
              fontSize: "clamp(1.3rem,2.8vw,2rem)",
              fontWeight: 700,
              color: "var(--accent-orange)",
              margin: "0 0 20px",
              letterSpacing: "-0.01em",
            }}
          >
            Department
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "16px",
              color: "var(--text-secondary)",
              lineHeight: 1.82,
              maxWidth: "660px",
              margin: "0 auto 52px",
            }}
          >
            Monitoring Earth's dynamic processes and natural hazards across
            Ethiopia using advanced satellite geodesy, InSAR, GPS, and remote
            sensing technologies.
          </p>

          {/* Stats — premium metric cards */}
          <div
            className="about-stats-grid"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "14px",
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "18px 26px",
                  borderRadius: "16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  textAlign: "center",
                  minWidth: "126px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  animation: `fadeSlideUp 0.5s ease ${0.1 + i * 0.08}s both`,
                }}
              >
                {/* Accent top bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background:
                      i % 2 === 0
                        ? "linear-gradient(90deg,#1f4fd8,#00aaff)"
                        : "linear-gradient(90deg,#f97316,#f59e0b)",
                    borderRadius: "16px 16px 0 0",
                  }}
                />
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 900,
                    color:
                      i % 2 === 0
                        ? "var(--accent-blue)"
                        : "var(--accent-orange)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    lineHeight: 1.3,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TABS
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="about-tab-bar"
          style={{
            display: "flex",
            gap: "4px",
            padding: "5px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
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
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: isActive
                    ? "1.5px solid var(--accent-blue)"
                    : "1.5px solid transparent",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  background: isActive ? "var(--accent-blue)" : "transparent",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  boxShadow: isActive
                    ? "0 3px 10px rgba(31,79,216,0.28)"
                    : "none",
                  letterSpacing: isActive ? "0" : "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(31,79,216,0.07)";
                    e.currentTarget.style.color = "var(--accent-blue)";
                    e.currentTarget.style.borderColor = "rgba(31,79,216,0.20)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "Overview" && (
          <Section>
            {/* Mission / Vision / SSGI cards */}
            <div
              className="about-mvv-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(276px,1fr))",
                gap: "20px",
                marginBottom: "52px",
              }}
            >
              {[
                {
                  Icon: FiTarget,
                  iconBg: "rgba(31,79,216,0.12)",
                  iconColor: "#1f4fd8",
                  title: "Mission",
                  titleColor: "#1f4fd8",
                  text: "To monitor, analyze, and communicate geophysical hazards and Earth deformation across Ethiopia using state-of-the-art satellite geodesy, InSAR, GPS, and remote sensing — supporting disaster risk reduction and sustainable development.",
                },
                {
                  Icon: FiEye,
                  iconBg: "rgba(249,115,22,0.12)",
                  iconColor: "#f97316",
                  title: "Vision",
                  titleColor: "#f97316",
                  text: "To be the leading center of excellence in geodetic research and near-real-time hazard monitoring in East Africa, bridging the gap between scientific observation and actionable disaster preparedness.",
                },
                {
                  Icon: FiAward,
                  iconBg: "rgba(16,185,129,0.12)",
                  iconColor: "#10b981",
                  title: "About SSGI",
                  titleColor: "#10b981",
                  text: "SSGI is Ethiopia's premier institution for space science, geodesy, and geospatial research — coordinating satellite operations, Earth observation programs, and geoscience education across the Horn of Africa.",
                },
              ].map(({ Icon, iconBg, iconColor, title, titleColor, text }) => (
                <GlassCard key={title}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <Icon size={22} style={{ color: iconColor }} />
                  </div>
                  <h3
                    style={{
                      color: titleColor,
                      fontWeight: 800,
                      fontSize: "17px",
                      margin: "0 0 12px",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: 1.74,
                      margin: 0,
                      fontSize: "13.5px",
                    }}
                  >
                    {text}
                  </p>
                </GlassCard>
              ))}
            </div>

            {/* What We Do */}
            <SectionLabel
              label="Our Work"
              title="What We Do"
              subtitle="Six core research and monitoring domains covering Ethiopia's most critical natural hazards."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(236px,1fr))",
                gap: "16px",
              }}
            >
              {ACTIVITIES.map(({ Icon: ActivityIcon, title, desc, accent }) => (
                <GlassCard
                  key={title}
                  accent={`${accent}25`}
                  style={{ padding: "22px" }}
                >
                  {/* Accent left stripe */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "20%",
                      bottom: "20%",
                      width: "3px",
                      borderRadius: "0 3px 3px 0",
                      background: accent,
                    }}
                  />
                  {/* Icon in styled box */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: `${accent}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <ActivityIcon size={20} style={{ color: accent }} />
                  </div>
                  <h4
                    style={{
                      color: accent,
                      fontWeight: 700,
                      fontSize: "14px",
                      margin: "0 0 8px",
                    }}
                  >
                    {title}
                  </h4>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: 1.65,
                      margin: 0,
                      fontSize: "13px",
                    }}
                  >
                    {desc}
                  </p>
                </GlassCard>
              ))}
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            RESEARCH TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "Research" && (
          <Section>
            <SectionLabel
              label="Research Areas"
              title="Active Research Programs"
              subtitle="Ongoing scientific programs using the latest satellite and geodetic technologies."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  Icon: FiLayers,
                  title: "InSAR Time Series Analysis",
                  tag: "Active",
                  desc: "Multi-temporal InSAR analysis of the Main Ethiopian Rift to detect slow ground deformation, magma intrusion, and fault creep at sub-centimeter precision.",
                  color: "#1f4fd8",
                },
                {
                  Icon: FiActivity,
                  title: "GPS Velocity Field",
                  tag: "Active",
                  desc: "Maintaining a continuous GPS network across Ethiopia to derive the national velocity field and contribute to the AFREF African reference frame.",
                  color: "#f97316",
                },
                {
                  Icon: FiDatabase,
                  title: "National Geospatial Database",
                  tag: "Ongoing",
                  desc: "Building Ethiopia's first open-access geospatial hazard database integrating satellite, GPS, and field data for use by researchers and policy makers.",
                  color: "#3b82f6",
                },
                {
                  Icon: FiRadio,
                  title: "Early Warning System",
                  tag: "Development",
                  desc: "Developing automated alert pipelines using satellite data to provide near-real-time warnings for volcanic unrest, floods, and seismic events.",
                  color: "#f59e0b",
                },
              ].map(({ Icon, title, tag, desc, color }) => {
                const badge = TAG_STYLES[tag] || TAG_STYLES["Ongoing"];
                return (
                  <GlassCard key={title} accent={`${color}20`}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "11px",
                          background: `${color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={18} style={{ color }} />
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: badge.bg,
                          color: badge.color,
                          letterSpacing: "0.04em",
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
                        margin: "0 0 8px",
                        lineHeight: 1.3,
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {desc}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PUBLICATIONS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "Publications" && (
          <Section>
            <SectionLabel
              label="Academic Output"
              title="Publications & Reports"
              subtitle="Peer-reviewed articles, technical reports and conference proceedings from the department."
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "13px" }}
            >
              {PUBLICATIONS.map((pub) => {
                const isReport = pub.type === "Technical Report";
                return <PubRow key={pub.title} pub={pub} isReport={isReport} />;
              })}
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TEAM TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "Team" && (
          <Section>
            <SectionLabel
              label="Our People"
              title="Research Team"
              subtitle={`Expert scientists and engineers dedicated to geodetic research and hazard monitoring.${dbResearchers.length > 0 ? ` Includes ${dbResearchers.length} registered researcher(s) from the platform.` : ""}`}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(234px, 100%), 1fr))",
                gap: "16px",
              }}
            >
              {allTeam.map(
                ({ name, role, field, initials, gradient, dynamic }) => (
                  <GlassCard
                    key={name}
                    style={{
                      textAlign: "center",
                      padding: "22px 18px",
                      position: "relative",
                    }}
                    accent={
                      dynamic ? "rgba(16,185,129,0.15)" : "rgba(31,79,216,0.15)"
                    }
                  >
                    {dynamic && (
                      <span
                        style={{
                          position: "absolute",
                          top: "13px",
                          right: "13px",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "rgba(16,185,129,0.12)",
                          color: "#10b981",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Platform
                      </span>
                    )}
                    {/* Avatar */}
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background:
                          gradient || "linear-gradient(135deg,#1f4fd8,#00aaff)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px",
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {initials}
                    </div>
                    <h3
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: "14px",
                        margin: "0 0 4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {name}
                    </h3>
                    <p
                      style={{
                        color: "var(--accent-orange)",
                        fontSize: "11px",
                        fontWeight: 700,
                        margin: "0 0 6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {role}
                    </p>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "11.5px",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {field}
                    </p>
                  </GlassCard>
                ),
              )}
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CONTACT TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "Contact" && (
          <Section>
            <SectionLabel
              label="Get in Touch"
              title="Contact Information"
              subtitle="Reach out for research collaboration, data requests, or general inquiries."
            />

            {/* Contact info cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(296px, 100%), 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {[
                {
                  Icon: FiMapPin,
                  label: "Address",
                  lines: [
                    "Ethiopian Space Science and Geospatial Institute (SSGI)",
                    "Addis Ababa, Ethiopia",
                  ],
                  color: "#1f4fd8",
                  iconBg: "rgba(31,79,216,0.11)",
                },
                {
                  Icon: FiPhone,
                  label: "Phone",
                  lines: ["+251 (0) 11 XXX XXXX", "+251 (0) 11 XXX XXXX"],
                  color: "#f97316",
                  iconBg: "rgba(249,115,22,0.11)",
                },
                {
                  Icon: FiMail,
                  label: "Email",
                  lines: ["geodesy@ssgi.gov.et", "geodynamics@ssgi.gov.et"],
                  color: "#10b981",
                  iconBg: "rgba(16,185,129,0.11)",
                },
                {
                  Icon: FiGlobe,
                  label: "Web Portal",
                  lines: [
                    "https://disaster.ssgi.gov.et",
                    "National Geospatial Portal",
                  ],
                  color: "#a855f7",
                  iconBg: "rgba(168,85,247,0.11)",
                },
              ].map(({ Icon, label, lines, color, iconBg }) => (
                <GlassCard
                  key={label}
                  accent={`${color}20`}
                  style={{ padding: "14px 16px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 800,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.11em",
                          margin: "0 0 4px",
                        }}
                      >
                        {label}
                      </p>
                      {lines.map((line, i) => (
                        <p
                          key={i}
                          style={{
                            color: "var(--text-primary)",
                            fontSize: "12.5px",
                            margin: "0 0 1px",
                            lineHeight: 1.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Send message CTA card */}
            <GlassCard style={{ padding: "36px", textAlign: "center" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(31,79,216,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  fontSize: "28px",
                }}
              >
                📬
              </div>
              <h3
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 800,
                  fontSize: "19px",
                  margin: "0 0 10px",
                }}
              >
                Send Us a Message
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.75,
                  margin: "0 0 26px",
                  maxWidth: "440px",
                  marginLeft: "auto",
                  marginRight: "auto",
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
                    gap: "8px",
                    padding: "12px 26px",
                    borderRadius: "11px",
                    background: "linear-gradient(135deg,#1f4fd8,#3b82f6)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "opacity 0.18s, transform 0.18s",
                    boxShadow: "0 4px 14px rgba(31,79,216,0.30)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FiMail size={15} style={{ color: "#ffffff" }} />
                  <span style={{ color: "#ffffff" }}>Send Email</span>
                </button>
                <a
                  href="https://disaster.ssgi.gov.et/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 26px",
                    borderRadius: "11px",
                    border: "1.5px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                    transition: "border-color 0.18s, transform 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FiGlobe size={15} />
                  Geoportal
                  <FiExternalLink size={12} />
                </a>
              </div>
            </GlassCard>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CTA BAR
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="about-cta-bar"
          style={{
            marginTop: "64px",
            padding: "36px 40px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg,#1a3fc4 0%,#1f4fd8 45%,#2563eb 100%)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(31,79,216,0.32)",
          }}
        >
          {/* subtle grid-dot pattern overlay */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px,transparent 1px)",
              backgroundSize: "22px 22px",
              pointerEvents: "none",
            }}
          />
          {/* corner glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }}
          />

          {/* Text */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "11.5px",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              Ready to explore?
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "clamp(1rem,2vw,1.25rem)",
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              Access our hazard monitoring dashboard
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              Satellite data · Real-time alerts · Open research
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <button
              onClick={() => {
                sessionStorage.setItem("scrollTo", "hazards");
                navigate("/");
              }}
              className="about-cta-explore"
              onMouseEnter={onExploreEnter}
              onMouseLeave={onExploreLeave}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "11px 22px",
                borderRadius: "11px",
                background: "#ffffff",
                color: "#1f4fd8",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13.5px",
                transition: "transform 0.22s ease, box-shadow 0.22s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                letterSpacing: "0.01em",
              }}
            >
              Explore Hazards
              <FiArrowRight size={14} style={{ color: "#1f4fd8" }} />
            </button>
            <Link
              to="/research"
              className="research-cta-button"
              onMouseEnter={onResearchEnter}
              onMouseLeave={onResearchLeave}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "11px 22px",
                borderRadius: "11px",
                border: "1.5px solid rgba(255,255,255,0.50)",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "13.5px",
                transition:
                  "transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease",
                letterSpacing: "0.01em",
              }}
            >
              Research Portal
              <FiChevronRight size={14} style={{ color: "#ffffff" }} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Keyframe styles ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── PubRow: extracted to avoid inline heap inside map ─────────────────────── */
function PubRow({ pub }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-card)",
        border: hovered
          ? "1px solid var(--accent-blue)"
          : "1px solid var(--border-light)",
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        transition: "box-shadow 0.22s, border-color 0.22s, transform 0.22s",
        boxShadow: hovered
          ? "0 6px 20px rgba(31,79,216,0.10)"
          : "0 1px 4px rgba(0,0,0,0.03)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* left accent line on hover */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: hovered
            ? "linear-gradient(180deg,#1f4fd8,#00aaff)"
            : "transparent",
          borderRadius: "14px 0 0 14px",
          transition: "background 0.22s",
        }}
      />

      {/* Year badge — compact */}
      <div
        style={{
          flexShrink: 0,
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: "rgba(249,115,22,0.09)",
          border: "1px solid rgba(249,115,22,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            color: "var(--accent-orange)",
            lineHeight: 1,
          }}
        >
          {pub.year}
        </span>
        <FiBookOpen size={11} style={{ color: "var(--text-muted)" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type + Journal on one row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
            marginBottom: "5px",
          }}
        >
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "999px",
              background: "rgba(31,79,216,0.09)",
              color: "var(--accent-blue)",
              letterSpacing: "0.04em",
            }}
          >
            {pub.type}
          </span>
          <span
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            {pub.journal}
          </span>
        </div>

        {/* Title — smaller on mobile */}
        <h4
          style={{
            color: "var(--text-primary)",
            fontWeight: 700,
            fontSize: "13.5px",
            margin: "0 0 4px",
            lineHeight: 1.4,
          }}
        >
          {pub.title}
        </h4>

        {/* Authors */}
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "11.5px",
            margin: "0 0 7px",
            lineHeight: 1.4,
          }}
        >
          {pub.authors}
        </p>

        {/* View link */}
        <a
          href={pub.doi}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11.5px",
            color: "var(--accent-blue)",
            textDecoration: "none",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          View Publication <FiExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
