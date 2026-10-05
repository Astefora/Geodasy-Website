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
import { useMap } from "react-leaflet";

export function StatBadge({ value, label, color }) {
  return (
    <div
      className="ew-stat-badge"
      style={{
        padding: "14px 22px",
        textAlign: "center",
        flex: "1 1 0",
        minWidth: "90px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent dot at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "28px",
          height: "2.5px",
          background: color,
          borderRadius: "0 0 4px 4px",
          opacity: 0.8,
        }}
      />
      <div
        className="ew-stat-value"
        style={{
          fontSize: "28px",
          fontWeight: 900,
          color,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          marginTop: "4px",
        }}
      >
        {value}
      </div>
      <div
        className="ew-stat-label"
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Map Controller for Smooth FlyTo & Auto Resize ────────────────────────── */
export function MapController({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
      if (flyTarget && flyTarget.lat && flyTarget.lon) {
        map.flyTo([flyTarget.lat, flyTarget.lon], flyTarget.zoom || 8, {
          duration: 1.0,
        });
      }
    } catch (e) {}
  }, [flyTarget, map]);

  useEffect(() => {
    let isMounted = true;
    const invalidate = () => {
      if (!isMounted || !map) return;
      try {
        const container = map.getContainer ? map.getContainer() : null;
        if (
          !container ||
          container.clientWidth === 0 ||
          container.clientHeight === 0
        )
          return;
        if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
        map.invalidateSize({ animate: false });
      } catch (e) {}
    };

    invalidate();
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 300);
    const t3 = setTimeout(invalidate, 600);

    window.addEventListener("resize", invalidate);
    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  return null;
}

/* ── MultiDaySparkline with Interactive Hover Behavior ────────────────────── */
export function MultiDaySparkline({
  history = [],
  forecast = [],
  color,
  unit = "",
  height = 52,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);

  const allVals = [...history, ...forecast];
  if (!allVals.length || allVals.length < 2) return null;

  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const padX = 10;
  const padY = 8;
  const totalW = 280;
  const totalH = height;
  const w = totalW - padX * 2;
  const h = totalH - padY * 2;
  const totalPoints = allVals.length;

  const getPt = (v, i) => {
    const x = padX + (i / (totalPoints - 1)) * w;
    const y = padY + (1 - (v - min) / range) * h;
    return [x, y];
  };

  const allPts = allVals.map((v, i) => getPt(v, i));
  const histPts = history.map((v, i) => getPt(v, i));
  const lastHistIdx = history.length - 1;
  const lastHistPt = histPts[lastHistIdx];
  const fcPts = forecast.map((v, i) => getPt(v, lastHistIdx + 1 + i));
  const allFcPts = [lastHistPt, ...fcPts];

  const histPath = [
    `M ${histPts[0][0]},${histPts[0][1]}`,
    ...histPts.slice(1).map((p) => `L ${p[0]},${p[1]}`),
  ].join(" ");
  const histArea = [
    `M ${histPts[0][0]},${histPts[0][1]}`,
    ...histPts.slice(1).map((p) => `L ${p[0]},${p[1]}`),
    `L ${histPts[histPts.length - 1][0]},${padY + h}`,
    `L ${histPts[0][0]},${padY + h}`,
    "Z",
  ].join(" ");

  const fcPath = [
    `M ${allFcPts[0][0]},${allFcPts[0][1]}`,
    ...allFcPts.slice(1).map((p) => `L ${p[0]},${p[1]}`),
  ].join(" ");

  const partitionX = lastHistPt[0];
  const dayNames = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Today",
    "+1d",
    "+2d",
    "+3d",
  ];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const svgX = (relX / rect.width) * totalW;
    let closestIdx = 0;
    let minDiff = Infinity;
    allPts.forEach((pt, idx) => {
      const diff = Math.abs(pt[0] - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };

  const activePt = hoveredIdx !== null ? allPts[hoveredIdx] : null;
  const isForecast = hoveredIdx !== null && hoveredIdx >= history.length;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
      style={{
        position: "relative",
        width: "100%",
        cursor: "crosshair",
        userSelect: "none",
      }}
    >
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        style={{
          width: "100%",
          height: `${height}px`,
          overflow: "visible",
          display: "block",
        }}
      >
        <defs>
          <linearGradient
            id={`ew-grad-${color.replace("#", "")}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Partition line */}
        <line
          x1={partitionX}
          y1={2}
          x2={partitionX}
          y2={totalH - 2}
          stroke="var(--border-light)"
          strokeDasharray="2 2"
          strokeWidth="1.2"
        />

        {/* Historical Area & Solid Line */}
        <path d={histArea} fill={`url(#ew-grad-${color.replace("#", "")})`} />
        <path
          d={histPath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forecast Line (Dashed) */}
        <path
          d={fcPath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeDasharray="3 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Base Forecast Nodes */}
        {fcPts.map((p, idx) => (
          <circle
            key={idx}
            cx={p[0]}
            cy={p[1]}
            r="3"
            fill="var(--bg-card)"
            stroke={color}
            strokeWidth="1.8"
          />
        ))}

        {/* Interactive Hover Crosshair & Glowing Indicator */}
        {activePt && (
          <g>
            <line
              x1={activePt[0]}
              y1={2}
              x2={activePt[0]}
              y2={totalH - 2}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <circle
              cx={activePt[0]}
              cy={activePt[1]}
              r="6"
              fill={color}
              opacity="0.25"
            />
            <circle
              cx={activePt[0]}
              cy={activePt[1]}
              r="3.5"
              fill={color}
              stroke="var(--bg-card)"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {/* Interactive Tooltip on Hover */}
      {hoveredIdx !== null && activePt && (
        <div
          style={{
            position: "absolute",
            top: `${Math.max(-36, activePt[1] - 42)}px`,
            left: `${(activePt[0] / totalW) * 100}%`,
            transform: "translateX(-50%)",
            background: "var(--bg-card)",
            border: `1px solid ${color}`,
            borderRadius: "6px",
            padding: "3px 7px",
            fontSize: "10px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            pointerEvents: "none",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            {dayNames[hoveredIdx]}:
          </span>
          <span style={{ color }}>
            {allVals[hoveredIdx]} {unit}
          </span>
          <span
            style={{
              fontSize: "8.5px",
              padding: "0 3px",
              borderRadius: "3px",
              background: isForecast
                ? "rgba(2,132,199,0.15)"
                : "rgba(34,197,94,0.15)",
              color: isForecast ? "#0284c7" : "#16a34a",
            }}
          >
            {isForecast ? "🔮 Forecast" : "✓ Sensor"}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── TrendBadge ───────────────────────────────────────────────────────────── */
export function TrendBadge({ data }) {
  if (!data || data.length < 2) return null;
  const prev = data[data.length - 2] || 0;
  const curr = data[data.length - 1] || 0;
  if (prev === 0 && curr === 0) return null;
  const pct =
    prev === 0 ? 100 : Math.round(Math.abs((curr - prev) / prev) * 100);
  const up = curr >= prev;
  return (
    <span
      className={`ew-trend-badge ${up ? "ew-trend-up" : "ew-trend-down"}`}
      style={{
        fontSize: "10px",
        fontWeight: 800,
        color: up ? "#dc2626" : "#15803d",
        backgroundColor: up ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
        border: `1px solid ${up ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
        borderRadius: "999px",
        padding: "1px 6px",
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        whiteSpace: "nowrap",
      }}
    >
      {up ? "↑" : "↓"} {pct}%
    </span>
  );
}

const TREND_CONFIG = {
  fire: {
    label: "Fire Hotspots",
    icon: "/icons/icons8-fire-96.png",
    color: "#f97316",
    unit: "hotspots",
  },
  earthquake: {
    label: "Earthquakes",
    icon: "/icons/icons8-earthquake-64.png",
    color: "#eab308",
    unit: "events",
  },
  flood: {
    label: "River Discharge",
    icon: "/icons/icons8-flood-64.png",
    color: "#3b82f6",
    unit: "m³/s",
  },
  landslide: {
    label: "Landslide Reports",
    icon: "/icons/icons8-landslide-96.png",
    color: "#a78bfa",
    unit: "reports",
  },
  drought: {
    label: "Drought Zones",
    icon: "/icons/icons8-drought-64.png",
    color: "#f59e0b",
    unit: "zones",
  },
  volcano: {
    label: "Volcanic Alerts",
    icon: "/icons/icons8-volcano-96.png",
    color: "#ef4444",
    unit: "alerts",
  },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
const FORECAST_DAY_LABELS = ["+1d", "+2d", "+3d"];

export function TrendCard({ hazardId, dataObj, loading }) {
  const cfg = TREND_CONFIG[hazardId];
  if (!cfg) return null;
  const history = dataObj?.history || [2, 3, 2, 4, 3, 5, 4];
  const forecast = dataObj?.forecast || [4, 5, 4];
  const current = history[history.length - 1] ?? 0;
  const forecastAvg = Math.round(
    forecast.reduce((a, b) => a + b, 0) / forecast.length,
  );

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "18px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        transition:
          "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)`;
        e.currentTarget.style.borderColor = `${cfg.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* Top color stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}66)`,
          borderRadius: "18px 18px 0 0",
        }}
      />

      {/* Header row: icon + label + trend badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${cfg.color}18`,
              border: `1.5px solid ${cfg.color}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={cfg.icon}
              alt={cfg.label}
              style={{
                width: "20px",
                height: "20px",
                objectFit: "contain",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                lineHeight: 1,
                marginBottom: "2px",
              }}
            >
              {cfg.unit}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cfg.label}
            </div>
          </div>
        </div>
        <TrendBadge data={history} />
      </div>

      {/* Current value + forecast */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: cfg.color,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {loading ? "—" : current.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            now
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "999px",
            background: "rgba(99,102,241,0.10)",
            border: "1px solid rgba(99,102,241,0.22)",
            color: "#6366f1",
            whiteSpace: "nowrap",
          }}
        >
          +3d: {forecastAvg}
        </span>
      </div>

      {/* Sparkline */}
      <div style={{ margin: "0" }}>
        {loading ? (
          <div
            style={{
              height: "44px",
              background: "rgba(128,128,128,0.07)",
              borderRadius: "8px",
            }}
          />
        ) : (
          <MultiDaySparkline
            history={history}
            forecast={forecast}
            color={cfg.color}
            unit={cfg.unit}
            height={44}
          />
        )}
      </div>

      {/* Axis Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8.5px",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border-light)",
          paddingTop: "5px",
        }}
      >
        <div style={{ display: "flex", gap: "5px" }}>
          {DAY_LABELS.map((d, i) => (
            <span
              key={i}
              style={{
                color: i === 6 ? cfg.color : "var(--text-muted)",
                fontWeight: i === 6 ? 700 : 400,
              }}
            >
              {d}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: "5px",
            color: "#0284c7",
            fontWeight: 700,
          }}
        >
          {FORECAST_DAY_LABELS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Region Dropdown Selector ─────────────────────────────────────────────── */
