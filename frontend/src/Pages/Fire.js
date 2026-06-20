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
import LocalDisasterData from "../Componenet/LocalDisasterData";
import EthiopiaMask from "../Componenet/EthiopiaMask";
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
        color: "#fff",
        fillColor: "#ff3300",
        fillOpacity: 0.9,
        radius: 5,
        weight: 0.8,
        opacity: 0.7,
      }
    : {
        color: "#fff",
        fillColor: "#ff8800",
        fillOpacity: 0.75,
        radius: 8,
        weight: 0.8,
        opacity: 0.7,
      };
}

// ── FIRMS fetch with proxy → direct fallback ───────────────────────────────
async function fetchFIRMS(startDate, endDate) {
  if (!MAP_KEY) throw new Error("No FIRMS MAP_KEY set in .env");

  const startAge = Math.ceil((new Date() - new Date(startDate)) / 86400000);
  const source = startAge <= 7 ? "VIIRS_SNPP_NRT" : "VIIRS_SNPP_SP";

  // Build chunks (FIRMS max 5 days per request)
  const chunks = [];
  let cursor = new Date(startDate);
  const endDt = new Date(endDate);
  while (cursor <= endDt) {
    const chunkStart = cursor.toISOString().slice(0, 10);
    const days = Math.min(5, Math.ceil((endDt - cursor) / 86400000) + 1);
    chunks.push({ date: chunkStart, days });
    cursor.setDate(cursor.getDate() + days);
  }

  // Try each base URL until one works
  async function fetchChunk(base, { date, days }) {
    const url = `${base}/api/area/csv/${MAP_KEY}/${source}/${ETH_BBOX}/${days}/${date}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    // FIRMS returns an error message (not CSV) if key is invalid
    if (
      text.startsWith("Invalid") ||
      text.startsWith("Error") ||
      text.includes("not a valid")
    ) {
      throw new Error(text.trim());
    }
    return text;
  }

  const csvTexts = await Promise.all(
    chunks.map(async (chunk) => {
      for (const base of FIRMS_URLS) {
        try {
          return await fetchChunk(base, chunk);
        } catch (e) {
          console.warn(`FIRMS via ${base} failed:`, e.message);
        }
      }
      return ""; // all bases failed for this chunk
    }),
  );

  const points = [];
  for (const csv of csvTexts) {
    if (!csv.trim()) continue;
    Papa.parse(csv, { header: true, skipEmptyLines: true }).data.forEach(
      (row) => {
        const p = parseFirePoint(row);
        if (p) points.push(p);
      },
    );
  }
  return points;
}

// ── CSV download ───────────────────────────────────────────────────────────
function downloadCSV(points) {
  if (!points.length) return;
  const header =
    "latitude,longitude,acq_date,acq_time,frp,confidence,satellite";
  const rows = points.map(
    (p) =>
      `${p.lat},${p.lon},${p.acq_date},${p.acq_time},${p.frp},${p.confidence},${p.satellite}`,
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], {
    type: "text/csv",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ethiopia_fires.csv";
  a.click();
}

// ── Leaflet pane helper ────────────────────────────────────────────────────
function CreatePane({ name, zIndex }) {
  const map = useMap();
  if (!map.getPane(name)) {
    const p = map.createPane(name);
    p.style.zIndex = String(zIndex);
    p.style.pointerEvents = "none";
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

// ── Main component ─────────────────────────────────────────────────────────
function Fire() {
  const today = getToday();
  const yesterday = daysAgo(1);
  const c = useColors();

  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(yesterday);
  const [firePoints, setFirePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapType, setMapType] = useState("default");

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const requestStart = startDate || DEFAULT_FIRE_START;
      const requestEnd = endDate || today;
      if (!requestStart || !requestEnd) return;
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      fetchFIRMS(requestStart, requestEnd)
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
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

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
        const res = await fetch("/api/uploads?hazardType=fire");
        if (!res.ok) throw new Error("Failed to fetch uploads");
        const data = await res.json();
        if (!cancelled) {
          setHasLocalUploads(data.length > 0);
        }
      } catch {
        // Try localStorage as fallback
        if (!cancelled) {
          const saved = JSON.parse(
            localStorage.getItem("disasterUploads") || "[]",
          );
          const fireUploads = saved.filter((u) => u.disasterType === "Fire");
          setHasLocalUploads(fireUploads.length > 0);
        }
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
    startDate && endDate
      ? `${startDate}/${endDate}`
      : endDate || startDate || today;

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
          flex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Top row — Local and Global side-by-side */}
        <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
          {/* Local Data */}
          <div
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: c.bgSecondary,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${c.borderLight}`,
            }}
          >
            <div
              style={{
                overflow: "auto",
                marginBottom: "10px",
              }}
            >
              <LocalDisasterData disasterType="Fire" />
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {!hasLocalUploads && (
                <div
                  style={{
                    flex: 1,
                    minHeight: "340px",
                    marginBottom: "10px",
                    position: "relative",
                  }}
                >
                  <MapContainer
                    center={[9.145, 40.489673]}
                    zoom={6}
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
                        style={{
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "1px solid #444",
                          background: mapType === key ? "#00aaff" : "#222",
                          color: mapType === key ? "#000" : "#aaa",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Global Data */}
          <div style={cardStyle}>
            <div style={titleStyle}>Global Fire Data (Ethiopia)</div>
            <div className="controls-row">
              <div className="date-input-wrap">
                <input
                  type="date"
                  value={startDate}
                  max={endDate || today}
                  min="2012-01-19"
                  data-placeholder="Start Date"
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-wrap">
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={today}
                  data-placeholder="End Date"
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button
                className="csv-btn"
                onClick={() => downloadCSV(firePoints)}
              >
                Download CSV
              </button>
            </div>
            {(loading || error) && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  paddingBottom: "4px",
                  color: error ? "#ff6060" : c.textMuted,
                }}
              >
                {loading ? "Loading fire data…" : `⚠ ${error}`}
              </div>
            )}

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
                zoom={6}
                style={{ height: "100%", width: "100%", minHeight: "340px" }}
              >
                <CreatePane name="fireOverlayPane" zIndex={450} />
                <CreatePane name="fireMarkersPane" zIndex={500} />
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
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid #444",
                      background: mapType === key ? "#00aaff" : "#222",
                      color: mapType === key ? "#000" : "#aaa",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
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
