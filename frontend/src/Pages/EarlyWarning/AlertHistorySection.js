import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../ThemeContext";
import {
  FiArrowRight, FiShield, FiRefreshCw, FiMapPin, FiLayers, FiAlertTriangle,
  FiBell, FiMail, FiSend, FiClock, FiCheckCircle, FiSearch, FiPhone, FiCheck, FiX,
} from "react-icons/fi";
export function getLoggedInUser() {
  let userObj = null;
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && typeof u === "object") userObj = u;
    }
  } catch {}

  const email = userObj?.email || localStorage.getItem("email") || "";
  const phone = userObj?.phone || localStorage.getItem("phone") || "";
  const fullName =
    userObj?.fullName ||
    localStorage.getItem("fullName") ||
    localStorage.getItem("username") ||
    "";
  const username =
    userObj?.username || localStorage.getItem("username") || fullName;
  const role =
    userObj?.role ||
    localStorage.getItem("role") ||
    (email.toLowerCase().includes("admin") ? "admin" : "member");
  const isAdmin =
    role === "admin" ||
    (email && email.toLowerCase().includes("admin")) ||
    (username && username.toLowerCase() === "admin");

  if (email || phone || fullName || userObj) {
    return {
      ...(userObj || {}),
      email,
      phone,
      fullName,
      username,
      role,
      isAdmin,
    };
  }
  return null;
}

/* ── Alert History (Audit Trail) & Notification Center ─────────────────────── */
const FALLBACK_ALERT_HISTORY = [
  {
    alertId: "ETH-EW-2026-0915-01",
    hazard: "flood",
    title: "Flood Warning — Oromia",
    location: "Oromia (Middle Awash / Melka Sedi Reach)",
    region: "Oromia",
    severity: "Warning",
    issuedAt: new Date(
      Date.now() - 4 * 24 * 3600 * 1000 - 8 * 3600 * 1000,
    ).toISOString(),
    resolvedAt: new Date(
      Date.now() - 4 * 24 * 3600 * 1000 - 4 * 3600 * 1000 - 20 * 60 * 1000,
    ).toISOString(),
    duration: "3h 40m",
    status: "Resolved",
    description:
      "Awash River discharge exceeded bankfull capacity at 295 m³/s. Downstream dykes stabilized and flow normalized.",
    telemetry: {
      discharge: "295 m³/s",
      threshold: "280 m³/s",
      basin: "Awash Basin",
    },
    dispatchedSmsCount: 1420,
    dispatchedEmailCount: 88,
  },
  {
    alertId: "ETH-EW-2026-0917-02",
    hazard: "fire",
    title: "Wildfire Watch — Gambella Lowlands",
    location: "Gambella (Open Savanna / Forest Edge)",
    region: "Gambella",
    severity: "Watch",
    issuedAt: new Date(
      Date.now() - 2 * 24 * 3600 * 1000 - 5 * 3600 * 1000,
    ).toISOString(),
    resolvedAt: new Date(
      Date.now() - 2 * 24 * 3600 * 1000 - 1 * 3600 * 1000,
    ).toISOString(),
    duration: "4h 00m",
    status: "Resolved",
    description:
      "Multiple high-confidence VIIRS hotspots detected near rural farming settlements. Controlled by regional fire units.",
    telemetry: { maxFRP: "52.4 MW", satellites: "VIIRS SNPP + MODIS" },
    dispatchedSmsCount: 840,
    dispatchedEmailCount: 42,
  },
  {
    alertId: "ETH-EW-2026-0918-03",
    hazard: "earthquake",
    title: "Seismic Advisory — Afar Rift Escarpment",
    location: "Afar (Tendaho Graben / Asaita)",
    region: "Afar",
    severity: "Advisory",
    issuedAt: new Date(
      Date.now() - 1 * 24 * 3600 * 1000 - 12 * 3600 * 1000,
    ).toISOString(),
    resolvedAt: new Date(
      Date.now() - 1 * 24 * 3600 * 1000 - 6 * 3600 * 1000,
    ).toISOString(),
    duration: "6h 00m",
    status: "Resolved",
    description:
      "USGS detected M3.8 shallow earthquake at 10.0 km depth. No structural damage reported in nearby pastoralist zones.",
    telemetry: { magnitude: "M3.8", depth: "10 km", energyGJ: "12.4 GJ" },
    dispatchedSmsCount: 650,
    dispatchedEmailCount: 35,
  },
  {
    alertId: "ETH-EW-2026-0919-04",
    hazard: "landslide",
    title: "Landslide Warning — Gofa Zone Slopes",
    location: "South Ethiopia (Sawla-Geze Gofa Escarpment)",
    region: "South Ethiopia / SNNP",
    severity: "Warning",
    issuedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    resolvedAt: null,
    duration: "Ongoing (14h)",
    status: "Active",
    description:
      "7-Day Antecedent Rainfall Index (ARI) reached 142.5 mm on weathered basalt saprolite slopes. Factor of Safety dropped to 0.88.",
    telemetry: { factorOfSafety: "0.88", ari7d: "142.5 mm", slope: "38°" },
    dispatchedSmsCount: 2350,
    dispatchedEmailCount: 110,
  },
  {
    alertId: "ETH-EW-2026-0919-05",
    hazard: "drought",
    title: "Drought Emergency — Somali Lowlands",
    location: "Somali (Ogaden / Shabelle Basin)",
    region: "Somali",
    severity: "Emergency",
    issuedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    resolvedAt: null,
    duration: "Ongoing (1d 12h)",
    status: "Active",
    description:
      "CHIRPS v3 SPI-90 dropped to -2.18 with 64% precipitation deficit and severe pasture depletion.",
    telemetry: { spi90: "-2.18", precipDeficit: "-64%", pastureDeficit: "78%" },
    dispatchedSmsCount: 4120,
    dispatchedEmailCount: 215,
  },
  {
    alertId: "ETH-EW-2026-0919-06",
    hazard: "volcano",
    title: "Volcanic Activity Advisory — Erta Ale",
    location: "Afar (Danakil Depression)",
    region: "Afar",
    severity: "Advisory",
    issuedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    duration: "24h 00m",
    status: "Resolved",
    description:
      "COMET InSAR velocity indicated localized lava lake swelling at +12 mm/yr. VONA aviation alert set to YELLOW.",
    telemetry: {
      vona: "YELLOW",
      insarVel: "+12 mm/yr",
      activity: "Active Lava Lake",
    },
    dispatchedSmsCount: 310,
    dispatchedEmailCount: 65,
  },
];

export function formatAlertDate(dateVal) {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hours}:${mins}`;
}

const SEVERITY_COLORS = {
  Emergency: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(239,68,68,0.35)",
    icon: "🔴",
  },
  Warning: {
    color: "#f97316",
    bg: "rgba(249,115,22,0.14)",
    border: "rgba(249,115,22,0.35)",
    icon: "🟠",
  },
  Watch: {
    color: "#eab308",
    bg: "rgba(234,179,8,0.14)",
    border: "rgba(234,179,8,0.35)",
    icon: "🟡",
  },
  Advisory: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(34,197,94,0.35)",
    icon: "🟢",
  },
};

const HAZARD_META = {
  flood: {
    name: "Flood",
    icon: "/icons/icons8-flood-64.png",
    color: "#0284c7",
  },
  fire: {
    name: "Wildfire",
    icon: "/icons/icons8-fire-96.png",
    color: "#f97316",
  },
  earthquake: {
    name: "Earthquake",
    icon: "/icons/icons8-earthquake-64.png",
    color: "#eab308",
  },
  landslide: {
    name: "Landslide",
    icon: "/icons/icons8-landslide-96.png",
    color: "#a855f7",
  },
  drought: {
    name: "Drought",
    icon: "/icons/icons8-drought-64.png",
    color: "#f59e0b",
  },
  volcano: {
    name: "Volcano",
    icon: "/icons/icons8-volcano-96.png",
    color: "#ef4444",
  },
};

export function AlertHistorySection({
  alerts,
  loading,
  onRefresh,
  onOpenModal,
  onResolveAlert,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHazard, setSelectedHazard] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [detailModalAlert, setDetailModalAlert] = useState(null);

  // Prevent background scrolling on mobile & desktop when detail modal is open
  useEffect(() => {
    if (detailModalAlert) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [detailModalAlert]);

  const displayList =
    alerts && alerts.length > 0 ? alerts : FALLBACK_ALERT_HISTORY;

  const filteredAlerts = useMemo(() => {
    return displayList.filter((item) => {
      if (
        selectedHazard !== "all" &&
        item.hazard?.toLowerCase() !== selectedHazard.toLowerCase()
      ) {
        return false;
      }
      if (selectedSeverity !== "All" && item.severity !== selectedSeverity) {
        return false;
      }
      if (
        selectedStatus !== "all" &&
        item.status?.toLowerCase() !== selectedStatus.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.alertId?.toLowerCase().includes(q);
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchLoc = item.location?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchLoc && !matchDesc) return false;
      }
      return true;
    });
  }, [
    displayList,
    selectedHazard,
    selectedSeverity,
    selectedStatus,
    searchQuery,
  ]);

  const activeCount = displayList.filter((a) => a.status === "Active").length;
  const resolvedCount = displayList.filter(
    (a) => a.status === "Resolved",
  ).length;
  const totalSms = displayList.reduce(
    (acc, a) => acc + (a.dispatchedSmsCount || 0),
    0,
  );
  const totalEmail = displayList.reduce(
    (acc, a) => acc + (a.dispatchedEmailCount || 0),
    0,
  );

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "18px",
        padding: "22px 24px",
        marginBottom: "32px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#3b82f6",
              fontWeight: 800,
            }}
          >
            Audit Trail &amp; Historical Records
          </div>
          <h2
            style={{
              margin: "2px 0 0 0",
              fontSize: "19px",
              color: "var(--text-primary)",
            }}
          >
            Early Warning Alert History
          </h2>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            Preserved audit trail of issued disaster warnings, resolution
            durations, and multi-channel telemetry dispatches.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => onOpenModal("preferences")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(59,130,246,0.4)",
              background: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff",
              color: isDark ? "#60a5fa" : "#2563eb",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <FiBell size={13} />
            <span>Notification Preferences</span>
          </button>

          {/* Dispatch Alert Button — ONLY visible for authenticated Administrators */}
          {getLoggedInUser()?.isAdmin && (
            <button
              onClick={() => onOpenModal("dispatch")}
              title="Broadcast official emergency alert"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                border: "none",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                transition: "all 0.15s ease",
              }}
            >
              <FiSend size={13} />
              <span>🚨 Dispatch New Alert</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-card-alt)",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <FiRefreshCw size={12} className={loading ? "ew-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            background: "var(--bg-card-alt)",
            border: "1px solid var(--border-light)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Total Logged
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 900,
                color: "var(--text-primary)",
              }}
            >
              {displayList.length}
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>📁</span>
        </div>

        <div
          style={{
            background: isDark ? "rgba(239,68,68,0.1)" : "#fef2f2",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10.5px",
                color: "#ef4444",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Active Alerts
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 900, color: "#ef4444" }}
            >
              {activeCount}
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>🚨</span>
        </div>

        <div
          style={{
            background: isDark ? "rgba(34,197,94,0.1)" : "#f0fdf4",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10.5px",
                color: "#16a34a",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Resolved Alerts
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: 900, color: "#16a34a" }}
            >
              {resolvedCount}
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>✅</span>
        </div>

        <div
          style={{
            background: "var(--bg-card-alt)",
            border: "1px solid var(--border-light)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Multi-Channel Outreach
            </div>
            <div
              style={{ fontSize: "14px", fontWeight: 800, color: "#0284c7" }}
            >
              {totalSms.toLocaleString()} SMS &nbsp;|&nbsp;{" "}
              {totalEmail.toLocaleString()} Email
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>📡</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {/* Search input */}
        <div
          style={{
            flex: "1 1 240px",
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <FiSearch
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search by Alert ID, Title, Region, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 34px",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-card-alt)",
              color: "var(--text-primary)",
              fontSize: "12.5px",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Hazard Pill Selector */}
        <div
          style={{
            display: "inline-flex",
            gap: "4px",
            background: "var(--bg-card-alt)",
            padding: "3px",
            borderRadius: "8px",
            border: "1px solid var(--border-light)",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {[
            "all",
            "flood",
            "fire",
            "earthquake",
            "landslide",
            "drought",
            "volcano",
          ].map((h) => {
            const active = selectedHazard === h;
            const meta = HAZARD_META[h];
            return (
              <button
                key={h}
                onClick={() => setSelectedHazard(h)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  background: active ? "#0284c7" : "transparent",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {meta?.icon && (
                  <img
                    src={meta.icon}
                    alt=""
                    style={{
                      width: "12px",
                      height: "12px",
                      objectFit: "contain",
                    }}
                  />
                )}
                <span>{h === "all" ? "All Hazards" : meta?.name || h}</span>
              </button>
            );
          })}
        </div>

        {/* Severity Selector */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid var(--border-light)",
            background: "var(--bg-card-alt)",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="All">All Severities</option>
          <option value="Emergency">🔴 Emergency</option>
          <option value="Warning">🟠 Warning</option>
          <option value="Watch">🟡 Watch</option>
          <option value="Advisory">🟢 Advisory</option>
        </select>

        {/* Status Selector */}
        <div
          style={{
            display: "inline-flex",
            gap: "2px",
            background: "var(--bg-card-alt)",
            padding: "3px",
            borderRadius: "8px",
            border: "1px solid var(--border-light)",
          }}
        >
          {[
            { id: "all", label: "All" },
            { id: "Active", label: "🚨 Active" },
            { id: "Resolved", label: "✅ Resolved" },
          ].map(({ id, label }) => {
            const active = selectedStatus === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedStatus(id)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  background: active ? "var(--bg-card)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Alert History Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-card-alt)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "12.5px",
          }}
        >
          <thead>
            <tr
              style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                borderBottom: "1px solid var(--border-light)",
                color: "var(--text-muted)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>
                Alert ID
              </th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>Hazard</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>
                Location
              </th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>
                Severity
              </th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>Issued</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>
                Resolved
              </th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>
                Duration
              </th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
              <th
                style={{
                  padding: "12px 14px",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No historical alert records matching your search/filters.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert, idx) => {
                const sevStyle =
                  SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.Warning;
                const meta =
                  HAZARD_META[alert.hazard?.toLowerCase()] || HAZARD_META.flood;
                const isActive = alert.status === "Active";

                return (
                  <tr
                    key={alert.alertId || idx}
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                      transition: "background 0.12s ease",
                      background:
                        idx % 2 === 0
                          ? "transparent"
                          : isDark
                            ? "rgba(255,255,255,0.015)"
                            : "rgba(0,0,0,0.01)",
                    }}
                  >
                    {/* Alert ID */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#0284c7",
                          background: isDark
                            ? "rgba(2,132,199,0.12)"
                            : "#e0f2fe",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid rgba(2,132,199,0.25)",
                        }}
                      >
                        {alert.alertId}
                      </span>
                    </td>

                    {/* Hazard */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <img
                          src={meta.icon}
                          alt={meta.name}
                          style={{
                            width: "16px",
                            height: "16px",
                            objectFit: "contain",
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {meta.name}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: "12px 14px", maxWidth: "240px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {alert.title || alert.location}
                      </div>
                      <div
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {alert.location}
                      </div>
                    </td>

                    {/* Severity */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: sevStyle.color,
                          background: sevStyle.bg,
                          border: `1px solid ${sevStyle.border}`,
                        }}
                      >
                        <span>{sevStyle.icon}</span>
                        <span>{alert.severity}</span>
                      </span>
                    </td>

                    {/* Issued */}
                    <td
                      style={{
                        padding: "12px 14px",
                        whiteSpace: "nowrap",
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FiClock
                          size={11}
                          style={{ color: "var(--text-muted)" }}
                        />
                        <span>{formatAlertDate(alert.issuedAt)}</span>
                      </div>
                    </td>

                    {/* Resolved */}
                    <td
                      style={{
                        padding: "12px 14px",
                        whiteSpace: "nowrap",
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                      }}
                    >
                      {isActive ? (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 800,
                            color: "#ef4444",
                            background: isDark
                              ? "rgba(239,68,68,0.15)"
                              : "#fee2e2",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }}
                        >
                          Ongoing
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FiCheckCircle
                            size={11}
                            style={{ color: "#16a34a" }}
                          />
                          <span>{formatAlertDate(alert.resolvedAt)}</span>
                        </div>
                      )}
                    </td>

                    {/* Duration */}
                    <td
                      style={{
                        padding: "12px 14px",
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {alert.duration || "—"}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "10.5px",
                          fontWeight: 800,
                          color: isActive ? "#ef4444" : "#16a34a",
                          background: isActive
                            ? isDark
                              ? "rgba(239,68,68,0.15)"
                              : "#fee2e2"
                            : isDark
                              ? "rgba(34,197,94,0.15)"
                              : "#dcfce7",
                          border: isActive
                            ? "1px solid rgba(239,68,68,0.3)"
                            : "1px solid rgba(34,197,94,0.3)",
                        }}
                      >
                        {isActive ? "🚨 Active" : "✅ Resolved"}
                      </span>
                    </td>

                    {/* Action */}
                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => setDetailModalAlert(alert)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-light)",
                            background: "var(--bg-card)",
                            color: "#0284c7",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Details
                        </button>
                        {isActive &&
                          onResolveAlert &&
                          getLoggedInUser()?.isAdmin && (
                            <button
                              onClick={() => onResolveAlert(alert.alertId)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(34,197,94,0.4)",
                                background: isDark
                                  ? "rgba(34,197,94,0.15)"
                                  : "#f0fdf4",
                                color: "#16a34a",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Resolve
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Alert Detail Drawer/Modal */}
      {detailModalAlert &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              minHeight: "100dvh",
              background: "rgba(0,0,0,0.76)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 9999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            }}
            onClick={() => setDetailModalAlert(null)}
          >
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: "16px",
                maxWidth: "560px",
                width: "100%",
                maxHeight: "90dvh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                animation: "fadeIn 0.2s ease-out",
                margin: "auto",
                overscrollBehavior: "contain",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-card-alt)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: "#0284c7",
                      background: isDark ? "rgba(2,132,199,0.15)" : "#e0f2fe",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {detailModalAlert.alertId}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}
                  >
                    Audit Trail Record
                  </span>
                </div>
                <button
                  onClick={() => setDetailModalAlert(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "4px",
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: "20px 24px",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src={
                      HAZARD_META[detailModalAlert.hazard?.toLowerCase()]?.icon
                    }
                    alt=""
                    style={{
                      width: "22px",
                      height: "22px",
                      objectFit: "contain",
                    }}
                  />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "17px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {detailModalAlert.title}
                  </h3>
                </div>

                {/* Badges row */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      color: SEVERITY_COLORS[detailModalAlert.severity]?.color,
                      background:
                        SEVERITY_COLORS[detailModalAlert.severity]?.bg,
                      border: `1px solid ${SEVERITY_COLORS[detailModalAlert.severity]?.border}`,
                    }}
                  >
                    {detailModalAlert.severity}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: "var(--bg-card-alt)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    📍 {detailModalAlert.location}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background:
                        detailModalAlert.status === "Active"
                          ? "rgba(239,68,68,0.1)"
                          : "rgba(34,197,94,0.1)",
                      color:
                        detailModalAlert.status === "Active"
                          ? "#ef4444"
                          : "#16a34a",
                      border: `1px solid ${detailModalAlert.status === "Active" ? "#ef444444" : "#16a34a44"}`,
                    }}
                  >
                    {detailModalAlert.status === "Active"
                      ? "🚨 Active Status"
                      : "✅ Resolved"}
                  </span>
                </div>

                {/* Time parameters table */}
                <div
                  style={{
                    background: "var(--bg-card-alt)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    fontSize: "12.5px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Issued Timestamp
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {formatAlertDate(detailModalAlert.issuedAt)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Resolved Timestamp
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {detailModalAlert.resolvedAt
                          ? formatAlertDate(detailModalAlert.resolvedAt)
                          : "Active (Ongoing)"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Total Duration
                      </div>
                      <div style={{ fontWeight: 800, color: "#0284c7" }}>
                        {detailModalAlert.duration || "—"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Dispatched By
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {detailModalAlert.dispatchedBy ||
                          "EDRMC / SSGI Early Warning Desk"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    Situation &amp; Telemetry Assessment:
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {detailModalAlert.description ||
                      "Official alert bulletin dispatched across affected woredas and monitoring agencies."}
                  </div>
                </div>

                {/* Telemetry Snapshot */}
                {detailModalAlert.telemetry &&
                  Object.keys(detailModalAlert.telemetry).length > 0 && (
                    <div
                      style={{
                        background: isDark ? "rgba(2,132,199,0.08)" : "#f0f9ff",
                        border: "1px solid rgba(2,132,199,0.25)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 800,
                          color: "#0284c7",
                          textTransform: "uppercase",
                          marginBottom: "6px",
                        }}
                      >
                        Sensor Metrics Snapshot:
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                        }}
                      >
                        {Object.entries(detailModalAlert.telemetry).map(
                          ([k, v]) => (
                            <span
                              key={k}
                              style={{ color: "var(--text-primary)" }}
                            >
                              <strong>{k}:</strong> {String(v)}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Multi-Channel Outreach count */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "var(--bg-card-alt)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      SMS Recipients (SMS Ethiopia):{" "}
                    </span>
                    <strong style={{ color: "#f97316" }}>
                      {(
                        detailModalAlert.dispatchedSmsCount || 0
                      ).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      HTML Email Bulletins:{" "}
                    </span>
                    <strong style={{ color: "#3b82f6" }}>
                      {(
                        detailModalAlert.dispatchedEmailCount || 0
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-card-alt)",
                }}
              >
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Emergency Dispatch Hotline:{" "}
                  <strong style={{ color: "#ef4444" }}>8335</strong>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {detailModalAlert.status === "Active" &&
                    onResolveAlert &&
                    getLoggedInUser()?.isAdmin && (
                      <button
                        onClick={() => {
                          onResolveAlert(detailModalAlert.alertId);
                          setDetailModalAlert(null);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#16a34a",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Mark as Resolved
                      </button>
                    )}
                  <button
                    onClick={() => setDetailModalAlert(null)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ── Notification Preferences & Multi-Channel Dispatch Modal ────────────── */
