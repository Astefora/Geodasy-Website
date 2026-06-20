import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
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

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function CreatePane({ name, zIndex }) {
  const map = useMap();
  if (!map.getPane(name)) {
    const p = map.createPane(name);
    p.style.zIndex = String(zIndex);
    p.style.pointerEvents = "none";
  }
  return null;
}

function DroughtOverlay({ date }) {
  return (
    <>
      <WMSTileLayer
        key={`drought-day-${date}`}
        url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
        layers="MODIS_Terra_Land_Surface_Temp_Day"
        format="image/png"
        transparent
        time={date}
        opacity={0.8}
        pane="droughtOverlayPane"
        attribution="NASA GIBS · MODIS Terra LST Day"
      />
      <WMSTileLayer
        key={`drought-night-${date}`}
        url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
        layers="MODIS_Terra_Land_Surface_Temp_Night"
        format="image/png"
        transparent
        time={date}
        opacity={0.6}
        pane="droughtOverlayPane"
        attribution="NASA GIBS · MODIS Terra LST Night"
      />
      <EthiopiaMask paneNames={["droughtOverlayPane"]} />
    </>
  );
}

function Drought() {
  const yesterday = getYesterday();
  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(yesterday);
  const [activeDate, setActiveDate] = useState(yesterday);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");

  const handleStartDate = (val) => {
    setStartDate(val);
    setActiveDate(val);
  };

  const handleEndDate = (val) => {
    setEndDate(val);
    setActiveDate(val);
  };

  const downloadCSV = useCallback(() => {
    const blob = new Blob(
      ["date,layer\n" + activeDate + ",MODIS_Terra_Land_Surface_Temp_Day"],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ethiopia_drought.csv";
    a.click();
  }, [activeDate]);

  // Check for local uploads
  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=drought&status=approved",
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
          const droughtUploads = saved.filter(
            (u) => u.disasterType === "Drought",
          );
          setHasLocalUploads(droughtUploads.length > 0);
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
              <LocalDisasterData disasterType="Drought" />
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
            <div style={titleStyle}>Global Drought Data (Ethiopia)</div>
            <div className="controls-row">
              <div className="date-input-wrap">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDate(e.target.value)}
                  min="2000-02-24"
                  max={yesterday}
                  data-placeholder="Start Date"
                />
              </div>
              <div className="date-input-wrap">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDate(e.target.value)}
                  min={startDate}
                  max={yesterday}
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
                <CreatePane name="droughtOverlayPane" zIndex={450} />
                <TileLayer
                  attribution={MAP_TYPES[mapType].attribution}
                  url={MAP_TYPES[mapType].url}
                />
                {/* DroughtOverlay re-renders automatically when activeDate changes */}
                <DroughtOverlay date={activeDate} />
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
          <h3 style={{ color: "#00aaff" }}>Comparison</h3>
          <p>
            Comparison of uploaded local drought data with NASA MODIS land
            surface temperature over Ethiopia.
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

export default Drought;
