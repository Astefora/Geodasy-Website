import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import "leaflet/dist/leaflet.css";
import "../styles/GlobalDataCard.css";
import "../styles/HazardPage.css";
import LocalDisasterData, {
  UploadedImageFill,
} from "../Componenet/LocalDisasterData";
import FitEthiopia from "../Componenet/FitEthiopia";
import {
  RegionSelector,
  RegionRiskCard,
  computeRegionRisk,
  computeAllRegionRisks,
  ETHIOPIA_REGIONS,
} from "../Componenet/RegionRiskPanel";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

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

const ACCENT = "#0284c7"; // Cyan/Blue flood theme

// ── Region Name Normalization Dictionary ─────────────────────────────────────
const REGION_NAME_MAP = {
  "addis ababa": "Addis Ababa",
  afar: "Afar",
  amhara: "Amhara",
  "beneshangul gumu": "Benishangul Gumz",
  "benishangul-gumuz": "Benishangul Gumz",
  "benishangul gumz": "Benishangul Gumz",
  "dire dawa": "Dire Dawa",
  gambela: "Gambela",
  gambella: "Gambela",
  hareri: "Harari",
  harari: "Harari",
  oromia: "Oromia",
  snnpr: "SNNP",
  snnp: "SNNP",
  "central ethiopia": "SNNP",
  sidama: "Sidama",
  somali: "Somali",
  "south west ethiopia": "South West Ethiopia",
  "south west ethiopia peoples": "South West Ethiopia",
  tigray: "Tigray",
};

function normalizeRegionName(rawName) {
  if (!rawName) return "";
  const key = rawName.trim().toLowerCase();
  return REGION_NAME_MAP[key] || rawName;
}

// Severity tier definition based on AER FloodScan SFED (Flood Fraction %) & Return Period
function getFloodSeverity(sfed, rp) {
  if (sfed >= 0.015 || rp === ">10") {
    return {
      tier: "Extreme",
      label: "Extreme Inundation (>10 yr event)",
      color: "#dc2626",
      bg: "rgba(220, 38, 38, 0.48)",
      border: "#b91c1c",
      weight: 2.2,
      opacity: 0.9,
    };
  }
  if (sfed >= 0.008 || rp === "5-10") {
    return {
      tier: "High",
      label: "High Flood (5–10 yr event)",
      color: "#f97316",
      bg: "rgba(249, 115, 22, 0.40)",
      border: "#ea580c",
      weight: 1.8,
      opacity: 0.85,
    };
  }
  if (sfed >= 0.002 || rp === "2-5") {
    return {
      tier: "Moderate",
      label: "Moderate Flood (2–5 yr event)",
      color: "#eab308",
      bg: "rgba(234, 179, 8, 0.32)",
      border: "#ca8a04",
      weight: 1.4,
      opacity: 0.8,
    };
  }
  if (sfed > 0) {
    return {
      tier: "Low",
      label: "Seasonal Baseline (1–1.5 yr)",
      color: "#0ea5e9",
      bg: "rgba(14, 165, 233, 0.22)",
      border: "#0284c7",
      weight: 1.1,
      opacity: 0.75,
    };
  }
  return {
    tier: "Minimal",
    label: "No Observed Inundation",
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.08)",
    border: "#94a3b8",
    weight: 0.8,
    opacity: 0.45,
  };
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

// ── AER FloodScan GeoJSON Layer with Automatic Color-Coding ──────────────────
function FloodScanGeoLayer({
  regionsGeo,
  regionStatsByName,
  activeRegion,
  onSelectRegion,
  selectedDate,
}) {
  const map = useMap();
  const isFirstRender = useRef(true);

  // Fly to region if selected
  useEffect(() => {
    if (!activeRegion || !map) return;
    try {
      if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
      const region = ETHIOPIA_REGIONS.find((r) => r.id === activeRegion);
      if (region) {
        map.flyTo([region.lat, region.lon], region.zoom, {
          animate: true,
          duration: 1.0,
        });
      }
    } catch (err) {}
  }, [activeRegion, map]);

  // When cleared, fit back to Ethiopia (skip on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (activeRegion === null && map) {
      let isMounted = true;
      const t = setTimeout(() => {
        if (!isMounted || !map) return;
        try {
          if (!map._loaded || !map.getPanes || !map.getPanes()?.mapPane) return;
          map.invalidateSize({ animate: false });
          map.fitBounds(
            [
              [3.0, 32.5],
              [15.2, 48.4],
            ],
            { padding: [10, 10], animate: false },
          );
        } catch (err) {}
      }, 50);

      return () => {
        isMounted = false;
        clearTimeout(t);
      };
    }
  }, [activeRegion, map]);

  if (!regionsGeo) return null;

  return (
    <GeoJSON
      key={`${selectedDate}-${activeRegion || "all"}`}
      data={regionsGeo}
      style={(feature) => {
        const rawName = feature.properties?.shapeName || "";
        const normName = normalizeRegionName(rawName);
        const stat = regionStatsByName[normName];
        const isSelected =
          activeRegion &&
          ETHIOPIA_REGIONS.find(
            (r) => r.id === activeRegion,
          )?.name.toLowerCase() === normName.toLowerCase();

        const sfed = stat ? stat.sfed : 0;
        const rp = stat ? stat.rp : "1-1.5";
        const sev = getFloodSeverity(sfed, rp);

        return {
          fillColor: sev.color,
          fillOpacity: isSelected ? 0.65 : sev.bg ? 0.38 : 0.08,
          color: isSelected ? "#ffffff" : sev.border,
          weight: isSelected ? 3.0 : sev.weight,
          dashArray: isSelected ? "4, 2" : undefined,
          opacity: isSelected ? 1.0 : sev.opacity,
        };
      }}
      onEachFeature={(feature, layer) => {
        const rawName = feature.properties?.shapeName || "";
        const normName = normalizeRegionName(rawName);
        const stat = regionStatsByName[normName];
        const regionObj = ETHIOPIA_REGIONS.find(
          (r) => r.name.toLowerCase() === normName.toLowerCase(),
        );

        const sfed = stat ? (stat.sfed * 100).toFixed(2) : "0.00";
        const baseline = stat ? (stat.baseline * 100).toFixed(2) : "0.00";
        const anomaly = stat ? (stat.anomaly * 100).toFixed(2) : "0.00";
        const rp = stat?.rp || "1-1.5";
        const sev = getFloodSeverity(stat?.sfed || 0, rp);

        layer.bindTooltip(
          `<div style="font-family:inherit; min-width: 170px; line-height: 1.45;">
            <div style="font-weight: 800; font-size: 13px; color: #111; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
              <span>📍 ${normName}</span>
              <span style="font-size: 10px; color: ${sev.color}; background: ${sev.color}15; padding: 1px 6px; border-radius: 4px; font-weight: 700;">${sev.tier}</span>
            </div>
            <div style="font-size: 11px; color: #333;"><strong>Flood Extent (SFED):</strong> <span style="color: ${sev.color}; font-weight: 700;">${sfed}%</span></div>
            <div style="font-size: 11px; color: #555;"><strong>10-Yr Baseline:</strong> ${baseline}%</div>
            <div style="font-size: 11px; color: #555;"><strong>Anomaly vs Baseline:</strong> <span style="font-weight: 700; color: ${stat?.anomaly > 0 ? "#dc2626" : "#059669"};">${stat?.anomaly > 0 ? "+" : ""}${anomaly}%</span></div>
            <div style="font-size: 10px; color: #666; margin-top: 4px; border-top: 1px dashed #ccc; padding-top: 3px;">
              Return Period: <strong>${rp} yrs</strong> · Valid: ${selectedDate}
            </div>
          </div>`,
          { sticky: true, opacity: 0.98 },
        );

        layer.on("click", () => {
          if (regionObj) {
            onSelectRegion(regionObj.id);
          }
        });
      }}
    />
  );
}

// ── Flood Component ──────────────────────────────────────────────────────────
function Flood() {
  const [floodScanData, setFloodScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsGeo, setRegionsGeo] = useState(null);
  const [hasLocalUploads, setHasLocalUploads] = useState(false);
  const [mapType, setMapType] = useState("default");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);

  // Load GeoJSON for Ethiopian regions
  useEffect(() => {
    fetch("/ethiopia-regions.geojson")
      .then((r) => r.json())
      .then(setRegionsGeo)
      .catch((err) =>
        console.warn("Failed to load ethiopia-regions.geojson", err),
      );
  }, []);

  // Fetch AER FloodScan dataset from backend proxy or static fallback
  useEffect(() => {
    let cancelled = false;
    const fetchFloodScan = async () => {
      setLoading(true);
      setError(null);
      try {
        let res = await fetch("/api/floodscan");
        if (!res.ok) {
          // fallback to public static json
          res = await fetch("/ethiopia-floodscan.json");
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setFloodScanData(data);
        if (data.dateRange?.end) {
          setSelectedDate(data.dateRange.end); // Default to latest day
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load FloodScan dataset:", err);
          setError("Failed to load AER FloodScan dataset. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFloodScan();
    return () => {
      cancelled = true;
    };
  }, []);

  // Check for local approved SSGI flood image uploads
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
    const id = setInterval(check, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Close date picker dropdown when clicked outside
  useEffect(() => {
    if (!showDatePicker) return;
    const handleOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showDatePicker]);

  // All distinct available observation dates in chronological order
  const availableDates = useMemo(() => {
    if (!floodScanData?.admin1?.length) return [];
    return [...new Set(floodScanData.admin1.map((r) => r.date))].sort();
  }, [floodScanData]);

  // Current day's Admin 1 (regional) flood records
  const currentDayRecords = useMemo(() => {
    if (!floodScanData?.admin1?.length || !selectedDate) return [];
    return floodScanData.admin1.filter((r) => r.date === selectedDate);
  }, [floodScanData, selectedDate]);

  // Current day's Admin 2 (woreda/zone) flood records
  const currentDayAdmin2 = useMemo(() => {
    if (!floodScanData?.admin2?.length || !selectedDate) return [];
    return floodScanData.admin2.filter((r) => r.date === selectedDate);
  }, [floodScanData, selectedDate]);

  // Map of region stats by normalized name for current selected day
  const regionStatsByName = useMemo(() => {
    const map = {};
    currentDayRecords.forEach((r) => {
      const norm = normalizeRegionName(r.adm1);
      if (!map[norm] || r.sfed > map[norm].sfed) {
        map[norm] = r;
      }
    });
    return map;
  }, [currentDayRecords]);

  // Live risk for all regions — passed to RegionSelector dropdown
  const regionRisks = useMemo(() => {
    return computeAllRegionRisks("Flood", {
      floodScanByRegion: regionStatsByName,
    });
  }, [regionStatsByName]);

  // National full season daily time series (89 days)
  const nationalTimeSeries = useMemo(() => {
    if (!floodScanData?.admin1?.length) return [];
    const dateMap = {};

    floodScanData.admin1.forEach((r) => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = {
          date: r.date,
          label: new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          totalSfed: 0,
          totalBaseline: 0,
          count: 0,
          maxSfed: 0,
          peakRegion: "",
        };
      }
      dateMap[r.date].totalSfed += r.sfed;
      dateMap[r.date].totalBaseline += r.baseline;
      dateMap[r.date].count += 1;
      if (r.sfed > dateMap[r.date].maxSfed) {
        dateMap[r.date].maxSfed = r.sfed;
        dateMap[r.date].peakRegion = r.adm1;
      }
    });

    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => {
        const avgSfed = +((d.totalSfed / Math.max(d.count, 1)) * 100).toFixed(
          3,
        );
        const avgBase = +(
          (d.totalBaseline / Math.max(d.count, 1)) *
          100
        ).toFixed(3);
        const anomaly = +(avgSfed - avgBase).toFixed(3);
        return {
          ...d,
          avgSfed,
          avgBase,
          anomaly,
          maxSfedPct: +(d.maxSfed * 100).toFixed(2),
        };
      });
  }, [floodScanData]);

  // Spatial breakdown by region on selected date
  const spatialData = useMemo(() => {
    return Object.entries(regionStatsByName)
      .map(([name, stat]) => {
        const sfedPct = +(stat.sfed * 100).toFixed(2);
        const basePct = +(stat.baseline * 100).toFixed(2);
        const anomalyPct = +(stat.anomaly * 100).toFixed(2);
        const sev = getFloodSeverity(stat.sfed, stat.rp);

        // Find primary woredas in this region from admin2
        const woredas = currentDayAdmin2
          .filter((w) => normalizeRegionName(w.adm1) === name && w.sfed > 0)
          .sort((a, b) => b.sfed - a.sfed)
          .map((w) => `${w.adm2} (${(w.sfed * 100).toFixed(2)}%)`)
          .slice(0, 3);

        return {
          name,
          sfed: stat.sfed,
          sfedPct,
          basePct,
          anomalyPct,
          rp: stat.rp,
          sev,
          woredas,
        };
      })
      .sort((a, b) => b.sfed - a.sfed);
  }, [regionStatsByName, currentDayAdmin2]);

  // Forecast / Recession Analysis (7-day MA and 3-day projection)
  const forecastData = useMemo(() => {
    if (!nationalTimeSeries.length) return null;
    const last7 = nationalTimeSeries.slice(-7);
    const n = last7.length;
    if (n < 2) return null;

    const xMean = (n - 1) / 2;
    const yMean = last7.reduce((s, d) => s + d.avgSfed, 0) / n;
    const slope =
      last7.reduce((s, d, i) => s + (i - xMean) * (d.avgSfed - yMean), 0) /
        last7.reduce((s, _, i) => s + (i - xMean) ** 2, 0) || 0;
    const intercept = yMean - slope * xMean;

    const lastDate = new Date(last7[last7.length - 1].date);
    const projection = [1, 2, 3].map((offset) => {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + offset);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const raw = intercept + slope * (n - 1 + offset);
      return {
        label,
        value: Math.max(0, +raw.toFixed(3)),
      };
    });

    const status =
      slope < -0.01
        ? {
            label: "Receding Flood Waters",
            color: "#059669",
            bg: "#05966918",
            desc: "Flood inundation is trending downward across monitored basins.",
          }
        : slope > 0.01
          ? {
              label: "Expanding Inundation",
              color: "#dc2626",
              bg: "#dc262618",
              desc: "Satellite flood fractions are increasing over recent days.",
            }
          : {
              label: "Stable / Cresting",
              color: "#eab308",
              bg: "#eab30818",
              desc: "Flood extents have stabilized near seasonal peaks.",
            };

    return { slope: +slope.toFixed(4), projection, status, last7 };
  }, [nationalTimeSeries]);

  // Overall Season Metrics
  const seasonStats = useMemo(() => {
    if (!nationalTimeSeries.length) return null;
    let peakDay = nationalTimeSeries[0];
    nationalTimeSeries.forEach((d) => {
      if (d.maxSfedPct > peakDay.maxSfedPct) peakDay = d;
    });

    const latest = nationalTimeSeries[nationalTimeSeries.length - 1];
    const totalFloodedRegions = spatialData.filter((r) => r.sfed > 0).length;

    return {
      peakDate: peakDay.date,
      peakSfedPct: peakDay.maxSfedPct,
      peakRegion: peakDay.peakRegion,
      latestAvgSfed: latest.avgSfed,
      totalFloodedRegions,
      totalDays: nationalTimeSeries.length,
    };
  }, [nationalTimeSeries, spatialData]);

  // CSV download function for active day data
  const handleDownloadCSV = () => {
    if (!currentDayRecords.length) return;
    const headers = [
      "Date",
      "Region",
      "PCode",
      "Flood_Fraction_SFED_Percent",
      "Historical_10yr_Baseline_Percent",
      "Flood_Anomaly_Percent",
      "Return_Period_Years",
    ];
    const rows = currentDayRecords.map((r) => [
      r.date,
      `"${r.adm1}"`,
      r.pcode,
      (r.sfed * 100).toFixed(4),
      (r.baseline * 100).toFixed(4),
      (r.anomaly * 100).toFixed(4),
      `"${r.rp}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FloodScan_Ethiopia_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Step backward / forward one day
  const stepDate = (delta) => {
    const curIdx = availableDates.indexOf(selectedDate);
    if (curIdx === -1) return;
    const nextIdx = Math.max(
      0,
      Math.min(availableDates.length - 1, curIdx + delta),
    );
    setSelectedDate(availableDates[nextIdx]);
  };

  return (
    <div className="hazard-page">
      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="hazard-page-header-wrap">
        <div
          className="hazard-page-header-card"
          style={{ "--hazard-glow": "rgba(2, 132, 199, 0.15)" }}
        >
          <div className="hazard-page-header">
            <div className="hazard-page-header-left">
              <div
                className="hazard-page-header-icon"
                style={{ background: "#0284c718" }}
              >
                <img
                  src="/icons/icons8-flood-64.png"
                  alt="Flood"
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
                  Flood Inundation Monitoring
                </div>
                <div className="hazard-page-header-subtitle">
                  AER FloodScan daily satellite flood fractions (0–100%) &amp;
                  10-year baseline anomalies (HDX)
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
                flexWrap: "nowrap",
              }}
            >
              <RegionSelector
                activeRegion={activeRegion}
                onSelect={setActiveRegion}
                liveHazard="Flood"
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
        {/* ── TOOLBAR: DATE NAVIGATION & PRESETS ──────────────────────── */}
        <div
          className="global-fire-toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
            padding: "10px 16px",
            background: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border-light)",
          }}
        >
          {/* Preset Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginRight: "4px",
              }}
            >
              Date Presets:
            </span>
            {[
              { label: "🛰️ Latest (Sep 17)", date: "2026-09-17" },
              { label: "🌊 Peak Flood (Sep 15)", date: "2026-09-15" },
              { label: "Aug 30", date: "2026-08-30" },
              { label: "Aug 15", date: "2026-08-15" },
              { label: "Jul 15", date: "2026-07-15" },
            ].map((p) => (
              <button
                key={p.date}
                onClick={() => setSelectedDate(p.date)}
                style={{
                  background:
                    selectedDate === p.date ? ACCENT : "rgba(255,255,255,0.06)",
                  color:
                    selectedDate === p.date ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${selectedDate === p.date ? ACCENT : "var(--border-light)"}`,
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Day Stepper & Custom Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => stepDate(-1)}
              disabled={availableDates.indexOf(selectedDate) <= 0}
              title="Previous Day"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-light)",
                borderRadius: "6px",
                padding: "5px 8px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FiChevronLeft size={14} />
            </button>

            {/* Date Select Dropdown */}
            <div style={{ position: "relative" }} ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${showDatePicker ? ACCENT : "var(--border-light)"}`,
                  borderRadius: "6px",
                  padding: "5px 12px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FiCalendar size={13} style={{ color: ACCENT }} />
                <span>Valid: {selectedDate || "Select Date"}</span>
              </button>

              {showDatePicker && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "6px",
                    background: "var(--bg-card, #1e293b)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                    zIndex: 1000,
                    maxHeight: "260px",
                    overflowY: "auto",
                    width: "180px",
                  }}
                >
                  {availableDates.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDate(d);
                        setShowDatePicker(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "7px 12px",
                        textAlign: "left",
                        background:
                          d === selectedDate ? ACCENT + "22" : "transparent",
                        color:
                          d === selectedDate ? ACCENT : "var(--text-primary)",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        fontSize: "12px",
                        fontWeight: d === selectedDate ? 700 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => stepDate(1)}
              disabled={
                availableDates.indexOf(selectedDate) >=
                availableDates.length - 1
              }
              title="Next Day"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-light)",
                borderRadius: "6px",
                padding: "5px 8px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FiChevronRight size={14} />
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownloadCSV}
              className="download-csv-btn flood-csv-btn"
              title="Download FloodScan tabular dataset for this date"
              data-flood-csv="true"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1.5px solid #0284c7",
                background: "#e0f2fe",
                color: "#0284c7",
                cursor: "pointer",
              }}
            >
              <FiDownload size={12} style={{ color: "#0284c7" }} />
              <span style={{ color: "#0284c7", fontWeight: 600 }}>CSV</span>
            </button>
          </div>
        </div>

        {/* ── MAPS ROW ─────────────────────────────────────────────────── */}
        <div className="hazard-maps-row">
          {/* ── GLOBAL / OBSERVATIONAL MAP ──────────────────────────────── */}
          <div className="hazard-section hazard-analysis-section">
            <div className="hazard-map-card">
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Global Satellite Observational Extent · AER FloodScan
                    </div>
                    <div className="hazard-map-title">
                      Flood Severity by Ethiopian Region
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
                    : `${currentDayRecords.length} regional zones · ${selectedDate}`}
                </span>
              </div>

              {loading && (
                <div className="hazard-status-text">
                  Loading AER FloodScan satellite observational records…
                </div>
              )}

              {error && (
                <div
                  className="hazard-status-text"
                  style={{ color: "#ef4444" }}
                >
                  {error}
                </div>
              )}

              {/* Severity Legend */}
              <div className="hazard-legend">
                {[
                  { color: "#dc2626", label: "Extreme (≥1.5% / >10yr RP)" },
                  { color: "#f97316", label: "High (0.8–1.5%)" },
                  { color: "#eab308", label: "Moderate (0.2–0.8%)" },
                  { color: "#0ea5e9", label: "Low / Baseline (<0.2%)" },
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

              <div
                className="hazard-status-text"
                style={{ padding: "4px 16px 6px", fontSize: "11px" }}
              >
                Hover over a region for SFED flood fraction, 10-year baseline
                anomaly, and return period · Click to zoom
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
                  <FloodScanGeoLayer
                    regionsGeo={regionsGeo}
                    regionStatsByName={regionStatsByName}
                    activeRegion={activeRegion}
                    onSelectRegion={setActiveRegion}
                    selectedDate={selectedDate}
                  />
                </MapContainer>
                <RegionRiskCard
                  activeRegion={activeRegion}
                  onClose={() => setActiveRegion(null)}
                  liveHazard="Flood"
                  liveRisk={computeRegionRisk("Flood", activeRegion, {
                    floodScanByRegion: regionStatsByName,
                  })}
                />
                <MapTypeToggle mapType={mapType} setMapType={setMapType} />
              </div>

              <div className="hazard-map-footer">
                <span>
                  Source: AER FloodScan (Atmospheric and Environmental Research)
                  · Published on HDX
                </span>
                <span>Date: {selectedDate} · SFED Daily Resolution</span>
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
                      Local Flood Data — Ethiopia
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
                  disasterType="Flood"
                  onUploadReady={(u) => setHasLocalUploads(!!u)}
                />
              </div>

              <div className="hazard-map-container">
                {hasLocalUploads ? (
                  <UploadedImageFill disasterType="Flood" />
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
                      <FloodScanGeoLayer
                        regionsGeo={regionsGeo}
                        regionStatsByName={regionStatsByName}
                        activeRegion={activeRegion}
                        onSelectRegion={setActiveRegion}
                        selectedDate={selectedDate}
                      />
                    </MapContainer>
                    <MapTypeToggle mapType={mapType} setMapType={setMapType} />
                  </>
                )}
              </div>

              <div className="hazard-map-footer">
                <span>Source: SSGI Ethiopia · Local flood observations</span>
                <span>
                  {hasLocalUploads ? "Uploaded data" : "Live base map"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: TIME SERIES (FULL SEASON 89 DAYS) ────────────── */}
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
                    Time Series · AER FloodScan Satellite Observations
                  </div>
                  <div className="hazard-map-title">
                    National Daily Flood Extent vs. 10-Year Historical Baseline
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
                89 Daily Observations · 2026 Season
              </span>
            </div>

            {/* Stat Pills */}
            {seasonStats && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "10px 20px 0",
                }}
              >
                {[
                  {
                    label: "Peak Inundation Day",
                    value: `${seasonStats.peakDate} (${seasonStats.peakRegion})`,
                    color: "#dc2626",
                  },
                  {
                    label: "Max Regional Flood Extent",
                    value: `${seasonStats.peakSfedPct}% of area`,
                    color: "#f97316",
                  },
                  {
                    label: "Active Inundated Regions",
                    value: `${seasonStats.totalFloodedRegions} of 13 regions`,
                    color: ACCENT,
                  },
                  {
                    label: "Current National Inundation",
                    value: `${seasonStats.latestAvgSfed}% avg`,
                    color: "#059669",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: color + "10",
                      border: `1.5px solid ${color}30`,
                      borderRadius: "12px",
                      padding: "10px 16px 11px",
                      minWidth: "120px",
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
                        fontSize: "19px",
                        fontWeight: 900,
                        color,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Line Chart */}
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
                    fontSize: "13px",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `2px solid ${ACCENT}`,
                      borderTopColor: "transparent",
                      display: "inline-block",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                  Aggregating FloodScan daily time series…
                </div>
              ) : nationalTimeSeries.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No time series records available
                </div>
              ) : (
                <Line
                  data={{
                    labels: nationalTimeSeries.map((d) => d.label),
                    datasets: [
                      {
                        label: "Observed Flood Extent (SFED %)",
                        data: nationalTimeSeries.map((d) => d.avgSfed),
                        borderColor: "#0284c7",
                        backgroundColor: "rgba(2, 132, 199, 0.12)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: nationalTimeSeries.map((d) =>
                          d.date === selectedDate ? 5 : 1,
                        ),
                        pointBackgroundColor: nationalTimeSeries.map((d) =>
                          d.date === selectedDate ? "#dc2626" : "#0284c7",
                        ),
                        borderWidth: 2,
                        yAxisID: "ySfed",
                      },
                      {
                        label: "10-Year Historical Baseline (%)",
                        data: nationalTimeSeries.map((d) => d.avgBase),
                        borderColor: "#f59e0b",
                        backgroundColor: "transparent",
                        fill: false,
                        tension: 0.35,
                        pointRadius: 0,
                        borderWidth: 1.8,
                        borderDash: [4, 4],
                        yAxisID: "ySfed",
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
                        backgroundColor: "rgba(15,23,42,0.94)",
                        titleColor: "#fff",
                        bodyColor: "#ccc",
                        borderColor: ACCENT,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                          title: (items) => {
                            const idx = items[0]?.dataIndex;
                            const d = nationalTimeSeries[idx];
                            return d ? `📅 ${d.date} (${d.label})` : "";
                          },
                          label: (item) => {
                            if (item.datasetIndex === 0)
                              return `  🌊 Observed Extent: ${item.raw}%`;
                            return `  📈 10-Yr Baseline: ${item.raw}%`;
                          },
                          afterBody: (items) => {
                            const idx = items[0]?.dataIndex;
                            const d = nationalTimeSeries[idx];
                            if (!d) return [];
                            return [
                              `  ⚡ Anomaly vs Normal: ${d.anomaly > 0 ? "+" : ""}${d.anomaly}%`,
                              `  📍 Peak Region: ${d.peakRegion} (${d.maxSfedPct}%)`,
                            ];
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
                      ySfed: {
                        type: "linear",
                        position: "left",
                        grid: { color: "rgba(255,255,255,0.06)" },
                        ticks: { color: ACCENT, font: { size: 10 } },
                        title: {
                          display: true,
                          text: "Inundation Extent (% of area)",
                          color: ACCENT,
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
                Standard Flood Extent Depiction (SFED) daily satellite fraction
                mapped against 10-year baseline
              </span>
              <span>
                Source: Atmospheric and Environmental Research (AER) · HDX
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SPATIAL ANALYSIS (BY ETHIOPIAN REGION) ───────── */}
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
                    Spatial Analysis · Regional Distribution
                  </div>
                  <div className="hazard-map-title">
                    Flood Extent &amp; Anomaly by Region — {selectedDate}
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
                {spatialData.filter((r) => r.sfed > 0).length} Regions Inundated
              </span>
            </div>

            {/* Horizontal Bar Chart */}
            <div
              style={{
                padding: "16px 20px 12px",
                height: `${Math.max(260, spatialData.length * 32 + 60)}px`,
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
                  Loading regional flood fractions…
                </div>
              ) : spatialData.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No regional data for this date
                </div>
              ) : (
                <Bar
                  data={{
                    labels: spatialData.map((r) => r.name),
                    datasets: [
                      {
                        label: "Observed Flood Extent (SFED %)",
                        data: spatialData.map((r) => r.sfedPct),
                        backgroundColor: spatialData.map((r) => r.sev.bg),
                        borderColor: spatialData.map((r) => r.sev.color),
                        borderWidth: 1.5,
                        borderRadius: 4,
                      },
                      {
                        label: "10-Yr Baseline (%)",
                        data: spatialData.map((r) => r.basePct),
                        backgroundColor: "rgba(245, 158, 11, 0.18)",
                        borderColor: "#f59e0b",
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
                        backgroundColor: "rgba(15,23,42,0.94)",
                        titleColor: "#fff",
                        bodyColor: "#ccc",
                        borderColor: ACCENT,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                          title: (items) => {
                            const idx = items[0]?.dataIndex;
                            const r = spatialData[idx];
                            return r ? `📍 ${r.name} · ${r.sev.tier} Risk` : "";
                          },
                          label: (item) => {
                            if (item.datasetIndex === 0)
                              return `  🌊 Observed Flood: ${item.raw}%`;
                            return `  📈 10-Yr Baseline: ${item.raw}%`;
                          },
                          afterBody: (items) => {
                            const idx = items[0]?.dataIndex;
                            const r = spatialData[idx];
                            if (!r) return [];
                            const lines = [
                              `  ⚡ Anomaly: ${r.anomalyPct > 0 ? "+" : ""}${r.anomalyPct}%`,
                              `  ⏳ Return Period: ${r.rp} years`,
                            ];
                            if (r.woredas.length > 0) {
                              lines.push(
                                `  🏘️ Top Woredas: ${r.woredas.join(", ")}`,
                              );
                            }
                            return lines;
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
                          text: "Flood Extent Fraction (% of region area)",
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
                Comparison of daily satellite flood extent (SFED %) vs 10-year
                historical baseline for each Ethiopian region
              </span>
              <span>Valid Date: {selectedDate}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: RISK ASSESSMENT (RETURN PERIOD & ANOMALY) ────── */}
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
                    Risk Assessment · Return Period &amp; 10-Year Anomaly
                  </div>
                  <div className="hazard-map-title">
                    Flood Severity &amp; Statistical Return Period (RP)
                    Classification
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
                {spatialData.filter((r) => r.rp === ">10").length} Historic
                (&gt;10 yr) ·{" "}
                {spatialData.filter((r) => r.rp === "5-10").length} High (5–10
                yr)
              </span>
            </div>

            {/* Scorecards Grid */}
            <div
              className="scorecard-grid"
              style={{
                padding: "12px 20px 16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "10px",
              }}
            >
              {spatialData.map((r) => (
                <div
                  key={r.name}
                  className="scorecard"
                  style={{
                    background: r.sev.color + "10",
                    border: `1px solid ${r.sev.color}33`,
                    borderRadius: "10px",
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>
                      {r.name}
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: r.sev.color,
                        background: r.sev.color + "18",
                        border: `1px solid ${r.sev.color}44`,
                        borderRadius: "20px",
                        padding: "2px 8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {r.sev.tier}
                    </span>
                  </div>

                  {/* Progress bar of inundation */}
                  <div
                    className="scorecard-bar"
                    style={{
                      height: "5px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (r.sfed / 0.03) * 100)}%`,
                        background: r.sev.color,
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "4px",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        padding: "4px 2px",
                        borderRadius: "4px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: r.sev.color }}>
                        {r.sfedPct}%
                      </div>
                      <div>Observed</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        padding: "4px 2px",
                        borderRadius: "4px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#f59e0b" }}>
                        {r.basePct}%
                      </div>
                      <div>10-Yr Normal</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        padding: "4px 2px",
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: r.anomalyPct > 0 ? "#dc2626" : "#059669",
                        }}
                      >
                        {r.anomalyPct > 0 ? "+" : ""}
                        {r.anomalyPct}%
                      </div>
                      <div>Anomaly</div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>
                      Return Period:{" "}
                      <strong style={{ color: r.sev.color }}>{r.rp} yr</strong>
                    </span>
                    {r.woredas.length > 0 && (
                      <span>Top: {r.woredas[0].split(" ")[0]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hazard-map-footer">
              <span>
                Return period categories: &gt;10 yr (Severe Inundation), 5–10 yr
                (High), 2–5 yr (Moderate), &lt;2 yr (Baseline)
              </span>
              <span>AER FloodScan 10-Year Historical Baseline Methodology</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: FORECAST / RECESSION OUTLOOK ─────────────────── */}
        {forecastData && (
          <div style={{ marginBottom: "24px" }}>
            <div className="hazard-map-card" style={{ overflow: "hidden" }}>
              <div className="hazard-map-header">
                <div className="hazard-map-header-left">
                  <div className="hazard-map-indicator global" />
                  <div className="hazard-map-title-group">
                    <div className="hazard-map-label">
                      Forecast &amp; Recession Analysis · 7-Day Trend
                    </div>
                    <div className="hazard-map-title">
                      Short-Term Flood Recession &amp; Inundation Outlook
                    </div>
                  </div>
                </div>
                <span
                  className="hazard-map-badge"
                  style={{
                    color: forecastData.status.color,
                    borderColor: forecastData.status.color + "44",
                    background: forecastData.status.bg,
                  }}
                >
                  {forecastData.status.label}
                </span>
              </div>

              {/* Stat Pills */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "10px 20px 0",
                }}
              >
                {[
                  {
                    label: "Current Trend",
                    value: forecastData.status.label,
                    color: forecastData.status.color,
                  },
                  {
                    label: "Rate of Change",
                    value: `${forecastData.slope > 0 ? "+" : ""}${forecastData.slope}% / day`,
                    color: forecastData.slope > 0 ? "#dc2626" : "#059669",
                  },
                  {
                    label: `Outlook Day +1 (${forecastData.projection[0].label})`,
                    value: `~${forecastData.projection[0].value}% national avg`,
                    color: ACCENT,
                  },
                  {
                    label: `Outlook Day +3 (${forecastData.projection[2].label})`,
                    value: `~${forecastData.projection[2].value}% national avg`,
                    color: ACCENT,
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: color + "10",
                      border: `1.5px solid ${color}30`,
                      borderRadius: "12px",
                      padding: "10px 16px 11px",
                      minWidth: "120px",
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
                        fontSize: "19px",
                        fontWeight: 900,
                        color,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: "14px 20px 10px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                }}
              >
                {forecastData.status.desc} Projected values represent a 3-day
                hydrological recession trend calibrated from recent daily
                satellite delta.
              </div>

              <div className="hazard-map-footer">
                <span>
                  Hydrological recession projection · Derived from recent 7-day
                  AER FloodScan satellite observations
                </span>
                <span>Statistical recession estimate</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Flood;
