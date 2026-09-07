import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "../styles/GlobalDataCard.css";
import LocalDisasterData, {
  UploadedImageFill,
} from "../Componenet/LocalDisasterData";
import EthiopiaMask, {
  fetchEthiopiaFeature,
} from "../Componenet/EthiopiaMask";
import { useColors } from "../useColors";

// ── Constants ──────────────────────────────────────────────────────────────
const ETH_BBOX = "33,3,48,15";
const MAP_KEY = process.env.REACT_APP_FIRMS_MAP_KEY || "";
const RECENT_MS = 24 * 60 * 60 * 1000;

// Try proxy first (avoids CORS), fall back to direct FIRMS URL
const FIRMS_URLS = [
  "/api/firms", // Express proxy
  "https://firms.modaps.eosdis.nasa.gov", // direct (FIRMS sends CORS headers)
];

// ── Date helpers ───────────────────────────────────────────────────────────
const getToday = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const DEFAULT_FIRE_START = "2012-01-19";

// ── Parse one FIRMS CSV row ────────────────────────────────────────────────
function parseFirePoint(row) {
  const lat = parseFloat(row.latitude);
  const lon = parseFloat(row.longitude);
  if (isNaN(lat) || isNaN(lon)) return null;
  const dateStr = row.acq_date || "";
  const timeStr = String(row.acq_time || "0").padStart(4, "0");
  const timestamp = new Date(
    `${dateStr}T${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:00Z`,
  ).getTime();
  return {
    lat,
    lon,
    timestamp,
    acq_date: dateStr,
    acq_time: timeStr,
    confidence: row.confidence || "n",
    frp: parseFloat(row.frp) || 0,
    satellite: row.satellite || "",
  };
}

// ── Marker style by age ────────────────────────────────────────────────────
function markerProps(timestamp) {
  const isRecent = Date.now() - timestamp <= RECENT_MS;
  return isRecent
    ? {
        // 🔴 Recent fires (< 24h)
        color: "#fff",
        fillColor: "#ff3300",
        fillOpacity: 0.95,
        radius: 6,
        weight: 1,
        opacity: 0.95,
      }
    : {
        // 🟠 Older fires (> 24h)
        color: "#fff",
        fillColor: "#ff8800",
        fillOpacity: 0.85,
        radius: 6,
        weight: 1,
        opacity: 0.9,
      };
}

// ── Real Ethiopia border — point-in-polygon ────────────────────────────────
// Uses the same GeoJSON that EthiopiaMask fetches & caches, so markers are
// clipped to the exact same border as the WMS overlay.
// Supports both Polygon and MultiPolygon geometry types.
function ringContains(ring, lat, lon) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // GeoJSON: [lon, lat]
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideEthiopia(lat, lon, feature) {
  if (!feature) return true; // GeoJSON not loaded yet → show everything
  const geom = feature.geometry;
  const polys =
    geom.type === "Polygon"
      ? [geom.coordinates]
      : geom.coordinates; // MultiPolygon
  return polys.some((poly) => {
    // poly[0] = outer ring, poly[1..] = holes
    if (!ringContains(poly[0], lat, lon)) return false;
    // If inside a hole, the point is outside
    for (let h = 1; h < poly.length; h++) {
      if (ringContains(poly[h], lat, lon)) return false;
    }
    return true;
  });
}

// ── FIRMS fetch ─────────────────────────────────────────────────────────────
// FIRMS API (confirmed from their source):
//   Without date: /api/area/csv/{key}/{src}/{bbox}/{days}
//     → returns most recent data (TODAY back to TODAY-days+1), max days=5
//   With date:    /api/area/csv/{key}/{src}/{bbox}/{days}/{date}
//     → returns data for DATE to DATE+days-1, max days=5
//
// presetDays: if set, use no-date mode (reliable, most recent N days)
// startDate/endDate: if set, use date-based chunked mode for custom range
async function fetchFIRMS({ presetDays = null, startDate = null, endDate = null } = {}) {
  if (!MAP_KEY) throw new Error("No FIRMS MAP_KEY set in .env");

  const CHUNK = 5; // FIRMS max per request
  const now   = new Date();

  // ── Fetch one chunk helper ────────────────────────────────────────────────
  async function fetchChunk(days, date = null) {
    const ageOfStart = date
      ? Math.floor((now - new Date(date)) / 86400000)
      : 0; // no-date = most recent → always NRT
    const source = ageOfStart <= 60 ? "VIIRS_SNPP_NRT" : "VIIRS_SNPP_SP";
    const firmsPath = date
      ? `/api/area/csv/${MAP_KEY}/${source}/${ETH_BBOX}/${days}/${date}`
      : `/api/area/csv/${MAP_KEY}/${source}/${ETH_BBOX}/${days}`;

    for (const base of FIRMS_URLS) {
      try {
        const url = base === "/api/firms" ? `/api/firms${firmsPath}` : `${base}${firmsPath}`;
        const r   = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        if (
          text.startsWith("Invalid") ||
          text.startsWith("Error")   ||
          text.includes("not a valid")
        ) throw new Error(text.trim());
        return text;
      } catch (e) {
        console.warn(`FIRMS chunk (days=${days} date=${date}) via ${base} failed:`, e.message);
      }
    }
    return "";
  }

  // ── Build chunks ──────────────────────────────────────────────────────────
  let csvTexts = [];
  let filterStartTs = 0;
  let filterEndTs   = Date.now();

  if (presetDays !== null) {
    // No-date mode: request the most recent N days in CHUNK-sized pieces.
    // We fire multiple requests, each without a date, going N days back.
    // But FIRMS' no-date mode always returns "most recent N days" —
    // to get a range > 5 days we must use date-based chunking from today backward.
    // Use today → today-(CHUNK-1), then today-CHUNK → today-(2*CHUNK-1), etc.
    const todayStr = getToday();
    let remaining  = presetDays;
    let chunkEndDate = new Date(todayStr);
    const chunks = [];

    while (remaining > 0) {
      const days      = Math.min(CHUNK, remaining);
      const chunkDate = new Date(chunkEndDate);
      chunkDate.setDate(chunkDate.getDate() - (days - 1));
      chunks.push({ days, date: chunkDate.toISOString().slice(0, 10) });
      chunkEndDate.setDate(chunkEndDate.getDate() - days);
      remaining -= days;
    }

    csvTexts = await Promise.all(chunks.map(({ days, date }) => fetchChunk(days, date)));

    const startDt = new Date(todayStr);
    startDt.setDate(startDt.getDate() - (presetDays - 1));
    const endDt = new Date(todayStr);
    filterStartTs = Date.UTC(startDt.getUTCFullYear(), startDt.getUTCMonth(), startDt.getUTCDate(), 0, 0, 0);
    filterEndTs   = Date.UTC(endDt.getUTCFullYear(),   endDt.getUTCMonth(),   endDt.getUTCDate(),   23, 59, 59);


  } else {
    // Date-based chunked mode for custom calendar range
    const startDt      = new Date(startDate);
    const effectiveEnd = new Date(endDate) > now ? now : new Date(endDate);
    const chunks       = [];
    let cursor         = new Date(startDt);

    while (cursor <= effectiveEnd) {
      const chunkDate    = cursor.toISOString().slice(0, 10);
      const daysLeft     = Math.floor((effectiveEnd - cursor) / 86400000) + 1;
      const days         = Math.min(CHUNK, daysLeft);
      chunks.push({ days, date: chunkDate });
      cursor.setDate(cursor.getDate() + days);
    }

    csvTexts = await Promise.all(chunks.map(({ days, date }) => fetchChunk(days, date)));

    filterStartTs = Date.UTC(startDt.getUTCFullYear(), startDt.getUTCMonth(), startDt.getUTCDate(), 0, 0, 0);
    filterEndTs   = Date.UTC(effectiveEnd.getUTCFullYear(), effectiveEnd.getUTCMonth(), effectiveEnd.getUTCDate(), 23, 59, 59);
  }

  // ── Fetch real Ethiopia border (cached) ───────────────────────────────────
  let ethiopiaFeature = null;
  try {
    ethiopiaFeature = await fetchEthiopiaFeature();
  } catch (e) {
    console.warn("Ethiopia GeoJSON unavailable:", e.message);
  }

  // ── Parse & filter ────────────────────────────────────────────────────────
  const points = [];
  for (const csv of csvTexts) {
    if (!csv || !csv.trim()) continue;
    Papa.parse(csv, { header: true, skipEmptyLines: true }).data.forEach((row) => {
      const p = parseFirePoint(row);
      if (!p) return;
      if (!isInsideEthiopia(p.lat, p.lon, ethiopiaFeature)) return;
      if (p.timestamp < filterStartTs || p.timestamp > filterEndTs) return;
      points.push(p);
    });
  }
  return points;
}


// ── CSV download ───────────────────────────────────────────────────────────
function downloadCSV(points, startDate, endDate) {
  if (!points.length) return;
  const header =
    "latitude,longitude,acq_date,acq_time,frp,confidence,satellite";
  const rows = points.map(
    (p) =>
      `${p.lat},${p.lon},${p.acq_date},${p.acq_time},${p.frp.toFixed(2)},${p.confidence},${p.satellite}`,
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ethiopia_fires_${startDate}_to_${endDate}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Leaflet pane helper ────────────────────────────────────────────────────
// overlayClickable=false → pointer-events: none  (WMS tile panes — don't intercept clicks)
// overlayClickable=true  → pointer-events: auto  (marker panes — must receive clicks)
function CreatePane({ name, zIndex, clickable = false }) {
  const map = useMap();
  if (!map.getPane(name)) {
    const p = map.createPane(name);
    p.style.zIndex = String(zIndex);
    p.style.pointerEvents = clickable ? "auto" : "none";
  }
  return null;
}

// ── Fire detail panel (click overlay) ─────────────────────────────────────
function FireDetailPanel({ pt, onClose }) {
  if (!pt) return null;
  const isRecent = Date.now() - pt.timestamp <= RECENT_MS;
  const color = isRecent ? "#ff3300" : "#ff8800";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="detail-panel-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "12px",
          maxWidth: "360px",
          width: "100%",
          padding: "20px",
          fontFamily: "sans-serif",
          fontSize: "13px",
          lineHeight: "1.7",
          position: "relative",
          boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
          border: "1px solid #333",
        }}
      >
        <button
          className="detail-close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <div
          style={{
            height: "4px",
            background: color,
            borderRadius: "4px",
            marginBottom: "14px",
          }}
        />

        <div
          className="detail-title"
          style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "10px" }}
        >
          {isRecent ? "🔴 Recent Fire (< 24h)" : "🟠 Older Fire (> 24h)"}
        </div>

        <div className="detail-value">
          <span className="detail-label">Date: </span>
          {pt.acq_date}
        </div>
        <div className="detail-value">
          <span className="detail-label">Time (UTC): </span>
          {pt.acq_time.slice(0, 2)}:{pt.acq_time.slice(2, 4)}
        </div>
        <div className="detail-value">
          <span className="detail-label">FRP: </span>
          {pt.frp.toFixed(1)} MW
        </div>
        <div className="detail-value">
          <span className="detail-label">Confidence: </span>
          {pt.confidence}
        </div>
        <div className="detail-value">
          <span className="detail-label">Satellite: </span>
          {pt.satellite}
        </div>
        <div className="detail-value" style={{ marginTop: "4px" }}>
          <span className="detail-label">Location: </span>
          {pt.lat.toFixed(4)}°N, {pt.lon.toFixed(4)}°E
        </div>
      </div>
    </div>
  );
}

// ── Fire markers ───────────────────────────────────────────────────────────
function FireMarkers({ points, onSelect }) {
  if (!points?.length) return null;
  return points.map((pt, i) => {
    const props = markerProps(pt.timestamp);
    const isRecent = Date.now() - pt.timestamp <= RECENT_MS;
    return (
      <CircleMarker
        key={`${pt.lat}-${pt.lon}-${i}`}
        center={[pt.lat, pt.lon]}
        radius={props.radius}
        pane="fireMarkersPane"
        pathOptions={{
          color: props.color,
          fillColor: props.fillColor,
          fillOpacity: props.fillOpacity,
          weight: props.weight,
          opacity: props.opacity,
        }}
        eventHandlers={{ click: () => onSelect(pt) }}
      >
        <Tooltip
          direction="top"
          offset={[0, -4]}
          opacity={1}
          sticky={false}
          className="fire-tooltip"
        >
          <div
            style={{
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#111",
              background: "#fff",
              padding: "4px 6px",
              borderRadius: "4px",
              minWidth: "140px",
            }}
          >
            <strong style={{ color: isRecent ? "#cc2200" : "#cc6600" }}>
              {isRecent ? "🔴 Recent Fire" : "🟠 Older Fire"}
            </strong>
            <br />
            <span style={{ color: "#333" }}>
              {pt.lat.toFixed(3)}°N, {pt.lon.toFixed(3)}°E
            </span>
            <br />
            <span style={{ color: "#444" }}>
              {pt.acq_date} · FRP: {pt.frp.toFixed(1)} MW
            </span>
          </div>
        </Tooltip>
      </CircleMarker>
    );
  });
}

// ── Fire overlay ───────────────────────────────────────────────────────────
function FireOverlay({ wmsDate, points, onSelect }) {
  return (
    <>
      <WMSTileLayer
        key={`wms-${wmsDate}`}
        url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
        layers="VIIRS_SNPP_Thermal_Anomalies_375m_All"
        format="image/png"
        transparent
        time={wmsDate}
        opacity={0.55}
        pane="fireOverlayPane"
        attribution="NASA GIBS · VIIRS SNPP"
      />
      <EthiopiaMask paneNames={["fireOverlayPane"]} />
      <FireMarkers points={points} onSelect={onSelect} />
    </>
  );
}

// ── Shared card styles ─────────────────────────────────────────────────────
const cardStyle = {
  flex: 1,
  backgroundColor: "var(--bg-card)",
  borderRadius: "10px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};
const titleStyle = {
  color: "var(--accent-blue)",
  fontWeight: "bold",
  fontSize: "18px",
  textAlign: "center",
  padding: "12px 16px 8px",
};

// ── Map tile configuration ────────────────────────────────────────────────
const MAP_TYPES = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    label: "Default",
    description: "Streets, businesses, and transit lines",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    label: "Satellite",
    description: "Aerial photography and satellite imagery",
  },
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    label: "Terrain",
    description: "Physical landscape showing elevation and topography",
  },
};

const mapTypeToggleStyle = {
  position: "absolute",
  bottom: "12px",
  right: "12px",
  display: "flex",
  gap: "6px",
  zIndex: 1000,
};

function MapTypeToggle({ mapType, setMapType }) {
  return (
    <div style={mapTypeToggleStyle}>
      {Object.entries(MAP_TYPES).map(([key, type]) => (
        <button
          key={key}
          onClick={() => setMapType(key)}
          title={type.description}
          className={`map-toggle-btn${mapType === key ? " active" : ""}`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

// ── Filter presets — fixed buttons (mirrors NASA FIRMS) ─────────────────────
const FILTER_PRESETS = [
  { id: "today",  label: "TODAY",  presetDays: 1  },
  { id: "24hrs",  label: "24HRS",  presetDays: 2  },
  { id: "7days",  label: "7DAYS",  presetDays: 7  },
];

// Labels for the days dropdown (WEEK / 2–4 WEEKS for multiples of 7)
function getDayLabel(n) {
  if (n === 7)  return "WEEK";
  if (n === 14) return "2 WEEKS";
  if (n === 21) return "3 WEEKS";
  if (n === 28) return "4 WEEKS";
  return `${n} day${n !== 1 ? "s" : ""}`;
}

// ── Main component ─────────────────────────────────────────────────────────
function Fire() {
  const today = getToday();
  const c = useColors();

  const [filterMode, setFilterMode]             = useState("24hrs");
  const [customDays, setCustomDays]             = useState(7);
  const [customStartDate, setCustomStartDate]   = useState(() => daysAgo(6)); // default: 7 days ending today
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [firePoints, setFirePoints]             = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [hasLocalUploads, setHasLocalUploads]   = useState(false);
  const [selectedFire, setSelectedFire]         = useState(null);
  const [mapType, setMapType]                   = useState("default");

  const debounceRef  = useRef(null);
  const abortRef     = useRef(null);
  const dropdownRef  = useRef(null);

  // Derive display start/end for status bar, CSV filename, and fetch args.
  // For custom: start = customStartDate, end = min(start + days - 1, today)
  const activePreset = FILTER_PRESETS.find((p) => p.id === filterMode);
  const displayStart = filterMode === "custom"
    ? customStartDate
    : activePreset ? daysAgo(activePreset.presetDays - 1) : today;
  const displayEnd = filterMode === "custom"
    ? (() => {
        const d = new Date(customStartDate);
        d.setDate(d.getDate() + customDays - 1);
        const raw = d.toISOString().slice(0, 10);
        return raw > today ? today : raw; // clamp to today — no future fire data
      })()
    : today;


  // Close the days dropdown when user clicks outside
  useEffect(() => {
    if (!showDaysDropdown) return;
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDaysDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showDaysDropdown]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);

      // Build the right call depending on mode
      const fetchArgs = filterMode === "custom"
        ? { startDate: customStartDate, endDate: displayEnd }
        : { presetDays: activePreset?.presetDays ?? 1 };

      fetchFIRMS(fetchArgs)
        .then((pts) => {
          if (ctrl.signal.aborted) return;
          pts.sort((a, b) => b.timestamp - a.timestamp);
          setFirePoints(pts);
          setLoading(false);
        })
        .catch((err) => {
          if (ctrl.signal.aborted) return;
          console.error("FIRMS fetch failed:", err);
          setError(err.message || "Failed to load fire data");
          setLoading(false);
        });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, customDays, customStartDate]);




  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
    },
    [],
  );

  // Check for local uploads
  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch("/api/uploads?hazardType=fire&status=approved");
        if (!res.ok) throw new Error("Failed to fetch uploads");
        const data = await res.json();
        if (!cancelled) {
          setHasLocalUploads(data.length > 0);
        }
      } catch {
        // On fetch failure, keep current state — don't hide the map
      }
    };
    checkUploads();
    const pollId = setInterval(checkUploads, 8000);
    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, []);

  const wmsDate =
    displayStart && displayEnd
      ? `${displayStart}/${displayEnd}`
      : displayEnd || displayStart || today;


  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        backgroundColor: c.bgPrimary,
        transition: "background-color 0.3s",
      }}
    >
      {/* Click detail panel — fixed overlay */}
      <FireDetailPanel
        pt={selectedFire}
        onClose={() => setSelectedFire(null)}
      />
      {/* LEFT COLUMN — wider */}
      <div
        style={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Top row — Local and Global side-by-side */}
        <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
          {/* ── Local Data card — mirrors global card layout ── */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#1a1a1a",
              borderRadius: "10px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Title — always visible, same style as global */}
            <div style={titleStyle}>Local Fire Data (Ethiopia)</div>

            {/* Metadata section — fixed height */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2a",
                minHeight: "72px",
              }}
            >
              <LocalDisasterData
                disasterType="Fire"
                onUploadReady={(upload) => setHasLocalUploads(!!upload)}
              />
            </div>

            {/* Fill area — map OR uploaded image, stretches to bottom */}
            <div style={{ flex: 1, position: "relative", minHeight: "340px" }}>
              {hasLocalUploads ? (
                <UploadedImageFill disasterType="Fire" />
              ) : (
                <>
                  <MapContainer
                    center={[9.145, 40.489673]}
                    zoom={5}
                    style={{
                      height: "100%",
                      width: "100%",
                      minHeight: "340px",
                    }}
                  >
                    <TileLayer
                      attribution={MAP_TYPES[mapType].attribution}
                      url={MAP_TYPES[mapType].url}
                    />
                    <EthiopiaMask paneNames={[]} />
                  </MapContainer>
                  <MapTypeToggle mapType={mapType} setMapType={setMapType} />
                </>
              )}
            </div>
          </div>

          {/* Global Data */}
          <div style={cardStyle}>
            <div style={titleStyle}>Global Fire Data (Ethiopia)</div>

            {/* ── Filter bar: TODAY / 24HRS / 7DAYS + days dropdown + CSV ── */}
            <div className="controls-row" style={{ gap: "5px", paddingBottom: "8px", flexWrap: "nowrap" }}>
              {/* Fixed preset buttons */}
              {FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`fire-filter-btn${filterMode === preset.id ? " active" : ""}`}
                  onClick={() => { setFilterMode(preset.id); setShowDaysDropdown(false); }}
                >
                  {preset.label}
                </button>
              ))}

              {/* Days dropdown trigger */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  className={`fire-filter-btn fire-filter-btn--cal${filterMode === "custom" ? " active" : ""}`}
                  onClick={() => setShowDaysDropdown((v) => !v)}
                  title="Select start date and number of days"
                >
                  {filterMode === "custom" ? getDayLabel(customDays) : "📅"}
                  <span style={{ marginLeft: 3, fontSize: 9 }}>▼</span>
                </button>

                {showDaysDropdown && (
                  <div className="fire-days-dropdown">
                    {/* Selectable calendar date at top */}
                    <div className="fire-days-dropdown-header">
                      <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.8 }}>Start date</div>
                      <input
                        type="date"
                        value={customStartDate}
                        max={getToday()}
                        className="fire-days-date-input"
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setCustomStartDate(e.target.value);
                          setFilterMode("custom");
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.currentTarget.showPicker?.();
                        }}
                      />
                    </div>
                    {/* Day range options 1–31 */}
                    <div className="fire-days-dropdown-list">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          className={`fire-days-dropdown-item${
                            filterMode === "custom" && customDays === n ? " active" : ""
                          }${n === 7 || n === 14 || n === 21 || n === 28 ? " special" : ""}`}
                          onClick={() => {
                            setFilterMode("custom");
                            setCustomDays(n);
                            setShowDaysDropdown(false);
                          }}
                        >
                          {getDayLabel(n)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CSV download — no spacer, pushed naturally by flex */}
              <button
                className="csv-btn"
                style={{ marginLeft: "auto" }}
                onClick={() => downloadCSV(firePoints, displayStart, displayEnd)}
                disabled={!firePoints.length}
                title={`Download ${firePoints.length} fire point${firePoints.length !== 1 ? "s" : ""} as CSV`}
              >
                ⬇ Download CSV
              </button>
            </div>

            {/* Status / count row */}
            <div
              style={{
                padding: "0 12px 6px",
                fontSize: "11px",
                color: error ? "#ff6060" : c.textMuted,
                minHeight: "18px",
              }}
            >
              {loading
                ? "⏳ Loading fire data…"
                : error
                ? `⚠ ${error}`
                : firePoints.length > 0
                ? `🔥 ${firePoints.length} fire point${firePoints.length !== 1 ? "s" : ""} · ${displayStart}${displayStart !== displayEnd ? ` → ${displayEnd}` : ""}`
                : "No fire data for this period"}
            </div>




            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                padding: "0 12px 8px",
                flexWrap: "wrap",
              }}
            >
              {[
                { color: "#ff3300", label: "Recent fire (< 24h)" },
                { color: "#ff8800", label: "Older fire (> 24h)" },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    color: "#aaa",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minHeight: "340px", position: "relative" }}>
              <MapContainer
                center={[9.145, 40.489673]}
                zoom={5}
                style={{ height: "100%", width: "100%", minHeight: "340px" }}
              >
                <CreatePane name="fireOverlayPane" zIndex={450} clickable={false} />
                <CreatePane name="fireMarkersPane" zIndex={500} clickable={true} />
                <TileLayer
                  attribution={MAP_TYPES[mapType].attribution}
                  url={MAP_TYPES[mapType].url}
                />
                <FireOverlay
                  wmsDate={wmsDate}
                  points={firePoints}
                  onSelect={setSelectedFire}
                />
              </MapContainer>
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  display: "flex",
                  gap: "6px",
                  zIndex: 1000,
                }}
              >
                {Object.entries(MAP_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setMapType(key)}
                    title={type.description}
                    className={`map-toggle-btn${mapType === key ? " active" : ""}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div
          style={{
            padding: "15px",
            backgroundColor: c.bgSecondary,
            borderRadius: "8px",
            textAlign: "center",
            border: `1px solid ${c.borderLight}`,
          }}
        >
          <h3 style={{ color: c.accentBlue }}>Comparison</h3>
          <p style={{ color: c.textMuted }}>
            Comparison of uploaded local fire data with NASA VIIRS thermal
            anomaly observations over Ethiopia.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN — narrower */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: "20px",
        }}
      >
        {[
          "Time Series",
          "Spatial Analysis",
          "Risk Assessment",
          "Forecast / Prediction",
        ].map((t) => (
          <div
            key={t}
            style={{
              padding: "15px",
              backgroundColor: c.bgSecondary,
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${c.borderLight}`,
            }}
          >
            <h4 style={{ color: c.accentBlue, marginBottom: "8px" }}>{t}</h4>
            <p style={{ color: c.textMuted }}>
              Placeholder for {t.toLowerCase()} graph/analysis.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Fire;
