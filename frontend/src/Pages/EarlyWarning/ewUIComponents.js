import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../ThemeContext";
import {
  FiArrowRight,
  FiShield,
  FiRefreshCw,
  FiMapPin,
  FiLayers,
  FiAlertTriangle,
  FiBell,
  FiMail,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiPhone,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { ETHIOPIA_REGIONS, HAZARD_ICONS } from "./ewData";

export function RegionDropdown({ activeRegion, onSelect }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <select
        value={activeRegion || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "8px",
          padding: "5px 10px",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-primary)",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="">🗺️ Zoom to Region (All Ethiopia)</option>
        {ETHIOPIA_REGIONS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} — {r.risk} ({r.activeHazards} hazards)
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Overall Risk Banner Component ────────────────────────────────────────── */
export function OverallRiskBanner({
  isDark,
  quakes,
  fires,
  floods,
  volcs,
  droughts,
  landslides,
}) {
  return (
    <div
      className="ew-risk-banner"
      style={{
        background: isDark
          ? "linear-gradient(135deg, rgba(220,38,38,0.24) 0%, rgba(185,28,28,0.18) 50%, rgba(127,29,29,0.14) 100%)"
          : "linear-gradient(135deg, rgba(254,226,226,0.92) 0%, rgba(254,242,242,0.95) 50%, rgba(255,237,213,0.80) 100%)",
        border: isDark
          ? "1.5px solid rgba(239,68,68,0.45)"
          : "1.5px solid rgba(239,68,68,0.35)",
        borderLeft: "6px solid #ef4444",
        borderRadius: "18px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: isDark
          ? "0 6px 24px rgba(239,68,68,0.18)"
          : "0 4px 20px rgba(239,68,68,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: isDark
                ? "rgba(239,68,68,0.28)"
                : "rgba(239,68,68,0.16)",
              border: "1.5px solid rgba(239,68,68,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FiAlertTriangle
              size={20}
              style={{ color: isDark ? "#f87171" : "#ef4444" }}
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                className="ew-risk-banner-title"
                style={{
                  fontSize: "14px",
                  fontWeight: 900,
                  color: isDark ? "#f87171" : "#dc2626",
                  letterSpacing: "0.02em",
                }}
              >
                NATIONAL MULTI-HAZARD RISK STATUS: HIGH ALERT
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: "#ef4444",
                  color: "#ffffff",
                  letterSpacing: "0.05em",
                  boxShadow: "0 2px 6px rgba(239,68,68,0.35)",
                }}
              >
                LEVEL 3
              </span>
            </div>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12.5px",
                fontWeight: 500,
                color: isDark ? "#f1f5f9" : "#334155",
                lineHeight: 1.45,
              }}
            >
              Active hydrometeorological deficit in southeastern rangelands
              &amp; localized tectonic rifting in Afar and MER escarpments.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <span
            className="ew-risk-pill"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDark
                ? "rgba(249,115,22,0.22)"
                : "rgba(249,115,22,0.12)",
              border: isDark
                ? "1px solid rgba(249,115,22,0.45)"
                : "1px solid rgba(249,115,22,0.3)",
              color: isDark ? "#fb923c" : "#ea580c",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <img
              src={HAZARD_ICONS.fire}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
            {fires} Fires
          </span>
          <span
            className="ew-risk-pill"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDark
                ? "rgba(234,179,8,0.22)"
                : "rgba(234,179,8,0.12)",
              border: isDark
                ? "1px solid rgba(234,179,8,0.45)"
                : "1px solid rgba(234,179,8,0.3)",
              color: isDark ? "#facc15" : "#ca8a04",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <img
              src={HAZARD_ICONS.earthquake}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
            {quakes} Quakes
          </span>
          <span
            className="ew-risk-pill"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDark
                ? "rgba(59,130,246,0.22)"
                : "rgba(59,130,246,0.12)",
              border: isDark
                ? "1px solid rgba(59,130,246,0.45)"
                : "1px solid rgba(59,130,246,0.3)",
              color: isDark ? "#60a5fa" : "#2563eb",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <img
              src={HAZARD_ICONS.flood}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
            {floods} Basins
          </span>
          <span
            className="ew-risk-pill"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDark
                ? "rgba(239,68,68,0.22)"
                : "rgba(239,68,68,0.12)",
              border: isDark
                ? "1px solid rgba(239,68,68,0.45)"
                : "1px solid rgba(239,68,68,0.3)",
              color: isDark ? "#f87171" : "#dc2626",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <img
              src={HAZARD_ICONS.volcano}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
            {volcs} Volcanoes
          </span>
          <span
            className="ew-risk-pill"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDark
                ? "rgba(245,158,11,0.22)"
                : "rgba(245,158,11,0.12)",
              border: isDark
                ? "1px solid rgba(245,158,11,0.45)"
                : "1px solid rgba(245,158,11,0.3)",
              color: isDark ? "#fbbf24" : "#d97706",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <img
              src={HAZARD_ICONS.drought}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
            {droughts} Droughts
          </span>
          <span
            className="ew-risk-pill"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "8px",
              background: isDark
                ? "rgba(167,139,250,0.22)"
                : "rgba(167,139,250,0.12)",
              border: isDark
                ? "1px solid rgba(167,139,250,0.45)"
                : "1px solid rgba(167,139,250,0.3)",
              color: isDark ? "#c4b5fd" : "#7c3aed",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <img
              src={HAZARD_ICONS.landslide}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
            {landslides} Slopes
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── What To Do Component (Restored at Bottom) ────────────────────────────── */
export function WhatToDoSection() {
  const [activeTab, setActiveTab] = useState("protocols");

  const alertFramework = [
    {
      level: "Advisory",
      color: "#22c55e",
      badge: "Normal to Low",
      icon: "🟢",
      actions: [
        "Monitor local DRMC bulletins and weather updates.",
        "Check basic emergency supplies and water provisions.",
        "Keep mobile phones and emergency battery radios charged.",
      ],
    },
    {
      level: "Watch",
      color: "#eab308",
      badge: "Elevated Risk",
      icon: "🟡",
      actions: [
        "Review household and community evacuation routes.",
        "Secure lightweight structures, roofs, and livestock.",
        "Clear drainage ditches around homes and agricultural plots.",
      ],
    },
    {
      level: "Warning",
      color: "#f97316",
      badge: "High Threat",
      icon: "🟠",
      actions: [
        "Avoid riverbanks, steep saturated slopes, and dry riverbeds.",
        "Stage critical documents and medical kits for rapid transit.",
        "Prepare vulnerable family members for relocation to safe zones.",
      ],
    },
    {
      level: "Emergency",
      color: "#ef4444",
      badge: "Immediate Threat",
      icon: "🔴",
      actions: [
        "Evacuate designated danger zones immediately upon official order.",
        "Move to elevated safe shelters away from flood & landslide paths.",
        "Report trapped individuals to EDRMC/Civil Protection hotlines.",
      ],
    },
  ];

  const emergencyContacts = [
    {
      title: "EDRMC National Emergency Hotline",
      number: "8335",
      note: "Toll-Free 24/7 Disaster Response Dispatch",
      icon: "🚨",
    },
    {
      title: "Ethiopian Red Cross Society (ERCS)",
      number: "+251 11 515 9074",
      note: "Search, Rescue & First Aid Relief",
      icon: "🏥",
    },
    {
      title: "Fire & Emergency Prevention Agency",
      number: "939",
      note: "Urban Fires & Structural Emergencies",
      icon: "🚒",
    },
    {
      title: "National Meteorological Institute",
      number: "+251 11 661 5779",
      note: "Hydrometeorological Advisory",
      icon: "🌦️",
    },
  ];

  const hazardGuides = [
    {
      id: "earthquake",
      label: "Earthquake",
      icon: "/icons/icons8-earthquake-64.png",
      steps:
        "Drop, Cover, and Hold On. Stay clear of masonry walls and unreinforced structures.",
    },
    {
      id: "flood",
      label: "Flood",
      icon: "/icons/icons8-flood-64.png",
      steps:
        "Move immediately to higher ground. Never attempt to drive or walk through moving floodwaters.",
    },
    {
      id: "fire",
      label: "Wildfire",
      icon: "/icons/icons8-fire-96.png",
      steps:
        "Create 10m fuel breaks around dwellings. Evacuate uphill and upwind from advancing firelines.",
    },
    {
      id: "landslide",
      label: "Landslide",
      icon: "/icons/icons8-landslide-96.png",
      steps:
        "Watch for rapid spring flow, soil cracking, or tilting trees on steep slopes. Evacuate promptly.",
    },
    {
      id: "drought",
      label: "Drought",
      icon: "/icons/icons8-drought-64.png",
      steps:
        "Implement water rationing, preserve strategic pasture reserves, and register for feed subsidies.",
    },
    {
      id: "volcano",
      label: "Volcano",
      icon: "/icons/icons8-volcano-96.png",
      steps:
        "Wear dust masks to prevent ash inhalation. Evacuate low valleys prone to pyroclastic flows.",
    },
  ];

  return (
    <div
      className="ew-what-to-do"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "22px",
        overflow: "hidden",
        marginBottom: "32px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: "20px 24px 0",
          borderBottom: "1px solid var(--border-light)",
          background:
            "linear-gradient(to bottom, rgba(34,197,94,0.03), var(--bg-card))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#16a34a",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              Emergency Guidance
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              What To Do During Alerts
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Actionable protocols for each hazard level
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "var(--bg-card-alt, rgba(0,0,0,0.04))",
              border: "1px solid var(--border-light)",
              borderRadius: "12px",
              padding: "4px",
              flexShrink: 0,
            }}
          >
            {[
              { key: "protocols", label: "Protocols", color: "#16a34a" },
              { key: "guides", label: "Guides", color: "#0284c7" },
              { key: "contacts", label: "Hotlines", color: "#ef4444" },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  background: activeTab === key ? color : "transparent",
                  color: activeTab === key ? "#ffffff" : "var(--text-muted)",
                  boxShadow:
                    activeTab === key ? "0 2px 8px " + color + "44" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px 24px" }}>
        {activeTab === "protocols" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            {alertFramework.map((card) => (
              <div
                key={card.level}
                style={{
                  background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                  border: "1.5px solid " + card.color + "30",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: "4px",
                    background:
                      "linear-gradient(90deg, " +
                      card.color +
                      ", " +
                      card.color +
                      "88)",
                  }}
                />
                <div style={{ padding: "14px 16px", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{card.icon}</span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: card.color,
                        }}
                      >
                        {card.level}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: card.color + "14",
                        border: "1px solid " + card.color + "35",
                        color: card.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "15px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {card.actions.map((act, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: "12.5px",
                          color: "var(--text-secondary)",
                          lineHeight: "1.5",
                        }}
                      >
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "guides" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {hazardGuides.map((g) => (
              <div
                key={g.id}
                style={{
                  background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                  border: "1px solid var(--border-light)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={g.icon}
                    alt={g.label}
                    width={24}
                    height={24}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      marginBottom: "5px",
                    }}
                  >
                    {g.label}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11.5px",
                      color: "var(--text-secondary)",
                      lineHeight: "1.55",
                    }}
                  >
                    {g.steps}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "contacts" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
            }}
          >
            {emergencyContacts.map((c, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                  border: "1.5px solid rgba(239,68,68,0.20)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(239,68,68,0.10)",
                    border: "1.5px solid rgba(239,68,68,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "22px",
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: "3px",
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 900,
                      color: "#ef4444",
                      letterSpacing: "0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    {c.number}
                  </div>
                  <div
                    style={{
                      fontSize: "10.5px",
                      color: "var(--text-secondary)",
                      marginTop: "2px",
                      lineHeight: 1.4,
                    }}
                  >
                    {c.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Logged in user reader helper ─────────────────────────────────────────── */
