import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
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
import EthiopiaMask from "../Componenet/EthiopiaMask";
import FitEthiopia from "../Componenet/FitEthiopia";
import {
  RegionSelector,
  RegionGeoLayer,
  RegionRiskCard,
  computeRegionRisk,
  computeAllRegionRisks,
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

const RECENT_MS = 24 * 60 * 60 * 1000;
const ACCENT = "#eab308"; // Amber / Gold seismic theme

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

// Ray-casting algorithm to test if (lat, lon) is inside a polygon ring
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

function EqDetailPanel({ eq, onClose }) {
  if (!eq) return null;
  const recent = Date.now() - new Date(eq.properties.time) <= RECENT_MS;
  const color = recent ? "#ff3300" : "#ff8800";
  const mag = eq.properties.mag;
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
          maxWidth: "400px",
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
          style={{ fontSize: "17px", fontWeight: "bold", marginBottom: "10px" }}
        >
          {recent ? "🔴 Recent Earthquake (< 24h)" : "🟠 Earthquake"}
        </div>
        <div className="detail-value">
          <span className="detail-label">Magnitude: </span>
          <strong
            style={{
              fontSize: "16px",
              color: mag >= 5 ? "#ff3300" : mag >= 3 ? "#ff8800" : "#ffcc00",
            }}
          >
            {mag}
          </strong>
        </div>
        <div className="detail-value">
          <span className="detail-label">Place: </span>
          {eq.properties.place}
        </div>
        <div className="detail-value">
          <span className="detail-label">Date: </span>
          {new Date(eq.properties.time).toLocaleString()}
        </div>
        <div className="detail-value">
          <span className="detail-label">Depth: </span>
          {eq.geometry.coordinates[2].toFixed(1)} km
        </div>
        <div className="detail-value">
          <span className="detail-label">Location: </span>
          {eq.geometry.coordinates[1].toFixed(3)}°N,{" "}
          {eq.geometry.coordinates[0].toFixed(3)}°E
        </div>
        {eq.properties.url && (
          <a
            href={eq.properties.url}
            target="_blank"
            rel="noreferrer"
            className="detail-link"
            style={{
              fontSize: "12px",
              textDecoration: "none",
              marginTop: "8px",
              display: "inline-block",
            }}
          >
            View on USGS →
          </a>
        )}
      </div>
    </div>
  );
}

function Earthquake() {
  const today = new Date().toISOString().slice(0, 10);
  const yearAgo = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const [earthquakes, setEarthquakes] = useState([]);
  const [startDate, setStartDate] = useState(yearAgo);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [localUploadsReady, setLocalUploadsReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mapType, setMapType] = useState("default");
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsGeo, setRegionsGeo] = useState(null);
  useEffect(() => {
    fetch("/ethiopia-regions.geojson")
      .then((r) => r.json())
      .then(setRegionsGeo)
      .catch(() => {});
  }, []);

  // Live risk for all regions — shown in RegionSelector dropdown
  const regionRisks = useMemo(
    () => computeAllRegionRisks("Earthquake", { earthquakes }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [earthquakes],
  );

  const fetchEarthquakes = async (start, end) => {
    try {
      setLoading(true);
      const url =
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
        `&starttime=${start}&endtime=${end}` +
        `&minlatitude=3.0&maxlatitude=15.0&minlongitude=33.0&maxlongitude=48.0`;
      const data = await fetch(url).then((r) => r.json());
      setEarthquakes(data.features || []);
    } catch (err) {
      console.error("Earthquake fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) fetchEarthquakes(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=earthquake&status=approved",
        );
        if (!res.ok) throw new Error("Failed to fetch uploads");
        const data = await res.json();
        if (!cancelled) {
          // Only count "Disaster Data:" uploads — same filter as LocalDisasterData
          // and UploadedImageFill. Research uploads must NOT trigger the image fill.
          const localOnly = data.filter((u) =>
            u.title?.startsWith("Disaster Data:"),
          );
          setHasLocalUploads(localOnly.length > 0);
          setLocalUploadsReady(true);
        }
      } catch {
        // keep current state
      }
    };
    checkUploads();
    const pollId = setInterval(checkUploads, 8000);
    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, []);

  const isRecent = (time) => Date.now() - new Date(time) <= RECENT_MS;

  const downloadCSV = () => {
    const header = "id,place,magnitude,time,longitude,latitude,depth";
    const rows = earthquakes.map((eq) =>
      [
        eq.id,
        `"${eq.properties.place}"`,
        eq.properties.mag,
        new Date(eq.properties.time).toISOString(),
        eq.geometry.coordinates[0],
        eq.geometry.coordinates[1],
        eq.geometry.coordinates[2],
      ].join(","),
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ethiopia_earthquakes.csv";
    a.click();
  };

  // ── SECTION 1: TIME SERIES (Daily Buckets) ──────────────────────────────────
  const timeSeriesData = useMemo(() => {
    if (!earthquakes.length) return [];
    const dateMap = {};

    earthquakes.forEach((eq) => {
      const dStr = new Date(eq.properties.time).toISOString().slice(0, 10);
      if (!dateMap[dStr]) {
        dateMap[dStr] = {
          date: dStr,
          count: 0,
          maxMag: 0,
          totalMag: 0,
          depths: [],
        };
      }
      dateMap[dStr].count += 1;
      const mag = eq.properties.mag || 0;
      dateMap[dStr].totalMag += mag;
      if (mag > dateMap[dStr].maxMag) dateMap[dStr].maxMag = mag;
      dateMap[dStr].depths.push(eq.geometry.coordinates[2]);
    });

    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        avgDepth: d.depths.length
          ? +(d.depths.reduce((a, b) => a + b, 0) / d.depths.length).toFixed(1)
          : 10.0,
      }));
  }, [earthquakes]);

  // Overall seismic summary statistics
  const seismicStats = useMemo(() => {
    if (!earthquakes.length) return null;
    let peakEq = earthquakes[0];
    let totalDepth = 0;
    let sigCount = 0;

    earthquakes.forEach((eq) => {
      if ((eq.properties.mag || 0) > (peakEq.properties.mag || 0)) {
        peakEq = eq;
      }
      totalDepth += eq.geometry.coordinates[2] || 0;
      if ((eq.properties.mag || 0) >= 4.5) sigCount += 1;
    });

    const avgDepth = +(totalDepth / earthquakes.length).toFixed(1);
    const peakMag = peakEq.properties.mag || 0;
    const peakPlace = peakEq.properties.place || "Ethiopia";
    const peakDate = new Date(peakEq.properties.time)
      .toISOString()
      .slice(0, 10);

    return {
      totalCount: earthquakes.length,
      peakMag,
      peakPlace,
      peakDate,
      avgDepth,
      sigCount,
    };
  }, [earthquakes]);

  // ── SECTION 2: SPATIAL ANALYSIS (By Region Point-in-Polygon) ────────────────
  const regionSeismicStats = useMemo(() => {
    if (!regionsGeo?.features?.length || !earthquakes.length) return [];

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

    const counts = {};
    regionsGeo.features.forEach((feat) => {
      const name =
        feat.properties?.shapeName ||
        feat.properties?.NAME_1 ||
        feat.properties?.name ||
        "Unknown";
      counts[name] = {
        name,
        count: 0,
        maxMag: 0,
        totalMag: 0,
        shallowCount: 0,
        intermediateCount: 0,
        totalEnergy: 0,
      };
    });

    earthquakes.forEach((eq) => {
      const lat = eq.geometry.coordinates[1];
      const lon = eq.geometry.coordinates[0];
      const depth = eq.geometry.coordinates[2] || 10;
      const mag = eq.properties.mag || 0;
      const energy = Math.pow(10, 4.8 + 1.5 * mag);

      for (const feat of regionsGeo.features) {
        if (pointInFeature(feat, lat, lon)) {
          const name =
            feat.properties?.shapeName ||
            feat.properties?.NAME_1 ||
            feat.properties?.name ||
            "Unknown";
          if (counts[name]) {
            counts[name].count++;
            counts[name].totalMag += mag;
            if (mag > counts[name].maxMag) counts[name].maxMag = mag;
            if (depth < 15) counts[name].shallowCount++;
            else counts[name].intermediateCount++;
            counts[name].totalEnergy += energy;
          }
          break;
        }
      }
    });

    return Object.values(counts)
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [earthquakes, regionsGeo]);

  // ── SECTION 3: RISK ASSESSMENT (Modified Mercalli Intensity & Hazard) ───────
  const riskAssessmentData = useMemo(() => {
    if (!regionSeismicStats.length) return [];
    return regionSeismicStats.map((r) => {
      const avgMag = +(r.totalMag / r.count).toFixed(2);
      let mmi = "I - II";
      let level = { label: "Low", color: "#22c55e", bg: "#22c55e15" };
      let description = "Imperceptible to light shaking";

      if (r.maxMag >= 5.5) {
        mmi = "VII - VIII";
        level = { label: "Critical", color: "#dc2626", bg: "#dc262618" };
        description = "Very strong to destructive shaking";
      } else if (r.maxMag >= 4.8 || r.count >= 20) {
        mmi = "V - VI";
        level = { label: "High", color: "#f97316", bg: "#f9731618" };
        description = "Moderate to strong shaking; rift fault displacement";
      } else if (r.maxMag >= 4.0 || r.count >= 8) {
        mmi = "III - IV";
        level = { label: "Moderate", color: "#eab308", bg: "#eab30818" };
        description = "Light to noticeable shaking";
      }

      const energyGJ = +(r.totalEnergy / 1e9).toFixed(1);

      return {
        ...r,
        avgMag,
        mmi,
        level,
        description,
        energyGJ,
      };
    });
  }, [regionSeismicStats]);

  // ── SECTION 4: FORECAST / PROBABILISTIC SEISMIC OUTLOOK ────────────────────
  const forecastData = useMemo(() => {
    if (earthquakes.length < 5) return null;
    const totalDays = Math.max(
      1,
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
    );
    const dailyRate = earthquakes.length / totalDays;
    const sigDailyRate =
      earthquakes.filter((eq) => (eq.properties.mag || 0) >= 4.5).length /
      totalDays;

    const prob7Days = +((1 - Math.exp(-sigDailyRate * 7)) * 100).toFixed(1);
    const prob30Days = +((1 - Math.exp(-sigDailyRate * 30)) * 100).toFixed(1);

    const recent14Count = earthquakes.filter(
      (eq) =>
        Date.now() - new Date(eq.properties.time) <= 14 * 24 * 60 * 60 * 1000,
    ).length;
    const prev14Count = earthquakes.filter((eq) => {
      const dt = Date.now() - new Date(eq.properties.time);
      return dt > 14 * 24 * 60 * 60 * 1000 && dt <= 28 * 24 * 60 * 60 * 1000;
    }).length;

    const trend =
      recent14Count > prev14Count + 2
        ? { label: "Elevated Seismic Swarm", color: "#dc2626", bg: "#dc262618" }
        : recent14Count < prev14Count - 2
          ? {
              label: "Quiescent / Decreasing",
              color: "#059669",
              bg: "#05966918",
            }
          : {
              label: "Steady Background Seismicity",
              color: "#eab308",
              bg: "#eab30818",
            };

    return {
      dailyRate: +dailyRate.toFixed(2),
      sigDailyRate: +sigDailyRate.toFixed(3),
      prob7Days,
      prob30Days,
      trend,
      recent14Count,
    };
  }, [earthquakes, startDate, endDate]);

  return (
    <div className="hazard-page">
      <EqDetailPanel eq={selected} onClose={() => setSelected(null)} />

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="hazard-page-header-wrap">
        <div
          className="hazard-page-header-card"
          style={{ "--hazard-glow": "rgba(59,130,246,0.12)" }}
        >
          <div className="hazard-page-header">
            <div className="hazard-page-header-left">
              <div
                className="hazard-page-header-icon"
                style={{ background: ACCENT + "18" }}
              >
                <img
                  src="/icons/icons8-earthquake-64.png"
                  alt="Earthquake"
                  style={{ width: 26, height: 26, objectFit: "contain" }}
                />
              </div>
              <div className="hazard-page-header-text">
                <div className="hazard-page-header-label">
                  Hazard Monitoring · Ethiopia
                </div>
                <div
                  className="hazard-page-header-title"
                  style={{ color: ACCENT }}
                >
                  Earthquake Monitoring
                </div>
                <div className="hazard-page-header-subtitle">
                  Real-time seismic activity — USGS &amp; SSGI local network
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <RegionSelector
                activeRegion={activeRegion}
                onSelect={setActiveRegion}
                liveHazard="Earthquake"
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
                    <div className="hazard-map-label">Global Data · USGS</div>
                    <div className="hazard-map-title">
                      Global Earthquake Data — Ethiopia
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
                  <span
                    className="hazard-map-badge"
                    style={{
                      color: ACCENT,
                      borderColor: ACCENT + "44",
                      background: ACCENT + "12",
                    }}
                  >
                    {loading
                      ? "Loading…"
                      : `${earthquakes.length} event${earthquakes.length !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              <div className="global-fire-toolbar">
                <div className="date-input-wrap">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || today}
                    data-placeholder="Start Date"
                  />
                </div>
                <div className="date-input-wrap">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={today}
                    data-placeholder="End Date"
                  />
                </div>
                <button className="download-csv-btn" onClick={downloadCSV}>
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

              {loading && (
                <div className="hazard-status-text">
                  Loading earthquake data…
                </div>
              )}

              <div className="hazard-legend">
                {[
                  { color: "#ff3300", label: "Recent quake (< 24h)" },
                  { color: "#ff8800", label: "Older quake (> 24h)" },
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
                  {earthquakes.map((eq) => {
                    const recent = isRecent(eq.properties.time);
                    return (
                      <CircleMarker
                        key={eq.id}
                        center={[
                          eq.geometry.coordinates[1],
                          eq.geometry.coordinates[0],
                        ]}
                        radius={recent ? 5 : 8}
                        pathOptions={{
                          color: "#fff",
                          fillColor: recent ? "#ff3300" : "#ff8800",
                          fillOpacity: recent ? 0.9 : 0.75,
                          weight: 1,
                          opacity: 0.8,
                        }}
                        eventHandlers={{ click: () => setSelected(eq) }}
                      >
                        <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                          <div
                            style={{
                              fontSize: "12px",
                              lineHeight: "1.5",
                              minWidth: "140px",
                              color: "#111",
                            }}
                          >
                            <strong>M {eq.properties.mag}</strong>
                            <br />
                            <span style={{ color: "#444" }}>
                              {eq.properties.place}
                            </span>
                            <br />
                            <span
                              style={{
                                color: recent ? "#c0392b" : "#b7600a",
                                fontSize: "11px",
                              }}
                            >
                              {recent
                                ? "🔴 Recent (< 24h)"
                                : "🟠 Older (> 24h)"}
                            </span>
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
                <RegionRiskCard
                  activeRegion={activeRegion}
                  onClose={() => setActiveRegion(null)}
                  liveHazard="Earthquake"
                  liveRisk={computeRegionRisk("Earthquake", activeRegion, {
                    earthquakes,
                  })}
                />
                <MapTypeToggle mapType={mapType} setMapType={setMapType} />
              </div>

              <div className="hazard-map-footer">
                <span>Source: USGS Earthquake Hazards Program</span>
                <span>
                  {startDate} → {endDate}
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
                      Local Earthquake Data — Ethiopia
                    </div>
                  </div>
                </div>
                <span
                  className="hazard-map-badge"
                  style={{
                    color: ACCENT,
                    borderColor: ACCENT + "44",
                    background: ACCENT + "12",
                  }}
                >
                  SSGI Ethiopia
                </span>
              </div>

              <div className="hazard-local-meta">
                <LocalDisasterData
                  disasterType="Earthquake"
                  onUploadReady={(upload) => setHasLocalUploads(!!upload)}
                />
              </div>

              <div className="hazard-map-container">
                {hasLocalUploads ? (
                  <UploadedImageFill disasterType="Earthquake" />
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
                <span>Source: SSGI Ethiopia · Local seismic network</span>
                <span>
                  {hasLocalUploads ? "Uploaded data" : "Live base map"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: TIME SERIES (SEISMIC FREQUENCY & MAGNITUDE) ──── */}
        <div
          className="hazard-analysis-section"
          style={{ marginBottom: "24px" }}
        >
          <div className="hazard-map-card" style={{ overflow: "hidden" }}>
            <div className="hazard-map-header">
              <div className="hazard-map-header-left">
                <div className="hazard-map-indicator global" />
                <div className="hazard-map-title-group">
                  <div className="hazard-map-label">
                    Time Series · USGS Seismic Catalog
                  </div>
                  <div className="hazard-map-title">
                    Daily Seismic Event Frequency &amp; Peak Magnitude
                  </div>
                </div>
              </div>
              <span
                className="hazard-map-badge"
                style={{
                  color: ACCENT,
                  borderColor: ACCENT + "44",
                  background: ACCENT + "12",
                }}
              >
                {timeSeriesData.length} Active Seismic Days
              </span>
            </div>

            {/* Summary Stat Pills */}
            {seismicStats && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  padding: "14px 20px 6px",
                }}
              >
                {[
                  {
                    label: "Total Earthquakes",
                    value: `${seismicStats.totalCount}`,
                    sub: "events recorded",
                    color: ACCENT,
                  },
                  {
                    label: "Peak Magnitude",
                    value: `M ${seismicStats.peakMag}`,
                    sub: seismicStats.peakDate,
                    color: "#dc2626",
                  },
                  {
                    label: "Avg Focal Depth",
                    value: `${seismicStats.avgDepth} km`,
                    sub: "crustal seismicity",
                    color: "#059669",
                  },
                  {
                    label: "Significant (M ≥ 4.5)",
                    value: `${seismicStats.sigCount}`,
                    sub: "events",
                    color: "#f97316",
                  },
                ].map(({ label, value, sub, color }) => (
                  <div
                    key={label}
                    style={{
                      background: color + "10",
                      border: `1.5px solid ${color}30`,
                      borderRadius: "12px",
                      padding: "10px 16px 11px",
                      minWidth: "130px",
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
                        fontSize: "20px",
                        fontWeight: 900,
                        color,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "var(--text-muted)",
                        marginTop: "3px",
                      }}
                    >
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dual Y-axis Line Chart */}
            <div
              style={{
                padding: "16px 20px 12px",
                height: "300px",
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
                  }}
                >
                  Aggregating seismic time series…
                </div>
              ) : timeSeriesData.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No seismic records found for this period
                </div>
              ) : (
                <Line
                  data={{
                    labels: timeSeriesData.map((d) => d.label),
                    datasets: [
                      {
                        label: "Earthquake Count",
                        data: timeSeriesData.map((d) => d.count),
                        borderColor: "#eab308",
                        backgroundColor: "rgba(234, 179, 8, 0.15)",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: "#eab308",
                        borderWidth: 2,
                        yAxisID: "yCount",
                      },
                      {
                        label: "Max Magnitude (Mw)",
                        data: timeSeriesData.map((d) => d.maxMag),
                        borderColor: "#ef4444",
                        backgroundColor: "transparent",
                        fill: false,
                        tension: 0.2,
                        pointRadius: 4,
                        pointBackgroundColor: "#ef4444",
                        borderWidth: 1.8,
                        borderDash: [4, 4],
                        yAxisID: "yMag",
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
                        borderColor: ACCENT,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                          title: (items) => {
                            const idx = items[0]?.dataIndex;
                            const d = timeSeriesData[idx];
                            return d ? `📅 ${d.date} (${d.label})` : "";
                          },
                          label: (item) => {
                            if (item.dataset.yAxisID === "yCount")
                              return `  ⚡ Events: ${item.raw}`;
                            return `  🔴 Max Magnitude: M ${item.raw}`;
                          },
                          afterBody: (items) => {
                            const idx = items[0]?.dataIndex;
                            const d = timeSeriesData[idx];
                            return d
                              ? [`  📏 Avg Depth: ${d.avgDepth} km`]
                              : [];
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
                          maxTicksLimit: 14,
                        },
                      },
                      yCount: {
                        type: "linear",
                        position: "left",
                        grid: { color: "rgba(255,255,255,0.06)" },
                        ticks: {
                          color: "#eab308",
                          font: { size: 10 },
                          precision: 0,
                        },
                        title: {
                          display: true,
                          text: "Daily Event Count",
                          color: "#eab308",
                          font: { size: 10 },
                        },
                      },
                      yMag: {
                        type: "linear",
                        position: "right",
                        min: 2.0,
                        max: 7.0,
                        grid: { drawOnChartArea: false },
                        ticks: { color: "#ef4444", font: { size: 10 } },
                        title: {
                          display: true,
                          text: "Magnitude (Mw)",
                          color: "#ef4444",
                          font: { size: 10 },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>

            <div className="hazard-map-footer">
              <span>
                Time-series aggregation: USGS Global Earthquake Catalog ·
                Window: {startDate} → {endDate}
              </span>
              <span>{earthquakes.length} total events recorded</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SPATIAL ANALYSIS (POINT-IN-POLYGON & DEPTH) ── */}
        <div
          className="hazard-analysis-section"
          style={{ marginBottom: "24px" }}
        >
          <div className="hazard-map-card" style={{ overflow: "hidden" }}>
            <div className="hazard-map-header">
              <div className="hazard-map-header-left">
                <div className="hazard-map-indicator global" />
                <div className="hazard-map-title-group">
                  <div className="hazard-map-label">
                    Spatial Analysis · Seismotectonic Clustering
                  </div>
                  <div className="hazard-map-title">
                    Seismic Events &amp; Maximum Magnitude by Ethiopian Region
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
                {regionSeismicStats.length} Seismically Active Regions
              </span>
            </div>

            {/* Horizontal Bar Chart */}
            <div
              style={{
                padding: "16px 20px 12px",
                height: `${Math.max(260, regionSeismicStats.length * 34 + 60)}px`,
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
                  }}
                >
                  Calculating regional seismic distribution…
                </div>
              ) : regionSeismicStats.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No seismic events mapped to regional polygons
                </div>
              ) : (
                <Bar
                  data={{
                    labels: regionSeismicStats.map((r) => r.name),
                    datasets: [
                      {
                        label: "Seismic Events",
                        data: regionSeismicStats.map((r) => r.count),
                        backgroundColor: regionSeismicStats.map((r) =>
                          r.maxMag >= 5.0
                            ? "rgba(220, 38, 38, 0.8)"
                            : r.maxMag >= 4.5
                              ? "rgba(249, 115, 22, 0.8)"
                              : "rgba(234, 179, 8, 0.8)",
                        ),
                        borderColor: regionSeismicStats.map((r) =>
                          r.maxMag >= 5.0
                            ? "#dc2626"
                            : r.maxMag >= 4.5
                              ? "#f97316"
                              : "#eab308",
                        ),
                        borderWidth: 1.2,
                        borderRadius: 4,
                      },
                      {
                        label: "Max Magnitude (Mw)",
                        data: regionSeismicStats.map((r) => r.maxMag),
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        borderColor: "#ef4444",
                        borderWidth: 1.5,
                        borderRadius: 4,
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
                        borderColor: ACCENT,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                          title: (items) => `📍 ${items[0]?.label}`,
                          label: (item) => {
                            if (item.datasetIndex === 0)
                              return `  ⚡ Earthquakes: ${item.raw}`;
                            return `  🔴 Peak Magnitude: M ${item.raw}`;
                          },
                          afterBody: (items) => {
                            const idx = items[0]?.dataIndex;
                            const r = regionSeismicStats[idx];
                            if (!r) return [];
                            return [
                              `  🔬 Shallow (<15km): ${r.shallowCount} events`,
                              `  🌐 Intermediate (≥15km): ${r.intermediateCount} events`,
                            ];
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: ACCENT, font: { size: 10 } },
                        title: {
                          display: true,
                          text: "Event Count & Magnitude",
                          color: ACCENT,
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
                    },
                  }}
                />
              )}
            </div>

            <div className="hazard-map-footer">
              <span>
                Point-in-polygon spatial assignment: USGS epicenters → Ethiopian
                Admin-1 boundaries
              </span>
              <span>
                Rift margin and Afar triple-junction seismic clustering
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: RISK ASSESSMENT (MMI & SEISMOTECTONIC HAZARD) ── */}
        <div
          className="hazard-analysis-section"
          style={{ marginBottom: "24px" }}
        >
          <div className="hazard-map-card" style={{ overflow: "hidden" }}>
            <div className="hazard-map-header">
              <div className="hazard-map-header-left">
                <div className="hazard-map-indicator global" />
                <div className="hazard-map-title-group">
                  <div className="hazard-map-label">
                    Risk Assessment · Modified Mercalli Intensity (MMI)
                  </div>
                  <div className="hazard-map-title">
                    Seismic Hazard &amp; Energy Release by Ethiopian Region
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
                {
                  riskAssessmentData.filter((r) => r.level.label === "Critical")
                    .length
                }{" "}
                Critical ·{" "}
                {
                  riskAssessmentData.filter((r) => r.level.label === "High")
                    .length
                }{" "}
                High
              </span>
            </div>

            {/* Scorecards Grid */}
            <div
              style={{
                padding: "14px 20px 18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              {riskAssessmentData.map((r) => (
                <div
                  key={r.name}
                  style={{
                    background: r.level.bg,
                    border: `1.5px solid ${r.level.color}30`,
                    borderRadius: "14px",
                    padding: "14px 16px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
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
                      background: `linear-gradient(90deg, ${r.level.color}, ${r.level.color}88)`,
                      borderRadius: "14px 14px 0 0",
                    }}
                  />

                  {/* Header row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                      marginTop: "4px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "13.5px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {r.name}
                    </div>
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 900,
                        color: r.level.color,
                        background: r.level.color + "18",
                        border: `1px solid ${r.level.color}50`,
                        borderRadius: "999px",
                        padding: "3px 10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {r.level.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: "6px",
                      background: "rgba(128,128,128,0.15)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (r.maxMag / 6.5) * 100)}%`,
                        background: `linear-gradient(90deg, ${r.level.color}cc, ${r.level.color})`,
                        borderRadius: "999px",
                        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </div>

                  {/* 3-col metrics */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "6px",
                      textAlign: "center",
                    }}
                  >
                    {[
                      { val: r.count, lbl: "Events", color: r.level.color },
                      {
                        val: `M ${r.maxMag}`,
                        lbl: "Peak Mag",
                        color: "#ef4444",
                      },
                      { val: r.mmi, lbl: "MMI", color: ACCENT },
                    ].map(({ val, lbl, color }) => (
                      <div
                        key={lbl}
                        style={{
                          background: "rgba(128,128,128,0.07)",
                          borderRadius: "8px",
                          padding: "6px 4px",
                          border: "1px solid rgba(128,128,128,0.10)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color,
                            lineHeight: 1,
                          }}
                        >
                          {val}
                        </div>
                        <div
                          style={{
                            fontSize: "9.5px",
                            color: "var(--text-muted)",
                            marginTop: "3px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {lbl}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10.5px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        paddingRight: 8,
                      }}
                    >
                      {r.description}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: r.level.color,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.energyGJ} GJ
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hazard-map-footer">
              <span>
                Modified Mercalli scale: I-II (Minor), III-IV (Light), V-VI
                (Moderate/Strong), VII+ (Destructive)
              </span>
              <span>Gutenberg-Richter seismic energy calculation</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: FORECAST / PROBABILISTIC SEISMIC OUTLOOK ─────── */}
        {forecastData && (
          <div
            className="hazard-analysis-section"
            style={{ marginBottom: "24px" }}
          >
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Forecast &amp; Probabilistic Seismic Outlook (PSHA)
                    </div>
                    <div className="hazard-map-title">
                      Short-Term Recurrence Rate &amp; Aftershock Decay Trend
                    </div>
                  </div>
                </div>
                <span
                  className="hazard-map-badge"
                  style={{
                    color: forecastData.trend.color,
                    borderColor: forecastData.trend.color + "44",
                    background: forecastData.trend.bg,
                  }}
                >
                  {forecastData.trend.label}
                </span>
              </div>

              {/* Upgraded Forecast Cards */}
              <div style={{ padding: "16px 20px 20px" }}>
                {/* Top row — 4 stat cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "12px",
                    marginBottom: "18px",
                  }}
                >
                  {[
                    {
                      label: "Seismic Rate",
                      value: `~${forecastData.dailyRate}`,
                      sub: "events / day",
                      color: ACCENT,
                    },
                    {
                      label: "7-Day Prob (M ≥ 4.5)",
                      value: `${forecastData.prob7Days}%`,
                      sub: "probability",
                      color:
                        forecastData.prob7Days >= 50 ? "#dc2626" : "#f97316",
                    },
                    {
                      label: "30-Day Prob (M ≥ 4.5)",
                      value: `${forecastData.prob30Days}%`,
                      sub: "probability",
                      color:
                        forecastData.prob30Days >= 70 ? "#dc2626" : "#f97316",
                    },
                    {
                      label: "Recent 14-Day",
                      value: `${forecastData.recent14Count}`,
                      sub: "events recorded",
                      color: "#059669",
                    },
                  ].map(({ label, value, sub, color }) => (
                    <div
                      key={label}
                      style={{
                        background: color + "10",
                        border: `1.5px solid ${color}30`,
                        borderRadius: "12px",
                        padding: "12px 16px",
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
                          marginBottom: "6px",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: 900,
                          color,
                          lineHeight: 1,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {value}
                      </div>
                      <div
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        {sub}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Probability gauge bars */}
                <div
                  style={{
                    background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                    border: "1px solid var(--border-light)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "12px",
                    }}
                  >
                    Exceedance Probability — Poisson Model
                  </div>
                  {[
                    {
                      label: "7-Day (M ≥ 4.5)",
                      prob: forecastData.prob7Days,
                      color:
                        forecastData.prob7Days >= 50 ? "#dc2626" : "#f97316",
                    },
                    {
                      label: "30-Day (M ≥ 4.5)",
                      prob: forecastData.prob30Days,
                      color:
                        forecastData.prob30Days >= 70 ? "#dc2626" : "#f97316",
                    },
                    {
                      label: "30-Day (M ≥ 3.0)",
                      prob: Math.min(99, forecastData.prob30Days * 2.5),
                      color: ACCENT,
                    },
                  ].map(({ label, prob, color }) => (
                    <div key={label} style={{ marginBottom: "10px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11.5px",
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{ fontSize: "12px", fontWeight: 800, color }}
                        >
                          {prob}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "7px",
                          background: "rgba(128,128,128,0.12)",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, prob)}%`,
                            background: `linear-gradient(90deg, ${color}88, ${color})`,
                            borderRadius: "999px",
                            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Methodology note */}
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    lineHeight: 1.65,
                    padding: "10px 14px",
                    background: "rgba(99,102,241,0.04)",
                    borderRadius: "10px",
                    border: "1px solid rgba(99,102,241,0.1)",
                  }}
                >
                  <strong style={{ color: "var(--text-secondary)" }}>
                    Poisson Model:
                  </strong>{" "}
                  Earthquake recurrence is modeled as a Poisson process using
                  observed daily seismic rate from the USGS catalog.
                  Probabilities reflect exceedance likelihood based on current
                  activity levels.{" "}
                  <em>
                    Earthquakes cannot be deterministically predicted in time or
                    location.
                  </em>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Earthquake;
