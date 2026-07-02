import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import "leaflet/dist/leaflet.css";
import "../styles/GlobalDataCard.css";
import LocalDisasterData, {
  UploadedImageFill,
} from "../Componenet/LocalDisasterData";
import EthiopiaMask from "../Componenet/EthiopiaMask";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

// ── Major Ethiopian river basins / monitoring points ───────────────────────
const ETHIOPIA_RIVERS = [
  { name: "Awash Basin", lat: 9.1, lon: 40.1, river: "Awash" },
  { name: "Blue Nile (Abbay)", lat: 10.6, lon: 37.5, river: "Blue Nile" },
  { name: "Omo River", lat: 6.5, lon: 36.5, river: "Omo" },
  { name: "Tekeze River", lat: 13.7, lon: 38.8, river: "Tekeze" },
  { name: "Wabe Shebelle", lat: 7.5, lon: 44.0, river: "Wabe Shebelle" },
  { name: "Baro River", lat: 8.2, lon: 34.6, river: "Baro" },
  { name: "Genale River", lat: 5.9, lon: 40.5, river: "Genale" },
  { name: "Meki River", lat: 8.15, lon: 38.82, river: "Meki" },
];

// ── Map types ──────────────────────────────────────────────────────────────
const MAP_TYPES = {
  default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    label: "Default",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    label: "Satellite",
  },
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
    label: "Terrain",
  },
};

const cardStyle = {
  flex: 1,
  backgroundColor: "#1a1a1a",
  borderRadius: "10px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};
const titleStyle = {
  color: "#00aaff",
  fontWeight: "bold",
  fontSize: "18px",
  textAlign: "center",
  padding: "12px 16px 8px",
};
const toggleStyle = {
  position: "absolute",
  bottom: "12px",
  right: "12px",
  display: "flex",
  gap: "6px",
  zIndex: 1000,
};

function MapTypeToggle({ mapType, setMapType }) {
  return (
    <div style={toggleStyle}>
      {Object.entries(MAP_TYPES).map(([key, t]) => (
        <button
          key={key}
          onClick={() => setMapType(key)}
          className={`map-toggle-btn${mapType === key ? " active" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Colour marker by discharge level relative to max ──────────────────────
function dischargeColor(current, max) {
  if (!current || !max) return "#aaa";
  const ratio = current / max;
  if (ratio > 0.75) return "#ff1100";
  if (ratio > 0.5) return "#ff8800";
  if (ratio > 0.25) return "#ffcc00";
  return "#00aaff";
}

function dischargeLabel(current, max) {
  if (!current || !max) return "No data";
  const ratio = current / max;
  if (ratio > 0.75) return "⚠ Very High";
  if (ratio > 0.5) return "High";
  if (ratio > 0.25) return "Moderate";
  return "Low";
}

// ── Fetch Open-Meteo flood API for one point ───────────────────────────────
async function fetchRiverDischarge(lat, lon) {
  const url =
    `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}` +
    `&daily=river_discharge&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function Flood() {
  const [riverData, setRiverData] = useState({}); // { name: { dates, values } }
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");

  // ── Fetch all river points on mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled(
        ETHIOPIA_RIVERS.map((r) => fetchRiverDischarge(r.lat, r.lon)),
      );
      if (cancelled) return;
      const data = {};
      results.forEach((res, i) => {
        const r = ETHIOPIA_RIVERS[i];
        if (res.status === "fulfilled" && res.value.daily) {
          data[r.name] = {
            dates: res.value.daily.time,
            values: res.value.daily.river_discharge,
            lat: r.lat,
            lon: r.lon,
            river: r.river,
          };
        }
      });
      setRiverData(data);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Local uploads check ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=flood&status=approved",
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setHasLocalUploads(data.length > 0);
      } catch {
        /* keep current */
      }
    };
    check();
    const id = setInterval(check, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ── Helper: current (today) discharge for a river ─────────────────────
  const currentDischarge = (name) => {
    const d = riverData[name];
    if (!d || !d.values?.length) return null;
    return d.values[0];
  };
  const maxDischarge = (name) => {
    const d = riverData[name];
    if (!d || !d.values?.length) return null;
    return Math.max(...d.values.filter(Boolean));
  };

  // ── Chart for selected river ───────────────────────────────────────────
  const chartData =
    selected && riverData[selected]
      ? {
          labels: riverData[selected].dates.map((d) => d.slice(5)), // MM-DD
          datasets: [
            {
              label: `${selected} — River Discharge (m³/s)`,
              data: riverData[selected].values,
              borderColor: "#00aaff",
              backgroundColor: "rgba(0,170,255,0.12)",
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: riverData[selected].values.map((v) =>
                dischargeColor(v, maxDischarge(selected)),
              ),
            },
          ],
        }
      : null;

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        backgroundColor: "#111",
      }}
    >
      {/* LEFT COLUMN */}
      <div
        style={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
          {/* Local Data */}
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
            <div style={titleStyle}>Local Flood Data (Ethiopia)</div>
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2a",
                minHeight: "72px",
              }}
            >
              <LocalDisasterData
                disasterType="Flood"
                onUploadReady={(u) => setHasLocalUploads(!!u)}
              />
            </div>
            <div style={{ flex: 1, position: "relative", minHeight: "340px" }}>
              {hasLocalUploads ? (
                <UploadedImageFill disasterType="Flood" />
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

          {/* Global Data — Open-Meteo Flood */}
          <div style={cardStyle}>
            <div style={titleStyle}>
              Global Flood Data — Open-Meteo River Discharge
            </div>

            {loading && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  padding: "6px",
                  color: "#888",
                }}
              >
                Loading river discharge forecasts…
              </div>
            )}

            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: "14px",
                padding: "4px 14px 6px",
                flexWrap: "wrap",
              }}
            >
              {[
                { color: "#ff1100", label: "Very High (>75%)" },
                { color: "#ff8800", label: "High (50–75%)" },
                { color: "#ffcc00", label: "Moderate (25–50%)" },
                { color: "#00aaff", label: "Low (<25%)" },
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
                    }}
                  />
                  {label}
                </div>
              ))}
            </div>

            <div
              style={{ fontSize: "11px", color: "#555", padding: "0 14px 4px" }}
            >
              Click a marker to see 16-day forecast · Colour = % of forecast
              peak discharge
            </div>

            {/* Map */}
            <div style={{ flex: 1, minHeight: "340px", position: "relative" }}>
              <MapContainer
                center={[9.145, 40.489673]}
                zoom={5}
                style={{ height: "100%", width: "100%", minHeight: "340px" }}
              >
                <TileLayer
                  attribution={MAP_TYPES[mapType].attribution}
                  url={MAP_TYPES[mapType].url}
                />
                {ETHIOPIA_RIVERS.map((r) => {
                  const cur = currentDischarge(r.name);
                  const max = maxDischarge(r.name);
                  const col = dischargeColor(cur, max);
                  const lbl = dischargeLabel(cur, max);
                  return (
                    <CircleMarker
                      key={r.name}
                      center={[r.lat, r.lon]}
                      radius={selected === r.name ? 10 : 7}
                      pathOptions={{
                        color: "#fff",
                        fillColor: col,
                        fillOpacity: 0.9,
                        weight: 1.5,
                      }}
                      eventHandlers={{ click: () => setSelected(r.name) }}
                    >
                      <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#111",
                            minWidth: "130px",
                          }}
                        >
                          <strong>{r.name}</strong>
                          <br />
                          <span style={{ color: "#444" }}>
                            River: {r.river}
                          </span>
                          <br />
                          <span style={{ color: col, fontWeight: "600" }}>
                            {lbl}
                          </span>
                          {cur && (
                            <span style={{ color: "#555" }}>
                              {" "}
                              — {cur.toFixed(0)} m³/s
                            </span>
                          )}
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
              <MapTypeToggle mapType={mapType} setMapType={setMapType} />
            </div>
          </div>
        </div>

        {/* Time-series chart for selected river */}
        {selected && chartData && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#1a1a1a",
              borderRadius: "10px",
              border: "1px solid #2a2a2a",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ color: "#00aaff", margin: 0 }}>
                📈 16-Day River Discharge Forecast — {selected}
              </h4>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "1px solid #444",
                  color: "#aaa",
                  borderRadius: "4px",
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Close
              </button>
            </div>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#aaa" } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.parsed.y?.toFixed(1)} m³/s`,
                    },
                  },
                },
                scales: {
                  x: { ticks: { color: "#888" }, grid: { color: "#222" } },
                  y: {
                    ticks: { color: "#888" },
                    grid: { color: "#222" },
                    title: { display: true, text: "m³/s", color: "#666" },
                  },
                },
              }}
            />
            <p
              style={{
                color: "#555",
                fontSize: "11px",
                margin: "8px 0 0",
                textAlign: "right",
              }}
            >
              Source: Open-Meteo Flood API · GloFAS-based river discharge model
            </p>
          </div>
        )}

        <div
          style={{
            padding: "15px",
            backgroundColor: "#222",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#00aaff" }}>Comparison</h3>
          <p style={{ color: "#888" }}>
            Comparison of local flood observations with Open-Meteo GloFAS river
            discharge forecasts for major Ethiopian river basins.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN */}
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
          "Flood Risk Map",
          "Precipitation Trend",
          "Forecast / Prediction",
        ].map((t) => (
          <div
            key={t}
            style={{
              padding: "15px",
              backgroundColor: "#222",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#00aaff" }}>{t}</h4>
            <p style={{ color: "#888" }}>Placeholder for {t.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Flood;
