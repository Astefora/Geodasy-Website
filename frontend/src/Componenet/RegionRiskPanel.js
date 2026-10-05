/**
 * RegionRiskPanel.js
 *
 * Shared component used across all 6 hazard pages.
 *
 * Provides:
 *   1. <RegionSelector>   — dropdown button (like EarlyWarning's RegionDropdown)
 *                           Place it in the map card header next to the refresh button.
 *   2. <RegionGeoLayer>   — React-Leaflet child component; renders the admin-1 GeoJSON
 *                           overlay and flies the map to the selected region.
 *                           Must be a child of <MapContainer>.
 *   3. <RegionRiskCard>   — floating panel that appears when a region is selected,
 *                           showing the per-hazard risk breakdown.
 *                           Renders inside the hazard-map-container div (position:absolute).
 *
 * Usage example (inside a hazard page):
 *
 *   // 1. Import
 *   import { RegionSelector, RegionGeoLayer, RegionRiskCard } from "../Componenet/RegionRiskPanel";
 *
 *   // 2. Add state
 *   const [activeRegion, setActiveRegion] = useState(null);
 *   const [regionsGeo, setRegionsGeo] = useState(null);
 *   useEffect(() => {
 *     fetch("/ethiopia-regions.geojson").then(r=>r.json()).then(setRegionsGeo).catch(()=>{});
 *   }, []);
 *
 *   // 3. In map header (left of refresh button):
 *   <RegionSelector activeRegion={activeRegion} onSelect={setActiveRegion} />
 *
 *   // 4. Inside <MapContainer> (after <TileLayer>):
 *   <RegionGeoLayer regionsGeo={regionsGeo} activeRegion={activeRegion} onSelect={setActiveRegion} />
 *
 *   // 5. Inside hazard-map-container div (alongside MapTypeToggle):
 *   <RegionRiskCard activeRegion={activeRegion} onClose={() => setActiveRegion(null)} />
 */

import React, { useState, useEffect, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import { FiMapPin, FiX } from "react-icons/fi";

// ── Region data (matches EarlyWarning.js) ─────────────────────────────────
export const ETHIOPIA_REGIONS = [
  {
    id: "afar",
    name: "Afar",
    lat: 12.36,
    lon: 41.03,
    zoom: 7,
    risk: "Critical",
    riskColor: "#ef4444",
    riskBg: "rgba(239,68,68,0.10)",
    hazardRisks: {
      Volcano: { level: "High", color: "#ef4444" },
      Earthquake: { level: "High", color: "#ef4444" },
      Drought: { level: "High", color: "#ef4444" },
      Fire: { level: "Moderate", color: "#eab308" },
      Flood: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "oromia",
    name: "Oromia",
    lat: 8.0,
    lon: 39.0,
    zoom: 7,
    risk: "High",
    riskColor: "#f97316",
    riskBg: "rgba(249,115,22,0.10)",
    hazardRisks: {
      Fire: { level: "High", color: "#ef4444" },
      Flood: { level: "High", color: "#f97316" },
      Drought: { level: "High", color: "#f97316" },
      Landslide: { level: "High", color: "#f97316" },
      Earthquake: { level: "Moderate", color: "#eab308" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "amhara",
    name: "Amhara",
    lat: 11.26,
    lon: 38.5,
    zoom: 7,
    risk: "Moderate",
    riskColor: "#eab308",
    riskBg: "rgba(234,179,8,0.10)",
    hazardRisks: {
      Flood: { level: "Moderate", color: "#eab308" },
      Landslide: { level: "Moderate", color: "#eab308" },
      Drought: { level: "Moderate", color: "#eab308" },
      Earthquake: { level: "Low", color: "#22c55e" },
      Fire: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "somali",
    name: "Somali",
    lat: 6.75,
    lon: 44.0,
    zoom: 7,
    risk: "High",
    riskColor: "#f97316",
    riskBg: "rgba(249,115,22,0.10)",
    hazardRisks: {
      Drought: { level: "High", color: "#ef4444" },
      Flood: { level: "High", color: "#f97316" },
      Fire: { level: "Moderate", color: "#eab308" },
      Earthquake: { level: "Moderate", color: "#eab308" },
      Landslide: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "tigray",
    name: "Tigray",
    lat: 14.0,
    lon: 38.0,
    zoom: 7,
    risk: "Moderate",
    riskColor: "#eab308",
    riskBg: "rgba(234,179,8,0.10)",
    hazardRisks: {
      Earthquake: { level: "Moderate", color: "#eab308" },
      Drought: { level: "Moderate", color: "#eab308" },
      Flood: { level: "Low", color: "#22c55e" },
      Fire: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "snnpr",
    name: "SNNPR",
    lat: 6.5,
    lon: 36.5,
    zoom: 7,
    risk: "High",
    riskColor: "#f97316",
    riskBg: "rgba(249,115,22,0.10)",
    hazardRisks: {
      Landslide: { level: "High", color: "#ef4444" },
      Flood: { level: "High", color: "#f97316" },
      Fire: { level: "Moderate", color: "#eab308" },
      Drought: { level: "Moderate", color: "#eab308" },
      Earthquake: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "benishangul",
    name: "Benishangul-Gumuz",
    lat: 10.38,
    lon: 35.5,
    zoom: 7,
    risk: "Low",
    riskColor: "#22c55e",
    riskBg: "rgba(34,197,94,0.10)",
    hazardRisks: {
      Flood: { level: "Moderate", color: "#eab308" },
      Fire: { level: "Low", color: "#22c55e" },
      Drought: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
      Earthquake: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "gambella",
    name: "Gambella",
    lat: 7.63,
    lon: 34.33,
    zoom: 8,
    risk: "Moderate",
    riskColor: "#eab308",
    riskBg: "rgba(234,179,8,0.10)",
    hazardRisks: {
      Flood: { level: "Moderate", color: "#eab308" },
      Fire: { level: "Moderate", color: "#eab308" },
      Drought: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
      Earthquake: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "harari",
    name: "Harari",
    lat: 9.31,
    lon: 42.12,
    zoom: 10,
    risk: "Low",
    riskColor: "#22c55e",
    riskBg: "rgba(34,197,94,0.10)",
    hazardRisks: {
      Earthquake: { level: "Low", color: "#22c55e" },
      Drought: { level: "Low", color: "#22c55e" },
      Flood: { level: "Low", color: "#22c55e" },
      Fire: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "addis",
    name: "Addis Ababa",
    lat: 9.03,
    lon: 38.74,
    zoom: 11,
    risk: "Low",
    riskColor: "#22c55e",
    riskBg: "rgba(34,197,94,0.10)",
    hazardRisks: {
      Earthquake: { level: "Low", color: "#22c55e" },
      Flood: { level: "Low", color: "#22c55e" },
      Fire: { level: "Low", color: "#22c55e" },
      Drought: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
  {
    id: "diredawa",
    name: "Dire Dawa",
    lat: 9.6,
    lon: 41.87,
    zoom: 11,
    risk: "Moderate",
    riskColor: "#eab308",
    riskBg: "rgba(234,179,8,0.10)",
    hazardRisks: {
      Drought: { level: "Moderate", color: "#eab308" },
      Earthquake: { level: "Moderate", color: "#eab308" },
      Flood: { level: "Low", color: "#22c55e" },
      Fire: { level: "Low", color: "#22c55e" },
      Landslide: { level: "Low", color: "#22c55e" },
      Volcano: { level: "Low", color: "#22c55e" },
    },
  },
];

const SHAPE_NAME_TO_ID = {
  "Addis Ababa": "addis",
  Afar: "afar",
  Amhara: "amhara",
  "Beneshangul Gumu": "benishangul",
  "Benishangul-Gumuz": "benishangul",
  "Dire Dawa": "diredawa",
  Gambela: "gambella",
  Gambella: "gambella",
  Hareri: "harari",
  Harari: "harari",
  Oromia: "oromia",
  SNNPR: "snnpr",
  "Southern Nations, Nationalities, and Peoples": "snnpr",
  "South Ethiopia": "south_ethiopia",
  "Central Ethiopia": "central_ethiopia",
  "South West Ethiopia": "south_west",
  Sidama: "sidama",
  Somali: "somali",
  Tigray: "tigray",
};

export function getFeatureRegionId(feature) {
  if (!feature || !feature.properties) return null;
  const p = feature.properties;
  const name =
    p.shapeName || p.name || p.NAME_1 || p.ADM1_EN || p.region || "";
  if (SHAPE_NAME_TO_ID[name]) return SHAPE_NAME_TO_ID[name];
  const clean = name.toLowerCase().replace(/[^a-z]/g, "");
  const found = ETHIOPIA_REGIONS.find(
    (r) =>
      r.id === clean ||
      r.name.toLowerCase().replace(/[^a-z]/g, "") === clean ||
      clean.includes(r.id),
  );
  return found ? found.id : clean;
}

const RISK_EMOJI = { Critical: "🔴", High: "🟠", Moderate: "🟡", Low: "🟢" };

const HAZARD_ICONS = {
  Fire: "/icons/icons8-fire-96.png",
  Flood: "/icons/icons8-flood-64.png",
  Drought: "/icons/icons8-drought-64.png",
  Earthquake: "/icons/icons8-earthquake-64.png",
  Landslide: "/icons/icons8-landslide-96.png",
  Volcano: "/icons/icons8-volcano-96.png",
};

// ── 1. RegionSelector — dropdown trigger button ────────────────────────────

/**
 * computeAllRegionRisks — compute live risk for all regions at once.
 * Call this in a useMemo/useEffect in each hazard page and pass result to RegionSelector.
 *
 * Returns: { regionId: { level, color }, ... }
 */
export function computeAllRegionRisks(hazardType, data) {
  const result = {};
  ETHIOPIA_REGIONS.forEach((region) => {
    const risk = computeRegionRisk(hazardType, region.id, data);
    if (risk) result[region.id] = risk;
  });
  return result;
}

export function RegionSelector({
  activeRegion,
  onSelect,
  liveHazard,
  regionRisks,
}) {
  const [open, setOpen] = React.useState(false);
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const wrapperRef = useRef(null);
  const selected = ETHIOPIA_REGIONS.find((r) => r.id === activeRegion);

  // Calculate dropdown position from button's screen coordinates.
  // Uses position:fixed so the dropdown escapes any overflow:hidden parent.
  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropLeft = Math.min(rect.left, window.innerWidth - 220);
      setDropPos({ top: rect.bottom + 4, left: Math.max(4, dropLeft) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (wrapperRef.current && wrapperRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  const pick = (id) => {
    setOpen(false);
    onSelect(id);
  };

  const triggerColor = selected ? selected.riskColor : "var(--text-secondary)";

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 10px",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          color: triggerColor,
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          outline: "none",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <FiMapPin
          size={11}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "120px",
          }}
        >
          {selected
            ? `${RISK_EMOJI[selected.risk]} ${selected.name}`
            : "All Ethiopia"}
        </span>
        <span
          style={{ fontSize: "9px", color: "var(--text-muted)", flexShrink: 0 }}
        >
          {open ? "\u25b2" : "\u25bc"}
        </span>
      </button>

      {/* Dropdown — position:fixed escapes overflow:hidden ancestors */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            minWidth: "215px",
            zIndex: 999999,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
            maxHeight: "300px",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* All Ethiopia (clear selection) */}
          <button
            onClick={() => pick(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "9px 12px",
              border: "none",
              borderBottom: "1px solid var(--border-light)",
              background: !activeRegion
                ? "rgba(128,128,128,0.10)"
                : "transparent",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <FiMapPin size={11} style={{ color: "var(--text-muted)" }} />
            All Ethiopia
          </button>

          {/* Region list */}
          {ETHIOPIA_REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => pick(r.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "9px 12px",
                border: "none",
                borderBottom: "1px solid var(--border-light)",
                background: activeRegion === r.id ? r.riskBg : "transparent",
                color:
                  activeRegion === r.id ? r.riskColor : "var(--text-primary)",
                fontSize: "12px",
                fontWeight: activeRegion === r.id ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "13px" }}>{RISK_EMOJI[r.risk]}</span>
              <span style={{ flex: 1 }}>{r.name}</span>
              {(() => {
                // Use live computed risk if available (from regionRisks prop), else static baseline
                const liveR = regionRisks && regionRisks[r.id];
                const bLevel = liveR
                  ? liveR.level
                  : r.hazardRisks[liveHazard]
                    ? r.hazardRisks[liveHazard].level
                    : r.risk;
                const bColor = liveR
                  ? liveR.color
                  : r.hazardRisks[liveHazard]
                    ? r.hazardRisks[liveHazard].color
                    : r.riskColor;
                return (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "999px",
                      color: bColor,
                      background: bColor + "18",
                      border: "1px solid " + bColor + "44",
                      textTransform: "uppercase",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bLevel}
                  </span>
                );
              })()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RegionGeoLayer({
  regionsGeo,
  geojsonData,
  geojson,
  activeRegion,
  selectedRegion,
  onSelect,
  onSelectRegion,
  regionRisks,
}) {
  const geo = regionsGeo || geojsonData || geojson;
  const currentRegion = activeRegion || selectedRegion;
  const handleSelect = onSelect || onSelectRegion;
  const map = useMap();
  const isFirstRender = useRef(true);

  // Fit map to the selected region's bounding box so the entire region is visible
  useEffect(() => {
    if (!currentRegion || !map) return;
    try {
      if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
      const b = REGION_BOUNDS[currentRegion];
      if (b) {
        map.flyToBounds(
          [
            [b.minLat, b.minLon],
            [b.maxLat, b.maxLon],
          ],
          {
            paddingTopLeft: [24, 24],
            paddingBottomRight: [260, 24],
            maxZoom: 9,
            animate: true,
            duration: 1.0,
          },
        );
      } else {
        // Fallback for regions without explicit bounds
        const region = ETHIOPIA_REGIONS.find((r) => r.id === currentRegion);
        if (region) {
          map.flyTo([region.lat, region.lon], region.zoom, {
            animate: true,
            duration: 1.0,
          });
        }
      }
    } catch (err) {}
  }, [currentRegion, map]);

  // When region is cleared (X button), fit back to full Ethiopia (skip on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (currentRegion === null && map) {
      let isMounted = true;
      const t = setTimeout(() => {
        if (!isMounted || !map) return;
        try {
          if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
          map.invalidateSize({ animate: false });
          map.fitBounds(
            [
              [3.0, 32.5],
              [15.2, 48.4],
            ],
            { padding: [6, 6], animate: false },
          );
        } catch (err) {}
      }, 50);

      return () => {
        isMounted = false;
        clearTimeout(t);
      };
    }
  }, [currentRegion, map]);

  if (!geo) return null;

  return (
    <GeoJSON
      key={currentRegion || "all"}
      data={geo}
      style={(feature) => {
        const id = getFeatureRegionId(feature);
        const region = ETHIOPIA_REGIONS.find((r) => r.id === id);
        if (!region) return { fillOpacity: 0, weight: 0 };
        const isSelected = currentRegion === id || currentRegion === region.id;
        // No colour at all when no region is selected
        if (!currentRegion) {
          return { fillOpacity: 0, weight: 0, opacity: 0 };
        }
        const liveR = regionRisks && regionRisks[id];
        const rColor = liveR ? liveR.color : region.riskColor;
        return {
          color: isSelected ? rColor : "rgba(255,255,255,0.18)",
          weight: isSelected ? 3.0 : 0.6,
          fillColor: rColor,
          fillOpacity: isSelected ? 0.38 : 0.04,
          opacity: isSelected ? 1 : 0.35,
        };
      }}
      onEachFeature={(feature, layer) => {
        const id = getFeatureRegionId(feature);
        const region = ETHIOPIA_REGIONS.find((r) => r.id === id);
        if (region) {
          layer.bindTooltip(
            `<strong>${region.name}</strong><br/>${RISK_EMOJI[region.risk]} ${region.risk} Risk`,
            { sticky: true },
          );
          layer.on("click", () => handleSelect && handleSelect(id));
        }
      }}
    />
  );
}

// ── Region bounding boxes for point-in-region checking ────────────────────
// Used by computeRegionRisk to filter live data to the selected region
const REGION_BOUNDS = {
  afar: { minLat: 9.5, maxLat: 14.9, minLon: 39.5, maxLon: 42.5 },
  oromia: { minLat: 3.5, maxLat: 10.5, minLon: 34.5, maxLon: 43.0 },
  amhara: { minLat: 9.5, maxLat: 14.0, minLon: 35.5, maxLon: 40.5 },
  somali: { minLat: 3.5, maxLat: 9.5, minLon: 40.0, maxLon: 47.9 },
  tigray: { minLat: 12.5, maxLat: 14.9, minLon: 36.5, maxLon: 40.5 },
  snnpr: { minLat: 3.5, maxLat: 8.5, minLon: 34.5, maxLon: 39.5 },
  benishangul: { minLat: 9.0, maxLat: 12.5, minLon: 34.0, maxLon: 37.5 },
  gambella: { minLat: 6.5, maxLat: 9.0, minLon: 33.0, maxLon: 36.0 },
  harari: { minLat: 9.1, maxLat: 9.5, minLon: 41.7, maxLon: 42.3 },
  addis: { minLat: 8.8, maxLat: 9.2, minLon: 38.5, maxLon: 39.0 },
  diredawa: { minLat: 9.4, maxLat: 9.8, minLon: 41.6, maxLon: 42.2 },
};

function inRegion(lat, lon, regionId) {
  const b = REGION_BOUNDS[regionId];
  if (!b) return false;
  return (
    lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon
  );
}

// ── Risk level thresholds ─────────────────────────────────────────────────
function countToFireRisk(count) {
  if (count >= 20) return { level: "High", color: "#ef4444" };
  if (count >= 5) return { level: "Moderate", color: "#eab308" };
  if (count >= 1) return { level: "Advisory", color: "#22c55e" };
  return { level: "Low", color: "#22c55e" };
}
function countToEqRisk(count, maxMag) {
  if (count >= 10 || maxMag >= 5.0) return { level: "High", color: "#ef4444" };
  if (count >= 3 || maxMag >= 3.5)
    return { level: "Moderate", color: "#eab308" };
  if (count >= 1) return { level: "Advisory", color: "#22c55e" };
  return { level: "Low", color: "#22c55e" };
}
function countToLandslideRisk(count) {
  if (count >= 5) return { level: "High", color: "#ef4444" };
  if (count >= 2) return { level: "Moderate", color: "#eab308" };
  if (count >= 1) return { level: "Advisory", color: "#22c55e" };
  return { level: "Low", color: "#22c55e" };
}
function countToVolcanoRisk(deformCount) {
  if (deformCount >= 2) return { level: "High", color: "#ef4444" };
  if (deformCount >= 1) return { level: "Moderate", color: "#eab308" };
  return { level: "Low", color: "#22c55e" };
}
function ratioToFloodRisk(ratio) {
  // ratio = current discharge / peak forecast
  if (ratio > 0.75) return { level: "High", color: "#ef4444" };
  if (ratio > 0.5) return { level: "Moderate", color: "#eab308" };
  if (ratio > 0.25) return { level: "Advisory", color: "#22c55e" };
  return { level: "Low", color: "#22c55e" };
}

/**
 * computeRegionRisk — call from a hazard page to get live risk for one hazard.
 *
 * Usage:
 *   // Fire page:
 *   const liveRisk = computeRegionRisk("Fire", activeRegion, { firePoints });
 *
 *   // Earthquake page:
 *   const liveRisk = computeRegionRisk("Earthquake", activeRegion, { earthquakes });
 *
 *   // Flood page: pass riverData + ETHIOPIA_RIVERS
 *   const liveRisk = computeRegionRisk("Flood", activeRegion, { riverData, rivers });
 *
 *   // Landslide page:
 *   const liveRisk = computeRegionRisk("Landslide", activeRegion, { landslides });
 *
 *   // Volcano page:
 *   const liveRisk = computeRegionRisk("Volcano", activeRegion, { volcanoes });
 *
 * Returns: { level, color } or null if not applicable
 */
export function computeRegionRisk(hazardType, regionId, data) {
  if (!regionId) return null;

  switch (hazardType) {
    case "Fire": {
      const pts = (data.firePoints || []).filter((p) =>
        inRegion(p.lat, p.lon, regionId),
      );
      return countToFireRisk(pts.length);
    }
    case "Earthquake": {
      const eqs = (data.earthquakes || []).filter((eq) => {
        const lat = eq.geometry?.coordinates?.[1];
        const lon = eq.geometry?.coordinates?.[0];
        return lat != null && inRegion(lat, lon, regionId);
      });
      const maxMag = eqs.reduce(
        (m, eq) => Math.max(m, eq.properties?.mag || 0),
        0,
      );
      return countToEqRisk(eqs.length, maxMag);
    }
    case "Landslide": {
      const ls = (data.landslides || []).filter((d) =>
        inRegion(parseFloat(d.latitude), parseFloat(d.longitude), regionId),
      );
      return countToLandslideRisk(ls.length);
    }
    case "Volcano": {
      const vs = (data.volcanoes || []).filter(
        (v) =>
          inRegion(parseFloat(v.latitude), parseFloat(v.longitude), regionId) &&
          v.deformation_observation === "Yes",
      );
      return countToVolcanoRisk(vs.length);
    }
    case "Flood": {
      // 1. AER FloodScan dataset support (SFED flood fraction + Return Period)
      if (data.floodScanByRegion) {
        const regionObj = ETHIOPIA_REGIONS.find((r) => r.id === regionId);
        const regName =
          regionObj?.name?.toLowerCase() || regionId.toLowerCase();
        const match = Object.entries(data.floodScanByRegion).find(
          ([name]) =>
            name.toLowerCase().includes(regName) ||
            regName.includes(name.toLowerCase()),
        );
        if (match && match[1]) {
          const stat = match[1];
          if (stat.sfed >= 0.015 || stat.rp === ">10")
            return { level: "Critical", color: "#dc2626" };
          if (stat.sfed >= 0.008 || stat.rp === "5-10")
            return { level: "High", color: "#f97316" };
          if (stat.sfed >= 0.002 || stat.rp === "2-5")
            return { level: "Moderate", color: "#eab308" };
          return { level: "Low", color: "#22c55e" };
        }
      }
      // 2. Fallback: river discharge model
      const rivers = data.rivers || [];
      const riverData = data.riverData || {};
      let maxRatio = 0;
      rivers.forEach((r) => {
        if (!inRegion(r.lat, r.lon, regionId)) return;
        const rd = riverData[r.name];
        if (!rd || !rd.values?.length) return;
        const cur = rd.values[0];
        const max = Math.max(...rd.values.filter(Boolean));
        if (max > 0) maxRatio = Math.max(maxRatio, cur / max);
      });
      return maxRatio > 0 ? ratioToFloodRisk(maxRatio) : null;
    }
    default:
      return null;
  }
}

// ── 3. RegionRiskCard — floating panel inside the map container ─────────────
// Props:
//   activeRegion: string | null
//   onClose: () => void
//   liveHazard: string | null   — the hazard this page monitors, e.g. "Fire"
//   liveRisk: { level, color } | null — computed via computeRegionRisk()
export function RegionRiskCard({
  activeRegion,
  onClose,
  liveHazard,
  liveRisk,
}) {
  if (!activeRegion) return null;
  const region = ETHIOPIA_REGIONS.find((r) => r.id === activeRegion);
  if (!region) return null;

  const hazardOrder = [
    "Fire",
    "Flood",
    "Drought",
    "Earthquake",
    "Landslide",
    "Volcano",
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "14px",
        right: "14px",
        zIndex: 1002,
        width: "235px",
        background: "var(--bg-card)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${region.riskColor}55`,
        borderRadius: "14px",
        boxShadow: `0 8px 28px rgba(0,0,0,0.22), 0 0 0 1px ${region.riskColor}18`,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: `1px solid ${region.riskColor}33`,
          background: region.riskBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "2px",
            }}
          >
            Regional Risk
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {region.name}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "3px",
              padding: "1px 7px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: region.riskColor,
              background: region.riskBg,
              border: `1px solid ${region.riskColor}44`,
            }}
          >
            {RISK_EMOJI[region.risk]} Overall {region.risk}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "16px",
            lineHeight: 1,
            padding: "2px",
            flexShrink: 0,
            alignSelf: "flex-start",
          }}
        >
          <FiX size={14} />
        </button>
      </div>

      {/* Hazard rows */}
      <div style={{ padding: "6px 0" }}>
        {hazardOrder.map((hazard) => {
          // Use live data for the hazard this page monitors, static baseline otherwise
          // isLive = true whenever this is the page's hazard (even if liveRisk is null, e.g. Drought raster)
          const isLiveRow = hazard === liveHazard;
          const risk =
            isLiveRow && liveRisk
              ? liveRisk
              : region.hazardRisks[hazard] || { level: "—", color: "#aaa" };
          // For Drought (raster-only): liveRisk is null but we still show LIVE badge
          const showLiveBadge = isLiveRow;
          const liveBadgeLabel =
            isLiveRow && !liveRisk ? "LIVE·Raster" : "LIVE";
          return (
            <div
              key={hazard}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
              }}
            >
              <img
                src={HAZARD_ICONS[hazard]}
                alt={hazard}
                style={{
                  width: 16,
                  height: 16,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "11.5px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {hazard}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {showLiveBadge && (
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      padding: "1px 4px",
                      borderRadius: "3px",
                      background: "#22c55e18",
                      color: "#22c55e",
                      border: "1px solid #22c55e44",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {liveBadgeLabel}
                  </span>
                )}
                <span
                  style={{
                    fontSize: "9.5px",
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: "999px",
                    textTransform: "uppercase",
                    color: risk.color,
                    background: risk.color + "14",
                    border: `1px solid ${risk.color}44`,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {risk.level}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note for static rows */}
      {liveHazard && (
        <div
          style={{
            padding: "4px 12px 8px",
            fontSize: "9px",
            color: "var(--text-muted)",
            fontStyle: "italic",
            borderTop: "1px solid var(--border-light)",
          }}
        >
          {liveHazard} risk is live · others are baseline estimates
        </div>
      )}
    </div>
  );
}
