import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ImageModal from "../Componenet/ImageModal";

// ── Tiny inline SVG icons (no emoji, consistent sizing) ────────────────────
const Ico = {
  calendar: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <rect
        x="1"
        y="2"
        width="12"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M1 6h12" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4 1v2M10 1v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  chart: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <path
        d="M1 11l3-4 3 2 3-5 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  pin: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <path
        d="M7 1a3.5 3.5 0 0 1 3.5 3.5C10.5 8 7 13 7 13S3.5 8 3.5 4.5A3.5 3.5 0 0 1 7 1z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="7" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  folder: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <path
        d="M1 3.5A1.5 1.5 0 0 1 2.5 2H5l1.5 2H12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2.5A1.5 1.5 0 0 1 1 10.5v-7z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  ),
  user: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M1 13c0-3.3 2.7-5 6-5s6 1.7 6 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  map: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <polygon
        points="1,2 5,4 9,2 13,4 13,12 9,10 5,12 1,10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M5 4v8M9 2v8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  sort: (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      style={{ width: 11, height: 11, flexShrink: 0 }}
    >
      <path
        d="M1 3h12M3 7h8M5 11h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  // Download format icons
  file: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      style={{ width: 18, height: 18, flexShrink: 0 }}
    >
      <rect
        x="3"
        y="1"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 7h6M7 11h6M7 15h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  braces: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      style={{ width: 18, height: 18, flexShrink: 0 }}
    >
      <path
        d="M7 3H5a2 2 0 0 0-2 2v3l-2 2 2 2v3a2 2 0 0 0 2 2h2M13 3h2a2 2 0 0 1 2 2v3l2 2-2 2v3a2 2 0 0 1-2 2h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  table: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      style={{ width: 18, height: 18, flexShrink: 0 }}
    >
      <rect
        x="2"
        y="2"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 7h16M2 12h16M8 7v10M13 7v10"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  ),
  globe: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      style={{ width: 18, height: 18, flexShrink: 0 }}
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 10h16M10 2c-2.5 2-4 5-4 8s1.5 6 4 8M10 2c2.5 2 4 5 4 8s-1.5 6-4 8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  excel: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      style={{ width: 18, height: 18, flexShrink: 0 }}
    >
      <rect
        x="3"
        y="1"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 5h8M6 9h8M6 13h8M6 17h4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M7 9l6 8M13 9l-6 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
};

// ── Helpers ────────────────────────────────────────────────────────────────
function getFileUrl(uploadPath) {
  if (!uploadPath) return "#";
  if (uploadPath.startsWith("http")) return uploadPath;
  const cleanPath = uploadPath.replace(/^\//, "");
  return `http://localhost:5002/${cleanPath}`;
}

const TOPICS = [
  {
    id: "Landslide",
    icon: "/icons/icons8-landslide-96.png",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.10)",
  },
  {
    id: "Volcano",
    icon: "/icons/icons8-volcano-96.png",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
  },
  {
    id: "Flood",
    icon: "/icons/icons8-flood-64.png",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.10)",
  },
  {
    id: "Earthquake",
    icon: "/icons/icons8-earthquake-64.png",
    color: "#eab308",
    bg: "rgba(234,179,8,0.10)",
  },
  {
    id: "Fire",
    icon: "/icons/icons8-fire-96.png",
    color: "#f97316",
    bg: "rgba(249,115,22,0.10)",
  },
  {
    id: "Drought",
    icon: "/icons/icons8-drought-64.png",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
  },
];

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function getFormatLabel(upload) {
  const ft = upload.fileType || "";
  const fn = (upload.fileName || "").toLowerCase();
  if (ft.includes("pdf")) return "PDF";
  if (ft.startsWith("image/")) return "Image";
  if (fn.endsWith(".geojson") || fn.endsWith(".json")) return "GeoJSON";
  if (fn.endsWith(".csv")) return "CSV";
  if (fn.endsWith(".xlsx") || fn.endsWith(".xls")) return "Excel";
  if (fn.endsWith(".shp")) return "Shapefile";
  if (fn.endsWith(".kml") || fn.endsWith(".kmz")) return "KML";
  if (fn.endsWith(".tif") || fn.endsWith(".tiff")) return "GeoTIFF";
  if (ft.includes("msword") || ft.includes("vnd.open")) return "Document";
  if (upload.uploadType === "link") return "Link";
  if (upload.uploadType === "text") return "Text";
  return "File";
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Derive a rough "region" from upload metadata (title / description)
const ETHIOPIA_REGIONS = [
  "Oromia",
  "Amhara",
  "Tigray",
  "SNNPR",
  "Afar",
  "Somali",
  "Benishangul",
  "Gambella",
  "Harari",
  "Dire Dawa",
  "Addis Ababa",
];
function inferRegion(upload) {
  // Prefer the stored region field (set on upload)
  if (upload.region && upload.region !== "Ethiopia") return upload.region;
  // Fall back to text scan
  const text = `${upload.title || ""} ${upload.description || ""}`;
  for (const r of ETHIOPIA_REGIONS) {
    if (text.toLowerCase().includes(r.toLowerCase())) return r;
  }
  return upload.region || "Ethiopia";
}

// Derive year range from date field
function inferDateRange(upload) {
  if (!upload.date) return null;
  const yr = new Date(upload.date).getFullYear();
  return `${yr}`;
}

// Pill component for metadata badges
function MetaPill({ icon, label, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        background: color
          ? color + "14"
          : "var(--bg-card-alt,rgba(128,128,128,0.08))",
        border: `1px solid ${color ? color + "30" : "var(--border-light)"}`,
        color: color || "var(--text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {icon && (
        <span style={{ display: "flex", alignItems: "center", opacity: 0.75 }}>
          {icon}
        </span>
      )}
      {label}
    </span>
  );
}

// ── Ethiopian regions + zones ──────────────────────────────────────────────
const REGION_ZONES = {
  Ethiopia: [],
  Oromia: [
    "West Hararghe",
    "East Hararghe",
    "West Welega",
    "East Welega",
    "Jimma",
    "Bale",
    "Borena",
    "Guji",
    "West Guji",
    "Ilu Aba Bora",
    "Kelam Welega",
    "Horo Guduru",
    "North Shewa",
    "East Shewa",
    "West Arsi",
    "Arsi",
    "South West Shewa",
    "Gedeo",
  ],
  Amhara: [
    "North Gondar",
    "South Gondar",
    "North Wollo",
    "South Wollo",
    "East Gojjam",
    "West Gojjam",
    "Awi",
    "Wag Hemra",
    "North Shewa (AM)",
    "Oromia (AM)",
  ],
  Tigray: [
    "Central",
    "Eastern",
    "North Western",
    "Southern",
    "Western",
    "Mekelle",
  ],
  SNNPR: [
    "Sidama",
    "Wolaita",
    "Hadiya",
    "Kambata",
    "Bench Sheko",
    "Dawro",
    "Gamo",
    "Gofa",
  ],
  Afar: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"],
  Somali: ["Shinile", "Jijiga", "Fik", "Korahe", "Gode", "Liben", "Afder"],
  Benishangul: ["Metekel", "Assosa", "Kamashi", "Mao-Komo"],
  Gambella: ["Agnuak", "Majang", "Nuer"],
  Harari: ["Harar"],
  "Dire Dawa": ["Dire Dawa"],
  "Addis Ababa": ["Addis Ababa"],
};

const FORMAT_OPTIONS = [
  "All",
  "GeoJSON",
  "CSV",
  "Excel",
  "Shapefile",
  "GeoTIFF",
  "KML",
  "PDF",
  "Image",
  "Document",
  "Link",
  "Text",
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title_az", label: "Title A→Z" },
  { value: "title_za", label: "Title Z→A" },
  { value: "size_desc", label: "Largest First" },
];

// ── Filter panel ───────────────────────────────────────────────────────────
function FilterPanel({
  filters,
  onChange,
  accentColor,
  uploads,
  topic,
  selectedTopic,
  onTopicChange,
}) {
  // Derive unique researchers from current topic uploads
  const researchers = useMemo(() => {
    const seen = new Set();
    uploads.forEach((u) => {
      if (u.uploadedBy) seen.add(u.uploadedBy);
    });
    return ["All", ...Array.from(seen).sort()];
  }, [uploads]);

  const years = useMemo(() => {
    const ys = new Set();
    uploads.forEach((u) => {
      if (u.date) ys.add(new Date(u.date).getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [uploads]);

  const zones = REGION_ZONES[filters.region] || [];

  const selectStyle = (active) => ({
    padding: "7px 10px",
    borderRadius: "9px",
    border: `1px solid ${active ? accentColor + "66" : "var(--border-light)"}`,
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: "12px",
    outline: "none",
    cursor: "pointer",
    width: "100%",
    boxShadow: active ? `0 0 0 3px ${accentColor}14` : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  const labelStyle = {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "5px",
    display: "block",
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid var(--border-light)`,
        borderRadius: "14px",
        padding: "18px 20px",
        marginBottom: "16px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "14px",
      }}
    >
      {/* Region */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            {Ico.pin} Region
          </span>
        </label>
        <select
          value={filters.region}
          onChange={(e) => onChange({ region: e.target.value, zone: "All" })}
          style={selectStyle(filters.region !== "Ethiopia")}
        >
          {Object.keys(REGION_ZONES).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Zone — only shown when region with zones is selected */}
      {zones.length > 0 && (
        <div>
          <label style={labelStyle}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                verticalAlign: "middle",
              }}
            >
              {Ico.map} Zone
            </span>
          </label>
          <select
            value={filters.zone}
            onChange={(e) => onChange({ zone: e.target.value })}
            style={selectStyle(filters.zone !== "All")}
          >
            <option value="All">All Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Format */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            {Ico.folder} Data Type
          </span>
        </label>
        <select
          value={filters.format}
          onChange={(e) => onChange({ format: e.target.value })}
          style={selectStyle(filters.format !== "All")}
        >
          {FORMAT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Date From */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            {Ico.calendar} Year From
          </span>
        </label>
        <select
          value={filters.yearFrom}
          onChange={(e) => onChange({ yearFrom: e.target.value })}
          style={selectStyle(!!filters.yearFrom)}
        >
          <option value="">Any</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Date To */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            {Ico.calendar} Year To
          </span>
        </label>
        <select
          value={filters.yearTo}
          onChange={(e) => onChange({ yearTo: e.target.value })}
          style={selectStyle(!!filters.yearTo)}
        >
          <option value="">Any</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Researcher */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            {Ico.user} Researcher
          </span>
        </label>
        <select
          value={filters.researcher}
          onChange={(e) => onChange({ researcher: e.target.value })}
          style={selectStyle(filters.researcher !== "All")}
        >
          {researchers.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Hazard Domain */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              style={{ width: 11, height: 11, flexShrink: 0 }}
            >
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M7 4v3l2 1.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            Hazard Domain
          </span>
        </label>
        <select
          value={selectedTopic || ""}
          onChange={(e) => onTopicChange(e.target.value || null)}
          style={selectStyle(!!selectedTopic)}
        >
          <option value="">All Domains</option>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label style={labelStyle}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              verticalAlign: "middle",
            }}
          >
            {Ico.sort} Sort By
          </span>
        </label>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          style={selectStyle(filters.sort !== "newest")}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function uploadMatchesTopic(upload, topic) {
  if (upload.hazardType)
    return upload.hazardType.toLowerCase() === topic.toLowerCase();
  const text =
    `${upload.title || ""} ${upload.description || ""}`.toLowerCase();
  return text.includes(topic.toLowerCase());
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── API Endpoint Row (used in the API Access section) ──────────────────────
function ApiEndpointRow({ method, path, desc, params, example }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(example).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
      }}
    >
      {/* Method + path bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          background: "rgba(99,102,241,0.05)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "5px",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            background: "#10b981",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {method}
        </span>
        <code
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#6366f1",
            fontFamily: "monospace",
            flex: 1,
          }}
        >
          {path}
        </code>
      </div>

      {/* Description + params */}
      <div style={{ padding: "12px 14px" }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {desc}
        </p>
        {params.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            {params.map((p) => (
              <code
                key={p}
                style={{
                  fontSize: "11px",
                  padding: "2px 7px",
                  borderRadius: "5px",
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.18)",
                  color: "#6366f1",
                  fontFamily: "monospace",
                }}
              >
                ?{p}
              </code>
            ))}
          </div>
        )}

        {/* Example with copy button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid var(--border-light)",
          }}
        >
          <code
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: "11px",
              fontFamily: "monospace",
              color: "var(--text-muted)",
              background: "var(--bg-card-alt,rgba(128,128,128,0.04))",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {example}
          </code>
          <button
            onClick={handleCopy}
            style={{
              padding: "7px 11px",
              border: "none",
              borderLeft: "1px solid var(--border-light)",
              cursor: "pointer",
              background: copied ? "#10b981" : "var(--bg-card)",
              color: copied ? "#fff" : "var(--text-muted)",
              fontSize: "11px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "background 0.2s, color 0.2s",
              flexShrink: 0,
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Download Modal ─────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5002";
const DOWNLOAD_FORMATS = [
  {
    key: "original",
    label: "Original File",
    icon: Ico.file,
    desc: "As uploaded",
  },
  { key: "json", label: "JSON", icon: Ico.braces, desc: "Metadata as JSON" },
  { key: "csv", label: "CSV", icon: Ico.table, desc: "Spreadsheet-ready" },
  {
    key: "geojson",
    label: "GeoJSON",
    icon: Ico.globe,
    desc: "Geographic format",
  },
  { key: "xlsx", label: "Excel", icon: Ico.excel, desc: "Microsoft Excel" },
];

function DownloadModal({ upload, accentColor, onClose }) {
  const downloadUrl = (fmt) =>
    `${API_BASE}/api/datasets/${upload._id}/download?format=${fmt}`;

  // Determine which formats make sense for this upload
  const nativeFormat = getFormatLabel(upload); // e.g. "GeoJSON", "CSV", "PDF", "Image"
  const isFileUpload = upload.uploadType === "file";

  // Conversion formats (JSON/CSV/GeoJSON/XLSX) are metadata-only exports —
  // they always make sense as they export the dataset's metadata record.
  // "original" only makes sense for real file uploads.
  // We hide a conversion format if the file IS already that format natively
  // (e.g. if the file is a GeoJSON, the GeoJSON tile would just re-download
  // the same file — use "original" for that instead).
  const nativeToKey = {
    GeoJSON: "geojson",
    CSV: "csv",
    Excel: "xlsx",
    JSON: "json",
  };
  const nativeKey = nativeToKey[nativeFormat]; // undefined if not a direct match

  const formats = DOWNLOAD_FORMATS.filter((f) => {
    if (f.key === "original") return isFileUpload; // only for real files
    if (f.key === nativeKey) return false; // skip if already that format
    return true;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--bg-card)",
          borderRadius: "18px",
          border: "1px solid var(--border-light)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header stripe */}
        <div
          style={{ height: "3px", background: accentColor, flexShrink: 0 }}
        />

        {/* Fixed header — never scrolls */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--border-light)",
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "var(--bg-card)",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accentColor,
              }}
            >
              Download Dataset
            </p>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.3,
              }}
            >
              {upload.title || "Dataset"}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              marginLeft: "12px",
            }}
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              style={{ width: 14, height: 14 }}
            >
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
          {/* Download format grid */}
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Choose Format
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "22px",
            }}
          >
            {formats.map((fmt) => (
              <a
                key={fmt.key}
                href={downloadUrl(fmt.key)}
                download
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "11px 12px",
                  borderRadius: "11px",
                  border: `1px solid ${accentColor}28`,
                  background: accentColor + "0c",
                  textDecoration: "none",
                  transition:
                    "background 0.15s, border-color 0.15s, transform 0.15s",
                  minWidth: 0,
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor + "1e";
                  e.currentTarget.style.borderColor = accentColor + "55";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = accentColor + "0c";
                  e.currentTarget.style.borderColor = accentColor + "28";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    background: accentColor + "14",
                    flexShrink: 0,
                    color: accentColor,
                  }}
                >
                  {fmt.icon}
                </span>
                <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: accentColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {fmt.label}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginTop: "1px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {fmt.desc}
                  </div>
                </div>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    width: 13,
                    height: 13,
                    marginLeft: "auto",
                    flexShrink: 0,
                    color: accentColor,
                  }}
                >
                  <path
                    d="M8 2v8M5 7l3 3 3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            ))}
          </div>

          {/* ── Full API Access docs ─────────────────────────────── */}
          <div
            style={{
              borderTop: "1px solid var(--border-light)",
              paddingTop: "18px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "7px" }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "7px",
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ width: 12, height: 12, color: "#6366f1" }}
                  >
                    <path
                      d="M4 6l-3 2 3 2M12 6l3 2-3 2M9 3l-2 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                >
                  API Access
                </span>
              </div>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: "#10b981",
                }}
              >
                Public · No Auth
              </span>
            </div>

            {/* Endpoint 1 — list */}
            <ApiEndpointRow
              method="GET"
              path="/api/datasets"
              desc={`List all approved ${upload.hazardType} datasets.`}
              params={["hazardType", "researcher", "yearFrom", "yearTo"]}
              example={`${API_BASE}/api/datasets?hazardType=${upload.hazardType || ""}`}
            />

            <div style={{ height: "10px" }} />

            {/* Endpoint 2 — download */}
            <ApiEndpointRow
              method="GET"
              path="/api/datasets/:id/download"
              desc="Download this dataset in your chosen format."
              params={["format: json | csv | geojson | xlsx | original"]}
              example={`${API_BASE}/api/datasets/${upload._id}/download?format=json`}
            />

            <div style={{ height: "12px" }} />

            {/* Response example */}
            <div
              style={{
                borderRadius: "9px",
                border: "1px solid var(--border-light)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "6px 12px",
                  background: "rgba(99,102,241,0.07)",
                  borderBottom: "1px solid var(--border-light)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#6366f1",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Example Response
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "12px 14px",
                  fontSize: "10px",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  background: "var(--bg-card-alt,rgba(128,128,128,0.04))",
                  overflow: "auto",
                  maxHeight: "140px",
                  fontFamily:
                    "'Fira Code','Cascadia Code','Consolas',monospace",
                }}
              >{`[
  {
    "id": "${upload._id}",
    "title": ${JSON.stringify(upload.title || "")},
    "hazardType": ${JSON.stringify(upload.hazardType || "")},
    "fileName": ${JSON.stringify(upload.fileName || "")},
    "uploadedBy": ${JSON.stringify(upload.uploadedBy || "")},
    "date": "${upload.date ? new Date(upload.date).toISOString() : ""}",
    "downloadUrl": "${API_BASE}/uploads/..."
  }
]`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dataset Card ───────────────────────────────────────────────────────────
function UploadCard({ upload, onImageClick, accentColor, topic, onDownload }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // When page shows "All" (no topic selected), resolve the topic from the upload's hazardType
  const resolvedTopic =
    topic ||
    TOPICS.find(
      (t) => t.id.toLowerCase() === (upload.hazardType || "").toLowerCase(),
    ) ||
    null;
  const cardAccent = resolvedTopic?.color || accentColor;

  const format = getFormatLabel(upload);
  const region = inferRegion(upload);
  const dateRange = inferDateRange(upload);
  const sizeLabel = formatFileSize(upload.size);
  const fileUrl =
    upload.uploadType === "file" ? getFileUrl(upload.path) : upload.content;
  const isImg =
    upload.uploadType === "file"
      ? upload.fileType?.startsWith("image/")
      : isImageUrl(upload.content || "");

  // Format badge colour by type
  const formatColor =
    {
      GeoJSON: "#10b981",
      CSV: "#3b82f6",
      Excel: "#22c55e",
      PDF: "#ef4444",
      Image: "#8b5cf6",
      Shapefile: "#f59e0b",
      GeoTIFF: "#06b6d4",
      KML: "#f97316",
      Link: "#6366f1",
    }[format] || "var(--text-muted)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="research-data-card"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hovered ? cardAccent + "55" : "var(--border-light)"}`,
        borderRadius: "18px",
        overflow: "hidden",
        transition: "border-color 0.22s, box-shadow 0.22s, transform 0.22s",
        boxShadow: hovered
          ? `0 10px 40px ${cardAccent}18, 0 2px 10px rgba(0,0,0,0.08)`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Accent stripe */}
      <div style={{ height: "3px", background: cardAccent, flexShrink: 0 }} />

      {/* ── Card body */}
      <div style={{ padding: "18px 20px 0", flex: 1 }}>
        {/* Topic badge + format badge row */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 9px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              background: cardAccent + "18",
              border: `1px solid ${cardAccent}33`,
              color: cardAccent,
            }}
          >
            {topic?.icon ? (
              <img
                src={resolvedTopic?.icon}
                alt={resolvedTopic?.id}
                style={{ width: 12, height: 12, objectFit: "contain" }}
              />
            ) : null}
            {(topic?.id || upload.hazardType || "Research").toUpperCase()}
          </span>
          <MetaPill label={format} color={formatColor} />
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "15px",
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.35,
          }}
        >
          {upload.title || "Untitled Dataset"}
        </h3>

        {/* Description */}
        {upload.description && (
          <p
            style={{
              margin: "0 0 14px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
              display: "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {upload.description}
          </p>
        )}
        {upload.description && upload.description.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              color: cardAccent,
              fontWeight: 600,
              padding: 0,
              marginBottom: "14px",
            }}
          >
            {expanded ? "Show less ↑" : "Read more ↓"}
          </button>
        )}

        {/* ── Metadata pills row */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          {dateRange && <MetaPill icon={Ico.calendar} label={dateRange} />}
          {sizeLabel && <MetaPill icon={Ico.chart} label={sizeLabel} />}
          <MetaPill icon={Ico.pin} label={region} />
          <MetaPill icon={Ico.folder} label={format} color={formatColor} />
        </div>

        {/* ── Researcher / status row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {/* Avatar circle */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: cardAccent + "22",
                border: `1px solid ${cardAccent}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: cardAccent,
                flexShrink: 0,
              }}
            >
              {(upload.uploadedBy || "L").charAt(0).toUpperCase()}
            </div>
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "2px",
                }}
              >
                Uploaded by
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}
              >
                {upload.uploadedBy || "LEO Member"}
              </div>
              {upload.date && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    marginTop: "1px",
                  }}
                >
                  {new Date(upload.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background:
                upload.status === "approved"
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(245,158,11,0.12)",
              border: `1px solid ${upload.status === "approved" ? "#10b98133" : "#f59e0b33"}`,
              color: upload.status === "approved" ? "#10b981" : "#f59e0b",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background:
                  upload.status === "approved" ? "#10b981" : "#f59e0b",
                display: "inline-block",
              }}
            />
            {upload.status === "approved" ? "Approved" : "Pending"}
          </span>
        </div>

        {/* ── Image preview (if applicable) */}
        {isImg && fileUrl && (
          <div
            onClick={() => onImageClick(fileUrl, upload.title)}
            style={{
              cursor: "pointer",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid var(--border-light)",
              marginBottom: "14px",
              height: "160px",
            }}
          >
            <img
              src={fileUrl}
              alt={upload.title}
              style={{
                display: "block",
                width: "100%",
                height: "160px",
                objectFit: "cover",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            />
          </div>
        )}

        {/* ── Text content preview */}
        {upload.uploadType === "text" && upload.content && (
          <div
            style={{
              background: "var(--bg-card-alt,rgba(128,128,128,0.05))",
              border: "1px solid var(--border-light)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "14px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.65,
              maxHeight: "120px",
              overflow: "hidden",
            }}
          >
            {upload.content}
          </div>
        )}
      </div>

      {/* ── Action footer */}
      <div
        style={{
          padding: "12px 20px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        {/* View */}
        {upload.uploadType === "text" ? (
          /* Text uploads have no URL — View expands/collapses content */
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "8px 8px",
              borderRadius: "9px",
              background: cardAccent + "18",
              border: `1px solid ${cardAccent}33`,
              color: cardAccent,
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = cardAccent + "30")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = cardAccent + "18")
            }
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              style={{ width: 13, height: 13 }}
            >
              <path
                d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="8"
                cy="8"
                r="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            {expanded ? "Collapse" : "View"}
          </button>
        ) : (
          <a
            href={fileUrl || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={fileUrl ? undefined : (e) => e.preventDefault()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "8px 8px",
              borderRadius: "9px",
              background: cardAccent + "18",
              border: `1px solid ${cardAccent}33`,
              color: cardAccent,
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
              overflow: "hidden",
              opacity: fileUrl ? 1 : 0.5,
              cursor: fileUrl ? "pointer" : "default",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = cardAccent + "30")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = cardAccent + "18")
            }
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              style={{ width: 13, height: 13 }}
            >
              <path
                d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="8"
                cy="8"
                r="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            View
          </a>
        )}

        {/* Download — opens format chooser modal (rendered at page level) */}
        <button
          onClick={() => onDownload(upload)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "8px 8px",
            borderRadius: "9px",
            background: "var(--bg-card-alt,rgba(128,128,128,0.06))",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(128,128,128,0.12)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              "var(--bg-card-alt,rgba(128,128,128,0.06))")
          }
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            style={{ width: 13, height: 13 }}
          >
            <path
              d="M8 2v8M5 7l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Download
        </button>

        {/* Analyze — navigate to hazard page via React Router (no page reload) */}
        <Link
          to={`/hazards/${(topic?.id || upload.hazardType || "").toLowerCase()}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "8px 8px",
            borderRadius: "9px",
            background: cardAccent,
            border: "none",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            transition: "opacity 0.15s, transform 0.15s",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.88";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            style={{ width: 13, height: 13 }}
          >
            <path
              d="M2 12l3-4 3 2 3-5 3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Analyze
        </Link>
      </div>
    </div>
  );
}

// ── Filter chip style helper ───────────────────────────────────────────────
function chipStyle(color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    background: color + "14",
    border: `1px solid ${color}33`,
    color: color,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.15s",
  };
}

// ── Main component ─────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  region: "Ethiopia",
  zone: "All",
  format: "All",
  yearFrom: "",
  yearTo: "",
  researcher: "All",
  sort: "newest",
};

function Research() {
  const [selectedTopic, setSelectedTopic] = useState(null); // null = show all
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [downloadUpload, setDownloadUpload] = useState(null);
  const [modalImage, setModalImage] = useState({
    isOpen: false,
    src: "",
    alt: "",
  });

  const activeTopic = TOPICS.find((t) => t.id === selectedTopic) || null;
  // Safe fallbacks when no topic is selected
  const topicColor = activeTopic?.color || "#f28c28";
  const topicBg = activeTopic?.bg || "rgba(242,140,40,0.10)";
  const topicIcon = activeTopic?.icon || null;
  const topicId = activeTopic?.id || "All";

  useEffect(() => {
    let mounted = true;
    const loadUploads = async (showSpinner = false) => {
      try {
        if (showSpinner && mounted) setLoading(true);
        const response = await fetch("/api/uploads?status=approved");
        if (!response.ok) {
          if (mounted) setUploads([]);
          return;
        }
        const saved = await response.json();
        if (mounted) setUploads(saved);
      } catch (error) {
        console.error("Research fetch error:", error.message);
        if (mounted) setUploads([]);
      } finally {
        if (showSpinner && mounted) setLoading(false);
      }
    };
    loadUploads(true);
    const onFocus = () => loadUploads(false);
    window.addEventListener("focus", onFocus);
    const pollId = setInterval(() => loadUploads(false), 30000);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      clearInterval(pollId);
    };
  }, []);

  const handleTopicChange = (topicId) => {
    setSelectedTopic(topicId); // null clears selection
    setSearchQuery("");
    setFilters(DEFAULT_FILTERS);
  };

  const handleFilterChange = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTopic(null);
    setFilters(DEFAULT_FILTERS);
  };

  // Count active filters (excluding sort)
  const activeFilterCount = [
    selectedTopic !== null,
    filters.region !== "Ethiopia",
    filters.zone !== "All",
    filters.format !== "All",
    !!filters.yearFrom,
    !!filters.yearTo,
    filters.researcher !== "All",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  // All uploads for this topic (before extra filters) — used by filter panel for researcher list
  const topicAllUploads = useMemo(() => {
    const base = uploads.filter((u) => !u.title?.startsWith("Disaster Data:"));
    if (!selectedTopic) return base;
    return base.filter((u) => uploadMatchesTopic(u, selectedTopic));
  }, [uploads, selectedTopic]);

  const topicUploads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = topicAllUploads.filter((u) => {
      // Text search
      if (q) {
        const haystack = [
          u.title || "",
          u.description || "",
          u.uploadedBy || "",
          u.content || "",
          u.fileName || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Region filter — match stored region field first, then fall back to text scan
      if (filters.region !== "Ethiopia") {
        const storedRegion = (u.region || "Ethiopia").toLowerCase();
        const text = `${u.title || ""} ${u.description || ""}`.toLowerCase();
        const regionLower = filters.region.toLowerCase();
        if (storedRegion !== regionLower && !text.includes(regionLower))
          return false;
      }
      // Zone filter
      if (filters.zone !== "All") {
        const text = `${u.title || ""} ${u.description || ""}`.toLowerCase();
        if (!text.includes(filters.zone.toLowerCase())) return false;
      }
      // Format filter
      if (filters.format !== "All") {
        if (getFormatLabel(u) !== filters.format) return false;
      }
      // Year from
      if (filters.yearFrom && u.date) {
        if (new Date(u.date).getFullYear() < parseInt(filters.yearFrom))
          return false;
      }
      // Year to
      if (filters.yearTo && u.date) {
        if (new Date(u.date).getFullYear() > parseInt(filters.yearTo))
          return false;
      }
      // Researcher
      if (filters.researcher !== "All") {
        if ((u.uploadedBy || "") !== filters.researcher) return false;
      }

      return true;
    });

    // Sort
    switch (filters.sort) {
      case "oldest":
        result = [...result].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        break;
      case "title_az":
        result = [...result].sort((a, b) =>
          (a.title || "").localeCompare(b.title || ""),
        );
        break;
      case "title_za":
        result = [...result].sort((a, b) =>
          (b.title || "").localeCompare(a.title || ""),
        );
        break;
      case "size_desc":
        result = [...result].sort((a, b) => (b.size || 0) - (a.size || 0));
        break;
      default: // newest
        result = [...result].sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
    }

    return result;
  }, [topicAllUploads, searchQuery, filters]);

  const topicCounts = useMemo(() => {
    const counts = {};
    TOPICS.forEach((t) => {
      counts[t.id] = uploads.filter(
        (u) =>
          uploadMatchesTopic(u, t.id) && !u.title?.startsWith("Disaster Data:"),
      ).length;
    });
    return counts;
  }, [uploads]);

  // Stats for the overview header
  const stats = useMemo(() => {
    const research = uploads.filter(
      (u) => !u.title?.startsWith("Disaster Data:"),
    );
    const researchers = new Set(
      research.map((u) => u.uploadedBy).filter(Boolean),
    );
    const hazardTypes = new Set(
      research.map((u) => u.hazardType).filter(Boolean),
    );
    const pending = research.filter((u) => u.status === "pending").length;
    const latest =
      research.length > 0
        ? research.reduce(
            (a, b) => (new Date(a.date) > new Date(b.date) ? a : b),
            research[0],
          )
        : null;
    return {
      total: research.length,
      approved: research.filter((u) => u.status === "approved").length,
      pending,
      researchers: researchers.size,
      hazardTypes: hazardTypes.size,
      latest,
    };
  }, [uploads]);

  return (
    <div
      style={{
        padding: "0 0 60px",
        minHeight: "100vh",
        color: "var(--text-primary)",
        overflowX: "hidden",
        background: "var(--bg-page, transparent)",
      }}
    >
      {/* ── STATS HEADER ────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 24px 0" }}>
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            border: "1px solid var(--border-light)",
            background: "var(--bg-card)",
            padding: "24px 28px",
            overflow: "hidden",
            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          {/* Ambient glows — clipped inside the card */}
          <div
            style={{
              position: "absolute",
              bottom: "-40px",
              left: "-40px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              pointerEvents: "none",
              background:
                "radial-gradient(circle, rgba(242,140,40,0.10) 0%, transparent 70%)",
              filter: "blur(28px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              pointerEvents: "none",
              background:
                "radial-gradient(circle, rgba(242,140,40,0.07) 0%, transparent 70%)",
              filter: "blur(28px)",
            }}
          />

          <div style={{ position: "relative" }}>
            {/* Title row */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 3px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#f28c28",
                  }}
                >
                  Research Data Center · SSGI Ethiopia
                </p>
                <h1
                  style={{
                    margin: "0 0 4px",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  Departmental Research Archive
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  Explore, manage, and analyze disaster-related research data
                  from LEO members.
                </p>
              </div>
              {stats.latest && (
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: "rgba(242,140,40,0.08)",
                    border: "1px solid rgba(242,140,40,0.2)",
                    fontSize: "11px",
                    color: "#f28c28",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "1px" }}>
                    Latest Upload
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stats.latest.title}
                  </div>
                </div>
              )}
            </div>

            {/* Stats strip */}
            <div
              style={{
                display: "flex",
                gap: "0",
                flexWrap: "wrap",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                overflow: "hidden",
              }}
            >
              {[
                { label: "Total Datasets", value: stats.total },
                { label: "Approved", value: stats.approved },
                { label: "Pending Approval", value: stats.pending },
                { label: "Researchers", value: stats.researchers },
                { label: "Hazard Types", value: stats.hazardTypes },
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  style={{
                    flex: "1 1 0",
                    textAlign: "center",
                    padding: "12px 8px",
                    borderRight:
                      i < arr.length - 1
                        ? "1px solid var(--border-light)"
                        : "none",
                    background: "var(--bg-card-alt,rgba(128,128,128,0.03))",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      color: "#f28c28",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginTop: "3px",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── UPLOADS SECTION ─────────────────────────────────────────────── */}
      <div style={{ padding: "24px 24px 0" }}>
        {/* ── Search + Filter bar ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: filtersOpen ? "14px" : "20px",
            flexWrap: "wrap",
            alignItems: "stretch",
          }}
        >
          {/* Main search input */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "15px",
                height: "15px",
                pointerEvents: "none",
                color: "var(--text-muted)",
              }}
            >
              <circle
                cx="8.5"
                cy="8.5"
                r="5.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M13.5 13.5L17 17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search datasets, locations, researchers, keywords…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 36px 10px 36px",
                borderRadius: "11px",
                border: `1px solid ${searchQuery ? topicColor + "66" : "var(--border-light)"}`,
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                boxShadow: searchQuery ? `0 0 0 3px ${topicColor}14` : "none",
                transition: "border-color 0.18s, box-shadow 0.18s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = topicColor + "88";
                e.target.style.boxShadow = `0 0 0 3px ${topicColor}14`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = searchQuery
                  ? topicColor + "66"
                  : "var(--border-light)";
                e.target.style.boxShadow = searchQuery
                  ? `0 0 0 3px ${topicColor}14`
                  : "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  borderRadius: "4px",
                }}
              >
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ width: 13, height: 13 }}
                >
                  <path
                    d="M2 2l10 10M12 2L2 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "10px 16px",
              borderRadius: "11px",
              cursor: "pointer",
              border: `1px solid ${filtersOpen || activeFilterCount > 0 ? topicColor + "66" : "var(--border-light)"}`,
              background:
                filtersOpen || activeFilterCount > 0
                  ? topicColor + "12"
                  : "var(--bg-card)",
              color:
                filtersOpen || activeFilterCount > 0
                  ? topicColor
                  : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.18s",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow:
                activeFilterCount > 0 ? `0 0 0 3px ${topicColor}12` : "none",
            }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              style={{ width: 14, height: 14 }}
            >
              <path
                d="M1 3h14M3 8h10M6 13h4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: topicColor,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 800,
                  borderRadius: "999px",
                  padding: "1px 6px",
                  lineHeight: "16px",
                }}
              >
                {activeFilterCount}
              </span>
            )}
            <svg
              viewBox="0 0 10 6"
              fill="none"
              style={{
                width: 10,
                height: 10,
                transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Clear all — shown when any filter active */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "10px 14px",
                borderRadius: "11px",
                cursor: "pointer",
                border: "1px solid var(--border-light)",
                background: "var(--bg-card)",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.borderColor = "#ef444440";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }}
            >
              <svg
                viewBox="0 0 14 14"
                fill="none"
                style={{ width: 12, height: 12 }}
              >
                <path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Clear all
            </button>
          )}
        </div>

        {/* ── Expandable filter panel ──────────────────────────────────── */}
        {filtersOpen && (
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            accentColor={topicColor || "#f28c28"}
            uploads={topicAllUploads}
            topic={activeTopic}
            selectedTopic={selectedTopic}
            onTopicChange={handleTopicChange}
          />
        )}

        {/* ── Section sub-header ────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          {topicIcon ? (
            <img
              src={topicIcon}
              alt={topicId}
              style={{ width: 22, height: 22, objectFit: "contain" }}
            />
          ) : (
            <svg
              viewBox="0 0 22 22"
              fill="none"
              style={{ width: 22, height: 22, color: topicColor }}
            >
              <circle
                cx="11"
                cy="11"
                r="9"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M7 11h8M11 7v8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: topicColor,
              }}
            >
              {topicId === "All" ? "All Research" : `${topicId} Research`}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginLeft: "8px",
              }}
            >
              {topicUploads.length} result{topicUploads.length !== 1 ? "s" : ""}
              {activeFilterCount > 0 ? " (filtered)" : " · approved uploads"}
            </span>
          </div>
          {/* Active filter chips */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {selectedTopic && (
              <span
                onClick={() => handleTopicChange(null)}
                style={chipStyle(topicColor)}
              >
                {topicIcon && (
                  <img
                    src={topicIcon}
                    alt={topicId}
                    style={{ width: 10, height: 10, objectFit: "contain" }}
                  />
                )}
                {topicId} ×
              </span>
            )}
            {filters.region !== "Ethiopia" && (
              <span
                onClick={() =>
                  handleFilterChange({ region: "Ethiopia", zone: "All" })
                }
                style={chipStyle(topicColor)}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  {Ico.pin}
                </span>
                {filters.region} ×
              </span>
            )}
            {filters.zone !== "All" && (
              <span
                onClick={() => handleFilterChange({ zone: "All" })}
                style={chipStyle(topicColor)}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  {Ico.map}
                </span>
                {filters.zone} ×
              </span>
            )}
            {filters.format !== "All" && (
              <span
                onClick={() => handleFilterChange({ format: "All" })}
                style={chipStyle(topicColor)}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  {Ico.folder}
                </span>
                {filters.format} ×
              </span>
            )}
            {filters.yearFrom && (
              <span
                onClick={() => handleFilterChange({ yearFrom: "" })}
                style={chipStyle(topicColor)}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  {Ico.calendar}
                </span>
                From {filters.yearFrom} ×
              </span>
            )}
            {filters.yearTo && (
              <span
                onClick={() => handleFilterChange({ yearTo: "" })}
                style={chipStyle(topicColor)}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  {Ico.calendar}
                </span>
                To {filters.yearTo} ×
              </span>
            )}
            {filters.researcher !== "All" && (
              <span
                onClick={() => handleFilterChange({ researcher: "All" })}
                style={chipStyle(topicColor)}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  {Ico.user}
                </span>
                {filters.researcher} ×
              </span>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px 0",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: `3px solid ${topicColor}33`,
                  borderTopColor: topicColor,
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 14px",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Loading research uploads…
              </p>
            </div>
          </div>
        ) : topicUploads.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "64px 24px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border-light)",
            }}
          >
            {/* Icon box */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: searchQuery.trim()
                  ? "rgba(128,128,128,0.08)"
                  : topicBg,
                border: `1px solid ${searchQuery.trim() ? "var(--border-light)" : topicColor + "33"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                boxShadow: searchQuery.trim()
                  ? "none"
                  : `0 4px 24px ${topicColor}18`,
              }}
            >
              {searchQuery.trim() ? (
                /* Magnifier with no-results slash */
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  style={{ width: 44, height: 44 }}
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="12"
                    stroke="var(--text-muted)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M29 29L40 40"
                    stroke="var(--text-muted)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 14l12 12"
                    stroke="var(--text-muted)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.45"
                  />
                </svg>
              ) : topicIcon ? (
                <img
                  src={topicIcon}
                  alt={topicId}
                  style={{ width: 48, height: 48, objectFit: "contain" }}
                />
              ) : (
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  style={{ width: 44, height: 44, color: topicColor }}
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M16 24h16M24 16v16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {activeFilterCount > 0
                ? "No matching datasets"
                : searchQuery.trim()
                  ? `No results for "${searchQuery.trim()}"`
                  : "No uploads yet"}
            </h3>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "13px",
                color: "var(--text-muted)",
                maxWidth: "360px",
              }}
            >
              {activeFilterCount > 0 ? (
                <>Adjust your filters or </>
              ) : searchQuery.trim() ? (
                <>Try different keywords or </>
              ) : (
                <>
                  No approved research uploads for{" "}
                  {topicId === "All" ? "any domain" : topicId} yet. LEO members
                  can submit via the Dashboard.
                </>
              )}
              {(activeFilterCount > 0 || searchQuery.trim()) && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: topicColor,
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  clear all filters
                </button>
              )}
            </p>
          </div>
        ) : (
          /* Upload cards grid */
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
              gap: "18px",
            }}
          >
            {topicUploads.map((upload) => (
              <UploadCard
                key={upload._id || upload.id}
                upload={upload}
                accentColor={topicColor}
                topic={activeTopic}
                onDownload={(u) => setDownloadUpload(u)}
                onImageClick={(src, alt) =>
                  setModalImage({ isOpen: true, src, alt })
                }
              />
            ))}
          </div>
        )}
      </div>

      <ImageModal
        isOpen={modalImage.isOpen}
        imageSrc={modalImage.src}
        altText={modalImage.alt}
        onClose={() => setModalImage({ isOpen: false, src: "", alt: "" })}
      />

      {/* ── Download + API modal — rendered at page level as true overlay ── */}
      {downloadUpload && (
        <DownloadModal
          upload={downloadUpload}
          accentColor={topicColor}
          onClose={() => setDownloadUpload(null)}
        />
      )}
    </div>
  );
}

export default Research;
