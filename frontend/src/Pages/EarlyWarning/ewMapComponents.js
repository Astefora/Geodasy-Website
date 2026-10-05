import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import {
  FiArrowRight, FiShield, FiRefreshCw, FiMapPin, FiLayers, FiAlertTriangle,
  FiBell, FiMail, FiSend, FiClock, FiCheckCircle, FiSearch, FiPhone, FiCheck, FiX,
} from "react-icons/fi";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { HAZARD_ICONS } from "./ewData";

export function makeIcon(type, size = 28) {
  const url = HAZARD_ICONS[type] || "/icons/icons8-fire-96.png";
  return L.icon({
    iconUrl: url,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    className: "ew-hazard-icon",
  });
}

export const ICONS = {
  earthquake: makeIcon("earthquake", 26),
  fire: makeIcon("fire", 26),
  flood: makeIcon("flood", 28),
  volcano: makeIcon("volcano", 28),
  drought: makeIcon("drought", 28),
  landslide: makeIcon("landslide", 28),
};

/* ── Bottom-Left Map Controls (Base Layers + Hazard Layers) ────────────────── */
export function MapBottomControls({
  baseTileLayer,
  setBaseTileLayer,
  filterLayers,
  toggleFilter,
}) {
  const [layersOpen, setLayersOpen] = useState(false);

  const hazardList = [
    {
      id: "earthquake",
      label: "Earthquake",
      icon: "/icons/icons8-earthquake-64.png",
      color: "#eab308",
    },
    {
      id: "fire",
      label: "Fire",
      icon: "/icons/icons8-fire-96.png",
      color: "#f97316",
    },
    {
      id: "volcano",
      label: "Volcano",
      icon: "/icons/icons8-volcano-96.png",
      color: "#ef4444",
    },
    {
      id: "flood",
      label: "Flood",
      icon: "/icons/icons8-flood-64.png",
      color: "#3b82f6",
    },
    {
      id: "landslide",
      label: "Landslide",
      icon: "/icons/icons8-landslide-96.png",
      color: "#a78bfa",
    },
    {
      id: "drought",
      label: "Drought",
      icon: "/icons/icons8-drought-64.png",
      color: "#f59e0b",
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "14px",
        bottom: "14px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {/* Base Map Switcher */}
      <div
        style={{
          display: "inline-flex",
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "10px",
          padding: "3px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          backdropFilter: "blur(10px)",
        }}
      >
        {[
          { id: "default", label: "Default", icon: "🗺️" },
          { id: "satellite", label: "Satellite", icon: "🛰️" },
          { id: "terrain", label: "Terrain", icon: "🏔️" },
        ].map((t) => {
          const active = baseTileLayer === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setBaseTileLayer(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                borderRadius: "7px",
                border: "none",
                background: active ? "#0284c7" : "transparent",
                color: active ? "#fff" : "var(--text-primary)",
                fontSize: "11px",
                fontWeight: active ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hazard Layers Toggle */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setLayersOpen((o) => !o)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            borderRadius: "10px",
            padding: "5px 10px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-primary)",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            backdropFilter: "blur(10px)",
          }}
        >
          <FiLayers size={13} style={{ color: "#0284c7" }} />
          <span>
            Hazards ({hazardList.filter((h) => filterLayers[h.id]).length}/6)
          </span>
          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            {layersOpen ? "▲" : "▼"}
          </span>
        </button>

        {layersOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "0",
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: "10px",
              padding: "8px 10px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minWidth: "150px",
              backdropFilter: "blur(12px)",
            }}
          >
            {hazardList.map((l) => {
              const active = filterLayers[l.id];
              return (
                <label
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleFilter(l.id)}
                    style={{ accentColor: l.color, cursor: "pointer" }}
                  />
                  <img src={l.icon} alt={l.label} width={14} height={14} />
                  <span>{l.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Marker Popup Card ────────────────────────────────────────────────────── */
export function MarkerPopup({ marker, onClose }) {
  if (!marker) return null;
  const { type, name, lat, lon } = marker;

  const renderContent = () => {
    switch (type) {
      case "earthquake":
        return (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{ fontSize: "16px", fontWeight: 900, color: "#eab308" }}
              >
                M{marker.mag?.toFixed(1) || "2.5"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Depth: {marker.depth?.toFixed(1) || "10"} km
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              📍 {marker.place}
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Energy: ~{(marker.energyJoules / 1e9).toFixed(1)} GJ (USGS Live)
            </div>
          </>
        );
      case "fire":
        return (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{ fontSize: "14px", fontWeight: 800, color: "#f97316" }}
              >
                FRP: {marker.frp?.toFixed(1) || "18.5"} MW
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  background: "rgba(249,115,22,0.15)",
                  color: "#f97316",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  fontWeight: 700,
                }}
              >
                {marker.confidence || "High"} Conf.
              </span>
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-secondary)",
                marginBottom: "3px",
              }}
            >
              🛰️ Satellite: {marker.satellite || "VIIRS SNPP"}
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Acquired: {marker.acq_date} {marker.acq_time || ""}
            </div>
          </>
        );
      case "flood":
        return (
          <>
            <div
              style={{
                fontSize: "12.5px",
                fontWeight: 800,
                color: marker.color,
                marginBottom: "4px",
              }}
            >
              {marker.status}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 900,
                color: "#3b82f6",
                marginBottom: "4px",
              }}
            >
              Discharge: {marker.discharge} m³/s
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "2px",
              }}
            >
              Threshold: {marker.threshold} m³/s · Basin: {marker.basin}
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              GloFAS 7-Day Peak: {marker.maxForecast} m³/s
            </div>
          </>
        );
      case "volcano":
        return (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  background: marker.color,
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                VONA: {marker.vona}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: marker.color,
                }}
              >
                {marker.threat} THREAT
              </span>
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-secondary)",
                marginBottom: "4px",
              }}
            >
              InSAR Velocity: <strong>{marker.insarVel}</strong>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                lineHeight: "1.4",
              }}
            >
              {marker.activity}
            </div>
          </>
        );
      case "drought":
        return (
          <>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: marker.color,
                marginBottom: "4px",
              }}
            >
              {marker.ipcPhase}
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-secondary)",
                marginBottom: "3px",
              }}
            >
              SPI-90: <strong>{marker.spi90}</strong> · Deficit:{" "}
              <strong>{marker.precipDeficit}</strong>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Pasture: {marker.pastureDeficit} · Water: {marker.waterDepletion}
            </div>
          </>
        );
      case "landslide":
        return (
          <>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: marker.color,
                marginBottom: "4px",
              }}
            >
              Alert: {marker.alertLevel} (FS: {marker.fs})
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-secondary)",
                marginBottom: "3px",
              }}
            >
              7-Day ARI: <strong>{marker.ari7d} mm</strong> · Slope:{" "}
              <strong>{marker.slopeDeg}°</strong>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Corridor: {marker.roadCorridor}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "14px",
        right: "14px",
        zIndex: 1000,
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "14px",
        padding: "14px 16px",
        maxWidth: "280px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <img src={HAZARD_ICONS[type]} alt={type} width={18} height={18} />
          <span
            style={{
              fontSize: "12.5px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {name || marker.place || `${type.toUpperCase()} Detection`}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "14px",
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          ✕
        </button>
      </div>

      {renderContent()}

      <div
        style={{
          marginTop: "10px",
          paddingTop: "6px",
          borderTop: "1px solid var(--border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
      >
        <span>
          Coords: {lat?.toFixed(2)}°, {lon?.toFixed(2)}°
        </span>
        <Link
          to={`/${type === "earthquake" ? "earthquakes" : type === "volcano" ? "volcano" : type}`}
          style={{ color: "#0284c7", fontWeight: 700, textDecoration: "none" }}
        >
          Details →
        </Link>
      </div>
    </div>
  );
}

/* ── Stat Badge ───────────────────────────────────────────────────────────── */
