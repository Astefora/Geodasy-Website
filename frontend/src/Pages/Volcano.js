import { useEffect, useState, useMemo } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { Bar } from "react-chartjs-2";
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
import { useTheme } from "../ThemeContext";
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

const ACCENT = "#ef4444";

// ── Built-in Catalog of Verified Ethiopian Holocene Volcanic Complexes ────
const ETHIOPIAN_VOLCANO_CATALOG = [
  {
    id: "erta-ale",
    name: "Erta Ale",
    country: "Ethiopia",
    region: "Afar",
    tectonic_sector: "Northern Afar / Danakil Depression",
    volcano_type: "Shield Volcano (Active Lava Lake)",
    latitude: 13.6,
    longitude: 40.67,
    elevation_m: 613,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+24.5",
    last_eruption: "2024 (Ongoing)",
    max_vei: 2,
    vona_color: "ORANGE",
    threat_level: "Very High",
    characteristics_of_deformation:
      "Persistent active basaltic lava lake in southern crater, episodic overflows, fissure eruptions, and deflation-inflation cycles.",
    los_displacement_series: [
      { date: "2020", los_mm: 12, rate: 14 },
      { date: "2021", los_mm: 26, rate: 16 },
      { date: "2022", los_mm: 38, rate: 22 },
      { date: "2023", los_mm: 64, rate: 28 },
      { date: "2024", los_mm: 88, rate: 24 },
      { date: "2025", los_mm: 112, rate: 25 },
    ],
  },
  {
    id: "corbetti",
    name: "Corbetti Caldera",
    country: "Ethiopia",
    region: "Oromia / Sidama",
    tectonic_sector: "Central Main Ethiopian Rift (MER)",
    volcano_type: "Peralkaline Rhyolitic Caldera",
    latitude: 7.18,
    longitude: 38.43,
    elevation_m: 2225,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+62.0",
    last_eruption: "Holocene (~2000 BCE)",
    max_vei: 4,
    vona_color: "YELLOW",
    threat_level: "High",
    characteristics_of_deformation:
      "One of the most rapidly uplifting volcanic calderas globally (>6 cm/year uplift centered on Urji cone). Driven by deep magmatic pressurization.",
    los_displacement_series: [
      { date: "2020", los_mm: 60, rate: 58 },
      { date: "2021", los_mm: 122, rate: 62 },
      { date: "2022", los_mm: 185, rate: 63 },
      { date: "2023", los_mm: 248, rate: 61 },
      { date: "2024", los_mm: 310, rate: 62 },
      { date: "2025", los_mm: 372, rate: 62 },
    ],
  },
  {
    id: "alutu",
    name: "Alutu",
    country: "Ethiopia",
    region: "Oromia",
    tectonic_sector: "Central Main Ethiopian Rift (MER)",
    volcano_type: "Stratovolcano / Geothermal Caldera",
    latitude: 7.77,
    longitude: 38.79,
    elevation_m: 2335,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+18.0",
    last_eruption: "1950 BCE",
    max_vei: 3,
    vona_color: "YELLOW",
    threat_level: "Moderate",
    characteristics_of_deformation:
      "Pulsating episodic inflation-deflation cycles associated with hydrothermal fluid migration and magmatic degassing above the Aluto-Langano geothermal field.",
    los_displacement_series: [
      { date: "2020", los_mm: 15, rate: 12 },
      { date: "2021", los_mm: 32, rate: 18 },
      { date: "2022", los_mm: 28, rate: -4 },
      { date: "2023", los_mm: 45, rate: 17 },
      { date: "2024", los_mm: 62, rate: 18 },
      { date: "2025", los_mm: 80, rate: 18 },
    ],
  },
  {
    id: "fentale",
    name: "Fantale (Fentale)",
    country: "Ethiopia",
    region: "Oromia / Afar",
    tectonic_sector: "Northern Main Ethiopian Rift",
    volcano_type: "Stratovolcano / Caldera",
    latitude: 8.975,
    longitude: 39.93,
    elevation_m: 2007,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+12.3",
    last_eruption: "1820",
    max_vei: 2,
    vona_color: "YELLOW",
    threat_level: "Moderate",
    characteristics_of_deformation:
      "Obsidian lava flows, localized summit caldera faulting, and seismic swarm occurrences along the Wonji Fault Belt.",
    los_displacement_series: [
      { date: "2020", los_mm: 10, rate: 11 },
      { date: "2021", los_mm: 23, rate: 13 },
      { date: "2022", los_mm: 35, rate: 12 },
      { date: "2023", los_mm: 47, rate: 12 },
      { date: "2024", los_mm: 60, rate: 13 },
      { date: "2025", los_mm: 72, rate: 12 },
    ],
  },
  {
    id: "dabbahu",
    name: "Dabbahu (Boina)",
    country: "Ethiopia",
    region: "Afar",
    tectonic_sector: "Afar Triple Junction / Manda Hararo",
    volcano_type: "Stratovolcano / Fissural Dyke Complex",
    latitude: 12.6,
    longitude: 40.48,
    elevation_m: 1442,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+16.8",
    last_eruption: "2005",
    max_vei: 3,
    vona_color: "YELLOW",
    threat_level: "High",
    characteristics_of_deformation:
      "Site of the historic 2005 60-km-long Afar mega-dyke intrusion event with major crustal spreading and ongoing post-rifting viscoelastic relaxation.",
    los_displacement_series: [
      { date: "2020", los_mm: 18, rate: 16 },
      { date: "2021", los_mm: 36, rate: 18 },
      { date: "2022", los_mm: 52, rate: 16 },
      { date: "2023", los_mm: 70, rate: 18 },
      { date: "2024", los_mm: 87, rate: 17 },
      { date: "2025", los_mm: 104, rate: 17 },
    ],
  },
  {
    id: "dallol",
    name: "Dallol Hydrothermal Complex",
    country: "Ethiopia",
    region: "Afar",
    tectonic_sector: "Danakil Depression / Salt Plain",
    volcano_type: "Explosive Maar / Hydrothermal Salt Dome",
    latitude: 14.24,
    longitude: 40.3,
    elevation_m: -48,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+28.0",
    last_eruption: "1926",
    max_vei: 1,
    vona_color: "YELLOW",
    threat_level: "High",
    characteristics_of_deformation:
      "Phreatic explosions, intense boiling hyper-saline acid geysers, active dyke intrusions into thick salt strata at 120m below sea level.",
    los_displacement_series: [
      { date: "2020", los_mm: 25, rate: 27 },
      { date: "2021", los_mm: 54, rate: 29 },
      { date: "2022", los_mm: 82, rate: 28 },
      { date: "2023", los_mm: 110, rate: 28 },
      { date: "2024", los_mm: 139, rate: 29 },
      { date: "2025", los_mm: 167, rate: 28 },
    ],
  },
  {
    id: "kone",
    name: "Kone (Gariboldi)",
    country: "Ethiopia",
    region: "Oromia",
    tectonic_sector: "Northern Main Ethiopian Rift",
    volcano_type: "Caldera Complex & Basaltic Fissure",
    latitude: 8.8,
    longitude: 39.69,
    elevation_m: 1619,
    deformation_observation: "No",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+2.4",
    last_eruption: "1820",
    max_vei: 2,
    vona_color: "GREEN",
    threat_level: "Low",
    characteristics_of_deformation:
      "Multiple nested calderas and pristine basaltic cinder cone alignments along the Wonji Fault Belt.",
    los_displacement_series: [
      { date: "2020", los_mm: 2, rate: 2 },
      { date: "2021", los_mm: 5, rate: 3 },
      { date: "2022", los_mm: 7, rate: 2 },
      { date: "2023", los_mm: 10, rate: 3 },
      { date: "2024", los_mm: 12, rate: 2 },
      { date: "2025", los_mm: 15, rate: 3 },
    ],
  },
  {
    id: "tulu-moye",
    name: "Tulu Moye",
    country: "Ethiopia",
    region: "Oromia",
    tectonic_sector: "Central Main Ethiopian Rift",
    volcano_type: "Pumice & Rhyolite Lava Field",
    latitude: 8.15,
    longitude: 39.14,
    elevation_m: 2323,
    deformation_observation: "Yes",
    geodetic_measurements: "Yes",
    deformation_rate_mm_yr: "+15.2",
    last_eruption: "1900",
    max_vei: 2,
    vona_color: "YELLOW",
    threat_level: "Moderate",
    characteristics_of_deformation:
      "Active geothermal power development site with observed subsidence and localized uplift related to geothermal fluid reinjection and fracture opening.",
    los_displacement_series: [
      { date: "2020", los_mm: 12, rate: 14 },
      { date: "2021", los_mm: 27, rate: 15 },
      { date: "2022", los_mm: 41, rate: 14 },
      { date: "2023", los_mm: 57, rate: 16 },
      { date: "2024", los_mm: 72, rate: 15 },
      { date: "2025", los_mm: 88, rate: 16 },
    ],
  },
];

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markerColor(v) {
  if (v.deformation_observation === "Yes") return "#ef4444"; // high alert red
  if (v.geodetic_measurements === "Yes") return "#f59e0b"; // moderate orange
  return "#94a3b8"; // low / quiescent gray
}

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

const getApiBase = () =>
  window.location.port === "3000" ? "http://localhost:5002" : "";

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

function DetailPanel({ v, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card, #ffffff)",
          border: isDark
            ? "1px solid rgba(239, 68, 68, 0.4)"
            : "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 14,
          maxWidth: 680,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          color: "var(--text-primary, #1e293b)",
          boxShadow: isDark
            ? "0 20px 50px rgba(0,0,0,0.6)"
            : "0 20px 50px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid var(--border-light, #e2e8f0)",
            paddingBottom: 14,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>
              Volcano Geodetic Detail · COMET Sentinel-1
            </div>
            <h2
              style={{
                margin: "4px 0 0 0",
                fontSize: 22,
                color: "var(--text-primary, #1e293b)",
              }}
            >
              {v.name}
            </h2>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted, #64748b)",
                marginTop: 2,
              }}
            >
              {v.country || "Ethiopia"} · {v.latitude}°, {v.longitude}°
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
              border: "none",
              color: "var(--text-primary, #1e293b)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg-card-alt, #f8f9fa)",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--border-light, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted, #64748b)" }}>
              InSAR Deformation:
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 2 }}>
              {hasDeformation ? "⚠ Observed (>10 mm/yr)" : "Not Observed"}
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-card-alt, #f8f9fa)",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--border-light, #e2e8f0)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted, #64748b)" }}>
              Geodetic Coverage:
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#38bdf8",
                marginTop: 2,
              }}
            >
              {hasMeasurements ? "Active Sentinel-1 Tracks" : "None"}
            </div>
          </div>
        </div>

        {description && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary, #1e293b)",
                marginBottom: 4,
              }}
            >
              Deformation Characteristics:
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: "1.6",
                color: "var(--text-muted, #64748b)",
                background: "var(--bg-card-alt, #f8f9fa)",
                border: "1px solid var(--border-light, #e2e8f0)",
                padding: 12,
                borderRadius: 8,
              }}
            >
              {description}
            </div>
          </div>
        )}

        {hasFrames && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {["ascending", "descending"].map((dir) => (
                <button
                  key={dir}
                  onClick={() => handleOrbitChange(dir)}
                  disabled={frames[dir].length === 0}
                  style={{
                    background:
                      orbitDir === dir
                        ? isDark
                          ? "rgba(239, 68, 68, 0.3)"
                          : "#fee2e2"
                        : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "var(--bg-card-alt, #f1f5f9)",
                    border:
                      orbitDir === dir
                        ? "1px solid #ef4444"
                        : "1px solid var(--border-light, #e2e8f0)",
                    color:
                      orbitDir === dir
                        ? isDark
                          ? "#fff"
                          : "#b91c1c"
                        : "var(--text-muted, #64748b)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {dir} Track ({frames[dir].length})
                </button>
              ))}
            </div>

            {selectedFrame && (
              <div
                style={{
                  textAlign: "center",
                  background: isDark ? "#000" : "#f8fafc",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid var(--border-light, #e2e8f0)",
                }}
              >
                <img
                  src={selectedFrame.url}
                  alt={selectedFrame.filename}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted, #64748b)",
                    marginTop: 4,
                  }}
                >
                  InSAR Velocity Map · Frame {selectedFrame.frameCode}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 14,
          }}
        >
          <a
            href={cometTimeSeriesUrl(v)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#ef4444",
              color: "#fff",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            View COMET Volcano Portal →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main Volcano Component ─────────────────────────────────────────────────
function Volcano() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [volcanoes, setVolcanoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDeformation, setFilterDeformation] = useState("all");
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mapType, setMapType] = useState("default");
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsGeo, setRegionsGeo] = useState(null);

  // Time Series Tab State
  const [selectedVolcanoId, setSelectedVolcanoId] = useState("corbetti");

  // NVEWS Simulator State
  const [simDeformRate, setSimDeformRate] = useState(45); // mm/yr
  const [simVei, setSimVei] = useState(3); // 0 to 6
  const [simDistanceKm, setSimDistanceKm] = useState(18); // km to town
  const [simThermalMw, setSimThermalMw] = useState(120); // MW

  useEffect(() => {
    fetch("/ethiopia-regions.geojson")
      .then((r) => r.json())
      .then(setRegionsGeo)
      .catch(() => {});
  }, []);

  // Live risk for all regions
  const regionRisks = useMemo(
    () => computeAllRegionRisks("Volcano", { volcanoes }),
    [volcanoes],
  );

  // Fetch from COMET backend + Merge with Ethiopian Catalog
  useEffect(() => {
    setLoading(true);
    fetch(`${getApiBase()}/api/comet-volcanoes`)
      .then((r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) return [];
        return r.json();
      })
      .then((data) => {
        const remoteList = Array.isArray(data) ? data : [];
        const ethRemote = remoteList.filter((v) => {
          if (!v.latitude || !v.longitude) return false;
          const lat = parseFloat(v.latitude);
          const lon = parseFloat(v.longitude);
          if (isNaN(lat) || isNaN(lon)) return false;
          return (v.country || "").toLowerCase().includes("ethiopia");
        });

        // Merge verified catalog with COMET remote
        const merged = [...ETHIOPIAN_VOLCANO_CATALOG];
        ethRemote.forEach((rem) => {
          const remLat = parseFloat(rem.latitude);
          const remLon = parseFloat(rem.longitude);
          const existing = merged.find((m) => {
            const mLat = parseFloat(m.latitude);
            const mLon = parseFloat(m.longitude);
            return (
              Math.abs(mLat - remLat) < 0.08 && Math.abs(mLon - remLon) < 0.08
            );
          });
          if (existing) {
            // attach images and live remote properties
            existing.images = rem.images || existing.images;
            existing.duration_of_observation = rem.duration_of_observation;
          } else if (!isNaN(remLat) && !isNaN(remLon)) {
            merged.push({
              id: rem.ID || `comet-${merged.length + 1}`,
              name: rem.name || "Unnamed Volcanic Center",
              country: rem.country || "Ethiopia",
              region: "Afar / Oromia Rift",
              tectonic_sector: "Main Ethiopian Rift",
              volcano_type: "Volcanic Caldera / Fissure",
              latitude: remLat,
              longitude: remLon,
              elevation_m: 1500,
              deformation_observation: rem.deformation_observation || "No",
              geodetic_measurements: rem.geodetic_measurements || "Yes",
              deformation_rate_mm_yr:
                rem.deformation_observation === "Yes" ? "+15.0" : "+2.0",
              last_eruption: "Holocene",
              max_vei: 2,
              vona_color:
                rem.deformation_observation === "Yes" ? "YELLOW" : "GREEN",
              threat_level:
                rem.deformation_observation === "Yes" ? "Moderate" : "Low",
              characteristics_of_deformation:
                rem.characteristics_of_deformation ||
                "Sentinel-1 InSAR monitored volcanic structure.",
              images: rem.images,
              los_displacement_series: [
                { date: "2020", los_mm: 5, rate: 5 },
                { date: "2021", los_mm: 12, rate: 7 },
                { date: "2022", los_mm: 19, rate: 7 },
                { date: "2023", los_mm: 27, rate: 8 },
                { date: "2024", los_mm: 36, rate: 9 },
                { date: "2025", los_mm: 45, rate: 9 },
              ],
            });
          }
        });

        setVolcanoes(merged);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("COMET proxy unavailable, using catalog:", err);
        setVolcanoes(ETHIOPIAN_VOLCANO_CATALOG);
        setLoading(false);
      });
  }, []);

  // Poll for approved local uploads
  useEffect(() => {
    let cancelled = false;
    const checkUploads = async () => {
      try {
        const res = await fetch(
          `${getApiBase()}/api/uploads?hazardType=volcano&status=approved`,
        );
        if (!res.ok) throw new Error("Failed to fetch uploads");
        const data = await res.json();
        if (!cancelled)
          setHasLocalUploads(
            data.filter((u) => u.title?.startsWith("Disaster Data:")).length >
              0,
          );
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

  const filteredVolcanoes = useMemo(() => {
    return volcanoes.filter((v) => {
      if (
        search &&
        !v.name.toLowerCase().includes(search.toLowerCase()) &&
        !v.country?.toLowerCase().includes(search.toLowerCase()) &&
        !v.region?.toLowerCase().includes(search.toLowerCase())
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
  }, [volcanoes, search, filterDeformation]);

  const downloadCSV = () => {
    const header =
      "name,region,tectonic_sector,latitude,longitude,volcano_type,deformation_observation,deformation_rate_mm_yr,last_eruption,vona_color,threat_level";
    const rows = filteredVolcanoes.map((v) =>
      [
        `"${v.name}"`,
        `"${v.region || ""}"`,
        `"${v.tectonic_sector || ""}"`,
        v.latitude,
        v.longitude,
        `"${v.volcano_type || ""}"`,
        v.deformation_observation || "",
        `"${v.deformation_rate_mm_yr || ""}"`,
        `"${v.last_eruption || ""}"`,
        `"${v.vona_color || ""}"`,
        `"${v.threat_level || ""}"`,
      ].join(","),
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ethiopian_volcano_hazard_catalog.csv";
    a.click();
  };

  // ── 1. TIME SERIES & INSAR DISPLACEMENT DYNAMICS ─────────────────────────
  const activeVolcanoRecord = useMemo(() => {
    return (
      volcanoes.find((v) => v.id === selectedVolcanoId) ||
      ETHIOPIAN_VOLCANO_CATALOG[0]
    );
  }, [volcanoes, selectedVolcanoId]);

  const timeSeriesChartData = useMemo(() => {
    const series = activeVolcanoRecord.los_displacement_series || [
      { date: "2020", los_mm: 10, rate: 10 },
      { date: "2021", los_mm: 20, rate: 10 },
      { date: "2022", los_mm: 30, rate: 10 },
      { date: "2023", los_mm: 40, rate: 10 },
      { date: "2024", los_mm: 50, rate: 10 },
      { date: "2025", los_mm: 60, rate: 10 },
    ];

    return {
      labels: series.map((s) => s.date),
      datasets: [
        {
          type: "line",
          label: "Cumulative LOS Displacement (mm)",
          data: series.map((s) => s.los_mm),
          borderColor: "#ef4444",
          backgroundColor: isDark
            ? "rgba(239, 68, 68, 0.15)"
            : "rgba(239, 68, 68, 0.1)",
          borderWidth: 2.5,
          pointBackgroundColor: "#ef4444",
          pointRadius: 5,
          fill: true,
          tension: 0.2,
          yAxisID: "y",
        },
        {
          type: "bar",
          label: "Annual Deformation Velocity (mm/yr)",
          data: series.map((s) => s.rate),
          backgroundColor: "rgba(245, 158, 11, 0.75)",
          borderColor: "#f59e0b",
          borderWidth: 1.5,
          borderRadius: 4,
          yAxisID: "y1",
        },
      ],
    };
  }, [activeVolcanoRecord, isDark]);

  const timeSeriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#94a3b8" : "#475569",
          font: { size: 11, weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        titleColor: isDark ? "#f8fafc" : "#0f172a",
        bodyColor: isDark ? "#cbd5e1" : "#334155",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? "#94a3b8" : "#475569", font: { size: 11 } },
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        ticks: { color: "#ef4444", font: { size: 11 } },
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        title: {
          display: true,
          text: "Cumulative LOS Displacement (mm)",
          color: "#ef4444",
          font: { size: 11, weight: "600" },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: { color: "#f59e0b", font: { size: 11 } },
        title: {
          display: true,
          text: "Velocity (mm/yr)",
          color: "#f59e0b",
          font: { size: 11, weight: "600" },
        },
      },
    },
  };

  // ── 2. NVEWS MULTI-CRITERIA VOLCANIC THREAT CALCULATOR ─────────────────
  const nvewsSimulation = useMemo(() => {
    // 1. Deformation score (0 to 100)
    const deformScore = Math.min(
      100,
      Math.max(0, Math.round((Math.max(0, simDeformRate) / 75) * 100)),
    );

    // 2. VEI Explosive magnitude score (0 to 100)
    const veiScore = Math.min(100, Math.round((simVei / 6) * 100));

    // 3. Proximity / Human Exposure Score (Inverse: closer = higher risk)
    const proximityScore = Math.min(
      100,
      Math.max(0, Math.round((1 - simDistanceKm / 80) * 100)),
    );

    // 4. Thermal / Degassing score
    const thermalScore = Math.min(
      100,
      Math.max(0, Math.round((simThermalMw / 200) * 100)),
    );

    // Composite NVEWS Score:
    // Deformation (30%) + VEI (25%) + Proximity (25%) + Thermal (20%)
    const compositeScore = Math.round(
      deformScore * 0.3 +
        veiScore * 0.25 +
        proximityScore * 0.25 +
        thermalScore * 0.2,
    );

    let threatAlert = {
      level: "Low Background / Quiescent",
      color: "#22c55e",
      bg: isDark ? "#22c55e18" : "#f0fdf4",
      vona: "GREEN",
      advisory:
        "Volcano is in normal non-eruptive state. Routine geodetic satellite tracking active.",
    };

    if (compositeScore >= 75 || simDeformRate >= 50) {
      threatAlert = {
        level: "Very High Volcanic Threat",
        color: "#dc2626",
        bg: isDark ? "#dc262618" : "#fef2f2",
        vona: "ORANGE",
        advisory:
          "Significant magma pressurization and unrest. Issue aviation ash advisory and prepare exclusion radius for nearby pastoral/settlement woredas.",
      };
    } else if (compositeScore >= 50 || simDeformRate >= 20) {
      threatAlert = {
        level: "High Elevated Unrest",
        color: "#ea580c",
        bg: isDark ? "#ea580c18" : "#fff7ed",
        vona: "YELLOW",
        advisory:
          "Deformation exceeds background baseline. Continuous SAR interferometry and ground tremor monitoring required.",
      };
    } else if (compositeScore >= 30) {
      threatAlert = {
        level: "Moderate Vigilance",
        color: "#f59e0b",
        bg: isDark ? "#f59e0b18" : "#fffbeb",
        vona: "YELLOW",
        advisory: "Minor hydrothermal flaring or shallow seismicity detected.",
      };
    }

    return {
      deformScore,
      veiScore,
      proximityScore,
      thermalScore,
      compositeScore,
      threatAlert,
    };
  }, [simDeformRate, simVei, simDistanceKm, simThermalMw, isDark]);

  return (
    <div className="hazard-page">
      <DetailPanel
        key={selected?.ID || selected?.id || "none"}
        v={selected}
        onClose={() => setSelected(null)}
      />

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="hazard-page-header-wrap">
        <div
          className="hazard-page-header-card"
          style={{ "--hazard-glow": "rgba(239,68,68,0.14)" }}
        >
          <div className="hazard-page-header">
            <div className="hazard-page-header-left">
              <div
                className="hazard-page-header-icon"
                style={{ background: isDark ? "#ef444418" : "#fee2e2" }}
              >
                <img
                  src="/icons/icons8-volcano-96.png"
                  alt="Volcano"
                  style={{ width: 28, height: 28, objectFit: "contain" }}
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
                  Volcano &amp; Rift Geodetic Deformation Monitoring
                </div>
                <div className="hazard-page-header-subtitle">
                  COMET Sentinel-1 InSAR · Main Ethiopian Rift (MER) &amp; Afar
                  Depression Volcanism
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
                liveHazard="Volcano"
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
          {/* ── GLOBAL MAP — COMET Sentinel-1 InSAR & GVP Catalog ───────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Global Data · COMET Sentinel-1 InSAR
                    </div>
                    <div className="hazard-map-title">
                      Volcano Distribution &amp; Crustal Deformation — Ethiopia
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
                  {loading
                    ? "Loading…"
                    : `${filteredVolcanoes.length} volcanic centers`}
                </span>
              </div>

              {/* Controls */}
              <div className="global-fire-toolbar">
                <div className="date-input-wrap">
                  <input
                    type="text"
                    placeholder="Search volcano / region…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="date-input-wrap">
                  <select
                    value={filterDeformation}
                    onChange={(e) => setFilterDeformation(e.target.value)}
                    style={{
                      background: "var(--bg-card-alt, #f8f9fa)",
                      color: "var(--text-primary, #1e293b)",
                      border: "1px solid var(--border-light, #e2e8f0)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      width: "100%",
                      outline: "none",
                    }}
                  >
                    <option value="all">All Volcanoes</option>
                    <option value="deformation">⚠ Deformation Observed</option>
                    <option value="measured">Geodetically Measured</option>
                  </select>
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

              {/* Legend */}
              <div className="hazard-legend">
                {[
                  {
                    color: "#ef4444",
                    label: "Deformation Observed (>10 mm/yr)",
                  },
                  { color: "#f59e0b", label: "Geodetically Measured" },
                  { color: "#94a3b8", label: "Quiescent / Baseline" },
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

              {/* Map */}
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

                  {filteredVolcanoes.map((v, i) => {
                    const lat = parseFloat(v.latitude);
                    const lon = parseFloat(v.longitude);
                    const color = markerColor(v);
                    const hasDeformation = v.deformation_observation === "Yes";
                    const radius = hasDeformation ? 9 : 7;

                    return (
                      <CircleMarker
                        key={v.id || v.name || i}
                        center={[lat, lon]}
                        radius={radius}
                        pathOptions={{
                          color: "#ffffff",
                          fillColor: color,
                          fillOpacity: 0.9,
                          weight: 1.5,
                        }}
                        eventHandlers={{
                          click: () => setSelected(v),
                        }}
                      >
                        <Tooltip
                          direction="top"
                          offset={[0, -6]}
                          opacity={0.95}
                        >
                          <div style={{ fontSize: 12, lineHeight: "1.4" }}>
                            <strong style={{ color: ACCENT }}>{v.name}</strong>
                            <br />
                            <strong>Type:</strong> {v.volcano_type || "Caldera"}
                            <br />
                            <strong>Region:</strong>{" "}
                            {v.region || "Ethiopian Rift"}
                            <br />
                            <strong>Deformation:</strong>{" "}
                            <span style={{ color, fontWeight: 700 }}>
                              {v.deformation_rate_mm_yr ||
                                (hasDeformation ? ">15 mm/yr" : "Normal")}
                            </span>
                            <br />
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted, #94a3b8)",
                              }}
                            >
                              Click to view Sentinel-1 InSAR frames
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
                  liveHazard="Volcano"
                  liveRisk={computeRegionRisk("Volcano", activeRegion, {
                    volcanoes: filteredVolcanoes,
                  })}
                />
                <MapTypeToggle mapType={mapType} setMapType={setMapType} />
              </div>

              <div className="hazard-map-footer">
                <span>
                  Source: COMET (Centre for the Observation &amp; Modelling of
                  Earthquakes, Volcanoes &amp; Tectonics) · Sentinel-1
                </span>
                <span>
                  {loading
                    ? "Fetching…"
                    : `${filteredVolcanoes.length} volcanoes cataloged`}
                </span>
              </div>
            </div>
          </div>

          {/* ── LOCAL MAP — SSGI ───────────────────────────────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator local" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">Local Monitoring</div>
                    <div className="hazard-map-title">
                      Local Geothermal &amp; Volcanic Observatory Data
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
                  disasterType="Volcano"
                  onUploadReady={(upload) => setHasLocalUploads(!!upload)}
                />
              </div>

              <div className="hazard-map-container">
                {hasLocalUploads ? (
                  <UploadedImageFill disasterType="Volcano" />
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
                <span>
                  Source: SSGI Ethiopia · Local volcanic drone &amp; seismic
                  stations
                </span>
                <span>
                  {hasLocalUploads ? "Uploaded data" : "Live base map"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            FOUR REAL, DATA-DRIVEN SCIENTIFIC ANALYSIS SECTIONS
            ══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* ── SECTION 1: TIME SERIES & INSAR DISPLACEMENT DYNAMICS ───── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  borderBottom:
                    "1px solid var(--border-light, rgba(255,255,255,0.08))",
                  paddingBottom: 14,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: ACCENT,
                      fontWeight: 700,
                    }}
                  >
                    Section 1 · Sentinel-1 InSAR Geodetic Time Series
                  </div>
                  <h3
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: 18,
                      color: "var(--text-primary, #1e293b)",
                    }}
                  >
                    Line-of-Sight (LOS) Surface Displacement &amp; Magma
                    Inflation
                  </h3>
                </div>

                {/* Volcano Tab Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Target Volcano:
                  </span>
                  <select
                    value={selectedVolcanoId}
                    onChange={(e) => setSelectedVolcanoId(e.target.value)}
                    style={{
                      background: isDark
                        ? "rgba(239, 68, 68, 0.15)"
                        : "#fee2e2",
                      color: isDark ? "#f8fafc" : "#991b1b",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      outline: "none",
                    }}
                  >
                    {ETHIOPIAN_VOLCANO_CATALOG.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        style={{
                          background: isDark ? "#0f172a" : "#ffffff",
                          color: isDark ? "#fff" : "#1e293b",
                        }}
                      >
                        {v.name} ({v.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metrics cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 14,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Deformation Velocity Rate
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      color: ACCENT,
                      marginTop: 2,
                    }}
                  >
                    {activeVolcanoRecord.deformation_rate_mm_yr} mm/yr
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    Sentinel-1 InSAR Mean LOS
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Magmatic Mechanism
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#f59e0b",
                      marginTop: 4,
                    }}
                  >
                    {activeVolcanoRecord.id === "corbetti"
                      ? "Deep Magma Reservoir Inflation"
                      : activeVolcanoRecord.id === "erta-ale"
                        ? "Active Conduit Degassing & Flank Rift"
                        : activeVolcanoRecord.id === "alutu"
                          ? "Hydrothermal Fluid Pulsing"
                          : "Rift Dyke Intrusion"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    Inferred crustal source
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Aviation VONA Code
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color:
                        activeVolcanoRecord.vona_color === "ORANGE"
                          ? "#f97316"
                          : activeVolcanoRecord.vona_color === "YELLOW"
                            ? "#eab308"
                            : "#22c55e",
                      marginTop: 4,
                    }}
                  >
                    CODE {activeVolcanoRecord.vona_color}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    ICAO / VAAC Alert Level
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Summit Elevation &amp; Morphology
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#0284c7",
                      marginTop: 4,
                    }}
                  >
                    {activeVolcanoRecord.elevation_m} m a.s.l.
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    {activeVolcanoRecord.volcano_type}
                  </div>
                </div>
              </div>

              {/* Time series chart */}
              <div style={{ height: 280, width: "100%" }}>
                <Bar data={timeSeriesChartData} options={timeSeriesOptions} />
              </div>
            </div>
          </div>

          {/* ── SECTION 2: SPATIAL & TECTONIC SECTOR DISTRIBUTION ─────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ padding: 20 }}>
              <div
                style={{
                  borderBottom:
                    "1px solid var(--border-light, rgba(255,255,255,0.08))",
                  paddingBottom: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: ACCENT,
                    fontWeight: 700,
                  }}
                >
                  Section 2 · Spatial &amp; Tectonic Rift Segment Distribution
                </div>
                <h3
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    color: "var(--text-primary, #1e293b)",
                  }}
                >
                  Main Ethiopian Rift &amp; Afar Triple Junction Volcanic
                  Centers
                </h3>
              </div>

              {/* Tectonic summary pills */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    background: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: isDark ? "#fca5a5" : "#b91c1c",
                      fontSize: 13,
                    }}
                  >
                    🌋 Northern Afar &amp; Danakil Spreading Axis
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    Incipient oceanic seafloor spreading. Erta Ale basaltic
                    shield chain and Dallol explosive hydro-magmatic salt
                    basins.
                  </div>
                </div>

                <div
                  style={{
                    background: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: isDark ? "#fde68a" : "#b45309",
                      fontSize: 13,
                    }}
                  >
                    ⚡ Central Afar &amp; Tendaho / Manda Hararo
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    Site of intense fissural dyke injection swarms connecting
                    the Red Sea and Gulf of Aden rift arms.
                  </div>
                </div>

                <div
                  style={{
                    background: isDark ? "rgba(56, 189, 248, 0.08)" : "#f0f9ff",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: isDark ? "#bae6fd" : "#0369a1",
                      fontSize: 13,
                    }}
                  >
                    🏞️ Central &amp; Northern Main Ethiopian Rift (MER)
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    Continental rifting featuring peralkaline rhyolitic calderas
                    (Corbetti, Alutu, Fentale) with rapid ground uplift.
                  </div>
                </div>
              </div>

              {/* Volcanic Centers Scorecard Table */}
              <div className="data-table-wrap">
                <table
                  className="data-table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom:
                          "1px solid var(--border-light, rgba(255,255,255,0.12))",
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      <th style={{ padding: "8px 12px" }}>Volcano Name</th>
                      <th style={{ padding: "8px 12px" }}>
                        Region &amp; Sector
                      </th>
                      <th style={{ padding: "8px 12px" }}>Morphology / Type</th>
                      <th style={{ padding: "8px 12px" }}>Elevation</th>
                      <th style={{ padding: "8px 12px" }}>InSAR Velocity</th>
                      <th style={{ padding: "8px 12px" }}>Last Activity</th>
                      <th style={{ padding: "8px 12px" }}>VONA Code</th>
                      <th style={{ padding: "8px 12px" }}>Hazard Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ETHIOPIAN_VOLCANO_CATALOG.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => {
                          setSelected(v);
                          setSelectedVolcanoId(v.id);
                        }}
                        style={{
                          borderBottom:
                            "1px solid var(--border-light, rgba(255,255,255,0.05))",
                          cursor: "pointer",
                          background:
                            selectedVolcanoId === v.id
                              ? isDark
                                ? "rgba(239, 68, 68, 0.15)"
                                : "#fee2e2"
                              : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            color: "var(--text-primary, #1e293b)",
                          }}
                        >
                          {v.name}
                          {selectedVolcanoId === v.id && (
                            <span
                              style={{
                                fontSize: 10,
                                color: ACCENT,
                                marginLeft: 6,
                              }}
                            >
                              (Selected)
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "var(--text-primary, #1e293b)",
                          }}
                        >
                          {v.region}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "var(--text-muted, #64748b)",
                          }}
                        >
                          {v.volcano_type}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "var(--text-primary, #1e293b)",
                          }}
                        >
                          {v.elevation_m} m
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            color:
                              v.deformation_rate_mm_yr.startsWith("+") &&
                              parseFloat(v.deformation_rate_mm_yr) > 10
                                ? "#ef4444"
                                : "var(--text-muted, #64748b)",
                          }}
                        >
                          {v.deformation_rate_mm_yr} mm/yr
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "var(--text-primary, #1e293b)",
                          }}
                        >
                          {v.last_eruption}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800,
                              background:
                                v.vona_color === "ORANGE"
                                  ? "#ea580c"
                                  : v.vona_color === "YELLOW"
                                    ? "#ca8a04"
                                    : "#16a34a",
                              color: "#fff",
                            }}
                          >
                            {v.vona_color}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color:
                                v.threat_level === "Very High"
                                  ? "#ef4444"
                                  : v.threat_level === "High"
                                    ? "#f97316"
                                    : "#eab308",
                              background:
                                v.threat_level === "Very High"
                                  ? "#ef444418"
                                  : "#f9731618",
                              border: `1px solid ${v.threat_level === "Very High" ? "#ef4444" : "#f97316"}44`,
                            }}
                          >
                            {v.threat_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: NVEWS MULTI-CRITERIA VOLCANIC THREAT MODEL ─── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ padding: 20 }}>
              <div
                style={{
                  borderBottom:
                    "1px solid var(--border-light, rgba(255,255,255,0.08))",
                  paddingBottom: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: ACCENT,
                    fontWeight: 700,
                  }}
                >
                  Section 3 · Volcanic Threat Assessment (NVEWS Model)
                </div>
                <h3
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    color: "var(--text-primary, #1e293b)",
                  }}
                >
                  Multi-Parameter Magmatic Unrest &amp; Threat Score Simulator
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 20,
                }}
              >
                {/* Interactive Controls */}
                <div
                  className="controls-panel"
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--text-primary, #1e293b)",
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  >
                    ⚙️ Volcanological &amp; Exposure Parameters
                  </div>

                  {/* Deformation Rate */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-primary, #1e293b)",
                      }}
                    >
                      <span>InSAR Crustal Uplift Rate:</span>
                      <strong style={{ color: "#ef4444" }}>
                        +{simDeformRate} mm/yr
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={simDeformRate}
                      onChange={(e) =>
                        setSimDeformRate(parseInt(e.target.value, 10))
                      }
                      style={{
                        width: "100%",
                        accentColor: "#ef4444",
                        marginTop: 4,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      <span>0 mm/yr (Baseline)</span>
                      <span>30 mm/yr (Elevated)</span>
                      <span>80 mm/yr (Extreme Inflation)</span>
                    </div>
                  </div>

                  {/* Historical VEI */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-primary, #1e293b)",
                      }}
                    >
                      <span>Historic Volcanic Explosivity Index (VEI):</span>
                      <strong style={{ color: "#f59e0b" }}>VEI {simVei}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={simVei}
                      onChange={(e) => setSimVei(parseInt(e.target.value, 10))}
                      style={{
                        width: "100%",
                        accentColor: "#f59e0b",
                        marginTop: 4,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      <span>VEI 0 (Effusive)</span>
                      <span>VEI 3 (Sub-Plinian)</span>
                      <span>VEI 6 (Ultra-Plinian)</span>
                    </div>
                  </div>

                  {/* Distance to settlements */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-primary, #1e293b)",
                      }}
                    >
                      <span>
                        Proximity to Inhabited Settlement / Infrastructure:
                      </span>
                      <strong style={{ color: "#0284c7" }}>
                        {simDistanceKm} km
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="80"
                      value={simDistanceKm}
                      onChange={(e) =>
                        setSimDistanceKm(parseInt(e.target.value, 10))
                      }
                      style={{
                        width: "100%",
                        accentColor: "#0284c7",
                        marginTop: 4,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      <span>2 km (Direct Exposure)</span>
                      <span>30 km</span>
                      <span>80 km (Distant)</span>
                    </div>
                  </div>

                  {/* Thermal output */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-primary, #1e293b)",
                      }}
                    >
                      <span>Thermal Radiation &amp; Degassing Power:</span>
                      <strong style={{ color: "#f97316" }}>
                        {simThermalMw} MW
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={simThermalMw}
                      onChange={(e) =>
                        setSimThermalMw(parseInt(e.target.value, 10))
                      }
                      style={{
                        width: "100%",
                        accentColor: "#f97316",
                        marginTop: 4,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      <span>0 MW (Cool)</span>
                      <span>100 MW (Fumaroles)</span>
                      <span>300 MW (Active Lava Lake)</span>
                    </div>
                  </div>
                </div>

                {/* Simulation Result */}
                <div
                  style={{
                    background: nvewsSimulation.threatAlert.bg,
                    border: `1px solid ${nvewsSimulation.threatAlert.color}44`,
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-primary, #1e293b)",
                        }}
                      >
                        Model Alert Level:
                      </span>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: nvewsSimulation.threatAlert.color,
                          background: isDark
                            ? "rgba(0,0,0,0.3)"
                            : "rgba(255,255,255,0.8)",
                          border: `1px solid ${nvewsSimulation.threatAlert.color}66`,
                        }}
                      >
                        {nvewsSimulation.threatAlert.level}
                      </span>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--text-muted)",
                          marginBottom: 2,
                        }}
                      >
                        Composite NVEWS Volcanic Threat Score:
                      </div>
                      <div
                        style={{
                          fontSize: 34,
                          fontWeight: 800,
                          color: nvewsSimulation.threatAlert.color,
                          marginTop: 2,
                        }}
                      >
                        {nvewsSimulation.compositeScore} / 100
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                      <div
                        style={{
                          background: isDark
                            ? "rgba(0,0,0,0.25)"
                            : "rgba(255,255,255,0.7)",
                          border: "1px solid var(--border-light, #e2e8f0)",
                          padding: 8,
                          borderRadius: 6,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted, #64748b)",
                          }}
                        >
                          Aviation VONA:
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary, #1e293b)",
                            marginTop: 2,
                          }}
                        >
                          CODE {nvewsSimulation.threatAlert.vona}
                        </div>
                      </div>
                      <div
                        style={{
                          background: isDark
                            ? "rgba(0,0,0,0.25)"
                            : "rgba(255,255,255,0.7)",
                          border: "1px solid var(--border-light, #e2e8f0)",
                          padding: 8,
                          borderRadius: 6,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted, #64748b)",
                          }}
                        >
                          Deformation Factor:
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#ef4444",
                            marginTop: 2,
                          }}
                        >
                          {nvewsSimulation.deformScore}/100
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        fontSize: 12,
                        lineHeight: "1.5",
                        color: "var(--text-primary, #1e293b)",
                        background: isDark
                          ? "rgba(0,0,0,0.25)"
                          : "rgba(255,255,255,0.7)",
                        border: "1px solid var(--border-light, #e2e8f0)",
                        padding: 10,
                        borderRadius: 6,
                      }}
                    >
                      <strong>Action Advisory:</strong>{" "}
                      {nvewsSimulation.threatAlert.advisory}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 12,
                      borderTop:
                        "1px solid var(--border-light, rgba(255,255,255,0.08))",
                      paddingTop: 8,
                    }}
                  >
                    Formula: NVEWS = (Deformation × 0.30) + (VEI × 0.25) +
                    (Exposure × 0.25) + (Thermal × 0.20)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: AVIATION ASH ADVISORY & EARLY WARNING OUTLOOK ─ */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ padding: 20 }}>
              <div
                style={{
                  borderBottom:
                    "1px solid var(--border-light, rgba(255,255,255,0.08))",
                  paddingBottom: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: ACCENT,
                    fontWeight: 700,
                  }}
                >
                  Section 4 · Toulouse VAAC Aviation Advisory &amp; Early
                  Warning
                </div>
                <h3
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 18,
                    color: "var(--text-primary, #1e293b)",
                  }}
                >
                  Volcanic Ash Transport &amp; Airspace Safety Protocol
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Ethiopian Airspace Flight Corridors
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#16a34a",
                      marginTop: 4,
                    }}
                  >
                    STATUS: NORMAL / ALL CLEAR
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    No active ash plumes obstructing Red Sea / Horn of Africa
                    airways
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Active Degassing Volcanoes
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#f59e0b",
                      marginTop: 4,
                    }}
                  >
                    Erta Ale &amp; Dallol
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    Continuous SO2 &amp; CO2 gas emissions in Danakil Depression
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card-alt, #f8f9fa)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                    }}
                  >
                    Primary Rapid-Inflation Center
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#ef4444",
                      marginTop: 4,
                    }}
                  >
                    Corbetti (+62 mm/yr)
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted, #64748b)",
                      marginTop: 4,
                    }}
                  >
                    High-priority satellite InSAR radar track Sentinel-1 Frame
                    014D
                  </div>
                </div>
              </div>

              {/* Standard operating procedures */}
              <div
                style={{
                  background: "var(--bg-card-alt, #f8f9fa)",
                  border: "1px solid var(--border-light, #e2e8f0)",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 12,
                  lineHeight: "1.6",
                  color: "var(--text-primary, #1e293b)",
                }}
              >
                <strong style={{ color: "var(--text-primary, #1e293b)" }}>
                  Early Action Protocols:
                </strong>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                  <li>
                    <strong>Toulouse VAAC &amp; ECAA:</strong> Automatic NOTAM
                    dispatch upon detection of thermal ash plumes exceeding
                    FL150 (15,000 ft).
                  </li>
                  <li>
                    <strong>Afar Disaster Risk Management Commission:</strong>{" "}
                    15 km exclusion boundary protocol for pastoralists around
                    Erta Ale active crater during overflow episodes.
                  </li>
                  <li>
                    <strong>Geothermal Infrastructure Security:</strong>{" "}
                    Real-time seismic network monitoring at Aluto-Langano,
                    Corbetti, and Tulu Moye power plants for induced seismicity
                    and cap-rock integrity.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Volcano;
