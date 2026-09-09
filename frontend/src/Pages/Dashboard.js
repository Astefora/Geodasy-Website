import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import {
  FiBookOpen,
  FiGlobe,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLogOut,
  FiUser,
  FiX,
  FiBell,
  FiTrendingUp,
  FiAlertCircle,
  FiMail,
} from "react-icons/fi";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";
  return (
    <div
      style={{ position: "fixed", top: "88px", right: "24px", zIndex: 9500 }}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold transition-all ${
        isSuccess
          ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
          : "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSuccess ? "bg-green-500" : "bg-red-500"}`}
      />
      {message}
      <button
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}

// ── Disaster dynamic fields config ────────────────────────────────────────
const DISASTER_FIELDS = {
  Earthquake: [
    {
      name: "magnitude",
      label: "Magnitude",
      type: "number",
      placeholder: "e.g. 6.5",
    },
    {
      name: "depth",
      label: "Depth (km)",
      type: "number",
      placeholder: "e.g. 10",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Addis Ababa",
    },
    { name: "datetime", label: "Date / Time", type: "datetime-local" },
  ],
  Landslide: [
    {
      name: "soilType",
      label: "Soil Type",
      type: "text",
      placeholder: "e.g. Clay, Loam",
    },
    {
      name: "slopeAngle",
      label: "Slope Angle (°)",
      type: "number",
      placeholder: "e.g. 35",
    },
    {
      name: "rainfallLevel",
      label: "Rainfall Level (mm)",
      type: "number",
      placeholder: "e.g. 120",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Debark",
    },
  ],
  Flood: [
    {
      name: "waterLevel",
      label: "Water Level (m)",
      type: "number",
      placeholder: "e.g. 3.2",
    },
    {
      name: "rainfallIntensity",
      label: "Rainfall Intensity (mm/hr)",
      type: "number",
      placeholder: "e.g. 45",
    },
    {
      name: "riverName",
      label: "River Name",
      type: "text",
      placeholder: "e.g. Awash River",
    },
    {
      name: "affectedArea",
      label: "Affected Area (km²)",
      type: "number",
      placeholder: "e.g. 200",
    },
  ],
  Drought: [
    {
      name: "duration",
      label: "Duration (days)",
      type: "number",
      placeholder: "e.g. 90",
    },
    {
      name: "rainfallDeficit",
      label: "Rainfall Deficit (mm)",
      type: "number",
      placeholder: "e.g. 150",
    },
    {
      name: "affectedArea",
      label: "Affected Area (km²)",
      type: "number",
      placeholder: "e.g. 500",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Somali Region",
    },
  ],
  Volcano: [
    {
      name: "volcanoName",
      label: "Volcano Name",
      type: "text",
      placeholder: "e.g. Erta Ale",
    },
    {
      name: "alertLevel",
      label: "Alert Level",
      type: "text",
      placeholder: "e.g. Orange, Red",
    },
    {
      name: "lavaFlowRate",
      label: "Lava Flow Rate (m³/s)",
      type: "number",
      placeholder: "e.g. 12",
    },
    { name: "datetime", label: "Date / Time", type: "datetime-local" },
  ],
  Fire: [
    {
      name: "burnedArea",
      label: "Burned Area (ha)",
      type: "number",
      placeholder: "e.g. 300",
    },
    {
      name: "fireIntensity",
      label: "Fire Intensity",
      type: "text",
      placeholder: "e.g. High, Medium",
    },
    {
      name: "cause",
      label: "Cause",
      type: "text",
      placeholder: "e.g. Lightning, Human",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Bale Mountains",
    },
  ],
};

const DISASTER_ICONS = {
  Earthquake: "/icons/icons8-earthquake-100.png",
  Landslide: "/icons/icons8-landslide-100.png",
  Flood: "/icons/icons8-flood-100.png",
  Drought: "/icons/icons8-drought-100.png",
  Volcano: "/icons/icons8-volcano-100.png",
  Fire: "/icons/icons8-fire-100.png",
};

const DISASTER_COLORS = {
  Earthquake: "#1f4fd8",
  Landslide: "#d2691e",
  Flood: "#4169e1",
  Drought: "#daa520",
  Volcano: "#ff4500",
  Fire: "#ff6347",
};

// Gradient configs per disaster type
const DISASTER_GRADIENTS = {
  Earthquake: "from-blue-600 to-indigo-600",
  Landslide: "from-amber-600 to-orange-600",
  Flood: "from-blue-500 to-cyan-500",
  Drought: "from-yellow-500 to-orange-500",
  Volcano: "from-red-600 to-orange-500",
  Fire: "from-orange-500 to-red-500",
};

// ── Shared Tailwind class strings ──────────────────────────────────────────
const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500";

const labelClass =
  "block mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400";

const cardClass =
  "bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg";

const submitBtnClass =
  "w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]";

// ── Mini stat badge ────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
      <Icon size={13} className={color} />
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
        {value}
      </span>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepDot({ active, done, label, num }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
          ${
            done
              ? "bg-green-500 border-green-500"
              : active
                ? "bg-blue-600 border-blue-600 scale-110"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          }`}
        style={{
          color: done ? "#fff" : active ? "#fff" : "#6b7280",
        }}
      >
        {done ? <FiCheckCircle size={13} /> : num}
      </div>
      <span
        style={{ color: active ? "#2563eb" : "#9ca3af" }}
        className="text-[10px] font-semibold"
      >
        {label}
      </span>
    </div>
  );
}

// ── Premium Action Buttons ────────────────────────────────────────────────
function ActionButtons({
  onCancel,
  submitLabel = "Submit",
  loading = false,
  disabled = false,
  accentColor = null,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const submitBg = accentColor
    ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
    : "linear-gradient(135deg, #1d4ed8, #4f46e5)";

  const submitBgHover = accentColor
    ? `linear-gradient(135deg, ${accentColor}dd, ${accentColor}aa)`
    : "linear-gradient(135deg, #1e40af, #4338ca)";

  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      {/* Cancel — ghost with subtle depth */}
      <button
        type="button"
        onClick={onCancel}
        style={{
          width: "144px",
          padding: "10px 0",
          borderRadius: "12px",
          border: isDark
            ? "1.5px solid rgba(255,255,255,0.10)"
            : "1.5px solid rgba(0,0,0,0.10)",
          background: isDark
            ? "linear-gradient(145deg, #1e2030, #181a28)"
            : "linear-gradient(145deg, #ffffff, #eef0f4)",
          boxShadow: isDark
            ? "0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 2px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80)",
          color: isDark ? "transparent" : "transparent",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "box-shadow 0.2s, transform 0.15s",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)"
            : "0 4px 16px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.90)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 2px 10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80)";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(0.98)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(-1px) scale(1)";
        }}
      >
        <span
          style={{
            color: isDark ? "#9ca3af" : "#374151",
            pointerEvents: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Cancel
        </span>
      </button>

      {/* Submit — solid gradient with glow */}
      <button
        type="submit"
        disabled={disabled || loading}
        style={{
          width: "144px",
          padding: "10px 0",
          borderRadius: "12px",
          border: "none",
          background:
            disabled || loading ? (isDark ? "#374151" : "#d1d5db") : submitBg,
          boxShadow:
            disabled || loading
              ? "none"
              : accentColor
                ? `0 4px 16px ${accentColor}55, 0 1px 4px ${accentColor}33`
                : "0 4px 16px rgba(79,70,229,0.45), 0 1px 4px rgba(29,78,216,0.30)",
          color:
            disabled || loading ? (isDark ? "#6b7280" : "#9ca3af") : "#ffffff",
          fontSize: "13px",
          fontWeight: 700,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          transition: "box-shadow 0.2s, transform 0.15s, background 0.2s",
          outline: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
        onMouseEnter={(e) => {
          if (disabled || loading) return;
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.background = submitBgHover;
          e.currentTarget.style.boxShadow = accentColor
            ? `0 6px 22px ${accentColor}66, 0 2px 6px ${accentColor}44`
            : "0 6px 22px rgba(79,70,229,0.55), 0 2px 6px rgba(29,78,216,0.40)";
        }}
        onMouseLeave={(e) => {
          if (disabled || loading) return;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.background = submitBg;
          e.currentTarget.style.boxShadow = accentColor
            ? `0 4px 16px ${accentColor}55, 0 1px 4px ${accentColor}33`
            : "0 4px 16px rgba(79,70,229,0.45), 0 1px 4px rgba(29,78,216,0.30)";
        }}
        onMouseDown={(e) => {
          if (!disabled && !loading)
            e.currentTarget.style.transform = "scale(0.98)";
        }}
        onMouseUp={(e) => {
          if (!disabled && !loading)
            e.currentTarget.style.transform = "translateY(-1px)";
        }}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Submitting…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}

// ── Validation Error Modal ─────────────────────────────────────────────────
function ValidationModal({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 w-full max-w-sm p-6 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center">
          <FiAlertCircle size={22} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">
            Missing Information
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
function SubmissionModal({ item, onClose }) {
  const typeKey = item.hazardType
    ? item.hazardType.charAt(0).toUpperCase() + item.hazardType.slice(1)
    : "";
  const iconSrc =
    DISASTER_ICONS[typeKey] || "/icons/icons8-environmental-hazard-100.png";
  const status = item.status || "pending";
  const statusStyles = {
    approved: {
      bg: "bg-green-100 dark:bg-green-900/40",
      text: "text-green-700 dark:text-green-400",
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-900/40",
      text: "text-red-600 dark:text-red-400",
    },
    pending: {
      bg: "bg-amber-100 dark:bg-amber-900/40",
      text: "text-amber-700 dark:text-amber-400",
    },
  };
  const ss = statusStyles[status] || statusStyles.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <img
            src={iconSrc}
            alt={typeKey}
            className="w-10 h-10 object-contain flex-shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
              {typeKey || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-0.5"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Status + date */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${ss.bg} ${ss.text}`}
          >
            {status}
          </span>
          {item.date && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <FiClock size={11} />
              {new Date(item.date).toLocaleString()}
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.description}
            </p>
          </div>
        )}

        {/* Uploaded by */}
        {item.uploadedBy && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FiUser size={12} />
            <span>
              Submitted by{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {item.uploadedBy}
              </span>
            </span>
          </div>
        )}

        {/* File link */}
        {item.path && (
          <a
            href={item.path}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline w-fit"
          >
            <FiFileText size={14} />
            View attached file
          </a>
        )}

        <button
          onClick={onClose}
          className="mt-1 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── My Research Submissions Section ───────────────────────────────────────
function ResearchSubmissions({ history }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState(null);

  if (!history || history.length === 0) return null;

  return (
    <>
      {selected && (
        <SubmissionModal item={selected} onClose={() => setSelected(null)} />
      )}
      <div
        className="mt-8 relative overflow-hidden rounded-2xl shadow-xl"
        style={{
          background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
          border: isDark
            ? "1.5px solid rgba(255,255,255,0.10)"
            : "1.5px solid rgba(99,102,241,0.18)",
          padding: "24px",
        }}
      >
        {/* top-left glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "-40px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        {/* bottom-right glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            right: "-40px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        {/* content */}
        <div className="relative" style={{ zIndex: 1 }}>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <FiFileText
                size={15}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
                My Research Submissions
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {history.length} submission{history.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {history.map((r) => {
              const typeKey = r.hazardType
                ? r.hazardType.charAt(0).toUpperCase() + r.hazardType.slice(1)
                : "";
              const iconSrc =
                DISASTER_ICONS[typeKey] ||
                "/icons/icons8-environmental-hazard-100.png";
              const status = r.status || "pending";
              const statusCls =
                status === "approved"
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : status === "rejected"
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400";

              return (
                <button
                  key={r._id || r.id}
                  onClick={() => setSelected(r)}
                  style={{
                    textAlign: "left",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    background: isDark
                      ? "linear-gradient(145deg, rgba(31,41,55,0.80), rgba(17,24,39,0.60))"
                      : "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,249,251,0.85))",
                    border: isDark
                      ? "1.5px solid rgba(255,255,255,0.10)"
                      : "1.5px solid rgba(99,102,241,0.20)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    minHeight: "88px",
                    boxShadow: isDark
                      ? "0 2px 10px rgba(0,0,0,0.35)"
                      : "0 2px 10px rgba(0,0,0,0.07)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 6px 20px rgba(0,0,0,0.50)"
                      : "0 6px 20px rgba(99,102,241,0.18)";
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(99,102,241,0.40)"
                      : "rgba(99,102,241,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 2px 10px rgba(0,0,0,0.35)"
                      : "0 2px 10px rgba(0,0,0,0.07)";
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(99,102,241,0.20)";
                  }}
                >
                  <img
                    src={iconSrc}
                    alt={typeKey}
                    className="w-7 h-7 object-contain flex-shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                      {r.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${statusCls}`}
                      >
                        {status}
                      </span>
                      {typeKey && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                          {typeKey}
                        </span>
                      )}
                    </div>
                    {r.date && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(r.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Research Upload Panel ─────────────────────────────────────────────────
function ResearchPanel({ currentUser, onGoBack }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    topic: "Earthquake",
    typeText: "",
    description: "",
    uploadType: "file",
    link: "",
    text: "",
  });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [showTypeDrop, setShowTypeDrop] = useState(false);
  const fileRef = useRef();

  // Compute current step (1=title, 2=type+desc, 3=file/link, 4=submit)
  const step =
    form.title.trim() && form.description.trim()
      ? form.uploadType === "file"
        ? file
          ? 4
          : 3
        : form.uploadType === "link"
          ? form.link.trim()
            ? 4
            : 3
          : form.text.trim()
            ? 4
            : 3
      : form.title.trim()
        ? 2
        : 1;

  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const mine = data.filter(
          (u) =>
            u.uploadedBy === (currentUser?.fullName || currentUser?.username) &&
            !u.title?.startsWith("Disaster Data:"),
        );
        setHistory(mine.slice(0, 5));
        setStats({
          total: mine.length,
          approved: mine.filter((u) => u.status === "approved").length,
          pending: mine.filter((u) => u.status === "pending").length,
        });
      })
      .catch(() => {});
  }, [currentUser]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const validate = () => {
    if (!form.title.trim()) return "Research title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (form.uploadType === "file" && !file) return "Please select a file.";
    if (form.uploadType === "link" && !form.link.trim())
      return "Please enter a URL.";
    if (form.uploadType === "text" && !form.text.trim())
      return "Please enter research text.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setLoading(true);
    try {
      // Resolve hazard type: typeText wins if filled, else fall back to topic picker
      const resolvedHazardType = (
        form.typeText.trim() || form.topic
      ).toLowerCase();

      let saved;
      if (form.uploadType === "file") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", form.title.trim());
        formData.append("hazardType", resolvedHazardType);
        formData.append("description", form.description.trim());
        formData.append(
          "uploadedBy",
          currentUser?.fullName || currentUser?.username || "LEO member",
        );
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.error || `Server error ${res.status}`);
        }
        saved = await res.json();
      } else {
        const content = form.uploadType === "link" ? form.link : form.text;
        const blob = new Blob([content], { type: "text/plain" });
        const pseudoFile = new File([blob], `${form.uploadType}-entry.txt`, {
          type: "text/plain",
        });
        const formData = new FormData();
        formData.append("file", pseudoFile);
        formData.append("title", form.title.trim());
        formData.append("hazardType", resolvedHazardType);
        formData.append("description", form.description.trim());
        formData.append(
          "uploadedBy",
          currentUser?.fullName || currentUser?.username || "LEO member",
        );
        formData.append("uploadType", form.uploadType);
        formData.append("content", content);
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.error || `Server error ${res.status}`);
        }
        saved = await res.json();
      }

      setForm({
        title: "",
        topic: "Earthquake",
        typeText: "",
        description: "",
        uploadType: "file",
        link: "",
        text: "",
      });
      setFile(null);
      setShowTypeDrop(false);
      if (fileRef.current) fileRef.current.value = "";

      fetch("/api/uploads")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const mine = data.filter(
            (u) =>
              u.uploadedBy ===
                (currentUser?.fullName || currentUser?.username) &&
              !u.title?.startsWith("Disaster Data:"),
          );
          setHistory(mine.slice(0, 5));
          setStats({
            total: mine.length,
            approved: mine.filter((u) => u.status === "approved").length,
            pending: mine.filter((u) => u.status === "pending").length,
          });
        })
        .catch(() => {});

      setLoading(false);
      setToast({
        message: "Research submitted successfully!",
        type: "success",
      });
    } catch (error) {
      setLoading(false);
      setToast({
        message: error.message.includes("fetch")
          ? "Could not reach the server. Make sure the backend is running."
          : error.message,
        type: "error",
      });
    }
  };

  return (
    <>
      {validationError && (
        <ValidationModal
          message={validationError}
          onClose={() => setValidationError(null)}
        />
      )}
      <div className={cardClass}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Panel header — single row: icon+title LEFT | steps+button RIGHT */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-3 justify-between">
            {/* Left: icon + title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40 flex-shrink-0">
                <FiBookOpen size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                  Upload Research
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Share findings with the LEO network
                </p>
              </div>
            </div>

            {/* Right: steps + gap + back button, top-aligned */}
            <div className="flex items-start gap-6 flex-shrink-0">
              {/* Step dots */}
              <div className="flex items-center gap-1">
                {["Info", "Type", "File", "Ready"].map((label, i) => (
                  <React.Fragment key={label}>
                    <StepDot
                      num={i + 1}
                      label={label}
                      active={step === i + 1}
                      done={step > i + 1}
                    />
                    {i < 3 && (
                      <div
                        className={`w-4 h-0.5 mb-3.5 rounded-full transition-colors duration-300 ${step > i + 1 ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              {/* Back button — top-aligned with circle row */}
              {onGoBack && (
                <div className="mt-0.5">
                  <SwitchPillBtn
                    onClick={onGoBack}
                    label="Local Data"
                    icon={FiGlobe}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>Research Title *</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Enter a descriptive research title"
            />
          </div>

          {/* Type — free-text + hazard dropdown */}
          <div className="relative">
            <label className={labelClass}>Research Type</label>
            <div className="relative">
              <input
                className={inputClass}
                value={form.typeText}
                onChange={(e) => {
                  set("typeText", e.target.value);
                  setShowTypeDrop(true);
                }}
                onFocus={() => setShowTypeDrop(true)}
                onBlur={() => setTimeout(() => setShowTypeDrop(false), 150)}
                placeholder="Type or select a hazard type…"
                autoComplete="off"
              />
              {/* Dropdown arrow */}
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowTypeDrop((v) => !v);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 5l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Dropdown list */}
            {showTypeDrop && (
              <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                {Object.keys(DISASTER_FIELDS)
                  .filter(
                    (t) =>
                      !form.typeText ||
                      t.toLowerCase().includes(form.typeText.toLowerCase()),
                  )
                  .map((type) => (
                    <button
                      key={type}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        set("typeText", type);
                        set("topic", type);
                        setShowTypeDrop(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img
                        src={DISASTER_ICONS[type]}
                        alt={type}
                        className="w-5 h-5 object-contain flex-shrink-0"
                      />
                      <span className="font-medium">{type}</span>
                    </button>
                  ))}
                {Object.keys(DISASTER_FIELDS).filter(
                  (t) =>
                    !form.typeText ||
                    t.toLowerCase().includes(form.typeText.toLowerCase()),
                ).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
                    No match — custom type will be used
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description + char counter */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClass.replace("mb-1.5 ", "")}>
                Description *
              </label>
              <span
                className={`text-xs font-medium ${form.description.length > 400 ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}
              >
                {form.description.length}/500
              </span>
            </div>
            <textarea
              className={`${inputClass} resize-y min-h-[80px]`}
              value={form.description}
              maxLength={500}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your research scope, methodology, and findings..."
            />
          </div>

          {/* Upload type toggle */}
          <div>
            <label className={labelClass}>Upload Method *</label>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {[
                { val: "file", icon: FiUploadCloud, label: "File" },
                { val: "link", icon: FiGlobe, label: "Link" },
                { val: "text", icon: FiFileText, label: "Text" },
              ].map(({ val, icon: Icon, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("uploadType", val)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${
                    form.uploadType === val
                      ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional upload field */}
          {form.uploadType === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div
                onClick={() => fileRef.current.click()}
                className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200
                ${
                  dragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]"
                    : file
                      ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                }`}
              >
                <FiUploadCloud
                  size={28}
                  className={`mx-auto mb-2 ${file ? "text-green-500" : "text-gray-300 dark:text-gray-600"}`}
                />
                <p
                  className={`text-sm font-semibold ${file ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {file ? file.name : "Drag & drop or click to select a file"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PDF, DOCX, PPTX, Images supported
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          )}

          {form.uploadType === "link" && (
            <div>
              <label className={labelClass}>External URL *</label>
              <input
                className={inputClass}
                value={form.link}
                onChange={(e) => set("link", e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          {form.uploadType === "text" && (
            <div>
              <label className={labelClass}>Research Text *</label>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={form.text}
                onChange={(e) => set("text", e.target.value)}
                placeholder="Write your research content here..."
              />
            </div>
          )}

          <ActionButtons
            onCancel={() => navigate("/")}
            submitLabel="Submit Research"
            loading={loading}
          />
        </form>
      </div>
      <ResearchSubmissions history={history} />
    </>
  );
}

// ── Switch Pill Button (neumorphic, theme-aware) ───────────────────────────
function SwitchPillBtn({ onClick, label, icon: Icon, isDark }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "6px 14px 6px 8px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
        outline: "none",
        flexShrink: 0,
        // Resting = already at hover level — always elevated
        background: isDark
          ? "linear-gradient(145deg, #1e1e2e, #0d0d18)"
          : "linear-gradient(145deg, #ffffff, #eaecf0)",
        boxShadow: isDark
          ? "0 5px 18px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.09)"
          : "0 5px 16px rgba(0,0,0,0.20), 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.96)",
        transform: "scale(1.04)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.07)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 26px rgba(0,0,0,0.85), 0 3px 8px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.11)"
          : "0 8px 24px rgba(0,0,0,0.26), 0 3px 8px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.98)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1.04)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 5px 18px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.09)"
          : "0 5px 16px rgba(0,0,0,0.20), 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.96)";
      }}
    >
      {/* Raised dot */}
      <span
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? "linear-gradient(145deg, #e8eaf0, #c8cad8)"
            : "linear-gradient(145deg, #1e1e2e, #111118)",
          boxShadow: isDark
            ? "0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.65)"
            : "0 2px 6px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <Icon size={10} style={{ color: isDark ? "#1e1e2e" : "#e8eaf0" }} />
      </span>
      {/* Label */}
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.01em",
          color: isDark ? "#e8eaf0" : "#1e1e2e",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ── Disaster Data Upload Panel ────────────────────────────────────────────
function DisasterPanel({ currentUser, onOpenResearch }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [disasterType, setDisasterType] = useState("");
  const [file, setFile] = useState(null);
  const [uploadLink, setUploadLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const fileRef = useRef();

  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const mine = data.filter(
          (u) =>
            u.uploadedBy === (currentUser?.fullName || currentUser?.username) &&
            u.title?.startsWith("Disaster Data:"),
        );
        setHistory(mine.slice(0, 6));
        setStats({
          total: mine.length,
          approved: mine.filter((u) => u.status === "approved").length,
          pending: mine.filter((u) => u.status === "pending").length,
        });
      })
      .catch(() => {});
  }, [currentUser]);

  const validate = () => {
    if (!disasterType) return "Please select a disaster type.";
    if (file && uploadLink.trim())
      return "Please provide either a file or a link, not both.";
    if (!file && !uploadLink.trim())
      return "Please attach a file/image or add a link.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      const uploaderName =
        currentUser?.fullName || currentUser?.username || "LEO member";

      if (file) {
        formData.append("file", file);
      } else {
        const blob = new Blob([uploadLink], { type: "text/plain" });
        const pseudoFile = new File([blob], "link-entry.txt", {
          type: "text/plain",
        });
        formData.append("file", pseudoFile);
        formData.append("uploadType", "link");
        formData.append("content", uploadLink.trim());
      }

      formData.append("title", `Disaster Data: ${disasterType}`);
      formData.append("hazardType", disasterType.toLowerCase());
      formData.append(
        "description",
        uploadLink.trim() ? `Link: ${uploadLink.trim()}` : "",
      );
      formData.append("uploadedBy", uploaderName);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const e2 = await res.json().catch(() => ({}));
        throw new Error(e2.error || `Server error ${res.status}`);
      }
      const saved = await res.json();

      // Also keep in localStorage for LocalDisasterData backward compat
      const entry = {
        id: saved._id,
        userId: currentUser?.id,
        uploadedBy: uploaderName,
        disasterType,
        fileName: saved.fileName,
        fileType: saved.fileType,
        fileData: null,
        path: saved.path,
        link: uploadLink.trim() || null,
        status: saved.status || "pending",
        date: new Date().toLocaleString(),
      };
      const all = JSON.parse(localStorage.getItem("disasterUploads") || "[]");
      const updated = [
        ...all.filter((u) => u.disasterType !== disasterType),
        entry,
      ];
      localStorage.setItem("disasterUploads", JSON.stringify(updated));

      setHistory((h) =>
        [entry, ...h.filter((u) => u.disasterType !== disasterType)].slice(
          0,
          6,
        ),
      );
      setStats((s) => ({ ...s, total: s.total + 1, pending: s.pending + 1 }));
      setDisasterType("");
      setFile(null);
      setUploadLink("");
      if (fileRef.current) fileRef.current.value = "";
      setLoading(false);
      setToast({
        message: "Disaster data submitted. Pending admin approval.",
        type: "success",
      });
    } catch (error) {
      setLoading(false);
      setToast({
        message: error.message.includes("fetch")
          ? "Could not reach the server. Make sure the backend is running."
          : error.message,
        type: "error",
      });
    }
  };

  const accentColor = disasterType ? DISASTER_COLORS[disasterType] : "#1f4fd8";
  const hasUpload = Boolean(file || uploadLink.trim());

  return (
    <>
      <div className={cardClass}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Panel header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
                <FiGlobe size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                  Submit Local Data
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Report hazard observations for review
                </p>
              </div>
            </div>

            {/* Research upload pill button */}
            <SwitchPillBtn
              onClick={onOpenResearch}
              label="Upload Research"
              icon={FiBookOpen}
              isDark={isDark}
            />
          </div>

          {/* Stats row removed */}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Disaster type selector */}
          <div>
            <label className={labelClass}>Select Disaster Type *</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {Object.keys(DISASTER_FIELDS).map((type) => {
                const isSelected = disasterType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDisasterType(type)}
                    className={`flex flex-col items-center py-5 px-1 rounded-xl border-2 font-semibold text-xs transition-all duration-200 cursor-pointer
                    ${
                      isSelected
                        ? "border-transparent text-white shadow-md scale-[1.05]"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    style={
                      isSelected
                        ? {
                            background: `linear-gradient(135deg, ${DISASTER_COLORS[type]}, ${DISASTER_COLORS[type]}bb)`,
                            boxShadow: `0 6px 16px ${DISASTER_COLORS[type]}44`,
                          }
                        : {}
                    }
                  >
                    <img
                      src={DISASTER_ICONS[type]}
                      alt={type}
                      className="w-7 h-7 mb-1 object-contain"
                    />
                    <span className="text-[10px] font-bold leading-tight">
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload section — always visible, mutually exclusive */}
          <div className="space-y-4">
            {/* Colored accent bar — only when type selected */}
            {disasterType && (
              <div
                className="h-1 rounded-full w-full opacity-70"
                style={{
                  background: `linear-gradient(to right, ${accentColor}, transparent)`,
                }}
              />
            )}

            {/* File upload — disabled when link is filled */}
            <div>
              <label className={labelClass}>Attach File or Image</label>
              <div
                onClick={() => !uploadLink.trim() && fileRef.current.click()}
                className="rounded-xl border-2 border-dashed p-5 text-center transition-all"
                style={{
                  borderColor: uploadLink.trim()
                    ? "rgba(156,163,175,0.4)"
                    : disasterType
                      ? `${accentColor}66`
                      : "rgba(156,163,175,0.5)",
                  background: uploadLink.trim()
                    ? "rgba(156,163,175,0.06)"
                    : disasterType
                      ? `${accentColor}08`
                      : "rgba(156,163,175,0.04)",
                  cursor: uploadLink.trim() ? "not-allowed" : "pointer",
                  opacity: uploadLink.trim() ? 0.5 : 1,
                }}
              >
                <FiUploadCloud
                  size={26}
                  className="mx-auto mb-1.5"
                  style={{
                    color: file
                      ? "#16a34a"
                      : uploadLink.trim()
                        ? "#9ca3af"
                        : accentColor,
                  }}
                />
                <span
                  className="text-sm font-semibold block"
                  style={{
                    color: file
                      ? "#16a34a"
                      : uploadLink.trim()
                        ? "#9ca3af"
                        : "#6b7280",
                  }}
                >
                  {uploadLink.trim()
                    ? "Locked — clear the link to upload a file"
                    : file
                      ? file.name
                      : "Click to attach file or image"}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                  PDF, images, CSV, JSON, TXT, DOC, XLS
                </span>
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,.csv,.json,.txt,.pdf,.doc,.docx,.xls,.xlsx"
                disabled={!!uploadLink.trim()}
                onChange={(e) => {
                  if (!uploadLink.trim()) setFile(e.target.files[0]);
                }}
              />
              {file && !uploadLink.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="mt-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <FiX size={11} /> Remove file
                </button>
              )}
            </div>

            {/* Link input — disabled when file is selected */}
            <div>
              <label className={labelClass}>Or Add External Link</label>
              <input
                className={inputClass}
                style={{
                  borderColor: file
                    ? "rgba(156,163,175,0.4)"
                    : disasterType
                      ? `${accentColor}55`
                      : undefined,
                  opacity: file ? 0.5 : 1,
                  cursor: file ? "not-allowed" : "text",
                }}
                type="url"
                placeholder={
                  file
                    ? "Locked — remove the file to enter a link"
                    : "https://example.com/disaster-report"
                }
                value={uploadLink}
                disabled={!!file}
                onChange={(e) => {
                  if (!file) setUploadLink(e.target.value);
                }}
              />
              {file && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <FiX size={11} className="text-amber-400" />
                  Remove the file above to enter a link instead
                </p>
              )}
            </div>
          </div>

          {/* Progress / status indicator */}
          {disasterType && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span
                className={`w-2 h-2 rounded-full ${disasterType ? "bg-green-400" : "bg-gray-300"}`}
              />
              Type selected
              <span className="mx-1 text-gray-200 dark:text-gray-700">·</span>
              <span
                className={`w-2 h-2 rounded-full ${hasUpload ? "bg-green-400" : "bg-gray-300"}`}
              />
              {hasUpload ? "File/link ready" : "Awaiting file or link"}
            </div>
          )}

          <ActionButtons
            onCancel={() => navigate("/")}
            submitLabel="Submit Data"
            loading={loading}
            disabled={!disasterType || !hasUpload}
            accentColor={disasterType && hasUpload ? accentColor : null}
          />
        </form>
      </div>
      <DisasterSubmissions history={history} />
    </>
  );
}

// ── My Local Data Submissions Section ─────────────────────────────────────
function DisasterSubmissions({ history }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selected, setSelected] = useState(null);

  if (!history || history.length === 0) return null;

  return (
    <>
      {selected && (
        <SubmissionModal item={selected} onClose={() => setSelected(null)} />
      )}
      <div
        className="mt-8 relative overflow-hidden rounded-2xl shadow-xl"
        style={{
          background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
          border: isDark
            ? "1.5px solid rgba(255,255,255,0.10)"
            : "1.5px solid rgba(99,102,241,0.18)",
          padding: "24px",
        }}
      >
        {/* top-left glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "-40px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        {/* bottom-right glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            right: "-40px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        {/* content */}
        <div className="relative" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <FiGlobe
                size={15}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
                My Local Data Submissions
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {history.length} submission{history.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {history.map((r) => {
              const dType =
                r.disasterType ||
                (r.hazardType
                  ? r.hazardType.charAt(0).toUpperCase() + r.hazardType.slice(1)
                  : "");
              const iconSrc =
                DISASTER_ICONS[dType] ||
                "/icons/icons8-environmental-hazard-100.png";
              const status = r.status || "pending";
              const statusCls =
                status === "approved"
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : status === "rejected"
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400";
              return (
                <button
                  key={r._id || r.id}
                  onClick={() =>
                    setSelected({
                      ...r,
                      title: r.title || dType,
                      hazardType: r.hazardType || r.disasterType?.toLowerCase(),
                    })
                  }
                  style={{
                    textAlign: "left",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    background: isDark
                      ? "linear-gradient(145deg, rgba(31,41,55,0.80), rgba(17,24,39,0.60))"
                      : "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,249,251,0.85))",
                    border: isDark
                      ? "1.5px solid rgba(255,255,255,0.10)"
                      : "1.5px solid rgba(139,92,246,0.20)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    minHeight: "88px",
                    boxShadow: isDark
                      ? "0 2px 10px rgba(0,0,0,0.35)"
                      : "0 2px 10px rgba(0,0,0,0.07)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 6px 20px rgba(0,0,0,0.50)"
                      : "0 6px 20px rgba(139,92,246,0.18)";
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(139,92,246,0.40)"
                      : "rgba(139,92,246,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isDark
                      ? "0 2px 10px rgba(0,0,0,0.35)"
                      : "0 2px 10px rgba(0,0,0,0.07)";
                    e.currentTarget.style.borderColor = isDark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(139,92,246,0.20)";
                  }}
                >
                  <img
                    src={iconSrc}
                    alt={dType}
                    className="w-7 h-7 object-contain flex-shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                      {dType || "Local Data"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${statusCls}`}
                      >
                        {status}
                      </span>
                    </div>
                    {r.date && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(r.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showResearch, setShowResearch] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);

    const notifications = JSON.parse(
      localStorage.getItem("notifications") || "[]",
    );
    const unread = notifications.find(
      (n) => n.userId === user.id && !n.read && n.type === "approve",
    );
    if (unread) {
      setNotification(unread.message);
      const updated = notifications.map((n) =>
        n.id === unread.id ? { ...n, read: true } : n,
      );
      localStorage.setItem("notifications", JSON.stringify(updated));
    }
  }, [navigate]);

  const handleLogout = async () => {
    // Revoke the Remember Me token from the database and clear the cookie
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen pb-6 text-gray-900 dark:text-white">
      {/* ── Header card — ambient glow style ── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 mb-7">
        <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm px-6 py-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* Ambient glow — bottom-left soft indigo */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "-60px",
              left: "-60px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(99,102,241,0.03) 50%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          {/* Ambient glow — top-right soft indigo */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-60px",
              right: "-60px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(99,102,241,0.03) 50%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />

          {/* Left: label + title + description */}
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
              LEO Portal
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Member Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Welcome back,{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {currentUser.fullName}
              </span>
              {currentUser.designation && (
                <span className="text-gray-400 dark:text-gray-500">
                  {" · "}
                  {currentUser.designation}
                </span>
              )}
            </p>
          </div>

          {/* Right: action buttons */}
          <div className="relative flex items-center gap-2">
            {notification && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                <FiBell size={14} />
                <span className="text-xs font-semibold">1 new</span>
              </div>
            )}
            <button
              onClick={() => navigate("/contact")}
              title="My Profile"
              className="w-11 h-11 flex items-center justify-center rounded-full text-white font-extrabold text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 select-none flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #312e81 0%, #4c1d95 100%)",
              }}
            >
              {currentUser.fullName
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || <FiUser size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Approval notification banner ── */}
      {notification && (
        <div className="px-4 sm:px-6 lg:px-8 mb-5">
          <div className="flex items-center gap-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4 shadow-sm">
            <FiCheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <p className="flex-1 text-sm font-semibold text-green-700 dark:text-green-300">
              {notification}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Full-width panel — switches between Local Data and Research ── */}
      <div className="px-4 sm:px-6 lg:px-8">
        {showResearch ? (
          <ResearchPanel
            currentUser={currentUser}
            onGoBack={() => setShowResearch(false)}
          />
        ) : (
          <DisasterPanel
            currentUser={currentUser}
            onOpenResearch={() => setShowResearch(true)}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
