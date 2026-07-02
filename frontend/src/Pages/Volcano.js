import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/GlobalDataCard.css";
import LocalDisasterData, {
  UploadedImageFill,
} from "../Componenet/LocalDisasterData";
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
  backgroundColor: "var(--bg-card, #1a1a1a)",
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
          className={`map-toggle-btn${mapType === key ? " active" : ""}`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markerColor(v) {
  if (v.deformation_observation === "Yes") return "#ff3300";
  if (v.geodetic_measurements === "Yes") return "#ff8800";
  return "#aaaaaa";
}

// ── Parse Sentinel-1 frames from image filenames ──────────────────────────
// filename: volcanoname_TTTOD_NNNNN_XXXXXX.jpg  TTT=track, O=A/D, NNNNN=frame
function parseFrames(images) {
  const frames = { ascending: [], descending: [] };
  if (!images) return frames;
  images.forEach((img) => {
    const match = img.filename.match(/(\d{3})(A|D)_(\d{5})_?(\d{6})?/);
    if (match) {
      const track = match[1];
      const orbit = match[2];
      const dir = orbit === "A" ? "ascending" : "descending";
      const frame = match[3];
      const suffix = match[4] || "131313";
      const frameCode = `${track}${orbit}_${frame}_${suffix}`;
      if (!frames[dir].find((f) => f.frameCode === frameCode)) {
        frames[dir].push({
          track,
          frame,
          frameCode,
          url: img.url,
          filename: img.filename,
        });
      }
    }
  });
  return frames;
}

function cometTimeSeriesUrl(v) {
  const region =
    v.location?.[0]?.name?.replace(/ /g, "%20") || "Africa%20and%20Red%20Sea";
  const country = (v.country || "Ethiopia")
    .split("/")[0]
    .trim()
    .replace(/ /g, "%20");
  const slug = v.name.replace(/ /g, "%20");
  return `https://comet.nerc.ac.uk/comet-volcano-portal/volcano-index/${region}/${country}/${slug}/S1_analysis`;
}

// Bypasses React dev server (port 3000) intercepting Accept: text/html requests in development
const getProxyUrl = (targetUrl) => {
  const path = `/api/comet-page-proxy?url=${encodeURIComponent(targetUrl)}`;
  if (window.location.port === "3000") {
    return `http://localhost:5002${path}`;
  }
  return path;
};

// ── Click detail panel — uses CSS classes so theme overrides can't break it ─
function DetailPanel({ v, onClose }) {
  // Hooks must be unconditional — call before any early return
  const frames = parseFrames(v?.images);
  const defaultDir = frames.ascending.length > 0 ? "ascending" : "descending";
  const [orbitDir, setOrbitDir] = useState(defaultDir);
  const [selectedFrame, setSelectedFrame] = useState(
    frames[defaultDir][0] || null,
  );

  if (!v) return null;

  const color = markerColor(v);
  const hasDeformation = v.deformation_observation === "Yes";
  const hasMeasurements = v.geodetic_measurements === "Yes";
  const description = stripHtml(v.characteristics_of_deformation);
  const hasFrames = frames.ascending.length > 0 || frames.descending.length > 0;

  const handleOrbitChange = (dir) => {
    setOrbitDir(dir);
    setSelectedFrame(frames[dir][0] || null);
  };

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
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "20px",
          fontFamily: "sans-serif",
          fontSize: "13px",
          lineHeight: "1.6",
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
          style={{ fontSize: "17px", fontWeight: "bold", marginBottom: "4px" }}
        >
          🌋 {v.name}
        </div>
        <div className="detail-muted" style={{ marginBottom: "4px" }}>
          📍 {v.country}
          {v.location?.[0] ? ` — ${v.location[0].name}` : ""}
        </div>
        <div
          className="detail-dim"
          style={{ fontSize: "11px", marginBottom: "12px" }}
        >
          {parseFloat(v.latitude).toFixed(3)}°,{" "}
          {parseFloat(v.longitude).toFixed(3)}°
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <span
            className={hasMeasurements ? "badge-green" : "badge-red"}
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              border: "1px solid",
            }}
          >
            {hasMeasurements ? "✔ Geodetic Data" : "✘ No Geodetic Data"}
          </span>
          <span
            className={hasDeformation ? "badge-yellow" : "badge-grey"}
            style={{
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              border: "1px solid",
            }}
          >
            {hasDeformation ? "⚠ Deformation Observed" : "No Deformation"}
          </span>
        </div>

        {/* ── Sentinel-1 Time Series Section ─────────────────────────── */}
        {hasFrames && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#00aaff",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
                borderBottom: "1px solid #2a2a2a",
                paddingBottom: "6px",
              }}
            >
              🛰 Sentinel-1 Frame — Time Series Analysis
            </div>

            {/* Ascending / Descending orbit toggle */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: "11px", color: "#888", marginRight: "4px" }}
              >
                Orbit direction:
              </span>
              {["ascending", "descending"].map((dir) => {
                const count = frames[dir].length;
                const isActive = orbitDir === dir;
                return (
                  <button
                    key={dir}
                    onClick={() => handleOrbitChange(dir)}
                    disabled={count === 0}
                    className={`orbit-btn${isActive ? " active" : ""}${dir === "ascending" ? " ascending" : " descending"}`}
                  >
                    {dir === "ascending" ? "↗ Ascending" : "↘ Descending"}
                    {count > 0 && (
                      <span
                        style={{
                          marginLeft: "5px",
                          fontSize: "10px",
                          opacity: 0.65,
                        }}
                      >
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Frame selector chips */}
            {frames[orbitDir].length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    alignSelf: "center",
                  }}
                >
                  Frame:
                </span>
                {frames[orbitDir].map((f) => {
                  const active = selectedFrame?.filename === f.filename;
                  return (
                    <button
                      key={f.filename}
                      onClick={() => setSelectedFrame(f)}
                      className={`frame-btn${active ? " active" : ""}`}
                    >
                      {f.track}
                      {orbitDir === "ascending" ? "A" : "D"}_{f.frame}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Interactive COMET Time Series Iframe */}
            {selectedFrame && (
              <div style={{ marginTop: "14px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px", fontWeight: "600" }}>
                  Interactive Time Series (COMET Portal):
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "400px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #333",
                    backgroundColor: "#111",
                  }}
                >
                  <iframe
                    src={getProxyUrl(`${cometTimeSeriesUrl(v)}?frame=${selectedFrame.frameCode}`)}
                    title={`${v.name} Time Series`}
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              </div>
            )}

            {/* InSAR interferogram image */}
            {selectedFrame && (
              <div style={{ marginBottom: "12px" }}>
                <img
                  src={selectedFrame.url}
                  alt={selectedFrame.filename}
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    display: "block",
                    border: "1px solid #2a2a2a",
                  }}
                />
                <div
                  style={{
                    fontSize: "10px",
                    color: "#555",
                    marginTop: "4px",
                    textAlign: "center",
                  }}
                >
                  Sentinel-1 InSAR · {orbitDir} · track {selectedFrame.track},
                  frame {selectedFrame.frame}
                </div>
              </div>
            )}

            {/* Time series link */}
            <a
              href={`${cometTimeSeriesUrl(v)}${selectedFrame ? `?frame=${selectedFrame.frameCode}` : ""}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#0a1a2a",
                border: "1px solid #00aaff",
                color: "#00aaff",
                textDecoration: "none",
                padding: "7px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              📈 Open Time Series Analysis on COMET →
            </a>
          </div>
        )}

        {v.duration_of_observation && (
          <div style={{ marginBottom: "10px" }}>
            <div
              className="detail-label"
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Observation period
            </div>
            <div className="detail-value">{v.duration_of_observation}</div>
          </div>
        )}

        {description && (
          <div
            className="detail-desc"
            style={{
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "12px",
              marginBottom: "12px",
              lineHeight: "1.7",
              border: "1px solid",
            }}
          >
            {description}
          </div>
        )}

        <a
          href={v.uri}
          target="_blank"
          rel="noreferrer"
          className="detail-link"
          style={{ fontSize: "12px", textDecoration: "none" }}
        >
          View on COMET Portal →
        </a>
      </div>
    </div>
  );
}

// ── Marker with hover tooltip + click panel ────────────────────────────────
function VolcanoMarker({ v, onSelect }) {
  const color = markerColor(v);
  const hasDeformation = v.deformation_observation === "Yes";
  const hasMeasurements = v.geodetic_measurements === "Yes";
  const radius = hasDeformation ? 7 : hasMeasurements ? 5 : 4;

  return (
    <CircleMarker
      center={[parseFloat(v.latitude), parseFloat(v.longitude)]}
      radius={radius}
      pathOptions={{
        color: "#fff",
        fillColor: color,
        fillOpacity: hasDeformation ? 0.9 : 0.7,
        weight: 1,
        opacity: 0.8,
      }}
      eventHandlers={{ click: () => onSelect(v) }}
    >
      <Tooltip direction="top" offset={[0, -4]} opacity={1}>
        <div
          style={{
            fontSize: "12px",
            lineHeight: "1.5",
            minWidth: "130px",
            color: "#111",
          }}
        >
          <strong>{v.name}</strong>
          <br />
          <span style={{ color: "#444" }}>{v.country}</span>
          <br />
          <span
            style={{
              color: hasDeformation
                ? "#c0392b"
                : hasMeasurements
                  ? "#b7600a"
                  : "#666",
              fontSize: "11px",
            }}
          >
            {hasDeformation
              ? "⚠ Deformation Observed"
              : hasMeasurements
                ? "Geodetic Data"
                : "No Measurements"}
          </span>
        </div>
      </Tooltip>
    </CircleMarker>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
function Volcano() {
  const [volcanoes, setVolcanoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDeformation, setFilterDeformation] = useState("all");
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mapType, setMapType] = useState("default");

  useEffect(() => {
    setLoading(true);
    fetch("/api/comet-volcanoes")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const valid = data.filter((v) => {
          if (!v.latitude || !v.longitude) return false;
          const lat = parseFloat(v.latitude);
          const lon = parseFloat(v.longitude);
          if (isNaN(lat) || isNaN(lon)) return false;
          return (v.country || "").toLowerCase().includes("ethiopia");
        });
        setVolcanoes(valid);
        setLoading(false);
      })
      .catch((err) => {
        console.error("COMET fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=volcano&status=approved",
        );
        if (!res.ok) throw new Error("Failed to fetch uploads");
        const data = await res.json();
        if (!cancelled) setHasLocalUploads(data.length > 0);
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

  const filtered = volcanoes.filter((v) => {
    if (
      search &&
      !v.name.toLowerCase().includes(search.toLowerCase()) &&
      !v.country?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (
      filterDeformation === "deformation" &&
      v.deformation_observation !== "Yes"
    )
      return false;
    if (filterDeformation === "measured" && v.geodetic_measurements !== "Yes")
      return false;
    return true;
  });

  const downloadCSV = () => {
    const header =
      "name,country,latitude,longitude,geodetic_measurements,deformation_observation,duration";
    const rows = filtered.map((v) =>
      [
        `"${v.name}"`,
        `"${v.country || ""}"`,
        v.latitude,
        v.longitude,
        v.geodetic_measurements || "",
        v.deformation_observation || "",
        `"${v.duration_of_observation || ""}"`,
      ].join(","),
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "comet_volcanoes.csv";
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
      <DetailPanel key={selected?.ID || "none"} v={selected} onClose={() => setSelected(null)} />

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
          {/* Local data */}
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
            <div style={titleStyle}>Local Volcano Data (Ethiopia)</div>
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2a",
                minHeight: "72px",
              }}
            >
              <LocalDisasterData
                disasterType="Volcano"
                onUploadReady={(upload) => setHasLocalUploads(!!upload)}
              />
            </div>
            <div style={{ flex: 1, position: "relative", minHeight: "340px" }}>
              {hasLocalUploads ? (
                <UploadedImageFill disasterType="Volcano" />
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

          {/* Global COMET */}
          <div style={cardStyle}>
            <div style={titleStyle}>Global Volcano Data — COMET Portal</div>
            <div className="controls-row">
              <input
                type="text"
                placeholder="Search volcano or country…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "#111",
                  color: "#fff",
                  fontSize: "13px",
                  minWidth: 0,
                }}
              />
              <select
                value={filterDeformation}
                onChange={(e) => setFilterDeformation(e.target.value)}
                style={{
                  padding: "9px 10px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  background: "#111",
                  color: "#fff",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <option value="all">All ({volcanoes.length})</option>
                <option value="deformation">Deformation observed</option>
                <option value="measured">Geodetic data only</option>
              </select>
              <button className="csv-btn" onClick={downloadCSV}>
                Download CSV
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: "11px",
                padding: "0px 0 6px",
                color: error ? "#ff6060" : "#888",
              }}
            >
              {loading
                ? "Loading COMET volcano data…"
                : error
                  ? `⚠ ${error}`
                  : `Showing ${filtered.length} of ${volcanoes.length} volcanoes`}
            </div>

            <div
              style={{
                display: "flex",
                gap: "16px",
                padding: "0 12px 8px",
                flexWrap: "wrap",
              }}
            >
              {[
                { color: "#ff3300", label: "Deformation observed" },
                { color: "#ff8800", label: "Geodetic data, no deformation" },
                { color: "#aaaaaa", label: "No measurements" },
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
                <TileLayer
                  attribution={`Source: COMET Volcano Portal | ${MAP_TYPES[mapType].attribution}`}
                  url={MAP_TYPES[mapType].url}
                />
                {!loading &&
                  filtered.map((v) => (
                    <VolcanoMarker key={v.ID} v={v} onSelect={setSelected} />
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
          <h3 style={{ color: "#00aaff" }}>Comparison</h3>
          <p style={{ color: "#888" }}>
            Comparison of uploaded local volcano data with COMET satellite
            deformation observations.
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
          "Spatial Analysis",
          "Risk Assessment",
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
            <h4 style={{ color: "#00aaff", marginBottom: "8px" }}>{t}</h4>
            <p style={{ color: "#888" }}>Placeholder for {t.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Volcano;
