import React from "react";
import { Link } from "react-router-dom";

const HAZARDS = [
  {
    emoji: "🌍",
    title: "Earthquake",
    color: "#1f4fd8",
    border: "#1f4fd8",
    path: "/hazards/earthquake",
    desc: "Sudden ground shaking caused by tectonic plate movements. We monitor seismic activity to provide early warnings and assess structural vulnerabilities in high-risk zones.",
  },
  {
    emoji: "⛰️",
    title: "Landslide",
    color: "#d2691e",
    border: "#8b4513",
    path: "/hazards/landslide",
    desc: "Mass movement of rock, soil, and debris down slopes. Our research focuses on slope stability analysis and identifying areas prone to landslides during heavy rainfall.",
  },
  {
    emoji: "🌊",
    title: "Flood",
    color: "#4169e1",
    border: "#4169e1",
    path: "/hazards/flood",
    desc: "Overflow of water onto normally dry land. We track rainfall patterns, river levels, and flood-prone areas to help communities prepare and respond effectively.",
  },
  {
    emoji: "🌋",
    title: "Volcano",
    color: "#ff4500",
    border: "#ff4500",
    path: "/hazards/volcano",
    desc: "Eruption of molten rock, ash, and gases from beneath Earth's surface. We monitor volcanic activity, ground deformation, and gas emissions to predict potential eruptions.",
  },
  {
    emoji: "🔥",
    title: "Fire",
    color: "#ff6347",
    border: "#ff6347",
    path: "/hazards/fire",
    desc: "Uncontrolled burning of vegetation and forests. We use satellite imagery and weather data to detect fire hotspots and assess fire risk in vulnerable regions.",
  },
  {
    emoji: "☀️",
    title: "Drought",
    color: "#daa520",
    border: "#daa520",
    path: "/hazards/drought",
    desc: "Extended period of abnormally low rainfall leading to water shortage. We analyze precipitation trends and soil moisture to support agricultural planning and water resource management.",
  },
];

function Home() {
  return (
    <div
      style={{
        paddingTop: "120px",
        maxWidth: "1000px",
        margin: "0 auto",
        textAlign: "center",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <h2
        style={{ fontSize: "32px", marginBottom: "20px", fontWeight: "bold" }}
      >
        <span style={{ color: "#1f4fd8" }}>Welcome to the </span>
        <span style={{ color: "#1f4fd8" }}>Geodesy</span>
        <span style={{ color: "#f28c28" }}> & </span>
        <span style={{ color: "#1f4fd8" }}>Geodynamics</span>
        <span style={{ color: "#f28c28" }}> Department</span>
      </h2>

      <p
        style={{
          fontSize: "18px",
          lineHeight: "1.8",
          color: "var(--text-secondary)",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        The Department of Geodesy & Geodynamics focuses on studying the Earth's
        surface and dynamic processes affecting it. Our mission is to monitor
        natural hazards like landslides, volcanoes, floods, earthquakes, fires,
        and droughts, while conducting research to support sustainable
        development and disaster mitigation in Ethiopia.
      </p>

      <Link
        to="/research"
        style={{
          display: "inline-block",
          marginTop: "28px",
          padding: "12px 24px",
          borderRadius: "8px",
          border: "1px solid #1f4fd8",
          backgroundColor: "#1f4fd8",
          color: "#fff",
          textDecoration: "none",
          fontWeight: "600",
        }}
      >
        Research Portal
      </Link>

      <img
        src="https://images.unsplash.com/photo-1581090700227-1f1b4c86c9e1?auto=format&fit=crop&w=800&q=80"
        alt="Geodesy"
        style={{
          width: "80%",
          marginTop: "40px",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(255,255,255,0.15)",
        }}
      />

      <div style={{ marginTop: "60px", padding: "0 20px" }}>
        <h3
          style={{
            fontSize: "28px",
            marginBottom: "40px",
            color: "#f28c28",
            fontWeight: "bold",
          }}
        >
          Natural Hazards We Monitor
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "30px",
            marginBottom: "60px",
          }}
        >
          {HAZARDS.map((h) => (
            <Link key={h.title} to={h.path} style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: "var(--bg-card)",
                  padding: "25px",
                  borderRadius: "10px",
                  border: `2px solid ${h.border}`,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${h.border}44`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <h4
                  style={{
                    color: h.color,
                    fontSize: "22px",
                    marginBottom: "15px",
                  }}
                >
                  {h.emoji} {h.title}
                </h4>
                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {h.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* About section */}
      <div
        style={{
          padding: "60px 20px",
          borderTop: "1px solid var(--border-light)",
          textAlign: "center",
        }}
      >
        <h3
          style={{ fontSize: "26px", color: "#00aaff", marginBottom: "20px" }}
        >
          About the Department
        </h3>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            lineHeight: "1.8",
            maxWidth: "720px",
            margin: "0 auto 32px",
          }}
        >
          The Geodesy & Geodynamics Department, under the Ethiopian Space
          Science and Geospatial Institute (SSGI), uses satellite geodesy,
          InSAR, GPS, and remote sensing to monitor ground deformation and
          natural hazards — supporting disaster preparedness and sustainable
          development across Ethiopia.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "20px",
            maxWidth: "700px",
            margin: "0 auto 36px",
          }}
        >
          {[
            { num: "6", label: "Hazards Monitored" },
            { num: "25+", label: "Ethiopian Volcanoes" },
            { num: "Real-Time", label: "Fire Detection" },
            { num: "InSAR + GPS", label: "Geodetic Methods" },
          ].map(({ num, label }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-card)",
                borderRadius: "10px",
                border: "1px solid var(--border-light)",
                padding: "20px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#f28c28",
                  marginBottom: "6px",
                }}
              >
                {num}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/about"
          style={{
            display: "inline-block",
            padding: "11px 28px",
            borderRadius: "8px",
            border: "1px solid #00aaff",
            color: "#00aaff",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "14px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#00aaff";
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#00aaff";
          }}
        >
          Learn More →
        </Link>
      </div>
    </div>
  );
}

export default Home;
