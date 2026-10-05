import { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import Papa from "papaparse";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import "leaflet/dist/leaflet.css";
import "../styles/GlobalDataCard.css";
import "../styles/HazardPage.css";
import LocalDisasterData, {
  UploadedImageFill,
} from "../Componenet/LocalDisasterData";
import EthiopiaMask, { fetchEthiopiaFeature } from "../Componenet/EthiopiaMask";
import FitEthiopia from "../Componenet/FitEthiopia";
import { useColors } from "../useColors";
import {
  RegionSelector,
  RegionGeoLayer,
  RegionRiskCard,
  computeRegionRisk,
  computeAllRegionRisks,
  ETHIOPIA_REGIONS,
} from "../Componenet/RegionRiskPanel";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler,
);

// ── Multi-criteria fire risk (GIS weighted overlay) ───────────────────────
// Based on: Drought Index (40%) + Vegetation/Fuel Type (40%) + Wind (20%)
// Reference: weighted linear combination formula from fire risk literature.

// Vegetation fuel hazard scores (1=Very Low … 5=Very High)
// Assigned from Ethiopian land cover classification (Birhane et al., 2019;
// Global Land Cover 30m data for Ethiopia).
const VEGETATION_SCORES = {
  "Addis Ababa": 1, // urban — minimal fuel
  Harari: 2, // urban/agricultural edges
  "Dire Dawa": 3, // semi-arid acacia scrub
  Sidama: 2, // highland coffee/montane forest (moist)
  "South West Ethiopia Peoples": 2, // tropical highland rainforest
  "Central Ethiopia": 3, // highland mixed woodland
  Gambella: 4, // tropical savanna / floodplain grassland
  "Benishangul-Gumuz": 4, // Combretum-Terminalia woodland
  Tigray: 4, // degraded shrubland / dry Afromontane
  Afar: 4, // sparse desert scrub / dry grassland
  Amhara: 3, // highland Afromontane mixed
  Oromia: 4, // acacia savanna / highland grassland
  SNNPR: 3, // montane mixed forest / enset farmland
  Somali: 3, // arid acacia-Commiphora bushland
};

function getVegetationScore(regionName) {
  // Try exact match first, then partial
  if (VEGETATION_SCORES[regionName] !== undefined)
    return VEGETATION_SCORES[regionName];
  const key = Object.keys(VEGETATION_SCORES).find(
    (k) =>
      regionName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(regionName.toLowerCase()),
  );
  return key ? VEGETATION_SCORES[key] : 3; // default: moderate
}

// Drought score from 30-day cumulative precipitation (mm)
// Proxy for KBDI / SPI: < 10 mm = extremely dry → 5; > 100 mm = wet → 1
function calcDroughtScore(precip30d) {
  if (precip30d < 10) return 5; // extremely dry — very high ignition potential
  if (precip30d < 30) return 4; // dry
  if (precip30d < 60) return 3; // moderately dry
  if (precip30d < 100) return 2; // moist
  return 1; // wet / saturated
}

// Wind speed score from km/h (Open-Meteo default unit)
function calcWindSpeedScore(kmh) {
  if (kmh < 5) return 1; // calm
  if (kmh < 10) return 2; // light breeze
  if (kmh < 20) return 3; // moderate
  if (kmh < 30) return 4; // fresh — high spread potential
  return 5; // strong — extreme spread potential
}

// Wind direction modifier (±0.5)
// In Ethiopia, NE/N winds (Harmattan-like) bring dry air → higher risk.
// SW/W winds (Indian Ocean moisture) lower risk.
function calcWindDirModifier(degrees) {
  const d = ((degrees % 360) + 360) % 360;
  if (d < 90 || d >= 315) return 0.5; // N/NE: dry, dangerous
  if (d < 180) return 0.0; // SE: neutral
  return -0.3; // SW/W: humid, lower spread
}

// Composite score: Fire Risk = (V×0.40) + (D×0.40) + (W×0.20)
// Input scores are on 1–5 scale; output is 1–5 (clamped).
function calcCompositeScore(V, D, W_speed, W_dir_deg) {
  const W = Math.min(
    5,
    Math.max(1, calcWindSpeedScore(W_speed) + calcWindDirModifier(W_dir_deg)),
  );
  return +Math.min(5, Math.max(1, V * 0.4 + D * 0.4 + W * 0.2)).toFixed(2);
}

// Natural-breaks tier classification (1–5 → Low / Moderate / High / Extreme)
function getRiskTier(score) {
  if (score >= 4.0)
    return { label: "Extreme", color: "#dc2626", bg: "#dc262618" };
  if (score >= 3.0) return { label: "High", color: "#f97316", bg: "#f9731618" };
  if (score >= 2.0)
    return { label: "Moderate", color: "#eab308", bg: "#eab30818" };
  return { label: "Low", color: "#22c55e", bg: "#22c55e18" };
}

// ── Constants ──────────────────────────────────────────────────────────────
const ETH_BBOX = "33,3,48,15";
const MAP_KEY = process.env.REACT_APP_FIRMS_MAP_KEY || "";
const RECENT_MS = 24 * 60 * 60 * 1000;
const FIRMS_URLS = ["/api/firms", "https://firms.modaps.eosdis.nasa.gov"];

const getToday = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

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

function markerProps(timestamp) {
  const isRecent = Date.now() - timestamp <= RECENT_MS;
  return isRecent
    ? {
        color: "#fff",
        fillColor: "#ff3300",
        fillOpacity: 0.95,
        radius: 6,
        weight: 1,
        opacity: 0.95,
      }
    : {
        color: "#fff",
        fillColor: "#ff8800",
        fillOpacity: 0.85,
        radius: 6,
        weight: 1,
        opacity: 0.9,
      };
}

function ringContains(ring, lat, lon) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideEthiopia(lat, lon, feature) {
  if (!feature) return true;
  const geom = feature.geometry;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  return polys.some((poly) => {
    if (!ringContains(poly[0], lat, lon)) return false;
    for (let h = 1; h < poly.length; h++) {
      if (ringContains(poly[h], lat, lon)) return false;
    }
    return true;
  });
}

async function fetchFIRMS({
  presetDays = null,
  startDate = null,
  endDate = null,
} = {}) {
  if (!MAP_KEY) throw new Error("No FIRMS MAP_KEY set in .env");
  const CHUNK = 5;
  const now = new Date();

  async function fetchChunk(days, date = null) {
    const ageOfStart = date ? Math.floor((now - new Date(date)) / 86400000) : 0;
    const source = ageOfStart <= 60 ? "VIIRS_SNPP_NRT" : "VIIRS_SNPP_SP";
    const firmsPath = date
      ? `/api/area/csv/${MAP_KEY}/${source}/${ETH_BBOX}/${days}/${date}`
      : `/api/area/csv/${MAP_KEY}/${source}/${ETH_BBOX}/${days}`;
    for (const base of FIRMS_URLS) {
      try {
        const url =
          base === "/api/firms"
            ? `/api/firms${firmsPath}`
            : `${base}${firmsPath}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        // Empty response = backend/API unavailable (returned graceful empty)
        if (!text || !text.trim()) throw new Error("NASA FIRMS unavailable");
        if (
          text.startsWith("Invalid") ||
          text.startsWith("Error") ||
          text.includes("not a valid")
        )
          throw new Error(text.trim());
        return text;
      } catch (e) {
        console.warn(`FIRMS chunk failed:`, e.message);
      }
    }
    // Return null (not "") to signal API failure vs genuine empty data
    return null;
  }

  let csvTexts = [];
  let filterStartTs = 0;
  let filterEndTs = Date.now();

  if (presetDays !== null) {
    const todayStr = getToday();
    let remaining = presetDays;
    let chunkEndDate = new Date(todayStr);
    const chunks = [];
    while (remaining > 0) {
      const days = Math.min(CHUNK, remaining);
      const chunkDate = new Date(chunkEndDate);
      chunkDate.setDate(chunkDate.getDate() - (days - 1));
      chunks.push({ days, date: chunkDate.toISOString().slice(0, 10) });
      chunkEndDate.setDate(chunkEndDate.getDate() - days);
      remaining -= days;
    }
    csvTexts = await Promise.all(
      chunks.map(({ days, date }) => fetchChunk(days, date)),
    );
    const startDt = new Date(todayStr);
    startDt.setDate(startDt.getDate() - (presetDays - 1));
    const endDt = new Date(todayStr);
    filterStartTs = Date.UTC(
      startDt.getUTCFullYear(),
      startDt.getUTCMonth(),
      startDt.getUTCDate(),
      0,
      0,
      0,
    );
    filterEndTs = Date.UTC(
      endDt.getUTCFullYear(),
      endDt.getUTCMonth(),
      endDt.getUTCDate(),
      23,
      59,
      59,
    );
  } else {
    const startDt = new Date(startDate);
    const effectiveEnd = new Date(endDate) > now ? now : new Date(endDate);
    const chunks = [];
    let cursor = new Date(startDt);
    while (cursor <= effectiveEnd) {
      const chunkDate = cursor.toISOString().slice(0, 10);
      const daysLeft = Math.floor((effectiveEnd - cursor) / 86400000) + 1;
      const days = Math.min(CHUNK, daysLeft);
      chunks.push({ days, date: chunkDate });
      cursor.setDate(cursor.getDate() + days);
    }
    csvTexts = await Promise.all(
      chunks.map(({ days, date }) => fetchChunk(days, date)),
    );
    filterStartTs = Date.UTC(
      startDt.getUTCFullYear(),
      startDt.getUTCMonth(),
      startDt.getUTCDate(),
      0,
      0,
      0,
    );
    filterEndTs = Date.UTC(
      effectiveEnd.getUTCFullYear(),
      effectiveEnd.getUTCMonth(),
      effectiveEnd.getUTCDate(),
      23,
      59,
      59,
    );
  }

  let ethiopiaFeature = null;
  try {
    ethiopiaFeature = await fetchEthiopiaFeature();
  } catch (e) {
    /* ignore */
  }

  // If ALL chunks returned null, the API is unavailable — throw to show error message
  const allFailed = csvTexts.every((t) => t === null);
  if (allFailed) {
    throw new Error(
      "NASA FIRMS is temporarily unavailable. Please try again in a few minutes.",
    );
  }

  const points = [];
  for (const csv of csvTexts) {
    if (!csv || !csv.trim()) continue;
    Papa.parse(csv, { header: true, skipEmptyLines: true }).data.forEach(
      (row) => {
        const p = parseFirePoint(row);
        if (!p) return;
        if (!isInsideEthiopia(p.lat, p.lon, ethiopiaFeature)) return;
        if (p.timestamp < filterStartTs || p.timestamp > filterEndTs) return;
        points.push(p);
      },
    );
  }
  return points;
}

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

function CreatePane({ name, zIndex, clickable = false }) {
  const map = useMap();
  if (!map.getPane(name)) {
    const p = map.createPane(name);
    p.style.zIndex = String(zIndex);
    p.style.pointerEvents = clickable ? "auto" : "none";
  }
  return null;
}

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

function MapTypeToggle({ mapType, setMapType }) {
  return (
    <div className="hazard-map-type-toggle">
      <div className="map-type-control">
        {Object.entries(MAP_TYPES).map(([key, type]) => (
          <button
            key={key}
            onClick={() => setMapType(key)}
            title={type.description}
            className={`map-type-btn${mapType === key ? " active" : ""}`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const FILTER_PRESETS = [
  { id: "today", label: "TODAY", presetDays: 1 },
  { id: "24hrs", label: "24HRS", presetDays: 2 },
  { id: "7days", label: "7DAYS", presetDays: 7 },
];

function getDayLabel(n) {
  if (n === 7) return "WEEK";
  if (n === 14) return "2 WEEKS";
  if (n === 21) return "3 WEEKS";
  if (n === 28) return "4 WEEKS";
  return `${n} day${n !== 1 ? "s" : ""}`;
}

function Fire() {
  const today = getToday();
  const c = useColors();

  const [filterMode, setFilterMode] = useState("24hrs");
  const [customDays, setCustomDays] = useState(7);
  const [customStartDate, setCustomStartDate] = useState(() => daysAgo(6));
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [firePoints, setFirePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapType, setMapType] = useState("default");
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsGeo, setRegionsGeo] = useState(null);

  // ── Time series: 30-day dataset fetched independently of map filter ───────
  const [tsPoints, setTsPoints] = useState([]);
  const [tsLoading, setTsLoading] = useState(true);
  const [tsError, setTsError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch("/ethiopia-regions.geojson")
      .then((r) => r.json())
      .then(setRegionsGeo)
      .catch(() => {});
  }, []);

  // Fetch 30 days once on mount — independent of the map date filter so
  // the chart always shows the full 30-day picture.
  useEffect(() => {
    if (!MAP_KEY) {
      setTsLoading(false);
      return;
    }
    let cancelled = false;
    setTsLoading(true);
    setTsError(null);
    fetchFIRMS({ presetDays: 30 })
      .then((pts) => {
        if (!cancelled) {
          setTsPoints(pts);
          setTsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTsError(err.message);
          setTsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate into daily buckets: count of hotspots + average FRP per day
  const tsDaily = useMemo(() => {
    const byDate = {};
    tsPoints.forEach((pt) => {
      if (!pt.acq_date) return;
      if (!byDate[pt.acq_date]) byDate[pt.acq_date] = { count: 0, totalFrp: 0 };
      byDate[pt.acq_date].count++;
      byDate[pt.acq_date].totalFrp += pt.frp || 0;
    });
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const entry = byDate[key];
      result.push({
        date: key,
        label,
        count: entry?.count || 0,
        avgFrp: entry ? +(entry.totalFrp / entry.count).toFixed(1) : 0,
      });
    }
    return result;
  }, [tsPoints]);

  // ── Spatial analysis: aggregate firePoints by Ethiopian region ─────────
  // Uses point-in-polygon (reusing ringContains defined above) against the
  // loaded regionsGeo FeatureCollection. Each fire point is tested against
  // every region polygon until a match is found.
  // Depends on firePoints (map data) so it reflects the user's date filter.
  const regionFireStats = useMemo(() => {
    if (!regionsGeo?.features?.length || !firePoints.length) return [];

    // Build a quick polygon test per feature
    function pointInFeature(feat, lat, lon) {
      const geom = feat.geometry;
      const polys =
        geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
      return polys.some((poly) => {
        if (!ringContains(poly[0], lat, lon)) return false;
        for (let h = 1; h < poly.length; h++) {
          if (ringContains(poly[h], lat, lon)) return false;
        }
        return true;
      });
    }

    // Accumulate counts per region
    const counts = {};
    regionsGeo.features.forEach((feat) => {
      const name =
        feat.properties?.shapeName ||
        feat.properties?.NAME_1 ||
        feat.properties?.name ||
        "Unknown";
      counts[name] = { name, count: 0, totalFrp: 0 };
    });

    firePoints.forEach((pt) => {
      for (const feat of regionsGeo.features) {
        if (pointInFeature(feat, pt.lat, pt.lon)) {
          const name =
            feat.properties?.shapeName ||
            feat.properties?.NAME_1 ||
            feat.properties?.name ||
            "Unknown";
          if (counts[name]) {
            counts[name].count++;
            counts[name].totalFrp += pt.frp || 0;
          }
          break; // each point belongs to exactly one region
        }
      }
    });

    return Object.values(counts)
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [firePoints, regionsGeo]);

  // ── Open-Meteo: live weather per region centroid ──────────────────────
  // Fetches current wind (speed + direction) and 30-day precipitation sum
  // for every Ethiopian region's centroid in parallel — no API key needed.
  const [weatherData, setWeatherData] = useState({}); // keyed by region name
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);

    const fetchRegion = (region) => {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${region.lat}&longitude=${region.lon}` +
        `&current=wind_speed_10m,wind_direction_10m,temperature_2m` +
        `&daily=precipitation_sum` +
        `&past_days=30&forecast_days=0` +
        `&timezone=Africa%2FAddis_Ababa`;
      return fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then((data) => ({
          name: region.name,
          windSpeed: data.current?.wind_speed_10m ?? 0,
          windDir: data.current?.wind_direction_10m ?? 0,
          temp: data.current?.temperature_2m ?? 0,
          precip30d: (data.daily?.precipitation_sum ?? []).reduce(
            (s, v) => s + (v ?? 0),
            0,
          ),
        }))
        .catch(() => ({
          name: region.name,
          windSpeed: 0,
          windDir: 0,
          temp: 0,
          precip30d: 0,
          error: true,
        }));
    };

    Promise.all(ETHIOPIA_REGIONS.map(fetchRegion)).then((results) => {
      if (cancelled) return;
      const byName = {};
      results.forEach((r) => {
        byName[r.name] = r;
      });
      setWeatherData(byName);
      setWeatherLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []); // fetch once on mount — weather doesn't change within a session

  // ── Multi-criteria fire risk: Fire Risk = (V×0.40) + (D×0.40) + (W×0.20)
  // V = vegetation fuel score (static lookup, 1–5)
  // D = drought score computed from 30-day precipitation (1–5)
  // W = wind score from current speed + direction modifier (1–5)
  const multiCriteriaRisk = useMemo(() => {
    if (weatherLoading || Object.keys(weatherData).length === 0) return [];
    return ETHIOPIA_REGIONS.map((region) => {
      const wx = weatherData[region.name];
      const V = getVegetationScore(region.name);
      const D = wx ? calcDroughtScore(wx.precip30d) : 3;
      const Ws = wx?.windSpeed ?? 0;
      const Wd = wx?.windDir ?? 0;
      const score = calcCompositeScore(V, D, Ws, Wd);
      const tier = getRiskTier(score);
      return {
        name: region.name,
        score,
        tier,
        V,
        D,
        W: +Math.min(
          5,
          Math.max(1, calcWindSpeedScore(Ws) + calcWindDirModifier(Wd)),
        ).toFixed(1),
        windSpeed: wx?.windSpeed ?? 0,
        windDir: wx?.windDir ?? 0,
        precip30d: wx?.precip30d ?? 0,
        temp: wx?.temp ?? 0,
        dataError: wx?.error ?? false,
      };
    }).sort((a, b) => b.score - a.score);
  }, [weatherData, weatherLoading]);

  // Live risk for all regions — shown in RegionSelector dropdown
  const regionRisks = useMemo(
    () => computeAllRegionRisks("Fire", { firePoints }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firePoints], // re-compute when live data changes
  );

  const activePreset = FILTER_PRESETS.find((p) => p.id === filterMode);
  const displayStart =
    filterMode === "custom"
      ? customStartDate
      : activePreset
        ? daysAgo(activePreset.presetDays - 1)
        : today;
  const displayEnd =
    filterMode === "custom"
      ? (() => {
          const d = new Date(customStartDate);
          d.setDate(d.getDate() + customDays - 1);
          const raw = d.toISOString().slice(0, 10);
          return raw > today ? today : raw;
        })()
      : today;

  useEffect(() => {
    if (!showDaysDropdown) return;
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDaysDropdown(false);
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
      const fetchArgs =
        filterMode === "custom"
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

  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch("/api/uploads?hazardType=fire&status=approved");
        if (!res.ok) throw new Error("Failed to fetch uploads");
        const data = await res.json();
        if (!cancelled) setHasLocalUploads(data.length > 0);
      } catch {
        /* keep current state */
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
      className="hazard-page"
      style={{ transition: "background-color 0.3s" }}
    >
      <FireDetailPanel
        pt={selectedFire}
        onClose={() => setSelectedFire(null)}
      />

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="hazard-page-header-wrap">
        <div
          className="hazard-page-header-card"
          style={{ "--hazard-glow": "rgba(249,115,22,0.12)" }}
        >
          <div className="hazard-page-header">
            <div className="hazard-page-header-left">
              <div
                className="hazard-page-header-icon"
                style={{ background: "#f9731618" }}
              >
                <img
                  src="/icons/icons8-fire-96.png"
                  alt="Fire"
                  style={{ width: 26, height: 26, objectFit: "contain" }}
                />
              </div>
              <div className="hazard-page-header-text">
                <div className="hazard-page-header-label">
                  Hazard Monitoring · Ethiopia
                </div>
                <div
                  className="hazard-page-header-title"
                  style={{ color: "#f97316" }}
                >
                  Fire Monitoring
                </div>
                <div className="hazard-page-header-subtitle">
                  NASA FIRMS VIIRS thermal anomalies &amp; SSGI local
                  observations
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              <RegionSelector
                activeRegion={activeRegion}
                onSelect={setActiveRegion}
                liveHazard="Fire"
                regionRisks={regionRisks}
              />
              <button
                className="hazard-page-refresh-btn"
                onClick={() => window.location.reload()}
                title="Refresh data"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hazard-page-content">
        <div className="hazard-maps-row">
          {/* ── GLOBAL MAP ──────────────────────────────────────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Global Data · NASA FIRMS VIIRS
                    </div>
                    <div className="hazard-map-title">
                      Global Fire Data — Ethiopia
                    </div>
                  </div>
                </div>
                <span
                  className="hazard-map-badge"
                  style={{
                    color: "#f97316",
                    borderColor: "#f9731644",
                    background: "#f9731612",
                  }}
                >
                  {loading
                    ? "⏳ Loading…"
                    : error
                      ? "⚠ Error"
                      : `🔥 ${firePoints.length} point${firePoints.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Premium fire toolbar */}
              <div
                className="global-fire-toolbar"
                style={{ gap: "5px", flexWrap: "nowrap" }}
              >
                <div className="time-range-control">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`time-range-btn${filterMode === preset.id ? " active" : ""}`}
                      onClick={() => {
                        setFilterMode(preset.id);
                        setShowDaysDropdown(false);
                      }}
                    >
                      {preset.label === "TODAY"
                        ? "Today"
                        : preset.label === "24HRS"
                          ? "24 Hrs"
                          : "7 Days"}
                    </button>
                  ))}
                </div>

                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    className={`date-filter-btn${filterMode === "custom" ? " active" : ""}`}
                    onClick={() => setShowDaysDropdown((v) => !v)}
                    title="Select a custom start date and number of days"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="3" width="14" height="11" rx="2" />
                      <path d="M1 7h14M5 1v4M11 1v4" />
                    </svg>
                    {filterMode === "custom"
                      ? `${customStartDate} · ${getDayLabel(customDays)}`
                      : "Custom Range"}
                    <span style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
                  </button>

                  {showDaysDropdown && (
                    <div className="fire-days-dropdown">
                      <div className="fire-days-dropdown-header">
                        <div className="fire-days-dropdown-header-label">
                          Choose start date
                        </div>
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
                      <div className="fire-days-dropdown-list">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (n) => (
                            <button
                              key={n}
                              className={`fire-days-dropdown-item${filterMode === "custom" && customDays === n ? " active" : ""}${n === 7 || n === 14 || n === 21 || n === 28 ? " special" : ""}`}
                              onClick={() => {
                                setFilterMode("custom");
                                setCustomDays(n);
                                setShowDaysDropdown(false);
                              }}
                            >
                              {getDayLabel(n)}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="download-csv-btn"
                  onClick={() =>
                    downloadCSV(firePoints, displayStart, displayEnd)
                  }
                  disabled={!firePoints.length}
                  title={`Download ${firePoints.length} fire points as CSV`}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
                  </svg>
                  Download CSV
                </button>
              </div>

              <div
                className={`hazard-status-text${error ? " error" : ""}`}
                style={{ minHeight: "20px" }}
              >
                {loading
                  ? "⏳ Loading fire data…"
                  : error
                    ? `⚠ ${error}`
                    : firePoints.length > 0
                      ? `🔥 ${firePoints.length} fire point${firePoints.length !== 1 ? "s" : ""} · ${displayStart}${displayStart !== displayEnd ? ` → ${displayEnd}` : ""}`
                      : "No fire data for this period"}
              </div>

              <div className="hazard-legend">
                {[
                  { color: "#ff3300", label: "Recent fire (< 24h)" },
                  { color: "#ff8800", label: "Older fire (> 24h)" },
                ].map(({ color, label }) => (
                  <div key={label} className="hazard-legend-item">
                    <div
                      className="hazard-legend-dot"
                      style={{ background: color }}
                    />
                    {label}
                  </div>
                ))}
              </div>

              <div className="hazard-map-container">
                <MapContainer
                  zoomAnimation={false}
                  center={[9.145, 40.489673]}
                  zoom={5}
                  style={{ height: "100%", width: "100%" }}
                >
                  <CreatePane
                    name="fireOverlayPane"
                    zIndex={450}
                    clickable={false}
                  />
                  <CreatePane
                    name="fireMarkersPane"
                    zIndex={500}
                    clickable={true}
                  />
                  <TileLayer
                    attribution={MAP_TYPES[mapType].attribution}
                    url={MAP_TYPES[mapType].url}
                  />
                  <FitEthiopia />
                  <RegionGeoLayer
                    regionsGeo={regionsGeo}
                    activeRegion={activeRegion}
                    onSelect={setActiveRegion}
                  />
                  <FireOverlay
                    wmsDate={wmsDate}
                    points={firePoints}
                    onSelect={setSelectedFire}
                  />
                </MapContainer>
                <RegionRiskCard
                  activeRegion={activeRegion}
                  onClose={() => setActiveRegion(null)}
                  liveHazard="Fire"
                  liveRisk={computeRegionRisk("Fire", activeRegion, {
                    firePoints,
                  })}
                />
                <MapTypeToggle mapType={mapType} setMapType={setMapType} />
              </div>

              <div className="hazard-map-footer">
                <span>Source: NASA FIRMS · VIIRS SNPP / SP</span>
                <span>
                  {displayStart}
                  {displayStart !== displayEnd ? ` → ${displayEnd}` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ── LOCAL MAP ───────────────────────────────────────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator local" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">Local Monitoring</div>
                    <div className="hazard-map-title">
                      Local Fire Data — Ethiopia
                    </div>
                  </div>
                </div>
                <span
                  className="hazard-map-badge"
                  style={{
                    color: "#f97316",
                    borderColor: "#f9731644",
                    background: "#f9731612",
                  }}
                >
                  SSGI Ethiopia
                </span>
              </div>

              <div className="hazard-local-meta">
                <LocalDisasterData
                  disasterType="Fire"
                  onUploadReady={(upload) => setHasLocalUploads(!!upload)}
                />
              </div>

              <div className="hazard-map-container">
                {hasLocalUploads ? (
                  <UploadedImageFill disasterType="Fire" />
                ) : (
                  <>
                    <MapContainer
                      zoomAnimation={false}
                      center={[9.145, 40.489673]}
                      zoom={5}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution={MAP_TYPES[mapType].attribution}
                        url={MAP_TYPES[mapType].url}
                      />
                      <FitEthiopia />
                      <RegionGeoLayer
                        regionsGeo={regionsGeo}
                        activeRegion={activeRegion}
                        onSelect={setActiveRegion}
                      />
                      <EthiopiaMask paneNames={[]} />
                    </MapContainer>
                    <MapTypeToggle mapType={mapType} setMapType={setMapType} />
                  </>
                )}
              </div>

              <div className="hazard-map-footer">
                <span>Source: SSGI Ethiopia · Local fire observations</span>
                <span>
                  {hasLocalUploads ? "Uploaded data" : "Live base map"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TIME SERIES CHART — full width ───────────────────────────── */}
        <div style={{ marginBottom: "24px" }}>
          <div className="hazard-map-card" style={{ overflow: "hidden" }}>
            {/* Header */}
            <div className="hazard-map-header">
              <div className="hazard-map-header-left">
                <div className="hazard-map-indicator global" />
                <div className="hazard-map-title-group">
                  <div className="hazard-map-label">
                    Analysis · NASA FIRMS VIIRS
                  </div>
                  <div className="hazard-map-title">
                    Fire Hotspot Time Series — Past 30 Days
                  </div>
                </div>
              </div>
              <span
                className="hazard-map-badge"
                style={{
                  color: "#f97316",
                  borderColor: "#f9731644",
                  background: "#f9731612",
                }}
              >
                {tsLoading
                  ? "Loading…"
                  : tsError
                    ? "Error"
                    : `${tsPoints.length} detections`}
              </span>
            </div>

            {/* Summary stat pills */}
            {!tsLoading && !tsError && tsDaily.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "10px 20px 0",
                }}
              >
                {[
                  {
                    label: "Total hotspots",
                    value: tsPoints.length.toLocaleString(),
                    color: "#f97316",
                  },
                  {
                    label: "Peak day",
                    value: (() => {
                      const peak = tsDaily.reduce(
                        (a, b) => (b.count > a.count ? b : a),
                        tsDaily[0],
                      );
                      return `${peak.label} (${peak.count})`;
                    })(),
                    color: "#ef4444",
                  },
                  {
                    label: "Avg hotspots/day",
                    value: (
                      tsPoints.length /
                      Math.max(tsDaily.filter((d) => d.count > 0).length, 1)
                    ).toFixed(0),
                    color: "#f59e0b",
                  },
                  {
                    label: "Peak avg FRP",
                    value: `${Math.max(...tsDaily.map((d) => d.avgFrp)).toFixed(1)} MW`,
                    color: "#f97316",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: color + "10",
                      border: `1.5px solid ${color}30`,
                      borderRadius: "12px",
                      padding: "10px 16px 11px",
                      minWidth: "120px",
                      flex: "1 1 auto",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: color,
                        opacity: 0.6,
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "5px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "19px",
                        fontWeight: 900,
                        color,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart area */}
            <div
              style={{
                padding: "16px 20px 12px",
                height: "280px",
                position: "relative",
              }}
            >
              {!MAP_KEY ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontSize: "32px" }}>🔑</span>
                  <span>
                    No FIRMS API key configured.{" "}
                    <strong>Set REACT_APP_FIRMS_MAP_KEY in your .env</strong>
                  </span>
                </div>
              ) : tsLoading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: "2px solid #f97316",
                      borderTopColor: "transparent",
                      display: "inline-block",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                  Fetching 30 days of fire data from NASA FIRMS…
                </div>
              ) : tsError ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ef4444",
                    fontSize: "13px",
                  }}
                >
                  ⚠ {tsError}
                </div>
              ) : (
                <Line
                  data={{
                    labels: tsDaily.map((d) => d.label),
                    datasets: [
                      {
                        label: "Hotspot Count",
                        data: tsDaily.map((d) => d.count),
                        borderColor: "#f97316",
                        backgroundColor: "rgba(249,115,22,0.12)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: tsDaily.map((d) => (d.count > 0 ? 3 : 0)),
                        pointBackgroundColor: "#f97316",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 1,
                        borderWidth: 2,
                        yAxisID: "yCount",
                      },
                      {
                        label: "Avg FRP (MW)",
                        data: tsDaily.map((d) => d.avgFrp),
                        borderColor: "#fbbf24",
                        backgroundColor: "transparent",
                        fill: false,
                        tension: 0.4,
                        pointRadius: tsDaily.map((d) =>
                          d.avgFrp > 0 ? 2.5 : 0,
                        ),
                        pointBackgroundColor: "#fbbf24",
                        borderWidth: 1.5,
                        borderDash: [4, 3],
                        yAxisID: "yFrp",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: {
                        position: "top",
                        align: "end",
                        labels: {
                          boxWidth: 12,
                          boxHeight: 12,
                          font: { size: 11 },
                          color: "var(--text-muted, #888)",
                          padding: 12,
                        },
                      },
                      tooltip: {
                        backgroundColor: "rgba(20,20,20,0.92)",
                        titleColor: "#fff",
                        bodyColor: "#ccc",
                        borderColor: "#f97316",
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                          title: (items) => {
                            const idx = items[0]?.dataIndex;
                            if (idx !== undefined && tsDaily[idx]) {
                              return `📅  ${tsDaily[idx].date}  (${tsDaily[idx].label})`;
                            }
                            return items[0]?.label ?? "";
                          },
                          label: (item) => {
                            if (item.dataset.yAxisID === "yCount")
                              return `  🔥 Hotspots: ${item.raw}`;
                            return `  ⚡ Avg FRP: ${item.raw} MW`;
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: {
                          color: "var(--text-muted, #888)",
                          font: { size: 10 },
                          maxRotation: 45,
                          autoSkip: true,
                          maxTicksLimit: 15,
                        },
                      },
                      yCount: {
                        type: "linear",
                        position: "left",
                        grid: { color: "rgba(255,255,255,0.06)" },
                        ticks: {
                          color: "#f97316",
                          font: { size: 10 },
                          precision: 0,
                        },
                        title: {
                          display: true,
                          text: "Hotspot Count",
                          color: "#f97316",
                          font: { size: 10 },
                        },
                      },
                      yFrp: {
                        type: "linear",
                        position: "right",
                        grid: { drawOnChartArea: false },
                        ticks: {
                          color: "#fbbf24",
                          font: { size: 10 },
                        },
                        title: {
                          display: true,
                          text: "Avg FRP (MW)",
                          color: "#fbbf24",
                          font: { size: 10 },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>

            <div className="hazard-map-footer">
              <span>Source: NASA FIRMS · VIIRS SNPP — Ethiopia</span>
              <span>
                {daysAgo(29)} → {getToday()}
              </span>
            </div>
          </div>
        </div>

        {/* ── SPATIAL ANALYSIS — regional fire distribution ─────────── */}
        <div style={{ marginBottom: "24px" }}>
          <div className="hazard-map-card" style={{ overflow: "hidden" }}>
            <div className="hazard-map-header">
              <div className="hazard-map-header-left">
                <div className="hazard-map-indicator global" />
                <div className="hazard-map-title-group">
                  <div className="hazard-map-label">
                    Spatial Analysis · Point-in-Polygon
                  </div>
                  <div className="hazard-map-title">
                    Fire Hotspots by Ethiopian Region
                  </div>
                </div>
              </div>
              <span
                className="hazard-map-badge"
                style={{
                  color: "#f97316",
                  borderColor: "#f9731644",
                  background: "#f9731612",
                }}
              >
                {loading
                  ? "Loading…"
                  : regionFireStats.length > 0
                    ? `${regionFireStats.length} active region${regionFireStats.length !== 1 ? "s" : ""}`
                    : firePoints.length === 0
                      ? "No data"
                      : "Processing…"}
              </span>
            </div>

            {/* Top-region stat pills */}
            {regionFireStats.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "10px 20px 0",
                }}
              >
                {[
                  {
                    label: "Most active region",
                    value: regionFireStats[0].name,
                    color: "#ef4444",
                  },
                  {
                    label: "Hotspots (top region)",
                    value: regionFireStats[0].count.toLocaleString(),
                    color: "#f97316",
                  },
                  {
                    label: "Total FRP (top region)",
                    value: `${regionFireStats[0].totalFrp.toFixed(0)} MW`,
                    color: "#f59e0b",
                  },
                  {
                    label: "Avg FRP / hotspot",
                    value: `${(regionFireStats[0].totalFrp / regionFireStats[0].count).toFixed(1)} MW`,
                    color: "#fbbf24",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: color + "10",
                      border: `1.5px solid ${color}30`,
                      borderRadius: "12px",
                      padding: "10px 16px 11px",
                      minWidth: "120px",
                      flex: "1 1 auto",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: color,
                        opacity: 0.6,
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "5px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "19px",
                        fontWeight: 900,
                        color,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Horizontal bar chart */}
            <div
              style={{
                padding: "16px 20px 12px",
                height: `${Math.max(220, Math.min(regionFireStats.length, 14) * 32 + 60)}px`,
                position: "relative",
              }}
            >
              {loading ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: "2px solid #f97316",
                      borderTopColor: "transparent",
                      display: "inline-block",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                  Aggregating fire data by region…
                </div>
              ) : regionFireStats.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "32px" }}>🗺️</span>
                  {firePoints.length === 0
                    ? "No fire data loaded. Select a time range above."
                    : "No fires matched any Ethiopian region polygon."}
                </div>
              ) : (
                <Bar
                  data={{
                    labels: regionFireStats.map((r) => r.name),
                    datasets: [
                      {
                        label: "Fire Hotspots",
                        data: regionFireStats.map((r) => r.count),
                        backgroundColor: regionFireStats.map((r, i) => {
                          const ratio =
                            i / Math.max(regionFireStats.length - 1, 1);
                          // Gradient: top regions red → orange → amber
                          if (ratio < 0.25) return "rgba(239,68,68,0.82)";
                          if (ratio < 0.55) return "rgba(249,115,22,0.82)";
                          return "rgba(251,191,36,0.82)";
                        }),
                        borderColor: regionFireStats.map((r, i) => {
                          const ratio =
                            i / Math.max(regionFireStats.length - 1, 1);
                          if (ratio < 0.25) return "#ef4444";
                          if (ratio < 0.55) return "#f97316";
                          return "#fbbf24";
                        }),
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                      {
                        label: "Total FRP (MW)",
                        data: regionFireStats.map(
                          (r) => +r.totalFrp.toFixed(0),
                        ),
                        backgroundColor: "rgba(251,191,36,0.18)",
                        borderColor: "#fbbf24",
                        borderWidth: 1.5,
                        borderRadius: 4,
                        yAxisID: "yFrp",
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: {
                        position: "top",
                        align: "end",
                        labels: {
                          boxWidth: 12,
                          boxHeight: 12,
                          font: { size: 11 },
                          color: "var(--text-muted, #888)",
                          padding: 12,
                        },
                      },
                      tooltip: {
                        backgroundColor: "rgba(20,20,20,0.92)",
                        titleColor: "#fff",
                        bodyColor: "#ccc",
                        borderColor: "#f97316",
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                          title: (items) => `📍 ${items[0]?.label}`,
                          label: (item) => {
                            if (item.datasetIndex === 0)
                              return `  🔥 Hotspots: ${item.raw}`;
                            return `  ⚡ Total FRP: ${item.raw} MW`;
                          },
                          afterBody: (items) => {
                            const idx = items[0]?.dataIndex;
                            if (idx !== undefined && regionFireStats[idx]) {
                              const r = regionFireStats[idx];
                              return [
                                `  📊 Avg FRP/hotspot: ${(r.totalFrp / r.count).toFixed(1)} MW`,
                              ];
                            }
                            return [];
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: {
                          color: "#f97316",
                          font: { size: 10 },
                          precision: 0,
                        },
                        title: {
                          display: true,
                          text: "Hotspot Count",
                          color: "#f97316",
                          font: { size: 10 },
                        },
                      },
                      y: {
                        grid: { color: "rgba(255,255,255,0.04)" },
                        ticks: {
                          color: "var(--text-muted, #888)",
                          font: { size: 11 },
                        },
                      },
                      yFrp: {
                        display: false, // hidden axis — FRP bars share same y-axis labels
                      },
                    },
                  }}
                />
              )}
            </div>

            <div className="hazard-map-footer">
              <span>
                Spatial aggregation: NASA FIRMS VIIRS → Ethiopian Admin-1
                regions (point-in-polygon)
              </span>
              <span>
                {firePoints.length} points · {displayStart}
                {displayStart !== displayEnd ? ` → ${displayEnd}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── RISK ASSESSMENT — GIS Weighted Overlay ───────────────── */}
        <div style={{ marginBottom: "24px" }}>
          <div className="hazard-map-card" style={{ overflow: "hidden" }}>
            <div className="hazard-map-header">
              <div className="hazard-map-header-left">
                <div className="hazard-map-indicator global" />
                <div className="hazard-map-title-group">
                  <div className="hazard-map-label">
                    Risk Assessment · GIS Weighted Overlay (V×0.40 + D×0.40 +
                    W×0.20)
                  </div>
                  <div className="hazard-map-title">
                    Multi-Criteria Fire Risk Score by Ethiopian Region
                  </div>
                </div>
              </div>
              <span
                className="hazard-map-badge"
                style={{
                  color: "#dc2626",
                  borderColor: "#dc262644",
                  background: "#dc262612",
                }}
              >
                {weatherLoading
                  ? "Fetching weather…"
                  : `${multiCriteriaRisk.filter((r) => r.tier.label === "Extreme").length} Extreme · ${multiCriteriaRisk.filter((r) => r.tier.label === "High").length} High`}
              </span>
            </div>

            {weatherLoading ? (
              <div
                style={{
                  padding: "40px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "2px solid #f97316",
                    borderTopColor: "transparent",
                    display: "inline-block",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
                Fetching live weather from Open-Meteo for all Ethiopian regions…
              </div>
            ) : (
              <>
                {/* Stacked horizontal bar chart */}
                <div
                  style={{
                    padding: "14px 20px 0",
                    height: `${Math.max(260, multiCriteriaRisk.length * 34 + 70)}px`,
                  }}
                >
                  <Bar
                    data={{
                      labels: multiCriteriaRisk.map((r) => r.name),
                      datasets: [
                        {
                          label: "Vegetation (40%)",
                          data: multiCriteriaRisk.map(
                            (r) => +(r.V * 0.4).toFixed(2),
                          ),
                          backgroundColor: "rgba(34,197,94,0.75)",
                          borderColor: "#22c55e",
                          borderWidth: 1,
                          borderRadius: 3,
                          stack: "risk",
                        },
                        {
                          label: "Drought Index (40%)",
                          data: multiCriteriaRisk.map(
                            (r) => +(r.D * 0.4).toFixed(2),
                          ),
                          backgroundColor: "rgba(234,179,8,0.75)",
                          borderColor: "#eab308",
                          borderWidth: 1,
                          borderRadius: 3,
                          stack: "risk",
                        },
                        {
                          label: "Wind (20%)",
                          data: multiCriteriaRisk.map(
                            (r) => +(r.W * 0.2).toFixed(2),
                          ),
                          backgroundColor: "rgba(59,130,246,0.75)",
                          borderColor: "#3b82f6",
                          borderWidth: 1,
                          borderRadius: 3,
                          stack: "risk",
                        },
                      ],
                    }}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: "index", intersect: false },
                      plugins: {
                        legend: {
                          position: "top",
                          align: "end",
                          labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            font: { size: 11 },
                            color: "var(--text-muted, #888)",
                            padding: 12,
                          },
                        },
                        tooltip: {
                          backgroundColor: "rgba(20,20,20,0.93)",
                          titleColor: "#fff",
                          bodyColor: "#ccc",
                          borderColor: "#f97316",
                          borderWidth: 1,
                          padding: 10,
                          callbacks: {
                            title: (items) => {
                              const r = multiCriteriaRisk[items[0]?.dataIndex];
                              return r
                                ? `📍 ${r.name}  —  Score: ${r.score}/5  (${r.tier.label})`
                                : "";
                            },
                            label: (item) => {
                              const r = multiCriteriaRisk[item.dataIndex];
                              if (!r) return "";
                              if (item.datasetIndex === 0)
                                return `  🌿 Vegetation (V=${r.V}): ${item.raw}`;
                              if (item.datasetIndex === 1)
                                return `  💧 Drought (D=${r.D}, ${r.precip30d.toFixed(0)}mm/30d): ${item.raw}`;
                              return `  💨 Wind (${r.windSpeed.toFixed(1)} km/h, ${r.windDir}°): ${item.raw}`;
                            },
                            afterBody: (items) => {
                              const r = multiCriteriaRisk[items[0]?.dataIndex];
                              return r
                                ? [
                                    `  ─────────────────`,
                                    `  TOTAL: ${r.score} / 5.0  →  ${r.tier.label.toUpperCase()}`,
                                  ]
                                : [];
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          stacked: true,
                          min: 0,
                          max: 5,
                          grid: { color: "rgba(255,255,255,0.05)" },
                          ticks: {
                            color: "var(--text-muted, #888)",
                            font: { size: 10 },
                          },
                          title: {
                            display: true,
                            text: "Composite Fire Risk Score (1–5)",
                            color: "var(--text-muted, #888)",
                            font: { size: 10 },
                          },
                        },
                        y: {
                          stacked: true,
                          grid: { color: "rgba(255,255,255,0.04)" },
                          ticks: {
                            color: "var(--text-muted, #888)",
                            font: { size: 11 },
                          },
                        },
                      },
                    }}
                  />
                </div>

                {/* Scorecard grid */}
                <div
                  className="scorecard-grid"
                  style={{
                    padding: "12px 20px 16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))",
                    gap: "10px",
                  }}
                >
                  {multiCriteriaRisk.map((r) => (
                    <div
                      key={r.name}
                      className="scorecard"
                      style={{
                        background: r.tier.bg,
                        border: `1px solid ${r.tier.color}33`,
                        borderRadius: "10px",
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "13px" }}>
                          {r.name}
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: r.tier.color,
                            border: `1px solid ${r.tier.color}55`,
                            borderRadius: "20px",
                            padding: "2px 8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {r.tier.label}
                        </span>
                      </div>
                      <div
                        style={{
                          height: "5px",
                          background: "rgba(255,255,255,0.07)",
                          borderRadius: "4px",
                          overflow: "hidden",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(r.score / 5) * 100}%`,
                            background: r.tier.color,
                            borderRadius: "4px",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "4px",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            background: "rgba(34,197,94,0.1)",
                            borderRadius: "5px",
                            padding: "3px 0",
                          }}
                        >
                          <div style={{ color: "#22c55e", fontWeight: 700 }}>
                            V={r.V}
                          </div>
                          <div>Vegetation</div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            background: "rgba(234,179,8,0.1)",
                            borderRadius: "5px",
                            padding: "3px 0",
                          }}
                        >
                          <div style={{ color: "#eab308", fontWeight: 700 }}>
                            D={r.D}
                          </div>
                          <div>{r.precip30d.toFixed(0)}mm</div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            background: "rgba(59,130,246,0.1)",
                            borderRadius: "5px",
                            padding: "3px 0",
                          }}
                        >
                          <div style={{ color: "#3b82f6", fontWeight: 700 }}>
                            W={r.W}
                          </div>
                          <div>{r.windSpeed.toFixed(0)} km/h</div>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "6px",
                          textAlign: "right",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: r.tier.color,
                        }}
                      >
                        {r.score} / 5.0
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hazard-map-footer">
                  <span>
                    Formula: (V×0.40)+(D×0.40)+(W×0.20) · Weather: Open-Meteo ·
                    Vegetation: GLC30 Ethiopia
                  </span>
                  <span>Refreshed: {new Date().toLocaleTimeString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── FORECAST — 7-day MA + 3-day projection ───────────────── */}
        {tsDaily.length > 0 &&
          (() => {
            // 7-day moving average
            const MA_WINDOW = 7;
            const maData = tsDaily.map((d, i) => {
              const start = Math.max(0, i - MA_WINDOW + 1);
              const slice = tsDaily.slice(start, i + 1);
              return +(
                slice.reduce((s, x) => s + x.count, 0) / slice.length
              ).toFixed(1);
            });

            // Simple linear regression on last 7 days for trend
            const last7 = tsDaily.slice(-7);
            const n = last7.length;
            const xMean = (n - 1) / 2;
            const yMean = last7.reduce((s, d) => s + d.count, 0) / n;
            const slope =
              last7.reduce(
                (s, d, i) => s + (i - xMean) * (d.count - yMean),
                0,
              ) / last7.reduce((s, _, i) => s + (i - xMean) ** 2, 0) || 0;
            const intercept = yMean - slope * xMean;

            // 3-day forecast
            const today = new Date();
            const forecastDays = [1, 2, 3].map((offset) => {
              const d = new Date(today);
              d.setDate(d.getDate() + offset);
              const label = d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const raw = intercept + slope * (n - 1 + offset);
              return { label, value: Math.max(0, +raw.toFixed(1)) };
            });

            const trendDir =
              slope > 1
                ? "↑ Increasing"
                : slope < -1
                  ? "↓ Decreasing"
                  : "→ Stable";
            const trendColor =
              slope > 1 ? "#ef4444" : slope < -1 ? "#22c55e" : "#eab308";

            // Chart data: historical + forecast stitched together
            const histLabels = tsDaily.map((d) => d.label);
            const forecastLabels = forecastDays.map((d) => d.label);
            const allLabels = [...histLabels, ...forecastLabels];
            const actualData = [
              ...tsDaily.map((d) => d.count),
              ...Array(3).fill(null),
            ];
            const maLine = [...maData, ...Array(3).fill(null)];
            const forecastLine = [
              ...Array(tsDaily.length - 1).fill(null),
              maData[maData.length - 1], // bridge from last MA point
              ...forecastDays.map((d) => d.value),
            ];

            return (
              <div style={{ marginBottom: "24px" }}>
                <div className="hazard-map-card" style={{ overflow: "hidden" }}>
                  <div className="hazard-map-header">
                    <div className="hazard-map-header-left">
                      <div className="hazard-map-indicator global" />
                      <div className="hazard-map-title-group">
                        <div className="hazard-map-label">
                          Forecast · 7-day MA + Linear Projection
                        </div>
                        <div className="hazard-map-title">
                          Fire Activity Trend & 3-Day Outlook
                        </div>
                      </div>
                    </div>
                    <span
                      className="hazard-map-badge"
                      style={{
                        color: trendColor,
                        borderColor: trendColor + "44",
                        background: trendColor + "12",
                      }}
                    >
                      {trendDir} · slope {slope > 0 ? "+" : ""}
                      {slope.toFixed(1)}/day
                    </span>
                  </div>

                  {/* Trend stat pills */}
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      padding: "10px 20px 0",
                    }}
                  >
                    {[
                      {
                        label: "Trend (7 days)",
                        value: trendDir,
                        color: trendColor,
                      },
                      {
                        label: "Day +1 forecast",
                        value: `~${forecastDays[0].value} hotspots`,
                        color: "#f97316",
                      },
                      {
                        label: "Day +2 forecast",
                        value: `~${forecastDays[1].value} hotspots`,
                        color: "#f97316",
                      },
                      {
                        label: "Day +3 forecast",
                        value: `~${forecastDays[2].value} hotspots`,
                        color: "#f97316",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        style={{
                          background: color + "12",
                          border: `1px solid ${color}33`,
                          borderRadius: "8px",
                          padding: "6px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "2px",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{ fontSize: "14px", fontWeight: 800, color }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: "16px 20px 12px",
                      height: "280px",
                      position: "relative",
                    }}
                  >
                    <Line
                      data={{
                        labels: allLabels,
                        datasets: [
                          {
                            label: "Daily hotspots",
                            data: actualData,
                            borderColor: "#f97316",
                            backgroundColor: "rgba(249,115,22,0.08)",
                            fill: true,
                            tension: 0.3,
                            pointRadius: actualData.map((v) =>
                              v !== null ? 2 : 0,
                            ),
                            pointBackgroundColor: "#f97316",
                            borderWidth: 1.5,
                            spanGaps: false,
                            yAxisID: "y",
                          },
                          {
                            label: "7-day moving avg",
                            data: maLine,
                            borderColor: "#fbbf24",
                            backgroundColor: "transparent",
                            fill: false,
                            tension: 0.4,
                            pointRadius: 0,
                            borderWidth: 2,
                            spanGaps: false,
                            yAxisID: "y",
                          },
                          {
                            label: "3-day forecast",
                            data: forecastLine,
                            borderColor: "#a78bfa",
                            backgroundColor: "rgba(167,139,250,0.08)",
                            fill: true,
                            tension: 0.3,
                            pointRadius: forecastLine.map((v) =>
                              v !== null ? 4 : 0,
                            ),
                            pointBackgroundColor: "#a78bfa",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 1.5,
                            borderWidth: 2,
                            borderDash: [5, 4],
                            spanGaps: false,
                            yAxisID: "y",
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: "index", intersect: false },
                        plugins: {
                          legend: {
                            position: "top",
                            align: "end",
                            labels: {
                              boxWidth: 12,
                              boxHeight: 12,
                              font: { size: 11 },
                              color: "var(--text-muted, #888)",
                              padding: 12,
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(20,20,20,0.92)",
                            titleColor: "#fff",
                            bodyColor: "#ccc",
                            borderColor: "#f97316",
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                              title: (items) => {
                                const idx = items[0]?.dataIndex;
                                const isForecast = idx >= tsDaily.length;
                                const label = items[0]?.label ?? "";
                                return isForecast
                                  ? `🔮 Forecast: ${label}`
                                  : `📅 ${label}`;
                              },
                              label: (item) => {
                                if (item.raw === null) return null;
                                const labels = [
                                  "  🔥 Actual",
                                  "  📈 7-day MA",
                                  "  🔮 Forecast",
                                ];
                                return `${labels[item.datasetIndex]}: ${item.raw}`;
                              },
                            },
                          },
                          // Vertical divider between historical and forecast
                          annotation: undefined,
                        },
                        scales: {
                          x: {
                            grid: { color: "rgba(255,255,255,0.05)" },
                            ticks: {
                              color: "var(--text-muted, #888)",
                              font: { size: 10 },
                              maxRotation: 45,
                              autoSkip: true,
                              maxTicksLimit: 15,
                            },
                          },
                          y: {
                            grid: { color: "rgba(255,255,255,0.06)" },
                            ticks: {
                              color: "#f97316",
                              font: { size: 10 },
                              precision: 0,
                            },
                            title: {
                              display: true,
                              text: "Hotspot Count",
                              color: "#f97316",
                              font: { size: 10 },
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  <div className="hazard-map-footer">
                    <span>
                      Method: 7-day moving average · Linear regression on last 7
                      days for projection
                    </span>
                    <span>
                      ⚠ Forecast is statistical only — not a meteorological
                      model
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

export default Fire;
