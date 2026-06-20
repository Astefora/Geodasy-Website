import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
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
const inputStyle = {
  flex: 1,
  padding: "10px 10px",
  borderRadius: "6px",
  border: "1px solid #444",
  background: "#111",
  color: "#fff",
  fontSize: "13px",
  colorScheme: "dark",
  minWidth: 0,
};
const csvBtnStyle = {
  padding: "10px 16px",
  borderRadius: "6px",
  border: "none",
  background: "#2e7d32",
  color: "#fff",
  fontWeight: "700",
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  alignSelf: "flex-end",
};
const labelStyle = {
  fontSize: "11px",
  color: "#888",
  fontWeight: "600",
  letterSpacing: "0.4px",
  textTransform: "uppercase",
};

const floodEvents = [
  {
    id: "flood-1",
    place: "Awash River Basin",
    lat: 9.1,
    lon: 40.1,
    date: "2026-04-12",
    waterLevel: "High",
  },
  {
    id: "flood-2",
    place: "Gambela",
    lat: 8.25,
    lon: 34.58,
    date: "2026-04-18",
    waterLevel: "Moderate",
  },
  {
    id: "flood-3",
    place: "Dire Dawa",
    lat: 9.6,
    lon: 41.86,
    date: "2026-05-02",
    waterLevel: "High",
  },
];

function Flood() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");

  // Check for local uploads
  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=flood&status=approved",
        );
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
          const floodUploads = saved.filter((u) => u.disasterType === "Flood");
          setHasLocalUploads(floodUploads.length > 0);
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

  // Auto-filter: reacts immediately when dates change
  const filtered = floodEvents.filter((ev) => {
    const d = new Date(ev.date);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  });

  const downloadCSV = () => {
    const header = "id,place,latitude,longitude,date,waterLevel";
    const rows = filtered.map(
      (ev) =>
        `${ev.id},"${ev.place}",${ev.lat},${ev.lon},${ev.date},${ev.waterLevel}`,
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ethiopia_floods.csv";
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
      {/* LEFT COLUMN — wider */}
      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
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
            <div
              style={{
                overflow: "auto",
                marginBottom: "10px",
              }}
            >
              <LocalDisasterData disasterType="Flood" />
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

          <div style={cardStyle}>
            <div style={titleStyle}>Global Flood Data (Ethiopia)</div>
            <div className="controls-row">
              <div className="date-input-wrap">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-placeholder="Start Date"
                />
              </div>
              <div className="date-input-wrap">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-placeholder="End Date"
                />
              </div>
              <button className="csv-btn" onClick={downloadCSV}>
                Download CSV
              </button>
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
                {filtered.map((ev) => (
                  <CircleMarker
                    key={ev.id}
                    center={[ev.lat, ev.lon]}
                    radius={9}
                    pathOptions={{
                      color: ev.waterLevel === "High" ? "#ff1100" : "#0077cc",
                      fillColor:
                        ev.waterLevel === "High" ? "#ff3300" : "#00aaff",
                      fillOpacity: 0.85,
                      weight: 1.5,
                    }}
                  >
                    <Popup>
                      <strong>{ev.place}</strong>
                      <br />
                      Water level: {ev.waterLevel}
                      <br />
                      Date: {ev.date}
                    </Popup>
                  </CircleMarker>
                ))}
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
          <p>Placeholder for comparison of local vs global Flood data.</p>
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
        {["Time Series", "Map", "Risk Assessment", "Forecast / Prediction"].map(
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

export default Flood;
