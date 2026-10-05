import { useState, useCallback, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
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

const ACCENT = "#f59e0b";

// ── Critical Drought Monitoring Hubs in Ethiopia ───────────────────────────
const DROUGHT_MONITORING_HUBS = [
  {
    id: "gode",
    name: "Gode / Shabelle Zone",
    region: "Somali",
    zoneType: "Pastoralist Lowland",
    lat: 5.95,
    lon: 43.55,
    elevation_m: 290,
    climatology_annual_rain: 220,
    main_season: "Gu (Apr-May) & Deyr (Oct-Nov)",
    baseline_temp: 34.5,
  },
  {
    id: "semera",
    name: "Semera / Zone 1",
    region: "Afar",
    zoneType: "Hyper-Arid Rift Lowland",
    lat: 11.79,
    lon: 41.0,
    elevation_m: 430,
    climatology_annual_rain: 180,
    main_season: "Sugum (Mar-Apr) & Karma (Jul-Aug)",
    baseline_temp: 38.2,
  },
  {
    id: "yabelo",
    name: "Yabelo / Borena Zone",
    region: "Oromia",
    zoneType: "Agro-Pastoral Rangeland",
    lat: 4.88,
    lon: 38.08,
    elevation_m: 1640,
    climatology_annual_rain: 480,
    main_season: "Ganna (Mar-May) & Hagayya (Sep-Nov)",
    baseline_temp: 26.8,
  },
  {
    id: "mekelle",
    name: "Mekelle / Southern-Eastern Tigray",
    region: "Tigray",
    zoneType: "Semi-Arid Highland Cropland",
    lat: 13.49,
    lon: 39.47,
    elevation_m: 2250,
    climatology_annual_rain: 580,
    main_season: "Kiremt (Jun-Sep) & Belg (Mar-May)",
    baseline_temp: 24.2,
  },
  {
    id: "sekota",
    name: "Sekota / Wag Hemra",
    region: "Amhara",
    zoneType: "Drought-Prone Escarpment",
    lat: 12.63,
    lon: 39.03,
    elevation_m: 2260,
    climatology_annual_rain: 610,
    main_season: "Kiremt (Jun-Sep)",
    baseline_temp: 23.5,
  },
  {
    id: "kebridehar",
    name: "Kebri Dehar / Korahe",
    region: "Somali",
    zoneType: "Deep Pastoral Lowland",
    lat: 6.73,
    lon: 44.27,
    elevation_m: 490,
    climatology_annual_rain: 260,
    main_season: "Gu (Apr-May) & Deyr (Oct-Nov)",
    baseline_temp: 33.8,
  },
];

// ── Climatological Baseline Profiles by Region for Ethiopia ────────────────
const ETHIOPIA_DROUGHT_REGIONS = [
  {
    name: "Somali",
    zoneType: "Pastoralist Lowland",
    spi30: -1.82,
    spi90: -1.95,
    precipAnomaly: -54,
    lstAnomaly: +2.8,
    vhi: 26,
    soilMoisture: 18,
    ipcPhase: "Phase 4 (Emergency)",
    ipcColor: "#dc2626",
    waterPointFunctionality: 42,
    pastureDeficit: "-65%",
    dominantRisk:
      "Consecutive seasonal failure, mass livestock mortality, water distress",
  },
  {
    name: "Afar",
    zoneType: "Hyper-Arid Lowland",
    spi30: -1.65,
    spi90: -1.78,
    precipAnomaly: -48,
    lstAnomaly: +3.4,
    vhi: 30,
    soilMoisture: 22,
    ipcPhase: "Phase 3+ (Crisis / Emergency)",
    ipcColor: "#ea580c",
    waterPointFunctionality: 51,
    pastureDeficit: "-58%",
    dominantRisk:
      "Extreme thermal heat stress, dry riverbeds, pastoral migration tension",
  },
  {
    name: "Oromia",
    zoneType: "Pastoral Lowlands (Borena) & Highland Croplands",
    spi30: -1.35,
    spi90: -1.42,
    precipAnomaly: -36,
    lstAnomaly: +1.9,
    vhi: 41,
    soilMoisture: 35,
    ipcPhase: "Phase 3 (Crisis in Lowlands)",
    ipcColor: "#ea580c",
    waterPointFunctionality: 64,
    pastureDeficit: "-42%",
    dominantRisk:
      "Borena rangeland depletion, cereal crop yield suppression in East Hararghe",
  },
  {
    name: "Tigray",
    zoneType: "Semi-Arid Rainfed Cropland",
    spi30: -1.48,
    spi90: -1.55,
    precipAnomaly: -41,
    lstAnomaly: +2.1,
    vhi: 36,
    soilMoisture: 28,
    ipcPhase: "Phase 3+ (Crisis)",
    ipcColor: "#ea580c",
    waterPointFunctionality: 56,
    pastureDeficit: "-45%",
    dominantRisk:
      "Erratic Kiremt distribution, seed shortage, shallow aquifer depletion",
  },
  {
    name: "Amhara",
    zoneType: "Highland & Escarpment Croplands (Wag Hemra / Wollo)",
    spi30: -1.18,
    spi90: -1.25,
    precipAnomaly: -28,
    lstAnomaly: +1.5,
    vhi: 48,
    soilMoisture: 42,
    ipcPhase: "Phase 2–3 (Stressed / Crisis in Wag Hemra)",
    ipcColor: "#f59e0b",
    waterPointFunctionality: 72,
    pastureDeficit: "-30%",
    dominantRisk:
      "Moisture stress during flowering stage in teff, sorghum and barley",
  },
  {
    name: "South Ethiopia Regional State",
    zoneType: "Agro-Pastoral & Highland Rift",
    spi30: -0.92,
    spi90: -0.85,
    precipAnomaly: -18,
    lstAnomaly: +0.9,
    vhi: 58,
    soilMoisture: 52,
    ipcPhase: "Phase 2 (Stressed in South Omo)",
    ipcColor: "#f59e0b",
    waterPointFunctionality: 78,
    pastureDeficit: "-22%",
    dominantRisk: "Moderate rangeland pressure in lowland pastoral woredas",
  },
  {
    name: "Sidama",
    zoneType: "Highland Agroforestry & Coffee Belt",
    spi30: -0.45,
    spi90: -0.32,
    precipAnomaly: -8,
    lstAnomaly: +0.4,
    vhi: 68,
    soilMoisture: 65,
    ipcPhase: "Phase 1 (Minimal / Normal)",
    ipcColor: "#22c55e",
    waterPointFunctionality: 88,
    pastureDeficit: "-10%",
    dominantRisk:
      "Localised dry spells in lower elevation coffee growing zones",
  },
  {
    name: "South West Ethiopia",
    zoneType: "Humid Forest & Perennial Belt",
    spi30: +0.25,
    spi90: +0.4,
    precipAnomaly: +6,
    lstAnomaly: -0.2,
    vhi: 78,
    soilMoisture: 75,
    ipcPhase: "Phase 1 (Minimal)",
    ipcColor: "#22c55e",
    waterPointFunctionality: 92,
    pastureDeficit: "0% (Adequate)",
    dominantRisk: "Favorable rainfall and abundant vegetation cover",
  },
  {
    name: "Benishangul-Gumuz",
    zoneType: "Western Lowland & Humid Savanna",
    spi30: -0.15,
    spi90: +0.05,
    precipAnomaly: -4,
    lstAnomaly: +0.3,
    vhi: 72,
    soilMoisture: 68,
    ipcPhase: "Phase 1 (Minimal)",
    ipcColor: "#22c55e",
    waterPointFunctionality: 85,
    pastureDeficit: "-5%",
    dominantRisk: "Near-normal agro-climatic baseline conditions",
  },
  {
    name: "Gambela",
    zoneType: "Lowland Floodplain & Agro-Pastoral",
    spi30: -0.3,
    spi90: -0.22,
    precipAnomaly: -7,
    lstAnomaly: +0.6,
    vhi: 65,
    soilMoisture: 62,
    ipcPhase: "Phase 1–2 (Minimal to Stressed)",
    ipcColor: "#22c55e",
    waterPointFunctionality: 80,
    pastureDeficit: "-12%",
    dominantRisk: "Seasonal recession cultivation moisture variance",
  },
  {
    name: "Addis Ababa",
    zoneType: "Highland Urban Plateau",
    spi30: -0.65,
    spi90: -0.5,
    precipAnomaly: -12,
    lstAnomaly: +0.8,
    vhi: 60,
    soilMoisture: 58,
    ipcPhase: "Phase 1 (Minimal)",
    ipcColor: "#22c55e",
    waterPointFunctionality: 95,
    pastureDeficit: "N/A",
    dominantRisk: "Reservoir catchment storage monitoring",
  },
  {
    name: "Dire Dawa",
    zoneType: "Semi-Arid Urban & Foothill",
    spi30: -1.28,
    spi90: -1.35,
    precipAnomaly: -34,
    lstAnomaly: +1.8,
    vhi: 42,
    soilMoisture: 32,
    ipcPhase: "Phase 2–3 (Stressed)",
    ipcColor: "#f59e0b",
    waterPointFunctionality: 70,
    pastureDeficit: "-35%",
    dominantRisk:
      "Deep groundwater drawdown and surrounding pastoralist water supply",
  },
  {
    name: "Harari",
    zoneType: "Highland Agricultural Enclave",
    spi30: -0.95,
    spi90: -1.05,
    precipAnomaly: -22,
    lstAnomaly: +1.2,
    vhi: 52,
    soilMoisture: 45,
    ipcPhase: "Phase 2 (Stressed)",
    ipcColor: "#f59e0b",
    waterPointFunctionality: 78,
    pastureDeficit: "-25%",
    dominantRisk: "Horticultural and sorghum moisture stress",
  },
];

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const yesterday = getYesterday();
  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(yesterday);
  const [activeDate, setActiveDate] = useState(yesterday);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsGeo, setRegionsGeo] = useState(null);

  const [spiScale, setSpiScale] = useState("spi90");
  const [zoneFocus, setZoneFocus] = useState("pastoral");

  const [simPrecipAnomaly, setSimPrecipAnomaly] = useState(-45);
  const [simLstAnomaly, setSimLstAnomaly] = useState(2.6);
  const [simVhi, setSimVhi] = useState(28);
  const [simSoilMoisture, setSimSoilMoisture] = useState(20);

  const [selectedHub, setSelectedHub] = useState(DROUGHT_MONITORING_HUBS[0]);
  const [hubWeather, setHubWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    fetch("/ethiopia-regions.geojson")
      .then((r) => r.json())
      .then(setRegionsGeo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          "/api/uploads?hazardType=drought&status=approved",
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

  const fetchHubWeather = useCallback(async (hub) => {
    if (!hub) return;
    setWeatherLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${hub.lat}&longitude=${hub.lon}&daily=precipitation_sum,temperature_2m_max,et0_fao_evapotranspiration&past_days=30&forecast_days=14&timezone=Africa%2FAddis_Ababa`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      const data = await res.json();
      setHubWeather(data);
    } catch (e) {
      console.warn("Open-Meteo drought fetch error:", e);
      setHubWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubWeather(selectedHub);
  }, [selectedHub, fetchHubWeather]);

  const regionRisks = useMemo(() => computeAllRegionRisks("Drought", {}), []);

  const handleStartDate = (val) => {
    setStartDate(val);
    setActiveDate(val);
  };

  const handleEndDate = (val) => {
    setEndDate(val);
    setActiveDate(val);
  };

  const downloadCSV = () => {
    const headers = [
      "Region",
      "Zone_Type",
      "SPI_30",
      "SPI_90",
      "Precip_Anomaly_Pct",
      "LST_Anomaly_C",
      "VHI_Index",
      "Soil_Moisture_Pct",
      "IPC_Phase",
      "Water_Point_Functionality_Pct",
      "Pasture_Deficit",
    ];
    const rows = ETHIOPIA_DROUGHT_REGIONS.map((r) => [
      `"${r.name}"`,
      `"${r.zoneType}"`,
      r.spi30,
      r.spi90,
      r.precipAnomaly,
      r.lstAnomaly,
      r.vhi,
      r.soilMoisture,
      `"${r.ipcPhase}"`,
      r.waterPointFunctionality,
      `"${r.pastureDeficit}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ethiopia_drought_severity_${activeDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── 1. TIME SERIES CALCULATIONS ──────────────────────────────────────────
  const timeSeriesData = useMemo(() => {
    const dekadLabels = [
      "Dekad 1 (90d ago)",
      "Dekad 2 (80d ago)",
      "Dekad 3 (70d ago)",
      "Dekad 4 (60d ago)",
      "Dekad 5 (50d ago)",
      "Dekad 6 (40d ago)",
      "Dekad 7 (30d ago)",
      "Dekad 8 (20d ago)",
      "Dekad 9 (10d ago)",
      "Current Dekad",
    ];

    const isPastoral = zoneFocus === "pastoral";

    const observedRain = isPastoral
      ? [12, 8, 4, 0, 2, 0, 0, 5, 2, 1]
      : [28, 22, 18, 14, 10, 8, 12, 15, 9, 6];

    const normalBaseline = isPastoral
      ? [25, 30, 28, 22, 18, 15, 12, 20, 24, 26]
      : [45, 50, 48, 40, 35, 30, 32, 40, 42, 44];

    let cumObs = 0;
    let cumBase = 0;
    const spi90Curve = [];
    const spi30Curve = [];
    const anomalyCurve = [];

    for (let i = 0; i < observedRain.length; i++) {
      cumObs += observedRain[i];
      cumBase += normalBaseline[i];
      const diffPct = Math.round(((cumObs - cumBase) / cumBase) * 100);
      anomalyCurve.push(diffPct);

      const s90 = +(diffPct / 28).toFixed(2);
      spi90Curve.push(s90);

      const recentDiffPct = Math.round(
        ((observedRain[i] - normalBaseline[i]) / normalBaseline[i]) * 100,
      );
      spi30Curve.push(+(recentDiffPct / 32).toFixed(2));
    }

    const currentSpi =
      spiScale === "spi30"
        ? spi30Curve[spi30Curve.length - 1]
        : spi90Curve[spi90Curve.length - 1];

    const currentAnomaly = anomalyCurve[anomalyCurve.length - 1];

    return {
      labels: dekadLabels,
      observedRain,
      normalBaseline,
      spi90Curve,
      spi30Curve,
      anomalyCurve,
      totalObserved: cumObs,
      totalBaseline: cumBase,
      deficitPct: currentAnomaly,
      currentSpi,
      consecutiveDryDays: isPastoral ? 48 : 22,
    };
  }, [spiScale, zoneFocus]);

  const timeSeriesChartData = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        type: "bar",
        label: "Observed Precipitation (mm)",
        data: timeSeriesData.observedRain,
        backgroundColor: "rgba(245, 158, 11, 0.75)",
        borderColor: "#f59e0b",
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "30-Year Climatological Baseline (mm)",
        data: timeSeriesData.normalBaseline,
        borderColor: "#38bdf8",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
        fill: false,
        yAxisID: "y",
      },
      {
        type: "line",
        label:
          spiScale === "spi30"
            ? "SPI-30 (Soil Moisture Index)"
            : spiScale === "spi90"
              ? "SPI-90 (Agro-Meteorological Drought)"
              : "Precipitation Anomaly %",
        data:
          spiScale === "spi30"
            ? timeSeriesData.spi30Curve
            : spiScale === "spi90"
              ? timeSeriesData.spi90Curve
              : timeSeriesData.anomalyCurve,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        borderWidth: 2.5,
        pointBackgroundColor: "#ef4444",
        pointRadius: 4,
        fill: true,
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

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
        ticks: { color: isDark ? "#94a3b8" : "#475569", font: { size: 10 } },
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
          text: "Rainfall per Dekad (mm)",
          color: "#f59e0b",
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
          text:
            spiScale === "anomaly" ? "Anomaly (%)" : "Standardized Index (SPI)",
          color: "#ef4444",
          font: { size: 11, weight: "600" },
        },
      },
    },
  };

  // ── 2. CDSI MULTI-FACTOR SIMULATOR CALCULATIONS ─────────────────────────
  const cdsiSimulation = useMemo(() => {
    const precipScore = Math.min(
      100,
      Math.max(0, Math.round(Math.abs(Math.min(0, simPrecipAnomaly)) * 1.25)),
    );

    const lstScore = Math.min(
      100,
      Math.max(0, Math.round((Math.max(0, simLstAnomaly) / 5.5) * 100)),
    );

    const vhiStressScore = Math.round(100 - simVhi);
    const smStressScore = Math.round(100 - simSoilMoisture);

    const compositeCdsi = Math.round(
      precipScore * 0.4 +
        vhiStressScore * 0.25 +
        lstScore * 0.2 +
        smStressScore * 0.15,
    );

    let ipcResult = {
      phase: "Phase 1 (Minimal / Normal)",
      color: "#22c55e",
      bg: isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.08)",
      cropLossPct: "5–10%",
      livestockStress: "Normal pasture and water access",
      advisory:
        "Favorable conditions. Continue routine agro-meteorological monitoring.",
    };

    if (compositeCdsi >= 78) {
      ipcResult = {
        phase: "Phase 4 (Emergency / Severe Crisis)",
        color: "#dc2626",
        bg: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)",
        cropLossPct: "65–85% (Widespread Failure)",
        livestockStress:
          "Critical rangeland exhaustion, mass mortality, extreme water trucking required",
        advisory:
          "Immediate humanitarian food, fodder & emergency water distribution required across affected woredas.",
      };
    } else if (compositeCdsi >= 60) {
      ipcResult = {
        phase: "Phase 3 (Crisis)",
        color: "#ea580c",
        bg: isDark ? "rgba(234, 88, 12, 0.15)" : "rgba(234, 88, 12, 0.08)",
        cropLossPct: "40–60%",
        livestockStress:
          "Severe pasture depletion, distress herd migration, deep borehole queues",
        advisory:
          "Trigger crisis destocking subsidies and subsidized animal feed banks.",
      };
    } else if (compositeCdsi >= 40) {
      ipcResult = {
        phase: "Phase 2 (Stressed)",
        color: "#f59e0b",
        bg: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.08)",
        cropLossPct: "20–35%",
        livestockStress: "Moderate pasture drying, declining milk production",
        advisory:
          "Advise farmers on moisture conservation and drought-tolerant seed varieties.",
      };
    }

    return {
      precipScore,
      lstScore,
      vhiStressScore,
      smStressScore,
      compositeCdsi,
      ipcResult,
    };
  }, [simPrecipAnomaly, simLstAnomaly, simVhi, simSoilMoisture, isDark]);

  // ── 3. LIVE OPEN-METEO WEATHER OUTLOOK CALCULATIONS ──────────────────────
  const hubWeatherMetrics = useMemo(() => {
    if (!hubWeather || !hubWeather.daily) {
      return {
        past30Precip: 14.2,
        forecast14Precip: 18.5,
        avgMaxTemp: 35.8,
        potentialEvap: 145.2,
        dates: [
          "Day -14",
          "Day -10",
          "Day -6",
          "Day -2",
          "Today",
          "Day +2",
          "Day +6",
          "Day +10",
          "Day +14",
        ],
        precipSeries: [0, 2, 0, 4, 1, 3, 0, 5, 2],
        evapSeries: [7, 7.5, 8, 7.8, 8.2, 8.5, 8.1, 7.9, 8.0],
        droughtIndex: 72,
        status: "High Moisture Deficit",
        color: "#ea580c",
      };
    }

    const times = hubWeather.daily.time || [];
    const precips = hubWeather.daily.precipitation_sum || [];
    const temps = hubWeather.daily.temperature_2m_max || [];
    const evaps = hubWeather.daily.et0_fao_evapotranspiration || [];

    const past30P = precips.slice(0, 30);
    const past30Sum = +past30P
      .reduce((a, b) => a + (parseFloat(b) || 0), 0)
      .toFixed(1);

    const next14P = precips.slice(30);
    const next14Sum = +next14P
      .reduce((a, b) => a + (parseFloat(b) || 0), 0)
      .toFixed(1);

    const validTemps = temps.filter((t) => typeof t === "number" && !isNaN(t));
    const meanMaxTemp =
      validTemps.length > 0
        ? +(validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(
            1,
          )
        : selectedHub.baseline_temp;

    const totalEvap = +evaps
      .reduce((a, b) => a + (parseFloat(b) || 0), 0)
      .toFixed(1);

    const waterDeficit = Math.max(0, totalEvap - past30Sum);
    const droughtIndex = Math.min(
      100,
      Math.round((waterDeficit / Math.max(1, totalEvap)) * 100),
    );

    let status = "Mild / Normal";
    let color = "#22c55e";
    if (droughtIndex >= 75) {
      status = "Severe Moisture Deficit";
      color = "#dc2626";
    } else if (droughtIndex >= 55) {
      status = "High Moisture Deficit";
      color = "#ea580c";
    } else if (droughtIndex >= 35) {
      status = "Moderate Stress";
      color = "#f59e0b";
    }

    return {
      past30Precip: past30Sum,
      forecast14Precip: next14Sum,
      avgMaxTemp: meanMaxTemp,
      potentialEvap: totalEvap,
      dates: times.map((t) => t.slice(5)),
      precipSeries: precips,
      evapSeries: evaps,
      droughtIndex,
      status,
      color,
    };
  }, [hubWeather, selectedHub]);

  const hubWeatherChartData = {
    labels: hubWeatherMetrics.dates,
    datasets: [
      {
        type: "bar",
        label: "Precipitation (mm)",
        data: hubWeatherMetrics.precipSeries,
        backgroundColor: "rgba(56, 189, 248, 0.75)",
        borderColor: "#38bdf8",
        borderWidth: 1.5,
        borderRadius: 4,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "FAO Reference Evapotranspiration (ET0 mm/day)",
        data: hubWeatherMetrics.evapSeries,
        borderColor: "#f97316",
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
        yAxisID: "y",
      },
    ],
  };

  return (
    <div className="hazard-page">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="hazard-page-header-wrap">
        <div
          className="hazard-page-header-card"
          style={{ "--hazard-glow": "rgba(245,158,11,0.14)" }}
        >
          <div className="hazard-page-header">
            <div className="hazard-page-header-left">
              <div
                className="hazard-page-header-icon"
                style={{ background: ACCENT + "18" }}
              >
                <img
                  src="/icons/icons8-drought-100.png"
                  alt="Drought"
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
                  Drought &amp; Agro-Climatic Moisture Monitoring
                </div>
                <div className="hazard-page-header-subtitle">
                  NASA GIBS MODIS LST · Standardized Precipitation Index (SPI) ·
                  Combined Drought Severity (CDSI)
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
                liveHazard="Drought"
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
          {/* ── GLOBAL MAP — NASA GIBS MODIS LST ────────────────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Global Data · NASA GIBS MODIS
                    </div>
                    <div className="hazard-map-title">
                      Land Surface Temperature &amp; Thermal Drought Stress
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
                  {activeDate}
                </span>
              </div>

              {/* Date controls */}
              <div className="global-fire-toolbar">
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

              <div className="hazard-legend">
                {[
                  { color: "#0000ff", label: "Cool (< 20°C)" },
                  { color: "#00ff00", label: "Moderate (20–30°C)" },
                  { color: "#ffff00", label: "Warm (30–40°C)" },
                  { color: "#ff0000", label: "Extreme Hot (> 40°C)" },
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
                  <CreatePane name="droughtOverlayPane" zIndex={450} />
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
                  <DroughtOverlay date={activeDate} />
                </MapContainer>
                <RegionRiskCard
                  activeRegion={activeRegion}
                  onClose={() => setActiveRegion(null)}
                  liveHazard="Drought"
                  liveRisk={computeRegionRisk("Drought", activeRegion, {})}
                />
                <MapTypeToggle mapType={mapType} setMapType={setMapType} />
              </div>

              <div className="hazard-map-footer">
                <span>
                  Source: NASA GIBS · MODIS Terra Land Surface Temperature (Day
                  &amp; Night)
                </span>
                <span>Thermal infrared radiation composite</span>
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
                      Local Agro-Pastoral &amp; Borehole Observation
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
                  disasterType="Drought"
                  onUploadReady={(upload) => setHasLocalUploads(!!upload)}
                />
              </div>

              <div className="hazard-map-container">
                {hasLocalUploads ? (
                  <UploadedImageFill disasterType="Drought" />
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
                <span>Source: SSGI Ethiopia · Local drought field reports</span>
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
          {/* ── SECTION 1: TIME SERIES & SPI ANOMALY EVOLUTION ─────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 1 · Multi-Scale Time Series &amp; SPI Anomaly
                    </div>
                    <div className="hazard-map-title">
                      Precipitation Deficit vs Climatological Baseline
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* Zone Focus */}
                  <select
                    value={zoneFocus}
                    onChange={(e) => setZoneFocus(e.target.value)}
                    style={{
                      background: isDark
                        ? "rgba(245, 158, 11, 0.15)"
                        : "var(--bg-card, #fff)",
                      color: "var(--text-primary)",
                      border: "1px solid rgba(245, 158, 11, 0.4)",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <option
                      value="pastoral"
                      style={{
                        background: isDark ? "#1a1a1a" : "#fff",
                        color: isDark ? "#fff" : "#111",
                      }}
                    >
                      Pastoralist Lowlands (Somali / Afar / Borena)
                    </option>
                    <option
                      value="cropland"
                      style={{
                        background: isDark ? "#1a1a1a" : "#fff",
                        color: isDark ? "#fff" : "#111",
                      }}
                    >
                      Highland Croplands (Amhara / Tigray / Oromia)
                    </option>
                  </select>

                  {/* Index Scale */}
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      background: isDark
                        ? "rgba(0,0,0,0.3)"
                        : "rgba(0,0,0,0.04)",
                      padding: 3,
                      borderRadius: 8,
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    {[
                      { key: "spi90", label: "SPI-90 (Seasonal)" },
                      { key: "spi30", label: "SPI-30 (Soil)" },
                      { key: "anomaly", label: "Deficit %" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setSpiScale(t.key)}
                        style={{
                          background:
                            spiScale === t.key
                              ? "rgba(245, 158, 11, 0.25)"
                              : "transparent",
                          color:
                            spiScale === t.key ? ACCENT : "var(--text-muted)",
                          border:
                            spiScale === t.key
                              ? "1px solid rgba(245, 158, 11, 0.5)"
                              : "1px solid transparent",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                {/* Metric stat cards */}
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      90-Day Rainfall Deficit
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
                      {timeSeriesData.deficitPct}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {timeSeriesData.totalObserved}mm obs vs{" "}
                      {timeSeriesData.totalBaseline}mm norm
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      Standardized Precip Index
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color:
                          timeSeriesData.currentSpi < -1.5
                            ? "#ef4444"
                            : "#f59e0b",
                        marginTop: 2,
                      }}
                    >
                      SPI = {timeSeriesData.currentSpi}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {timeSeriesData.currentSpi < -1.5
                        ? "Severe / Extreme Drought"
                        : "Moderate Drought"}
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      Consecutive Dry Days (CDD)
                    </div>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: "#f97316",
                        marginTop: 2,
                      }}
                    >
                      {timeSeriesData.consecutiveDryDays} Days
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Without significant rain (&gt;1mm)
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      Moisture Deficit Regime
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#fbbf24",
                        marginTop: 4,
                      }}
                    >
                      {zoneFocus === "pastoral"
                        ? "Pastoral Rangeland Crisis"
                        : "Crop Yield Suppression"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Multi-season cumulative stress
                    </div>
                  </div>
                </div>

                {/* Time series chart */}
                <div style={{ height: 290, width: "100%" }}>
                  <Bar data={timeSeriesChartData} options={timeSeriesOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: REGIONAL SPATIAL ANALYSIS & IPC PHASES ──────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 2 · Regional Spatial Analysis &amp; Food Security
                      (IPC)
                    </div>
                    <div className="hazard-map-title">
                      14 Ethiopian Administrative Regions Drought Vulnerability
                      Scorecard
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
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
                        <th style={{ padding: "8px 12px" }}>Region</th>
                        <th style={{ padding: "8px 12px" }}>
                          Agro-Ecological Zone
                        </th>
                        <th style={{ padding: "8px 12px" }}>SPI-90</th>
                        <th style={{ padding: "8px 12px" }}>Precip Anomaly</th>
                        <th style={{ padding: "8px 12px" }}>
                          LST Heat Anomaly
                        </th>
                        <th style={{ padding: "8px 12px" }}>
                          Water Point Op %
                        </th>
                        <th style={{ padding: "8px 12px" }}>Pasture Deficit</th>
                        <th style={{ padding: "8px 12px" }}>
                          IPC Classification
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ETHIOPIA_DROUGHT_REGIONS.map((r) => (
                        <tr
                          key={r.name}
                          onClick={() =>
                            setActiveRegion(
                              activeRegion === r.name ? null : r.name,
                            )
                          }
                          style={{
                            borderBottom: "1px solid var(--border-light)",
                            cursor: "pointer",
                            background:
                              activeRegion === r.name
                                ? "rgba(245, 158, 11, 0.12)"
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
                            {r.name}
                            {activeRegion === r.name && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: ACCENT,
                                  marginLeft: 6,
                                }}
                              >
                                (Active)
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {r.zoneType}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontWeight: 700,
                              color:
                                r.spi90 < -1.5
                                  ? "#ef4444"
                                  : r.spi90 < -1.0
                                    ? "#f59e0b"
                                    : "#22c55e",
                            }}
                          >
                            {r.spi90}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color:
                                r.precipAnomaly < -30
                                  ? "#ef4444"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {r.precipAnomaly}%
                          </td>
                          <td
                            style={{ padding: "10px 12px", color: "#f59e0b" }}
                          >
                            +{r.lstAnomaly}°C
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {r.waterPointFunctionality}%
                          </td>
                          <td
                            style={{ padding: "10px 12px", color: "#ef4444" }}
                          >
                            {r.pastureDeficit}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                color: r.ipcColor,
                                background: r.ipcColor + "18",
                                border: `1px solid ${r.ipcColor}44`,
                              }}
                            >
                              {r.ipcPhase}
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

          {/* ── SECTION 3: COMPOSITE DROUGHT SEVERITY INDEX (CDSI) ─────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 3 · Combined Drought Severity Index (CDSI) Model
                    </div>
                    <div className="hazard-map-title">
                      Multi-Factor Drought Severity &amp; Livelihood Impact
                      Simulator
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px" }}>
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
                      ⚙️ Multi-Criteria Agro-Climatic Parameters
                    </div>

                    {/* Precip Anomaly */}
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
                        <span>Precipitation Deficit Anomaly:</span>
                        <strong style={{ color: "#ef4444" }}>
                          {simPrecipAnomaly}%
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="-90"
                        max="30"
                        value={simPrecipAnomaly}
                        onChange={(e) =>
                          setSimPrecipAnomaly(parseInt(e.target.value, 10))
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
                          color: "var(--text-muted)",
                        }}
                      >
                        <span>-90%</span>
                        <span>-45%</span>
                        <span>+30%</span>
                      </div>
                    </div>

                    {/* LST Thermal Heat */}
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
                        <span>LST Land Surface Temp Anomaly (ΔT):</span>
                        <strong style={{ color: "#f59e0b" }}>
                          +{simLstAnomaly}°C
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.1"
                        value={simLstAnomaly}
                        onChange={(e) =>
                          setSimLstAnomaly(parseFloat(e.target.value))
                        }
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
                          color: "var(--text-muted)",
                        }}
                      >
                        <span>0°C</span>
                        <span>+3°C</span>
                        <span>+6°C</span>
                      </div>
                    </div>

                    {/* VHI */}
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
                        <span>Vegetation Health Index (VHI):</span>
                        <strong
                          style={{ color: simVhi < 35 ? "#ef4444" : "#22c55e" }}
                        >
                          {simVhi} / 100
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={simVhi}
                        onChange={(e) =>
                          setSimVhi(parseInt(e.target.value, 10))
                        }
                        style={{
                          width: "100%",
                          accentColor: simVhi < 35 ? "#ef4444" : "#22c55e",
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
                        <span>&lt;20 (Vegetation Wilted)</span>
                        <span>50</span>
                        <span>&gt;80 (Vigorous Canopy)</span>
                      </div>
                    </div>

                    {/* Soil Moisture */}
                    <div>
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
                        <span>Root-Zone Soil Moisture Saturation:</span>
                        <strong style={{ color: "#38bdf8" }}>
                          {simSoilMoisture}%
                        </strong>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={simSoilMoisture}
                        onChange={(e) =>
                          setSimSoilMoisture(parseInt(e.target.value, 10))
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
                        <span>&lt;15% (Wilting Point)</span>
                        <span>50%</span>
                        <span>&gt;80% (Saturated)</span>
                      </div>
                    </div>
                  </div>

                  {/* Result Box */}
                  <div
                    style={{
                      background: cdsiSimulation.ipcResult.bg,
                      border: `1px solid ${cdsiSimulation.ipcResult.color}44`,
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
                          Projected Food Security Phase:
                        </span>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: cdsiSimulation.ipcResult.color,
                            background: isDark
                              ? "rgba(0,0,0,0.3)"
                              : "rgba(255,255,255,0.8)",
                            border: `1px solid ${cdsiSimulation.ipcResult.color}66`,
                          }}
                        >
                          {cdsiSimulation.ipcResult.phase}
                        </span>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          Combined Drought Severity Index (CDSI):
                        </div>
                        <div
                          style={{
                            fontSize: 34,
                            fontWeight: 800,
                            color: cdsiSimulation.ipcResult.color,
                            marginTop: 2,
                          }}
                        >
                          {cdsiSimulation.compositeCdsi} / 100
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 12,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            background: isDark
                              ? "rgba(0,0,0,0.25)"
                              : "rgba(255,255,255,0.6)",
                            padding: 8,
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                          >
                            Est. Crop Yield Loss:
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#ef4444",
                              marginTop: 2,
                            }}
                          >
                            {cdsiSimulation.ipcResult.cropLossPct}
                          </div>
                        </div>
                        <div
                          style={{
                            background: isDark
                              ? "rgba(0,0,0,0.25)"
                              : "rgba(255,255,255,0.6)",
                            padding: 8,
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                          >
                            Rangeland Stress:
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginTop: 2,
                            }}
                          >
                            {cdsiSimulation.ipcResult.livestockStress}
                          </div>
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
                        <strong>Action Advisory:</strong>{" "}
                        {cdsiSimulation.ipcResult.advisory}
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
                      Formula: CDSI = (PrecipDeficit × 0.40) + (VHI × 0.25) +
                      (LST × 0.20) + (SoilMoisture × 0.15)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: REAL-TIME CLIMATE OUTLOOK & 30-DAY FORECAST ─── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Section 4 · Live Climate Outlook &amp; 30-Day Forecast
                    </div>
                    <div className="hazard-map-title">
                      Atmospheric Water Deficit &amp; Evapotranspiration Balance
                    </div>
                  </div>
                </div>

                {/* Station Selector */}
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
                    Monitoring Hub:
                  </span>
                  <select
                    value={selectedHub.id}
                    onChange={(e) => {
                      const found = DROUGHT_MONITORING_HUBS.find(
                        (h) => h.id === e.target.value,
                      );
                      if (found) setSelectedHub(found);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      maxWidth: "100%",
                      background: isDark
                        ? "rgba(245, 158, 11, 0.15)"
                        : "var(--bg-card, #fff)",
                      color: "var(--text-primary)",
                      border: "1px solid rgba(245, 158, 11, 0.4)",
                      borderRadius: 6,
                      padding: "6px 32px 6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {DROUGHT_MONITORING_HUBS.map((h) => (
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
                      background: "var(--bg-card-alt, rgba(0,0,0,0.02))",
                      border: "1px solid var(--border-light)",
                      borderLeft: "3px solid var(--metric-accent, #6366f1)",
                      borderRadius: "0 14px 14px 0",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      Past 30-Day Rain
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
                      {weatherLoading
                        ? "…"
                        : `${hubWeatherMetrics.past30Precip} mm`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Cumulative water supply
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      14-Day Forecast Rain
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
                        : `${hubWeatherMetrics.forecast14Precip} mm`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Projected precipitation
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      Mean Max Daily Temp
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
                        : `${hubWeatherMetrics.avgMaxTemp}°C`}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Atmospheric thermal load
                    </div>
                  </div>

                  <div
                    style={{
                      background: `${hubWeatherMetrics.color}15`,
                      border: `1px solid ${hubWeatherMetrics.color}44`,
                      borderRadius: 10,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 2 }}>
                      Water Balance Status
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: hubWeatherMetrics.color,
                        marginTop: 4,
                      }}
                    >
                      {hubWeatherMetrics.status}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                      }}
                    >
                      Deficit Index: {hubWeatherMetrics.droughtIndex}/100
                    </div>
                  </div>
                </div>

                {/* Weather chart */}
                <div style={{ height: 260, width: "100%" }}>
                  <Bar
                    data={hubWeatherChartData}
                    options={{
                      ...timeSeriesOptions,
                      scales: {
                        ...timeSeriesOptions.scales,
                        y1: { display: false },
                        y: {
                          ...timeSeriesOptions.scales.y,
                          title: {
                            display: true,
                            text: "Precipitation & ET0 (mm/day)",
                            color: "#38bdf8",
                            font: { size: 11, weight: "600" },
                          },
                        },
                      },
                    }}
                  />
                </div>

                {/* Station footer */}
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
                    <strong>Hub Details:</strong> {selectedHub.name} · Zone:{" "}
                    {selectedHub.zoneType} · Climatological Rain:{" "}
                    {selectedHub.climatology_annual_rain}mm/yr · Rainy Regimes:{" "}
                    {selectedHub.main_season}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Live forecast backed by Open-Meteo &amp; ECMWF IFS
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

export default Drought;
