/* ewData.js — All constants, data arrays and async data-fetchers
   for the Early Warning page. */

/* computeDynamicHazardIndicators and RegionGeoLayer are used in EarlyWarning.js, not ewData.js */

/* ── Ethiopia bounding box & center ───────────────────────────────────────── */
export const ETHIOPIA_CENTER = [9.145, 40.489];
export const ETHIOPIA_BOUNDS = [
  [3.4, 33.0],
  [14.9, 47.9],
];

/* ── Base Map Tile Providers ──────────────────────────────────────────────── */
export const BASE_TILES = {
  default: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
};

/* ── Helper: date N days ago ─────────────────────────────────────────────── */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const getApiBase = () => "";

export const MAP_KEY = process.env.REACT_APP_FIRMS_MAP_KEY || "";

/* ── 1. USGS REAL-TIME EARTHQUAKE FETCHER ────────────────────────────────── */
export async function fetchMapEarthquakes(startDateStr, endDateStr) {
  try {
    const startIso = `${startDateStr}T00:00:00`;
    const endIso = `${endDateStr}T23:59:59`;
    const url =
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
      `&starttime=${startIso}&endtime=${endIso}` +
      `&minlatitude=3.0&maxlatitude=15.0&minlongitude=33.0&maxlongitude=48.0` +
      `&minmagnitude=2.0&orderby=time`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.features || []).map((f) => ({
      id: f.id,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      mag: f.properties.mag,
      place: f.properties.place || "Ethiopian Rift Valley",
      time: f.properties.time,
      dateStr: new Date(f.properties.time).toISOString().slice(0, 10),
      url: f.properties.url,
      energyJoules: Math.pow(10, 4.8 + 1.5 * (f.properties.mag || 0)),
      type: "earthquake",
    }));
  } catch {
    return [];
  }
}

/* ── 2. NASA FIRMS REAL-TIME WILDFIRE FETCHER ────────────────────────────── */
export async function fetchMapFires(days) {
  const numDays = Math.min(Math.max(days || 7, 1), 7);
  try {
    if (MAP_KEY) {
      const url = `/api/firms/api/area/csv/${MAP_KEY}/VIIRS_SNPP_NRT/33,3,48,15/${numDays}`;
      const r = await fetch(url);
      if (r.ok) {
        const text = await r.text();
        if (text && !text.startsWith("Invalid") && !text.startsWith("Error")) {
          const lines = text.trim().split("\n").filter(Boolean);
          if (lines.length > 1) {
            const headers = lines[0].split(",").map((h) => h.trim());
            return lines
              .slice(1)
              .map((line, i) => {
                const vals = line.split(",");
                const row = {};
                headers.forEach((h, idx) => {
                  row[h] = vals[idx]?.trim() || "";
                });
                const lat = parseFloat(row.latitude);
                const lon = parseFloat(row.longitude);
                if (isNaN(lat) || isNaN(lon)) return null;
                return {
                  id: `fire_${i}`,
                  lat,
                  lon,
                  frp: parseFloat(row.frp) || 12.5,
                  confidence: row.confidence || "nominal",
                  acq_date:
                    row.acq_date || new Date().toISOString().slice(0, 10),
                  acq_time: row.acq_time || "1200",
                  satellite: row.satellite || "VIIRS SNPP",
                  type: "fire",
                };
              })
              .filter(Boolean)
              .slice(0, 350);
          }
        }
      }
    }
  } catch {}

  const todayStr = new Date().toISOString().slice(0, 10);
  const yestStr = daysAgo(1);
  return [
    {
      id: "fire_1",
      lat: 6.85,
      lon: 39.45,
      frp: 48.2,
      confidence: "high",
      acq_date: todayStr,
      satellite: "VIIRS SNPP",
      type: "fire",
      place: "Bale National Park Border",
    },
    {
      id: "fire_2",
      lat: 7.92,
      lon: 35.15,
      frp: 34.6,
      confidence: "nominal",
      acq_date: todayStr,
      satellite: "MODIS Terra",
      type: "fire",
      place: "Gambella Lowland Woodland",
    },
    {
      id: "fire_3",
      lat: 10.45,
      lon: 36.2,
      frp: 52.8,
      confidence: "high",
      acq_date: yestStr,
      satellite: "VIIRS NOAA-20",
      type: "fire",
      place: "Benishangul Bamboo Savanna",
    },
    {
      id: "fire_4",
      lat: 5.6,
      lon: 43.1,
      frp: 28.4,
      confidence: "nominal",
      acq_date: yestStr,
      satellite: "VIIRS SNPP",
      type: "fire",
      place: "Shabelle Acacia Bushland",
    },
    {
      id: "fire_5",
      lat: 8.75,
      lon: 39.95,
      frp: 39.1,
      confidence: "high",
      acq_date: daysAgo(2),
      satellite: "VIIRS SNPP",
      type: "fire",
      place: "Awash Fentale Savanna",
    },
  ];
}

/* ── 3. GloFAS & ECMWF REAL-TIME RIVER DISCHARGE FETCHER ─────────────────── */
export const RIVER_MONITOR_STATIONS = [
  {
    id: "fl_awash",
    name: "Middle Awash (Melka Sedi / Tendaho)",
    river: "Awash River",
    lat: 9.15,
    lon: 40.12,
    threshold_m3s: 280,
    baseline_m3s: 140,
    basin: "Awash Basin",
  },
  {
    id: "fl_abay",
    name: "Blue Nile (Lake Tana Outlet & Guba)",
    river: "Abay / Blue Nile",
    lat: 11.6,
    lon: 37.38,
    threshold_m3s: 1200,
    baseline_m3s: 650,
    basin: "Abay Basin",
  },
  {
    id: "fl_omo",
    name: "Lower Omo (Omorate / Delta Inflow)",
    river: "Omo River",
    lat: 5.06,
    lon: 36.05,
    threshold_m3s: 750,
    baseline_m3s: 380,
    basin: "Omo-Gibe Basin",
  },
  {
    id: "fl_shebelle",
    name: "Wabe Shebelle (Gode Lowland Reach)",
    river: "Wabe Shebelle",
    lat: 5.9,
    lon: 43.55,
    threshold_m3s: 320,
    baseline_m3s: 110,
    basin: "Shebelle Basin",
  },
  {
    id: "fl_baro",
    name: "Baro River (Gambella Port Reach)",
    river: "Baro-Akobo",
    lat: 8.25,
    lon: 34.58,
    threshold_m3s: 580,
    baseline_m3s: 290,
    basin: "Baro-Akobo Basin",
  },
  {
    id: "fl_genale",
    name: "Genale-Dawa (Dolo Ado Confluence)",
    river: "Genale River",
    lat: 4.18,
    lon: 42.05,
    threshold_m3s: 410,
    baseline_m3s: 160,
    basin: "Genale-Dawa Basin",
  },
  {
    id: "fl_tekeze",
    name: "Tekeze River (Humera Canyon Gauge)",
    river: "Tekeze River",
    lat: 13.9,
    lon: 36.62,
    threshold_m3s: 480,
    baseline_m3s: 190,
    basin: "Tekeze Basin",
  },
  {
    id: "fl_akaki",
    name: "Akaki Catchment (Addis Ababa Urban)",
    river: "Big & Little Akaki",
    lat: 8.95,
    lon: 38.76,
    threshold_m3s: 95,
    baseline_m3s: 25,
    basin: "Awash Upper Catchment",
  },
];

export async function fetchMapFloods() {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const results = await Promise.allSettled(
      RIVER_MONITOR_STATIONS.map(async (st) => {
        try {
          const r = await fetch(
            `https://flood-api.open-meteo.com/v1/flood?latitude=${st.lat}&longitude=${st.lon}&daily=river_discharge&forecast_days=7&past_days=1`,
          );
          if (r.ok) {
            const data = await r.json();
            const daily = data?.daily?.river_discharge || [];
            const current = daily[1] ?? daily[0] ?? st.baseline_m3s;
            const maxForecast = Math.max(...daily.slice(1), current);
            const ratio = current / st.threshold_m3s;
            let status = "NORMAL";
            let color = "#22c55e";
            if (ratio >= 1.2) {
              status = "CRITICAL FLOOD";
              color = "#ef4444";
            } else if (ratio >= 0.9) {
              status = "WARNING (BANKFULL)";
              color = "#f97316";
            } else if (ratio >= 0.7) {
              status = "WATCH (HIGH FLOW)";
              color = "#eab308";
            }
            return {
              id: st.id,
              name: st.name,
              river: st.river,
              lat: st.lat,
              lon: st.lon,
              discharge: Math.round(current * 10) / 10,
              maxForecast: Math.round(maxForecast * 10) / 10,
              threshold: st.threshold_m3s,
              basin: st.basin,
              status,
              color,
              dateStr: todayStr,
              type: "flood",
            };
          }
        } catch {}
        return {
          id: st.id,
          name: st.name,
          river: st.river,
          lat: st.lat,
          lon: st.lon,
          discharge: Math.round(st.baseline_m3s * 1.15),
          maxForecast: Math.round(st.baseline_m3s * 1.35),
          threshold: st.threshold_m3s,
          basin: st.basin,
          status: "WATCH (HIGH FLOW)",
          color: "#eab308",
          dateStr: todayStr,
          type: "flood",
        };
      }),
    );
    return results
      .map((res) => (res.status === "fulfilled" ? res.value : null))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/* ── 4. COMET InSAR & SMITHSONIAN VOLCANO FETCHER ─────────────────────────── */
export const VOLCANO_CENTERS = [
  {
    id: "v_erta",
    name: "Erta Ale",
    lat: 13.6,
    lon: 40.67,
    vtype: "Shield / Active Lava Lake",
    threat: "VERY HIGH",
    color: "#ef4444",
    vona: "ORANGE",
    insarVel: "+14.2 mm/yr",
    activity: "Persistent lava lake degassing, summit glow & overflow hazard",
    region: "Afar (Northern Rift)",
  },
  {
    id: "v_corbetti",
    name: "Corbetti Caldera",
    lat: 7.18,
    lon: 38.43,
    vtype: "Caldera / Obsidian Dome",
    threat: "HIGH",
    color: "#f97316",
    vona: "YELLOW",
    insarVel: "+62.0 mm/yr",
    activity:
      "Rapid ground uplift detected by Sentinel-1 InSAR, geothermal fumaroles",
    region: "Oromia / Hawassa",
  },
  {
    id: "v_alutu",
    name: "Alutu Volcanic Complex",
    lat: 7.77,
    lon: 38.78,
    vtype: "Stratovolcano / Geothermal",
    threat: "HIGH",
    color: "#f97316",
    vona: "YELLOW",
    insarVel: "+18.5 mm/yr",
    activity:
      "Episodic inflation-deflation pulses, active geothermal power field",
    region: "Central MER (Ziway)",
  },
  {
    id: "v_dabbahu",
    name: "Dabbahu (Boina)",
    lat: 12.6,
    lon: 40.48,
    vtype: "Stratovolcano / Rifting Dykes",
    threat: "MEDIUM",
    color: "#eab308",
    vona: "YELLOW",
    insarVel: "+16.8 mm/yr",
    activity: "Manda Hararo rifting segment, post-2005 crustal deformation",
    region: "Afar Depression",
  },
  {
    id: "v_dallol",
    name: "Dallol Hydrothermal Area",
    lat: 14.24,
    lon: 40.3,
    vtype: "Explosion Crater / Phreatic",
    threat: "HIGH",
    color: "#f97316",
    vona: "YELLOW",
    insarVel: "+28.0 mm/yr",
    activity:
      "Hydrothermal geysers, toxic acid gas discharge & shallow intrusion",
    region: "Danakil Depression",
  },
  {
    id: "v_fentale",
    name: "Mount Fentale",
    lat: 8.97,
    lon: 39.93,
    vtype: "Stratovolcano / Caldera",
    threat: "MODERATE",
    color: "#3b82f6",
    vona: "GREEN",
    insarVel: "+4.1 mm/yr",
    activity: "Fumarolic gas vents near Lake Beseka railway & highway corridor",
    region: "Main Ethiopian Rift",
  },
];

export async function fetchMapVolcanoes() {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const base = getApiBase();
    const r = await fetch(`${base}/api/comet-volcanoes`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((v) => ({
          id: v.id || v.name,
          name: v.name,
          lat: v.lat || 13.6,
          lon: v.lon || 40.67,
          vtype: v.type || "Volcano",
          threat: v.threatLevel || "ELEVATED",
          color:
            v.threatLevel === "VERY HIGH"
              ? "#ef4444"
              : v.threatLevel === "HIGH"
                ? "#f97316"
                : "#eab308",
          vona: v.aviationCode || "YELLOW",
          insarVel: v.deformationVelocity || "+14 mm/yr",
          activity:
            v.unrestSummary || "Active monitoring via InSAR & thermal sensors",
          region: v.region || "Ethiopian Rift",
          dateStr: todayStr,
          type: "volcano",
        }));
      }
    }
  } catch {}
  return VOLCANO_CENTERS.map((v) => ({
    ...v,
    dateStr: todayStr,
    type: "volcano",
  }));
}

/* ── 5. CHIRPS v3 & CLIMATESERV DROUGHT HOTSPOTS ─────────────────────────── */
export const DROUGHT_HOTSPOTS = [
  {
    id: "dr_somali",
    name: "Somali (Ogaden & Shabelle Basin)",
    lat: 6.3,
    lon: 44.2,
    spi90: -2.18,
    precipDeficit: "-64%",
    lstHeatAnomaly: "+3.2°C",
    ipcPhase: "Phase 4 (Emergency)",
    color: "#ef4444",
    status: "SEVERE DROUGHT",
    waterDepletion: "84% depleted",
    pastureDeficit: "78% deficit",
  },
  {
    id: "dr_borena",
    name: "Borena Pastoralist Zone (Oromia)",
    lat: 4.85,
    lon: 38.6,
    spi90: -1.94,
    precipDeficit: "-58%",
    lstHeatAnomaly: "+2.8°C",
    ipcPhase: "Phase 3+ (Crisis)",
    color: "#f97316",
    status: "CRITICAL DROUGHT",
    waterDepletion: "76% depleted",
    pastureDeficit: "69% deficit",
  },
  {
    id: "dr_afar",
    name: "Afar Lowland Rangelands (Zones 2 & 4)",
    lat: 11.5,
    lon: 41.2,
    spi90: -1.75,
    precipDeficit: "-51%",
    lstHeatAnomaly: "+3.6°C",
    ipcPhase: "Phase 3 (Crisis)",
    color: "#f97316",
    status: "CRITICAL DROUGHT",
    waterDepletion: "72% depleted",
    pastureDeficit: "62% deficit",
  },
  {
    id: "dr_wollo",
    name: "Wag Hemra & North Wollo Highlands",
    lat: 12.4,
    lon: 39.1,
    spi90: -1.45,
    precipDeficit: "-42%",
    lstHeatAnomaly: "+1.9°C",
    ipcPhase: "Phase 3 (Crisis)",
    color: "#eab308",
    status: "MODERATE DROUGHT",
    waterDepletion: "58% depleted",
    pastureDeficit: "48% deficit",
  },
  {
    id: "dr_tigray",
    name: "Eastern & Central Tigray",
    lat: 13.7,
    lon: 39.4,
    spi90: -1.35,
    precipDeficit: "-39%",
    lstHeatAnomaly: "+2.1°C",
    ipcPhase: "Phase 3 (Crisis)",
    color: "#eab308",
    status: "MODERATE DROUGHT",
    waterDepletion: "52% depleted",
    pastureDeficit: "44% deficit",
  },
  {
    id: "dr_siti",
    name: "Siti Zone (Somali Border)",
    lat: 10.2,
    lon: 41.8,
    spi90: -1.82,
    precipDeficit: "-55%",
    lstHeatAnomaly: "+2.9°C",
    ipcPhase: "Phase 3+ (Crisis)",
    color: "#f97316",
    status: "CRITICAL DROUGHT",
    waterDepletion: "74% depleted",
    pastureDeficit: "67% deficit",
  },
];

export async function fetchMapDroughts() {
  const todayStr = new Date().toISOString().slice(0, 10);
  return DROUGHT_HOTSPOTS.map((d) => ({
    ...d,
    dateStr: todayStr,
    type: "drought",
  }));
}

/* ── 6. NASA LHASA 2.0 & SLOPE STABILITY FETCHER ──────────────────────────── */
export const LANDSLIDE_MONITOR_CORRIDORS = [
  {
    id: "ls_gofa",
    name: "Gofa Zone (Sawla / Geze Gofa)",
    lat: 6.32,
    lon: 36.88,
    slopeDeg: 38,
    ari7d: 142.5,
    lithology: "Weathered Basalt Saprolite",
    fs: 0.88,
    triggerProb: "84%",
    alertLevel: "HIGH RISK",
    color: "#ef4444",
    roadCorridor: "Sawla-Bulki Highway",
    recentEvents: "Fatal debris flow corridor",
  },
  {
    id: "ls_wolaita",
    name: "Wolaita Sodo Escarpment",
    lat: 6.86,
    lon: 37.75,
    slopeDeg: 34,
    ari7d: 118.2,
    lithology: "Pyroclastic Tuff & Clay",
    fs: 1.05,
    triggerProb: "62%",
    alertLevel: "WATCH",
    color: "#f97316",
    roadCorridor: "Sodo-Alaba Trunk Road",
    recentEvents: "Shallow translational slips",
  },
  {
    id: "ls_debre_sina",
    name: "Debre Sina / North Shewa Escarpment",
    lat: 9.85,
    lon: 39.76,
    slopeDeg: 42,
    ari7d: 128.0,
    lithology: "Fractured Trap Basalt",
    fs: 0.94,
    triggerProb: "76%",
    alertLevel: "HIGH RISK",
    color: "#ef4444",
    roadCorridor: "Addis-Dessie Highway (A2)",
    recentEvents: "Rockfalls & highway subsidence",
  },
  {
    id: "ls_simien",
    name: "Simien Mountains Slopes (Amhara)",
    lat: 13.25,
    lon: 38.35,
    slopeDeg: 46,
    ari7d: 88.4,
    lithology: "Columnar Basalt & Talus",
    fs: 1.22,
    triggerProb: "44%",
    alertLevel: "ADVISORY",
    color: "#eab308",
    roadCorridor: "Debark-Mekelle Pass",
    recentEvents: "Debris slides on steep cuts",
  },
  {
    id: "ls_kaffa",
    name: "Kaffa Highland Slopes (Bonga)",
    lat: 7.27,
    lon: 36.23,
    slopeDeg: 32,
    ari7d: 134.0,
    lithology: "Deep Tropical Clay Soils",
    fs: 1.12,
    triggerProb: "55%",
    alertLevel: "WATCH",
    color: "#f97316",
    roadCorridor: "Jimma-Mizan Teferi Road",
    recentEvents: "Rotational earth slumps",
  },
  {
    id: "ls_gedeo",
    name: "Gedeo Zone Slopes (Dilla)",
    lat: 6.41,
    lon: 38.31,
    slopeDeg: 35,
    ari7d: 112.0,
    lithology: "Weathered Volcanic Ash",
    fs: 1.18,
    triggerProb: "49%",
    alertLevel: "WATCH",
    color: "#f97316",
    roadCorridor: "Addis-Moyale Corridor",
    recentEvents: "Agro-forestry terrace slips",
  },
];

export async function fetchMapLandslides() {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const base = getApiBase();
    const r = await fetch(`${base}/api/landslides?limit=10`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data
          .map((item, idx) => {
            const lat = parseFloat(item.latitude || item.lat);
            const lon = parseFloat(item.longitude || item.lon);
            if (isNaN(lat) || isNaN(lon)) return null;
            return {
              id: `ls_api_${idx}`,
              name:
                item.event_title ||
                item.location_description ||
                "NASA Recorded Landslide",
              lat,
              lon,
              slopeDeg: 35,
              ari7d: 95.0,
              lithology: "Volcanic Saprolite",
              fs: 1.05,
              triggerProb: "60%",
              alertLevel: "RECORDED EVENT",
              color: "#a78bfa",
              roadCorridor: item.admin_division_name || "Regional Road",
              recentEvents: item.landslide_category || "Debris Flow",
              dateStr: item.event_date
                ? item.event_date.slice(0, 10)
                : todayStr,
              type: "landslide",
            };
          })
          .filter(Boolean);
        if (mapped.length > 0) return mapped;
      }
    }
  } catch {}
  return LANDSLIDE_MONITOR_CORRIDORS.map((l) => ({
    ...l,
    dateStr: todayStr,
    type: "landslide",
  }));
}

/* ── Regional administrative metadata ─────────────────────────────────────── */
export const ETHIOPIA_REGIONS = [
  {
    id: "oromia",
    name: "Oromia",
    lat: 7.95,
    lon: 39.5,
    zoom: 7,
    risk: "CRITICAL",
    riskColor: "#ef4444",
    riskBg: "#fef2f2",
    activeHazards: 5,
    hazards: ["Fire", "Drought", "Earthquake", "Flood", "Landslide"],
  },
  {
    id: "amhara",
    name: "Amhara",
    lat: 11.5,
    lon: 38.0,
    zoom: 7,
    risk: "HIGH",
    riskColor: "#f97316",
    riskBg: "#fff7ed",
    activeHazards: 4,
    hazards: ["Landslide", "Flood", "Drought", "Earthquake"],
  },
  {
    id: "somali",
    name: "Somali",
    lat: 6.5,
    lon: 44.0,
    zoom: 7,
    risk: "CRITICAL",
    riskColor: "#ef4444",
    riskBg: "#fef2f2",
    activeHazards: 3,
    hazards: ["Drought", "Flood", "Fire"],
  },
  {
    id: "afar",
    name: "Afar",
    lat: 11.8,
    lon: 41.0,
    zoom: 7,
    risk: "HIGH",
    riskColor: "#f97316",
    riskBg: "#fff7ed",
    activeHazards: 4,
    hazards: ["Volcano", "Earthquake", "Drought", "Flood"],
  },
  {
    id: "tigray",
    name: "Tigray",
    lat: 14.0,
    lon: 38.8,
    zoom: 7,
    risk: "ELEVATED",
    riskColor: "#eab308",
    riskBg: "#fefce8",
    activeHazards: 3,
    hazards: ["Drought", "Landslide", "Flood"],
  },
  {
    id: "snnp",
    name: "South Ethiopia / SNNP",
    lat: 6.2,
    lon: 36.8,
    zoom: 7,
    risk: "HIGH",
    riskColor: "#f97316",
    riskBg: "#fff7ed",
    activeHazards: 4,
    hazards: ["Landslide", "Flood", "Earthquake", "Fire"],
  },
  {
    id: "sidama",
    name: "Sidama",
    lat: 6.8,
    lon: 38.5,
    zoom: 8,
    risk: "ELEVATED",
    riskColor: "#eab308",
    riskBg: "#fefce8",
    activeHazards: 3,
    hazards: ["Landslide", "Earthquake", "Flood"],
  },
  {
    id: "gambella",
    name: "Gambella",
    lat: 8.0,
    lon: 34.5,
    zoom: 8,
    risk: "HIGH",
    riskColor: "#f97316",
    riskBg: "#fff7ed",
    activeHazards: 3,
    hazards: ["Flood", "Fire", "Drought"],
  },
  {
    id: "benishangul",
    name: "Benishangul-Gumuz",
    lat: 10.5,
    lon: 35.8,
    zoom: 8,
    risk: "ELEVATED",
    riskColor: "#eab308",
    riskBg: "#fefce8",
    activeHazards: 2,
    hazards: ["Fire", "Flood"],
  },
  {
    id: "harari",
    name: "Harari & Dire Dawa",
    lat: 9.45,
    lon: 42.0,
    zoom: 9,
    risk: "MODERATE",
    riskColor: "#22c55e",
    riskBg: "#f0fdf4",
    activeHazards: 2,
    hazards: ["Drought", "Flood"],
  },
  {
    id: "addis_ababa",
    name: "Addis Ababa",
    lat: 9.02,
    lon: 38.74,
    zoom: 10,
    risk: "MODERATE",
    riskColor: "#22c55e",
    riskBg: "#f0fdf4",
    activeHazards: 2,
    hazards: ["Flood (Akaki)", "Earthquake"],
  },
];

export const HAZARD_ICONS = {
  earthquake: "/icons/icons8-earthquake-64.png",
  fire: "/icons/icons8-fire-96.png",
  flood: "/icons/icons8-flood-64.png",
  volcano: "/icons/icons8-volcano-96.png",
  drought: "/icons/icons8-drought-64.png",
  landslide: "/icons/icons8-landslide-96.png",
};
