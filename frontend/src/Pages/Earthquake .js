import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/GlobalDataCard.css";
import LocalDisasterData from "../Componenet/LocalDisasterData";
import EthiopiaMask from "../Componenet/EthiopiaMask";

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

const RECENT_MS = 24 * 60 * 60 * 1000;

// ── Click detail panel ─────────────────────────────────────────────────────
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
  const [selected, setSelected] = useState(null);
  const [mapType, setMapType] = useState("default");

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
        if (!cancelled) setHasLocalUploads(data.length > 0);
      } catch {
        if (!cancelled) {
          const saved = JSON.parse(
            localStorage.getItem("disasterUploads") || "[]",
          );
          setHasLocalUploads(
            saved.filter((u) => u.disasterType === "Earthquake").length > 0,
          );
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

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        backgroundColor: "#111",
      }}
    >
      <EqDetailPanel eq={selected} onClose={() => setSelected(null)} />

      {/* LEFT COLUMN */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
          {/* Local data */}
          <div
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#222",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ overflow: "auto", marginBottom: "10px" }}>
              <LocalDisasterData disasterType="Earthquake" />
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

          {/* Global data */}
          <div style={cardStyle}>
            <div style={titleStyle}>Global Earthquake Data (Ethiopia)</div>
            <div className="controls-row">
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
              <button className="csv-btn" onClick={downloadCSV}>
                Download CSV
              </button>
            </div>

            {loading && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  paddingBottom: "4px",
                  color: "#888",
                }}
              >
                Loading earthquake data…
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
                { color: "#ff3300", label: "Recent quake (< 24h)", size: 5 },
                { color: "#ff8800", label: "Older quake (> 24h)", size: 8 },
              ].map(({ color, label, size }) => (
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
                      width: size + 4,
                      height: size + 4,
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
                <TileLayer
                  attribution={MAP_TYPES[mapType].attribution}
                  url={MAP_TYPES[mapType].url}
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
                            {recent ? "🔴 Recent (< 24h)" : "🟠 Older (> 24h)"}
                          </span>
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
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

        <div
          style={{
            padding: "15px",
            backgroundColor: "#222",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#00aaff" }}>Comparison</h3>
          <p>Placeholder for comparison of local vs global earthquake data.</p>
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
        {["Time Series", "Map", "Video", "Risk Assessment / Forecast"].map(
          (t) => (
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
              <p>Placeholder for {t.toLowerCase()}.</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default Earthquake;
