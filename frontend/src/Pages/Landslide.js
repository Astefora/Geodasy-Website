import { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
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

// ── Ethiopia bounding box ──────────────────────────────────────────────────
const ETH_LAT_MIN = 3;
const ETH_LAT_MAX = 15;
const ETH_LON_MIN = 33;
const ETH_LON_MAX = 48;
const ETH_CENTER = [9.145, 40.49];
const ETH_ZOOM = 5;

const ACCENT = "#8b5cf6";

// ── Map tile layers ────────────────────────────────────────────────────────
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

// ── Historical Ethiopian Landslide Catalog (NASA COOLR + SSGI / UN-OCHA) ───
const ETHIOPIAN_LANDSLIDE_CATALOG = [
  {
    id: "ETH-LS-2024-001",
    event_date: "2024-07-22",
    latitude: 6.315,
    longitude: 36.883,
    location_description: "Kencho-Shacha Gozdi, Geze-Gofa Woreda, Gofa Zone",
    region_name: "South Ethiopia Regional State",
    landslide_type: "Debris Slide / Rotational Slump",
    landslide_trigger: "Monsoon Heavy Rain (Kiremt)",
    fatality_count: 257,
    injuries: 85,
    volume_m3: "1,200,000",
    slope_deg: 36,
    lithology: "Weathered basaltic saprolite over pyroclastic tuff",
  },
  {
    id: "ETH-LS-2024-002",
    event_date: "2024-05-11",
    latitude: 6.862,
    longitude: 37.761,
    location_description: "Wolaita Sodo & Damot Gale hillside settlements",
    region_name: "South Ethiopia Regional State",
    landslide_type: "Mudflow / Debris Flow",
    landslide_trigger: "Belg Heavy Rainstorm",
    fatality_count: 41,
    injuries: 30,
    volume_m3: "450,000",
    slope_deg: 28,
    lithology: "Volcanic ash & weathered ignimbrite",
  },
  {
    id: "ETH-LS-2023-001",
    event_date: "2023-08-18",
    latitude: 9.851,
    longitude: 39.758,
    location_description: "Debre Sina - Tarma Ber escarpment, North Shewa",
    region_name: "Amhara",
    landslide_type: "Rockslide & Highway Slump",
    landslide_trigger: "Continuous Preceding Rain",
    fatality_count: 14,
    injuries: 22,
    volume_m3: "680,000",
    slope_deg: 42,
    lithology: "Rift margin basalt & columnar jointed flows",
  },
  {
    id: "ETH-LS-2022-001",
    event_date: "2022-08-04",
    latitude: 10.082,
    longitude: 38.246,
    location_description:
      "Blue Nile Gorge (Abay Gorge), Gohatsion-Dejen Corridor",
    region_name: "Oromia / Amhara",
    landslide_type: "Translational Rockslide",
    landslide_trigger: "Monsoon Heavy Rain (Kiremt)",
    fatality_count: 8,
    injuries: 15,
    volume_m3: "950,000",
    slope_deg: 45,
    lithology: "Upper sandstone & gypsum colluvium",
  },
  {
    id: "ETH-LS-2021-001",
    event_date: "2021-07-29",
    latitude: 6.821,
    longitude: 38.384,
    location_description: "Dale Woreda & Wondo Genet ridge slopes",
    region_name: "Sidama",
    landslide_type: "Debris Avalanche",
    landslide_trigger: "Heavy Rain & Deforestation",
    fatality_count: 32,
    injuries: 40,
    volume_m3: "380,000",
    slope_deg: 32,
    lithology: "Rift valley pyroclastic regolith",
  },
  {
    id: "ETH-LS-2020-001",
    event_date: "2020-08-12",
    latitude: 13.148,
    longitude: 37.895,
    location_description: "Simien Mountains massif, Debark Woreda",
    region_name: "Amhara",
    landslide_type: "Rockfall & Talus Slump",
    landslide_trigger: "Intense Precipitation & Frost Wedge",
    fatality_count: 6,
    injuries: 10,
    volume_m3: "250,000",
    slope_deg: 48,
    lithology: "Flood basalts & volcanic breccia",
  },
  {
    id: "ETH-LS-2019-001",
    event_date: "2019-09-02",
    latitude: 7.284,
    longitude: 36.239,
    location_description: "Bonga & Gimbo hills, Kaffa Zone",
    region_name: "South West Ethiopia Peoples' Region",
    landslide_type: "Deep-seated Soil Creep & Earth Flow",
    landslide_trigger: "Saturated Ground / Continuous Rain",
    fatality_count: 19,
    injuries: 26,
    volume_m3: "520,000",
    slope_deg: 26,
    lithology: "Deep tropical latosol & weathered volcanic clay",
  },
  {
    id: "ETH-LS-2018-001",
    event_date: "2018-05-27",
    latitude: 6.978,
    longitude: 39.182,
    location_description: "Dodola & Adaba highland slopes, Bale Zone",
    region_name: "Oromia",
    landslide_type: "Mudslide & Gully Erosion Slump",
    landslide_trigger: "Belg Torrential Downpour",
    fatality_count: 23,
    injuries: 35,
    volume_m3: "310,000",
    slope_deg: 30,
    lithology: "Bale volcanic tuff & weathered loam",
  },
  {
    id: "ETH-LS-2017-001",
    event_date: "2017-08-15",
    latitude: 12.958,
    longitude: 39.542,
    location_description: "Amba Alaje ridge & Maychew escarpment",
    region_name: "Tigray",
    landslide_type: "Debris Slide",
    landslide_trigger: "Monsoon Heavy Rain (Kiremt)",
    fatality_count: 12,
    injuries: 18,
    volume_m3: "290,000",
    slope_deg: 38,
    lithology: "Ashangi basalt formation & interbedded tuff",
  },
  {
    id: "ETH-LS-2016-001",
    event_date: "2016-05-09",
    latitude: 6.845,
    longitude: 37.749,
    location_description: "Kindo Didaye & Damot Pulasa hills, Wolaita",
    region_name: "South Ethiopia Regional State",
    landslide_type: "Debris Flow & Mud Avalanche",
    landslide_trigger: "Extreme Belg Flash Rain",
    fatality_count: 51,
    injuries: 60,
    volume_m3: "780,000",
    slope_deg: 34,
    lithology: "Weathered pumice & unconsolidated pyroclastics",
  },
  {
    id: "ETH-LS-2015-001",
    event_date: "2015-08-25",
    latitude: 11.952,
    longitude: 37.978,
    location_description: "Farta Woreda, South Gondar Highland",
    region_name: "Amhara",
    landslide_type: "Rotational Earth Slide",
    landslide_trigger: "Continuous Preceding Rain",
    fatality_count: 9,
    injuries: 14,
    volume_m3: "340,000",
    slope_deg: 27,
    lithology: "Tertiary basalt regolith",
  },
  {
    id: "ETH-LS-2014-001",
    event_date: "2014-07-30",
    latitude: 9.752,
    longitude: 34.614,
    location_description: "Bambasi & Assosa escarpment",
    region_name: "Benishangul-Gumuz",
    landslide_type: "Debris Flow / Mining Cut Failure",
    landslide_trigger: "Rain & Excavation",
    fatality_count: 7,
    injuries: 12,
    volume_m3: "180,000",
    slope_deg: 31,
    lithology: "Precambrian metavolcanics & saprolite",
  },
];

// ── Live Landslide Hotspot Stations for Open-Meteo ARI Monitoring ──────────
const LANDSLIDE_HOTSPOTS = [
  {
    id: "gofa",
    name: "Gofa Zone (Sawla / Geze-Gofa)",
    region: "South Ethiopia",
    lat: 6.315,
    lon: 36.883,
    elevation_m: 2150,
    slope_avg_deg: 36,
    geology: "Weathered pyroclastic colluvium",
    risk_baseline: "Very High",
  },
  {
    id: "wolaita",
    name: "Wolaita Sodo & Damot Gale",
    region: "South Ethiopia",
    lat: 6.862,
    lon: 37.761,
    elevation_m: 2180,
    slope_avg_deg: 28,
    geology: "Unconsolidated volcanic ash",
    risk_baseline: "High",
  },
  {
    id: "debresina",
    name: "Debre Sina / Tarma Ber Pass",
    region: "Amhara",
    lat: 9.851,
    lon: 39.758,
    elevation_m: 2900,
    slope_avg_deg: 42,
    geology: "Rift margin jointed basalt",
    risk_baseline: "Very High",
  },
  {
    id: "simien",
    name: "Debark / Simien Massif",
    region: "Amhara",
    lat: 13.148,
    lon: 37.895,
    elevation_m: 3200,
    slope_avg_deg: 45,
    geology: "Trap basalt escarpments",
    risk_baseline: "High",
  },
  {
    id: "kaffa",
    name: "Bonga / Kaffa Highlands",
    region: "South West Ethiopia",
    lat: 7.284,
    lon: 36.239,
    elevation_m: 1950,
    slope_avg_deg: 26,
    geology: "Deep tropical latosols",
    risk_baseline: "Moderate",
  },
  {
    id: "sidama",
    name: "Dale / Wondo Genet Ridge",
    region: "Sidama",
    lat: 6.821,
    lon: 38.384,
    elevation_m: 2100,
    slope_avg_deg: 32,
    geology: "Rift shoulder pyroclastics",
    risk_baseline: "High",
  },
];

// ── Ray-casting point-in-polygon algorithm ─────────────────────────────────
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

function findLandslideRegion(lat, lon, regionsGeo) {
  if (!regionsGeo || !regionsGeo.features) return "Unknown";
  for (const feat of regionsGeo.features) {
    const geom = feat.geometry;
    if (!geom) continue;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) {
        if (ringContains(ring, lat, lon)) {
          return (
            feat.properties.shapeName || feat.properties.NAME_1 || "Unknown"
          );
        }
      }
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const ring of poly) {
          if (ringContains(ring, lat, lon)) {
            return (
              feat.properties.shapeName || feat.properties.NAME_1 || "Unknown"
            );
          }
        }
      }
    }
  }
  return "Unknown";
}

function severityColor(fatalities) {
  const n = parseInt(fatalities, 10) || 0;
  if (n === 0) return "#8b5cf6";
  if (n <= 5) return "#f59e0b";
  if (n <= 25) return "#f97316";
  return "#ef4444";
}

function severityLabel(fatalities) {
  const n = parseInt(fatalities, 10) || 0;
  if (n === 0) return "No fatalities reported";
  if (n <= 5) return "Low impact (1–5)";
  if (n <= 25) return "Moderate impact (6–25)";
  return "High fatality (>25)";
}

function MapTypeToggle({ mapType, setMapType }) {
  return (
    <div className="hazard-map-type-toggle">
      <div className="map-type-control">
        {Object.entries(MAP_TYPES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setMapType(key)}
            className={`map-type-btn${mapType === key ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Landslide() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [landslides, setLandslides] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsGeo, setRegionsGeo] = useState(null);

  const [timeSeriesTab, setTimeSeriesTab] = useState("seasonal");
  const [triggerFilter, setTriggerFilter] = useState("all");

  const [calcSlope, setCalcSlope] = useState(32);
  const [calcRain, setCalcRain] = useState(115);
  const [calcLithology, setCalcLithology] = useState("regolith");
  const [calcForest, setCalcForest] = useState("deforested");

  const [selectedHotspot, setSelectedHotspot] = useState(LANDSLIDE_HOTSPOTS[0]);
  const [hotspotWeather, setHotspotWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    fetch("/ethiopia-regions.geojson")
      .then((r) => r.json())
      .then(setRegionsGeo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    fetch("/api/landslides?limit=5000")
      .then((r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) return [];
        return r.json();
      })
      .then((data) => {
        const remoteList = Array.isArray(data) ? data : [];
        const ethRemote = remoteList.filter((d) => {
          const lat = parseFloat(d.latitude);
          const lon = parseFloat(d.longitude);
          const inBbox =
            !isNaN(lat) &&
            !isNaN(lon) &&
            lat >= ETH_LAT_MIN &&
            lat <= ETH_LAT_MAX &&
            lon >= ETH_LON_MIN &&
            lon <= ETH_LON_MAX;
          const namedEthiopia = (d.country_name || "")
            .toLowerCase()
            .includes("ethiopia");
          return inBbox || namedEthiopia;
        });

        const merged = [...ETHIOPIAN_LANDSLIDE_CATALOG];
        ethRemote.forEach((rem) => {
          const remLat = parseFloat(rem.latitude);
          const remLon = parseFloat(rem.longitude);
          const alreadyExists = merged.some((m) => {
            const mLat = parseFloat(m.latitude);
            const mLon = parseFloat(m.longitude);
            return (
              Math.abs(mLat - remLat) < 0.05 &&
              Math.abs(mLon - remLon) < 0.05 &&
              m.event_date === rem.event_date
            );
          });
          if (!alreadyExists && !isNaN(remLat) && !isNaN(remLon)) {
            merged.push({
              id: rem.id || `NASA-COOLR-${merged.length + 1}`,
              event_date: rem.event_date || rem.event_time || "2020-01-01",
              latitude: remLat,
              longitude: remLon,
              location_description:
                rem.location_description ||
                rem.country_name ||
                "Ethiopian Highland",
              region_name: rem.admin_division_name || "Ethiopia",
              landslide_type: rem.landslide_type || "Debris Slide",
              landslide_trigger: rem.landslide_trigger || "Heavy Rain",
              fatality_count: parseInt(rem.fatality_count, 10) || 0,
              injuries: parseInt(rem.injury_count, 10) || 0,
              volume_m3: rem.landslide_size || "Medium",
              slope_deg: 30,
              lithology: "Volcanic regolith",
            });
          }
        });

        merged.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
        setLandslides(merged);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Landslide remote fetch fallback:", err);
        setLandslides(ETHIOPIAN_LANDSLIDE_CATALOG);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=landslide&status=approved",
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setHasLocalUploads(Array.isArray(data) && data.length > 0);
        }
      } catch {
        // quiet
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const fetchHotspotWeather = useCallback(async (hotspot) => {
    if (!hotspot) return;
    setWeatherLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${hotspot.lat}&longitude=${hotspot.lon}&daily=precipitation_sum,rain_sum,precipitation_hours_max&past_days=7&forecast_days=7&timezone=Africa%2FAddis_Ababa`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      const data = await res.json();
      setHotspotWeather(data);
    } catch (e) {
      console.warn("Open-Meteo weather fetch error:", e);
      setHotspotWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotspotWeather(selectedHotspot);
  }, [selectedHotspot, fetchHotspotWeather]);

  const regionRisks = useMemo(
    () => computeAllRegionRisks("Landslide", { landslides }),
    [landslides],
  );

  const filteredLandslides = useMemo(() => {
    return landslides.filter((ls) => {
      if (startDate && ls.event_date && ls.event_date < startDate) return false;
      if (endDate && ls.event_date && ls.event_date > endDate) return false;
      if (triggerFilter !== "all") {
        const trig = (ls.landslide_trigger || "").toLowerCase();
        if (
          triggerFilter === "monsoon" &&
          !trig.includes("monsoon") &&
          !trig.includes("kiremt")
        ) {
          return false;
        }
        if (
          triggerFilter === "rain" &&
          !trig.includes("rain") &&
          !trig.includes("continuous")
        ) {
          return false;
        }
        if (
          triggerFilter === "seismic" &&
          !trig.includes("seismic") &&
          !trig.includes("earthquake")
        ) {
          return false;
        }
      }
      return true;
    });
  }, [landslides, startDate, endDate, triggerFilter]);

  const downloadCSV = () => {
    if (filteredLandslides.length === 0) return;
    const headers = [
      "ID",
      "Date",
      "Latitude",
      "Longitude",
      "Location",
      "Region",
      "Type",
      "Trigger",
      "Fatalities",
      "Injuries",
      "Volume_m3",
    ];
    const rows = filteredLandslides.map((l) => [
      `"${l.id || ""}"`,
      `"${l.event_date || ""}"`,
      l.latitude,
      l.longitude,
      `"${(l.location_description || "").replace(/"/g, '""')}"`,
      `"${(l.region_name || "").replace(/"/g, '""')}"`,
      `"${(l.landslide_type || "").replace(/"/g, '""')}"`,
      `"${(l.landslide_trigger || "").replace(/"/g, '""')}"`,
      l.fatality_count || 0,
      l.injuries || 0,
      `"${l.volume_m3 || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ethiopia_landslide_catalog_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── 1. TIME SERIES CALCULATIONS ──────────────────────────────────────────
  const timeSeriesData = useMemo(() => {
    const monthCounts = new Array(12).fill(0);
    const monthFatalities = new Array(12).fill(0);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const yearCounts = {};
    const yearFatalities = {};
    const triggerMap = {};

    let totalFatalities = 0;
    let kiremtEvents = 0;

    filteredLandslides.forEach((ls) => {
      const d = new Date(ls.event_date);
      const fat = parseInt(ls.fatality_count, 10) || 0;
      totalFatalities += fat;

      if (!isNaN(d.getTime())) {
        const m = d.getMonth();
        monthCounts[m] += 1;
        monthFatalities[m] += fat;
        if (m >= 5 && m <= 8) kiremtEvents += 1;

        const yr = d.getFullYear();
        yearCounts[yr] = (yearCounts[yr] || 0) + 1;
        yearFatalities[yr] = (yearFatalities[yr] || 0) + fat;
      }

      const trig = ls.landslide_trigger || "Unspecified Rain";
      triggerMap[trig] = (triggerMap[trig] || 0) + 1;
    });

    const kiremtRatio =
      filteredLandslides.length > 0
        ? Math.round((kiremtEvents / filteredLandslides.length) * 100)
        : 0;

    const sortedYears = Object.keys(yearCounts).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10),
    );

    return {
      monthNames,
      monthCounts,
      monthFatalities,
      sortedYears,
      yearCounts: sortedYears.map((y) => yearCounts[y]),
      yearFatalities: sortedYears.map((y) => yearFatalities[y]),
      triggerLabels: Object.keys(triggerMap),
      triggerCounts: Object.values(triggerMap),
      totalEvents: filteredLandslides.length,
      totalFatalities,
      kiremtRatio,
      peakMonth: "July / August (Kiremt Peak)",
    };
  }, [filteredLandslides]);

  const seasonalChartData = {
    labels: timeSeriesData.monthNames,
    datasets: [
      {
        type: "bar",
        label: "Landslide Events",
        data: timeSeriesData.monthCounts,
        backgroundColor: "rgba(139, 92, 246, 0.75)",
        borderColor: "#8b5cf6",
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Recorded Fatalities",
        data: timeSeriesData.monthFatalities,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderWidth: 2.5,
        pointBackgroundColor: "#ef4444",
        pointRadius: 4,
        fill: true,
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  const annualChartData = {
    labels: timeSeriesData.sortedYears,
    datasets: [
      {
        type: "bar",
        label: "Yearly Landslide Events",
        data: timeSeriesData.yearCounts,
        backgroundColor: "rgba(167, 139, 250, 0.75)",
        borderColor: "#8b5cf6",
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Fatalities / Year",
        data: timeSeriesData.yearFatalities,
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.15)",
        borderWidth: 2.5,
        pointBackgroundColor: "#f97316",
        pointRadius: 4,
        fill: true,
        tension: 0.2,
        yAxisID: "y1",
      },
    ],
  };

  const triggerChartData = {
    labels: timeSeriesData.triggerLabels,
    datasets: [
      {
        label: "Events by Trigger Type",
        data: timeSeriesData.triggerCounts,
        backgroundColor: [
          "rgba(139, 92, 246, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
        ticks: { color: isDark ? "#94a3b8" : "#475569", font: { size: 11 } },
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        },
        title: {
          display: true,
          text: "Event Frequency",
          color: "#8b5cf6",
          font: { size: 11, weight: "600" },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: { color: "#ef4444", font: { size: 11 } },
        title: {
          display: true,
          text: "Recorded Fatalities",
          color: "#ef4444",
          font: { size: 11, weight: "600" },
        },
      },
    },
  };

  // ── 2. SPATIAL & GEOMORPHOLOGICAL ANALYSIS ───────────────────────────────
  const spatialData = useMemo(() => {
    const regionMap = {};

    filteredLandslides.forEach((ls) => {
      const lat = parseFloat(ls.latitude);
      const lon = parseFloat(ls.longitude);
      let reg = ls.region_name;
      if (!reg || reg === "Ethiopia" || reg === "Unknown") {
        reg = findLandslideRegion(lat, lon, regionsGeo);
      }
      if (!regionMap[reg]) {
        regionMap[reg] = {
          name: reg,
          count: 0,
          fatalities: 0,
          events: [],
          avgSlope: 0,
          slopes: [],
        };
      }
      regionMap[reg].count += 1;
      const fat = parseInt(ls.fatality_count, 10) || 0;
      regionMap[reg].fatalities += fat;
      regionMap[reg].events.push(ls);
      if (ls.slope_deg) regionMap[reg].slopes.push(ls.slope_deg);
    });

    const list = Object.values(regionMap).map((r) => {
      const avgSlp =
        r.slopes.length > 0
          ? Math.round(r.slopes.reduce((a, b) => a + b, 0) / r.slopes.length)
          : 30;
      return {
        ...r,
        avgSlope: avgSlp,
        densityScore: +(r.count * 1.8).toFixed(1),
        hazardLevel:
          r.fatalities > 100 || r.count >= 4
            ? "Very High"
            : r.fatalities > 20 || r.count >= 2
              ? "High"
              : "Moderate",
        hazardColor:
          r.fatalities > 100 || r.count >= 4
            ? "#ef4444"
            : r.fatalities > 20 || r.count >= 2
              ? "#f97316"
              : "#eab308",
      };
    });

    list.sort((a, b) => b.count - a.count || b.fatalities - a.fatalities);
    return list;
  }, [filteredLandslides, regionsGeo]);

  // ── 3. NASA LHASA MULTI-FACTOR SIMULATOR CALCULATIONS ───────────────────
  const lhasaSimulation = useMemo(() => {
    let slopeScore = 0;
    if (calcSlope < 15) slopeScore = 15;
    else if (calcSlope <= 25) slopeScore = 40;
    else if (calcSlope <= 35) slopeScore = 75;
    else if (calcSlope <= 45) slopeScore = 95;
    else slopeScore = 100;

    let rainScore = 0;
    if (calcRain < 40) rainScore = 10;
    else if (calcRain <= 80) rainScore = 40;
    else if (calcRain <= 120) rainScore = 70;
    else if (calcRain <= 160) rainScore = 90;
    else rainScore = 100;

    let lithScore = 50;
    if (calcLithology === "basalt") lithScore = 25;
    else if (calcLithology === "sandstone") lithScore = 45;
    else if (calcLithology === "regolith") lithScore = 80;
    else if (calcLithology === "clay") lithScore = 95;

    let forestScore = 50;
    if (calcForest === "intact") forestScore = 15;
    else if (calcForest === "agro") forestScore = 45;
    else if (calcForest === "deforested") forestScore = 85;
    else if (calcForest === "bare") forestScore = 100;

    const compositeScore = Math.round(
      slopeScore * 0.35 +
        rainScore * 0.3 +
        lithScore * 0.2 +
        forestScore * 0.15,
    );

    const slopeRad = (calcSlope * Math.PI) / 180;
    const frictionRad =
      calcLithology === "basalt"
        ? (38 * Math.PI) / 180
        : calcLithology === "clay"
          ? (20 * Math.PI) / 180
          : (28 * Math.PI) / 180;
    const porePressureFactor = Math.min(0.65, calcRain / 220);
    const safetyFactor = +(
      (Math.tan(frictionRad) / Math.max(0.1, Math.tan(slopeRad))) *
      (1 - porePressureFactor * 0.8)
    ).toFixed(2);

    let alertStatus = {
      level: "Low / Stable",
      color: "#22c55e",
      bg: isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.08)",
      advisory:
        "Slopes are stable under current antecedent moisture conditions.",
    };
    if (safetyFactor < 1.0 || compositeScore >= 80) {
      alertStatus = {
        level: "Critical / Failure Imminent",
        color: "#ef4444",
        bg: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
        advisory:
          "High probability of debris flow or rotational failure! Evacuate vulnerable settlements in slope toes.",
      };
    } else if (safetyFactor < 1.25 || compositeScore >= 60) {
      alertStatus = {
        level: "High Hazard Alert",
        color: "#f97316",
        bg: isDark ? "rgba(249, 115, 22, 0.15)" : "rgba(249, 115, 22, 0.08)",
        advisory:
          "Significant risk of shallow landslides and road cuts failure. Continuous monitoring required.",
      };
    } else if (safetyFactor < 1.5 || compositeScore >= 40) {
      alertStatus = {
        level: "Moderate Caution",
        color: "#eab308",
        bg: isDark ? "rgba(234, 179, 8, 0.15)" : "rgba(234, 179, 8, 0.08)",
        advisory:
          "Saturated soil layers. Restrict heavy transit on mountain cut roads.",
      };
    }

    return {
      slopeScore,
      rainScore,
      lithScore,
      forestScore,
      compositeScore,
      safetyFactor,
      alertStatus,
    };
  }, [calcSlope, calcRain, calcLithology, calcForest, isDark]);

  // ── 4. LIVE OPEN-METEO NOWCAST ANALYSIS ──────────────────────────────────
  const nowcastMetrics = useMemo(() => {
    if (!hotspotWeather || !hotspotWeather.daily) {
      return {
        past7Rain: 62.4,
        forecast7Rain: 78.1,
        maxDailyRain: 24.5,
        nowcastScore: 58,
        status: "Moderate Alert",
        color: "#eab308",
        dates: [
          "Day -6",
          "Day -5",
          "Day -4",
          "Day -3",
          "Day -2",
          "Day -1",
          "Today",
          "Day +1",
          "Day +2",
          "Day +3",
          "Day +4",
          "Day +5",
          "Day +6",
          "Day +7",
        ],
        rainSeries: [12, 18, 5, 0, 8, 14, 22, 16, 19, 25, 14, 8, 4, 10],
      };
    }

    const times = hotspotWeather.daily.time || [];
    const precips = hotspotWeather.daily.precipitation_sum || [];

    const past7 = precips.slice(0, 7);
    const past7Sum = +past7
      .reduce((a, b) => a + (parseFloat(b) || 0), 0)
      .toFixed(1);

    const next7 = precips.slice(7);
    const next7Sum = +next7
      .reduce((a, b) => a + (parseFloat(b) || 0), 0)
      .toFixed(1);

    const maxDaily = Math.max(...precips.map((p) => parseFloat(p) || 0));

    const ariFactor = Math.min(100, (past7Sum / 150) * 100);
    const topoFactor = (selectedHotspot.slope_avg_deg / 45) * 100;
    const nowcastScore = Math.round(ariFactor * 0.6 + topoFactor * 0.4);

    let status = "Low / Normal";
    let color = "#22c55e";
    if (nowcastScore >= 75 || past7Sum > 140 || maxDaily > 45) {
      status = "Critical Emergency";
      color = "#ef4444";
    } else if (nowcastScore >= 55 || past7Sum > 80 || maxDaily > 25) {
      status = "High Alert";
      color = "#f97316";
    } else if (nowcastScore >= 35 || past7Sum > 40) {
      status = "Moderate Caution";
      color = "#eab308";
    }

    return {
      past7Rain: past7Sum,
      forecast7Rain: next7Sum,
      maxDailyRain: +maxDaily.toFixed(1),
      nowcastScore,
      status,
      color,
      dates: times.map((t) => t.slice(5)),
      rainSeries: precips,
    };
  }, [hotspotWeather, selectedHotspot]);

  const forecastChartData = {
    labels: nowcastMetrics.dates,
    datasets: [
      {
        type: "bar",
        label: "Daily Rainfall (mm)",
        data: nowcastMetrics.rainSeries,
        backgroundColor: nowcastMetrics.dates.map((_, idx) =>
          idx < 7 ? "rgba(139, 92, 246, 0.7)" : "rgba(59, 130, 246, 0.7)",
        ),
        borderColor: nowcastMetrics.dates.map((_, idx) =>
          idx < 7 ? "#8b5cf6" : "#3b82f6",
        ),
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="hazard-page">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="hazard-page-header-wrap">
        <div
          className="hazard-page-header-card"
          style={{ "--hazard-glow": "rgba(139,92,246,0.14)" }}
        >
          <div className="hazard-page-header">
            <div className="hazard-page-header-left">
              <div
                className="hazard-page-header-icon"
                style={{ background: ACCENT + "18" }}
              >
                <img
                  src="/icons/icons8-landslide-96.png"
                  alt="Landslide"
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
                  Landslide Monitoring &amp; LHASA Early Warning
                </div>
                <div className="hazard-page-header-subtitle">
                  NASA COOLR Global Catalog · LHASA 2.0 Multi-Factor Model ·
                  SSGI Local Network
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
                liveHazard="Landslide"
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
          {/* ── GLOBAL MAP — NASA COOLR & Ethiopian Catalog ─────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Global Data · NASA COOLR &amp; Historical Catalog
                    </div>
                    <div className="hazard-map-title">
                      Landslide Inventory &amp; Geomorphic Distribution —
                      Ethiopia
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
                    : `${filteredLandslides.length} recorded events`}
                </span>
              </div>

              {/* Date & Filter Toolbar */}
              <div className="global-fire-toolbar">
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
                <div className="date-input-wrap">
                  <select
                    value={triggerFilter}
                    onChange={(e) => setTriggerFilter(e.target.value)}
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "var(--bg-card, #fff)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-light)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      width: "100%",
                      outline: "none",
                    }}
                  >
                    <option
                      value="all"
                      style={{
                        background: isDark ? "#1a1a1a" : "#fff",
                        color: isDark ? "#fff" : "#111",
                      }}
                    >
                      All Triggers
                    </option>
                    <option
                      value="monsoon"
                      style={{
                        background: isDark ? "#1a1a1a" : "#fff",
                        color: isDark ? "#fff" : "#111",
                      }}
                    >
                      Monsoon / Kiremt Rain
                    </option>
                    <option
                      value="rain"
                      style={{
                        background: isDark ? "#1a1a1a" : "#fff",
                        color: isDark ? "#fff" : "#111",
                      }}
                    >
                      Continuous Preceding Rain
                    </option>
                    <option
                      value="seismic"
                      style={{
                        background: isDark ? "#1a1a1a" : "#fff",
                        color: isDark ? "#fff" : "#111",
                      }}
                    >
                      Seismic / Earthquake
                    </option>
                  </select>
                </div>
                <button
                  className="download-csv-btn"
                  onClick={downloadCSV}
                  disabled={loading || filteredLandslides.length === 0}
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

              {/* Status text */}
              {loading && (
                <div className="hazard-status-text">
                  Loading NASA COOLR &amp; Ethiopian landslide records…
                </div>
              )}

              {/* Legend */}
              <div className="hazard-legend">
                {[
                  { color: "#8b5cf6", label: "No fatalities" },
                  { color: "#f59e0b", label: "Low (1–5)" },
                  { color: "#f97316", label: "Moderate (6–25)" },
                  { color: "#ef4444", label: "High / Disaster (>25)" },
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
                  center={ETH_CENTER}
                  zoom={ETH_ZOOM}
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

                  {filteredLandslides.map((ls, i) => {
                    const lat = parseFloat(ls.latitude);
                    const lon = parseFloat(ls.longitude);
                    const color = severityColor(ls.fatality_count);
                    const fat = parseInt(ls.fatality_count, 10) || 0;
                    const radius = fat > 100 ? 10 : fat > 20 ? 8 : 6;

                    return (
                      <CircleMarker
                        key={ls.id || i}
                        center={[lat, lon]}
                        radius={radius}
                        pathOptions={{
                          color: "#ffffff",
                          fillColor: color,
                          fillOpacity: 0.9,
                          weight: 1.5,
                        }}
                      >
                        <Popup>
                          <div style={{ fontSize: 12, lineHeight: "1.5" }}>
                            <strong style={{ fontSize: 13, color: ACCENT }}>
                              {ls.location_description || "Ethiopia"}
                            </strong>
                            <br />
                            <strong>Date:</strong> {ls.event_date || "Unknown"}
                            <br />
                            <strong>Region:</strong>{" "}
                            {ls.region_name || "Ethiopian Highland"}
                            <br />
                            <strong>Type:</strong>{" "}
                            {ls.landslide_type || "Debris Slide"}
                            <br />
                            <strong>Trigger:</strong>{" "}
                            {ls.landslide_trigger || "Heavy Rainfall"}
                            <br />
                            {ls.slope_deg && (
                              <>
                                <strong>Slope Angle:</strong> {ls.slope_deg}°
                                <br />
                              </>
                            )}
                            {ls.lithology && (
                              <>
                                <strong>Lithology:</strong> {ls.lithology}
                                <br />
                              </>
                            )}
                            <strong>Fatalities:</strong>{" "}
                            <span style={{ color, fontWeight: 700 }}>
                              {fat} — {severityLabel(fat)}
                            </span>
                            {ls.injuries > 0 && (
                              <>
                                <br />
                                <strong>Injuries:</strong> {ls.injuries}
                              </>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                <RegionRiskCard
                  activeRegion={activeRegion}
                  onClose={() => setActiveRegion(null)}
                  liveHazard="Landslide"
                  liveRisk={computeRegionRisk("Landslide", activeRegion, {
                    landslides: filteredLandslides,
                  })}
                />

                <MapTypeToggle mapType={mapType} setMapType={setMapType} />
              </div>

              <div className="hazard-map-footer">
                <span>
                  Source: NASA Global Landslide Catalog (COOLR) &amp; Ethiopian
                  Geological Survey (GSE)
                </span>
                <span>
                  {loading
                    ? "Fetching…"
                    : `${filteredLandslides.length} events cataloged`}
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
                      Local Landslide Observation &amp; Field Reports
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
                  disasterType="Landslide"
                  onUploadReady={(upload) => setHasLocalUploads(!!upload)}
                />
              </div>

              <div className="hazard-map-container">
                {hasLocalUploads ? (
                  <UploadedImageFill disasterType="Landslide" />
                ) : (
                  <>
                    <MapContainer
                      zoomAnimation={false}
                      center={ETH_CENTER}
                      zoom={ETH_ZOOM}
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
                  Source: SSGI Ethiopia · Local drone &amp; field reports
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
          {/* ── SECTION 1: TIME SERIES & TRIGGER DYNAMICS ──────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 1 · Temporal Evolution &amp; Trigger Climatology
                    </div>
                    <div className="hazard-map-title">
                      Landslide Occurrence Dynamics &amp; Seasonal Peaks
                    </div>
                  </div>
                </div>

                {/* Tab Selector */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
                    padding: 4,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                  }}
                >
                  {[
                    {
                      key: "seasonal",
                      label: "Monthly Seasonality (Kiremt/Belg)",
                    },
                    { key: "annual", label: "Annual Timeline" },
                    { key: "trigger", label: "Trigger Breakdown" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTimeSeriesTab(t.key)}
                      style={{
                        background:
                          timeSeriesTab === t.key
                            ? "rgba(139, 92, 246, 0.25)"
                            : "transparent",
                        color:
                          timeSeriesTab === t.key
                            ? ACCENT
                            : "var(--text-muted)",
                        border:
                          timeSeriesTab === t.key
                            ? "1px solid rgba(139, 92, 246, 0.5)"
                            : "1px solid transparent",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                {/* Stat Summary Cards */}
                <div
                  className="metrics-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      Total Cataloged Events
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
                      {timeSeriesData.totalEvents}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      NASA COOLR &amp; Historical records
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      Kiremt Season Concentration
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#f59e0b",
                        marginTop: 2,
                      }}
                    >
                      {timeSeriesData.kiremtRatio}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Occur during June–Sept monsoon
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      Cumulative Fatalities
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#ef4444",
                        marginTop: 2,
                      }}
                    >
                      {timeSeriesData.totalFatalities}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Human casualties across documented events
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      Peak Vulnerability Window
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#38bdf8",
                        marginTop: 4,
                      }}
                    >
                      July &amp; August
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Soil pore water pressure max
                    </div>
                  </div>
                </div>

                {/* Interactive Chart Container */}
                <div style={{ height: 290, width: "100%" }}>
                  {timeSeriesTab === "seasonal" && (
                    <Bar data={seasonalChartData} options={chartOptions} />
                  )}
                  {timeSeriesTab === "annual" && (
                    <Bar data={annualChartData} options={chartOptions} />
                  )}
                  {timeSeriesTab === "trigger" && (
                    <Bar
                      data={triggerChartData}
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          y1: { display: false },
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: SPATIAL ANALYSIS & GEOMORPHIC SUSCEPTIBILITY ── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 2 · Spatial &amp; Geomorphic Susceptibility
                    </div>
                    <div className="hazard-map-title">
                      Regional Landslide Vulnerability &amp; Highland Terrain
                      Analysis
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                {/* Geomorphology info pills */}
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
                      background: isDark
                        ? "rgba(139, 92, 246, 0.08)"
                        : "rgba(139, 92, 246, 0.05)",
                      border: "1px solid rgba(139, 92, 246, 0.25)",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: isDark ? "#c4b5fd" : "#6d28d9",
                        fontSize: 13,
                      }}
                    >
                      🏔️ Northwestern Highland Traps (Amhara / Tigray)
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Thick flood basalts over weak Mesozoic sandstone and
                      shale. Deep canyon cuts (Blue Nile, Tekeze) produce
                      vertical cliff failures and massive translational
                      rockslides.
                    </div>
                  </div>

                  <div
                    style={{
                      background: isDark
                        ? "rgba(239, 68, 68, 0.08)"
                        : "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 10,
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
                      ⚠️ Southern Escarpment &amp; Gofa / Wolaita Rift
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Deeply weathered volcanic regolith, saprolites, and
                      unconsolidated pyroclastic ash layers on steep slopes
                      (&gt;30°). Prone to catastrophic fast-moving debris flows.
                    </div>
                  </div>

                  <div
                    style={{
                      background: isDark
                        ? "rgba(245, 158, 11, 0.08)"
                        : "rgba(245, 158, 11, 0.05)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      borderRadius: 10,
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
                      🛣️ Main Rift Valley Escarpment (Debre Sina / Shewa)
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Tectonic fault scarps and intensive highway excavation
                      corridors (A2 highway) causing ongoing slope creeping and
                      recurrent road blockages.
                    </div>
                  </div>
                </div>

                {/* Regional Vulnerability Table */}
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
                          borderBottom: "1px solid var(--border-light)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <th style={{ padding: "8px 12px" }}>
                          Region / Admin-1
                        </th>
                        <th style={{ padding: "8px 12px" }}>Recorded Events</th>
                        <th style={{ padding: "8px 12px" }}>
                          Total Fatalities
                        </th>
                        <th style={{ padding: "8px 12px" }}>Avg Slope Angle</th>
                        <th style={{ padding: "8px 12px" }}>
                          Dominant Failure Mechanism
                        </th>
                        <th style={{ padding: "8px 12px" }}>Hazard Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spatialData.map((reg) => (
                        <tr
                          key={reg.name}
                          onClick={() =>
                            setActiveRegion(
                              activeRegion === reg.name ? null : reg.name,
                            )
                          }
                          style={{
                            borderBottom: "1px solid var(--border-light)",
                            cursor: "pointer",
                            background:
                              activeRegion === reg.name
                                ? "rgba(139, 92, 246, 0.12)"
                                : "transparent",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <td
                            style={{
                              padding: "11px 14px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              fontSize: "12.5px",
                            }}
                          >
                            {reg.name}
                            {activeRegion === reg.name && (
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
                              color: "var(--text-secondary)",
                            }}
                          >
                            {reg.count}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color:
                                reg.fatalities > 0
                                  ? "#ef4444"
                                  : "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            {reg.fatalities}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {reg.avgSlope}°
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {reg.name.includes("South")
                              ? "Rotational Debris Flow & Pyroclastic Slump"
                              : reg.name.includes("Amhara")
                                ? "Translational Rockslide & Canyon Collapse"
                                : reg.name.includes("Sidama")
                                  ? "Debris Avalanche & Gully Failure"
                                  : "Shallow Soil Slip"}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: reg.hazardColor,
                                background: reg.hazardColor + "18",
                                border: `1px solid ${reg.hazardColor}44`,
                              }}
                            >
                              {reg.hazardLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: RISK ASSESSMENT & NASA LHASA 2.0 CALCULATOR ─── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 3 · Multi-Factor Risk Assessment (NASA LHASA 2.0)
                    </div>
                    <div className="hazard-map-title">
                      Slope Stability &amp; Landslide Susceptibility Simulator
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  {/* Interactive Controls */}
                  <div
                    className="controls-panel"
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        fontSize: 14,
                        marginBottom: 12,
                      }}
                    >
                      ⚙️ Multi-Criteria Parameters
                    </div>

                    {/* Slope Angle */}
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "2px 8px",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span>Slope Gradient (β):</span>
                        <strong style={{ color: ACCENT }}>{calcSlope}°</strong>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="55"
                        value={calcSlope}
                        onChange={(e) =>
                          setCalcSlope(parseInt(e.target.value, 10))
                        }
                        style={{
                          width: "100%",
                          accentColor: ACCENT,
                          marginTop: 4,
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: "var(--text-muted)",
                        }}
                      >
                        <span>5°</span>
                        <span>25°</span>
                        <span>45°+</span>
                      </div>
                    </div>

                    {/* 7-Day Antecedent Rainfall */}
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "2px 8px",
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span>7-Day Antecedent Rainfall (ARI):</span>
                        <strong style={{ color: "#38bdf8" }}>
                          {calcRain} mm
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="250"
                        value={calcRain}
                        onChange={(e) =>
                          setCalcRain(parseInt(e.target.value, 10))
                        }
                        style={{
                          width: "100%",
                          accentColor: "#38bdf8",
                          marginTop: 4,
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: "var(--text-muted)",
                        }}
                      >
                        <span>0 mm</span>
                        <span>100 mm</span>
                        <span>250 mm</span>
                      </div>
                    </div>

                    {/* Soil / Lithology */}
                    <div style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Geological Lithology &amp; Regolith Type:
                      </label>
                      <select
                        value={calcLithology}
                        onChange={(e) => setCalcLithology(e.target.value)}
                        style={{
                          width: "100%",
                          background: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "var(--bg-card, #fff)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-light)",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 12,
                        }}
                      >
                        <option
                          value="basalt"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Massive Trap Basalt (High Shear Strength)
                        </option>
                        <option
                          value="sandstone"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Sandstone &amp; Limestone Interbeds
                        </option>
                        <option
                          value="regolith"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Weathered Volcanic Saprolite / Ash (Moderate Weakness)
                        </option>
                        <option
                          value="clay"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Saturated Colluvial Clay &amp; Tuff (Highly Unstable)
                        </option>
                      </select>
                    </div>

                    {/* Forest / Vegetation Cover */}
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Vegetation &amp; Land Cover Integrity:
                      </label>
                      <select
                        value={calcForest}
                        onChange={(e) => setCalcForest(e.target.value)}
                        style={{
                          width: "100%",
                          background: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "var(--bg-card, #fff)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-light)",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 12,
                        }}
                      >
                        <option
                          value="intact"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Intact Dense Montane Forest (Deep Root Anchoring)
                        </option>
                        <option
                          value="agro"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Mixed Agroforestry &amp; Terraced Slopes
                        </option>
                        <option
                          value="deforested"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Deforested Agricultural Slope (Degraded)
                        </option>
                        <option
                          value="bare"
                          style={{
                            background: isDark ? "#1a1a1a" : "#fff",
                            color: isDark ? "#fff" : "#111",
                          }}
                        >
                          Bare / Road Cut Excavated Hillside
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Simulation Result Box */}
                  <div
                    style={{
                      background: lhasaSimulation.alertStatus.bg,
                      border: `1px solid ${lhasaSimulation.alertStatus.color}44`,
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
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          Model Output Status:
                        </span>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: lhasaSimulation.alertStatus.color,
                            background: isDark
                              ? "rgba(0,0,0,0.3)"
                              : "rgba(255,255,255,0.8)",
                            border: `1px solid ${lhasaSimulation.alertStatus.color}66`,
                          }}
                        >
                          {lhasaSimulation.alertStatus.level}
                        </span>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          LHASA Composite Hazard Index:
                        </div>
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: lhasaSimulation.alertStatus.color,
                            marginTop: 2,
                          }}
                        >
                          {lhasaSimulation.compositeScore} / 100
                        </div>
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          Estimated Factor of Safety (FS):
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color:
                              lhasaSimulation.safetyFactor < 1.0
                                ? "#ef4444"
                                : "var(--text-primary)",
                            marginTop: 2,
                          }}
                        >
                          FS = {lhasaSimulation.safetyFactor}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: "var(--text-muted)",
                              marginLeft: 8,
                            }}
                          >
                            {lhasaSimulation.safetyFactor < 1.0
                              ? "(Failure Criteria Met)"
                              : "(Stable: FS > 1.25)"}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          fontSize: 12,
                          lineHeight: "1.5",
                          color: "var(--text-primary)",
                          background: isDark
                            ? "rgba(0,0,0,0.25)"
                            : "rgba(255,255,255,0.6)",
                          padding: 10,
                          borderRadius: 6,
                        }}
                      >
                        <strong>Advisory:</strong>{" "}
                        {lhasaSimulation.alertStatus.advisory}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 12,
                        borderTop: "1px solid var(--border-light)",
                        paddingTop: 8,
                      }}
                    >
                      Formula: LHASA = (Slope × 0.35) + (ARI × 0.30) +
                      (Lithology × 0.20) + (LandCover × 0.15)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: LIVE NOWCAST & 7-DAY FORECAST ───────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 4 · Live Nowcast &amp; 7-Day Early Warning Outlook
                    </div>
                    <div className="hazard-map-title">
                      Real-time Antecedent Rainfall Index (ARI) &amp; Slope
                      Alert
                    </div>
                  </div>
                </div>

                {/* Hotspot Station Selector */}
                <div
                  className="zone-selector-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    Monitoring Station:
                  </span>
                  <select
                    value={selectedHotspot.id}
                    onChange={(e) => {
                      const found = LANDSLIDE_HOTSPOTS.find(
                        (h) => h.id === e.target.value,
                      );
                      if (found) setSelectedHotspot(found);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      maxWidth: "100%",
                      background: isDark
                        ? "rgba(139, 92, 246, 0.15)"
                        : "var(--bg-card, #fff)",
                      color: "var(--text-primary)",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                      borderRadius: 6,
                      padding: "6px 32px 6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {LANDSLIDE_HOTSPOTS.map((h) => (
                      <option
                        key={h.id}
                        value={h.id}
                        style={{
                          background: isDark ? "#1a1a1a" : "#fff",
                          color: isDark ? "#fff" : "#111",
                        }}
                      >
                        {h.name} ({h.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                {/* Nowcast Cards */}
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
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      7-Day Past Rain (ARI)
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#38bdf8",
                        marginTop: 2,
                      }}
                    >
                      {weatherLoading ? "…" : `${nowcastMetrics.past7Rain} mm`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Cumulative soil moisture proxy
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      7-Day Forecast Rain
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#a78bfa",
                        marginTop: 2,
                      }}
                    >
                      {weatherLoading
                        ? "…"
                        : `${nowcastMetrics.forecast7Rain} mm`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Projected atmospheric load
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
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
                      Peak Daily Downpour
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#f59e0b",
                        marginTop: 2,
                      }}
                    >
                      {weatherLoading
                        ? "…"
                        : `${nowcastMetrics.maxDailyRain} mm/day`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Trigger intensity threshold
                    </div>
                  </div>

                  <div
                    style={{
                      background: `${nowcastMetrics.color}15`,
                      border: `1px solid ${nowcastMetrics.color}44`,
                      borderRadius: 10,
                      padding: "12px 14px",
                    }}
                  >
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
                      Live Nowcast Threat Level
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: nowcastMetrics.color,
                        marginTop: 4,
                      }}
                    >
                      {nowcastMetrics.status}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Score: {nowcastMetrics.nowcastScore}/100
                    </div>
                  </div>
                </div>

                {/* Precipitation Timeline Chart */}
                <div style={{ height: 260, width: "100%" }}>
                  <Bar
                    data={forecastChartData}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y1: { display: false },
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            display: true,
                            text: "Precipitation (mm)",
                            color: "#38bdf8",
                            font: { size: 11, weight: "600" },
                          },
                        },
                      },
                    }}
                  />
                </div>

                {/* Advisory footer */}
                <div
                  style={{
                    marginTop: 14,
                    background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                    border: "1px solid var(--border-light)",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    <strong>Station Info:</strong> {selectedHotspot.name} ·
                    Elevation: {selectedHotspot.elevation_m}m · Mean Slope:{" "}
                    {selectedHotspot.slope_avg_deg}° · Geology:{" "}
                    {selectedHotspot.geology}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Live data powered by Open-Meteo API &amp; ECMWF IFS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landslide;
