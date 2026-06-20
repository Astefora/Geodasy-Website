import { useEffect, useState } from "react";
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
  );
}

function Landslide() {
  const [landslides, setLandslides] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");

  useEffect(() => {
    // Fetch via backend proxy — data.nasa.gov blocks direct browser requests (CORS)
    fetch("/api/landslides?limit=5000")
      .then((r) => {
        if (!r.ok) throw new Error(`Server responded ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const ethiopia = data.filter(
          (d) =>
            d.country_name?.toLowerCase().includes("ethiopia") &&
            d.latitude &&
            d.longitude,
        );
        setLandslides(ethiopia);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Landslide fetch error:", err);
        setError(
          "Could not load landslide data. Make sure the backend is running.",
        );
        setLoading(false);
      });
  }, []);

  // Check for local uploads
  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch("/api/uploads?hazardType=landslide");
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
          const landslideUploads = saved.filter(
            (u) => u.disasterType === "Landslide",
          );
          setHasLocalUploads(landslideUploads.length > 0);
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

  const filtered = landslides.filter((ls) => {
    if (!ls.event_date) return true;
    const d = new Date(ls.event_date);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  });

  const downloadCSV = () => {
    const header = "location,latitude,longitude,event_date,trigger,fatalities";
    const rows = filtered.map((ls) =>
      [
        `"${ls.location_description || ""}"`,
        ls.latitude,
        ls.longitude,
        ls.event_date || "",
        `"${ls.landslide_trigger || ""}"`,
        ls.fatality_count || 0,
      ].join(","),
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ethiopia_landslides.csv";
    a.click();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        backgroundColor: "#111",
        minHeight: "100vh",
        color: "#fff",
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
              <LocalDisasterData disasterType="Landslide" />
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
                  <MapTypeToggle mapType={mapType} setMapType={setMapType} />
                </div>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={titleStyle}>Global Landslide Data (Ethiopia)</div>
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

            {/* Status */}
            {(loading || error) && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  paddingBottom: "4px",
                  color: error ? "#ff6060" : "#888",
                }}
              >
                {loading ? "Loading landslide data…" : `⚠ ${error}`}
              </div>
            )}

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
                {filtered.map((ls, i) => (
                  <CircleMarker
                    key={i}
                    center={[parseFloat(ls.latitude), parseFloat(ls.longitude)]}
                    radius={6}
                    pathOptions={{
                      color: "#ff1100",
                      fillColor: "#ff3300",
                      fillOpacity: 0.85,
                      weight: 1.2,
                    }}
                  >
                    <Popup>
                      <strong>Location:</strong>{" "}
                      {ls.location_description || "N/A"}
                      <br />
                      <strong>Date:</strong> {ls.event_date || "Unknown"}
                      <br />
                      <strong>Trigger:</strong>{" "}
                      {ls.landslide_trigger || "Unknown"}
                      <br />
                      <strong>Fatalities:</strong> {ls.fatality_count || 0}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
              <MapTypeToggle mapType={mapType} setMapType={setMapType} />
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
          <h3 style={{ color: "#00aaff" }}>Local vs Global Comparison</h3>
          <p>
            Spatial and temporal comparison using NASA Global Landslide Catalog.
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
          "Susceptibility Map",
          "Trigger Analysis",
          "Risk Assessment / Forecast",
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
            <p>Placeholder for {t.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Landslide;
