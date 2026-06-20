import React from "react";
import { Link } from "react-router-dom";

const warningCards = [
  {
    title: "Hazard Signals",
    accent: "#1f4fd8",
    text: "Near real-time earthquake, fire, drought, flood, landslide, and volcano indicators are reviewed for unusual activity across Ethiopia.",
  },
  {
    title: "Risk Levels",
    accent: "#f28c28",
    text: "Alerts can be classified as advisory, watch, warning, or emergency based on event intensity, exposure, and expected impact.",
  },
  {
    title: "Response Guidance",
    accent: "#2e7d32",
    text: "Clear communication helps researchers, local authorities, and communities understand what is happening and what action may be needed.",
  },
];

const alertLevels = [
  { level: "Advisory", color: "#2e7d32", note: "Monitor conditions" },
  { level: "Watch", color: "#daa520", note: "Prepare for possible impact" },
  { level: "Warning", color: "#f28c28", note: "Take protective action" },
  { level: "Emergency", color: "#d32f2f", note: "Immediate response required" },
];

function EarlyWarning() {
  return (
    <main
      style={{
        padding: "120px 24px 80px",
        maxWidth: "1050px",
        margin: "0 auto",
        color: "var(--text-primary)",
      }}
    >
      <section style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1
          style={{
            fontSize: "36px",
            marginBottom: "14px",
            color: "var(--accent-blue)",
          }}
        >
          Early Warning
        </h1>
        <p
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            color: "var(--text-secondary)",
            lineHeight: 1.8,
            fontSize: "17px",
          }}
        >
          A coordinated space for tracking hazard indicators, reviewing risk
          levels, and supporting timely disaster preparedness decisions.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "44px",
        }}
      >
        {warningCards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderTop: `4px solid ${card.accent}`,
              borderRadius: "10px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                color: card.accent,
                fontSize: "19px",
                marginBottom: "10px",
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                margin: 0,
                fontSize: "14px",
              }}
            >
              {card.text}
            </p>
          </div>
        ))}
      </section>

      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "10px",
          padding: "28px",
          marginBottom: "36px",
        }}
      >
        <h2 style={{ color: "#f28c28", fontSize: "24px", marginBottom: "18px" }}>
          Alert Level Framework
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {alertLevels.map((item) => (
            <div
              key={item.level}
              style={{
                border: `1px solid ${item.color}`,
                borderRadius: "8px",
                padding: "16px",
                background: "var(--bg-card-alt)",
              }}
            >
              <div
                style={{
                  color: item.color,
                  fontWeight: "700",
                  fontSize: "16px",
                  marginBottom: "6px",
                }}
              >
                {item.level}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center" }}>
        <Link
          to="/hazards"
          style={{
            display: "inline-block",
            padding: "12px 26px",
            borderRadius: "8px",
            background: "#1f4fd8",
            color: "#fff",
            fontWeight: "700",
            textDecoration: "none",
          }}
        >
          View Hazard Monitoring
        </Link>
      </div>
    </main>
  );
}

export default EarlyWarning;
