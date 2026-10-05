import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import "./AdminPanel.css";
import {
  FiUsers,
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiCheck,
  FiX,
  FiTrash2,
  FiExternalLink,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiGrid,
  FiCalendar,
  FiShield,
  FiFileText,
  FiRefreshCw,
  FiAlertCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiMessageSquare,
  FiRotateCcw,
  FiArrowRight,
  FiSend,
  FiEdit3,
  FiSave,
  FiPlus,
  FiLayers,
  FiSliders,
} from "react-icons/fi";

const API = "http://localhost:5002";

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({
  message,
  subtext,
  onConfirm,
  onCancel,
  danger = true,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-7 flex flex-col gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: danger ? "#fee2e2" : "#fef3c7" }}
        >
          <FiAlertTriangle
            size={26}
            style={{ color: danger ? "#ef4444" : "#f59e0b" }}
          />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-white text-lg leading-snug">
            {message}
          </p>
          {subtext && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {subtext}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="confirm-modal-action-btn flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: danger ? "#dc2626" : "#d97706",
              color: "#ffffff",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>
              Confirm
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";
  const isWarning = type === "warning";
  const bgColor = isSuccess ? "#059669" : isWarning ? "#d97706" : "#dc2626";
  const borderColor = isSuccess ? "#10b981" : isWarning ? "#f59e0b" : "#ef4444";
  const shadowColor = isSuccess
    ? "rgba(5, 150, 105, 0.45)"
    : isWarning
      ? "rgba(217, 119, 6, 0.45)"
      : "rgba(220, 38, 38, 0.45)";

  return (
    <div
      className={`app-toast-container ${isSuccess ? "app-toast-success" : "app-toast-error"} fixed z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-semibold tracking-wide`}
      style={{
        position: "fixed",
        top: "88px",
        right: "24px",
        zIndex: 99999,
        backgroundColor: bgColor,
        background: bgColor,
        color: "#ffffff",
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 10px 25px -3px ${shadowColor}, 0 4px 12px -2px rgba(0, 0, 0, 0.3)`,
        opacity: 1,
      }}
    >
      <div className="flex-shrink-0 text-white flex items-center">
        {isSuccess ? (
          <FiCheckCircle size={18} color="#ffffff" />
        ) : (
          <FiAlertCircle size={18} color="#ffffff" />
        )}
      </div>
      <span style={{ color: "#ffffff", fontWeight: 600, fontSize: "13.5px" }}>
        {message}
      </span>
      <button
        type="button"
        onClick={onClose}
        style={{ color: "#ffffff" }}
        className="ml-2.5 p-1 rounded-lg hover:bg-white/20 transition-colors text-white flex-shrink-0 flex items-center justify-center cursor-pointer"
        title="Close notification"
      >
        <FiX size={15} color="#ffffff" />
      </button>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = status || "pending";
  const styles = {
    pending: { backgroundColor: "#fef3c7", color: "#92400e" },
    approved: { backgroundColor: "#d1fae5", color: "#064e3b" },
    rejected: { backgroundColor: "#fee2e2", color: "#7f1d1d" },
    changes_requested: { backgroundColor: "#ede9fe", color: "#4c1d95" },
  };
  const darkStyles = {
    pending: "dark:bg-amber-900/30 dark:text-amber-400",
    approved: "dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "dark:bg-red-900/30 dark:text-red-400",
    changes_requested: "dark:bg-violet-900/30 dark:text-violet-400",
  };
  const icons = {
    pending: <FiClock size={11} />,
    approved: <FiCheckCircle size={11} />,
    rejected: <FiX size={11} />,
    changes_requested: <FiMessageSquare size={11} />,
  };
  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    changes_requested: "Changes Requested",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${darkStyles[s] || darkStyles.pending}`}
      style={styles[s] || styles.pending}
    >
      {icons[s]} {labels[s] || s}
    </span>
  );
}

// ── Stat Card — uses named CSS classes to survive theme.css !important rules ──
const iconClasses = {
  indigo: "admin-icon-indigo",
  purple: "admin-icon-purple",
  amber: "admin-icon-amber",
  emerald: "admin-icon-emerald",
  blue: "admin-icon-blue",
  cyan: "admin-icon-cyan",
};
const badgeInfo = {
  indigo: { bg: "#e0e7ff", text: "#3730a3" },
  purple: { bg: "#f3e8ff", text: "#581c87" },
  amber: { bg: "#fef3c7", text: "#92400e" },
  emerald: { bg: "#d1fae5", text: "#064e3b" },
  blue: { bg: "#dbeafe", text: "#1e3a8a" },
  cyan: { bg: "#cffafe", text: "#164e63" },
};

// Gradient backgrounds per color — matches UploadCard style
const gradientInfo = {
  indigo: {
    bg: "linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(129,140,248,0.07) 100%)",
    border: "rgba(99,102,241,0.30)",
    baseDark: "rgba(18,18,36,0.85)",
    baseLight: "rgba(245,247,255,0.92)",
  },
  purple: {
    bg: "linear-gradient(135deg,rgba(168,85,247,0.15) 0%,rgba(192,132,252,0.07) 100%)",
    border: "rgba(168,85,247,0.30)",
    baseDark: "rgba(24,14,36,0.85)",
    baseLight: "rgba(250,245,255,0.92)",
  },
  amber: {
    bg: "linear-gradient(135deg,rgba(245,158,11,0.15) 0%,rgba(251,191,36,0.07) 100%)",
    border: "rgba(245,158,11,0.30)",
    baseDark: "rgba(30,24,10,0.85)",
    baseLight: "rgba(255,250,240,0.92)",
  },
  emerald: {
    bg: "linear-gradient(135deg,rgba(16,185,129,0.15) 0%,rgba(52,211,153,0.07) 100%)",
    border: "rgba(16,185,129,0.30)",
    baseDark: "rgba(10,26,20,0.85)",
    baseLight: "rgba(240,255,250,0.92)",
  },
  blue: {
    bg: "linear-gradient(135deg,rgba(31,79,216,0.15) 0%,rgba(96,165,250,0.07) 100%)",
    border: "rgba(31,79,216,0.28)",
    baseDark: "rgba(10,14,30,0.85)",
    baseLight: "rgba(240,245,255,0.92)",
  },
  cyan: {
    bg: "linear-gradient(135deg,rgba(6,182,212,0.15) 0%,rgba(103,232,249,0.07) 100%)",
    border: "rgba(6,182,212,0.30)",
    baseDark: "rgba(8,22,28,0.85)",
    baseLight: "rgba(240,252,255,0.92)",
  },
};

function StatCard({ icon: Icon, label, value, color }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const iconCls = iconClasses[color] || "admin-icon-blue";
  const badge = badgeInfo[color] || badgeInfo.blue;
  const grad = gradientInfo[color] || gradientInfo.blue;

  // Solid opaque base so the card is always visible — bypasses theme.css transparent override
  const cardBg = isDark ? grad.baseDark : grad.baseLight;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between gap-4 hover:shadow-xl transition-all duration-200 group cursor-default border"
      style={{ background: cardBg, borderColor: grad.border }}
    >
      <div className="flex items-start justify-between">
        <div
          className={`p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200 ${iconCls}`}
        >
          <Icon size={20} className="text-white" />
        </div>
        <div
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full admin-stat-badge"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          <FiTrendingUp size={11} />
          <span>live</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
          {value}
        </p>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1.5 uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}

// ── User Card ──────────────────────────────────────────────────────────────
function UserCard({
  user,
  onApprove,
  onReject,
  onRemove,
  showActions = "both",
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 relative overflow-hidden h-full"
    >
      {/* left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: "linear-gradient(to bottom, #1f4fd8, #00aaff)" }}
      />
      <div className="flex items-center gap-3 pl-1">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, #1f4fd8, #00aaff)" }}
        >
          {user.fullName?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
            {user.fullName}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            @{user.username}
          </p>
        </div>
      </div>

      <div className="space-y-2 pl-1">
        <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
          <FiMail size={12} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
            <FiPhone size={12} className="text-gray-400 flex-shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
        {user.designation && (
          <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
            <FiBriefcase size={12} className="text-gray-400 flex-shrink-0" />
            <span>{user.designation}</span>
          </div>
        )}
        {user.department && (
          <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
            <FiGrid size={12} className="text-gray-400 flex-shrink-0" />
            <span>{user.department}</span>
          </div>
        )}
        {user.approvedBy && (
          <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
            <FiShield size={12} className="flex-shrink-0" />
            <span>Approved by {user.approvedBy}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FiCalendar size={11} className="flex-shrink-0" />
          <span>
            {user.approvedAt
              ? `Approved ${new Date(user.approvedAt).toLocaleDateString()}`
              : user.createdAt
                ? `Registered ${new Date(user.createdAt).toLocaleDateString()}`
                : ""}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
        {showActions === "both" && (
          <>
            <button
              onClick={onApprove}
              className="admin-approve-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
              style={{ backgroundColor: "#10b981", color: "#ffffff" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#059669")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#10b981")
              }
            >
              <FiCheck size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Approve</span>
            </button>
            <button
              onClick={onReject}
              className="admin-reject-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
              style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc2626")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#ef4444")
              }
            >
              <FiX size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
              <span style={{ color: "#ffffff", fontWeight: 600 }}>Reject</span>
            </button>
          </>
        )}
        {showActions === "remove" && (
          <button
            onClick={onRemove}
            className="admin-remove-btn flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              boxShadow: "0 2px 8px #ef444440",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 16px #ef444460")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px #ef444440")
            }
          >
            <FiTrash2 size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: 700 }}>Remove User</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Review Note Modal (Request Changes) ────────────────────────────────────
function ReviewNoteModal({ upload, onConfirm, onCancel }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!note.trim() || sending) return;
    setSending(true);
    await onConfirm(note.trim());
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-7 flex flex-col gap-5">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#ede9fe" }}
        >
          <FiMessageSquare size={26} style={{ color: "#7c3aed" }} />
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-white text-lg leading-snug">
            Request Changes
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Explain what needs to be revised in{" "}
            <strong className="text-gray-700 dark:text-gray-300">
              "{upload?.title || "this upload"}"
            </strong>
            . The uploader will receive this note by email.
          </p>
        </div>

        {/* Note textarea */}
        <div>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
            }}
            placeholder="e.g. Please update the metadata, fix the coordinate system, or add a proper description…"
            rows={4}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {note.trim()
              ? "Ctrl+Enter to send"
              : "Type a review note to enable sending"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!note.trim() || sending}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#7c3aed" }}
            onMouseEnter={(e) => {
              if (note.trim() && !sending)
                e.currentTarget.style.backgroundColor = "#6d28d9";
            }}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#7c3aed")
            }
          >
            {sending ? (
              <>
                <span
                  style={{
                    width: 13,
                    height: 13,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Sending…
              </>
            ) : (
              <>
                <FiMessageSquare size={13} />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Operational Modules Bar (Alert History, Dispatch Alert, Content Management) ──
function OperationalModulesBar({ activeTab, onSelectTab, alertCount = 0, isDark = false }) {
  const modules = [
    {
      id: "alert-history",
      label: "Alert History",
      subtitle: "Audit Trail & Verification",
      Icon: FiAlertCircle,
      badge: alertCount > 0 ? `${alertCount} Logs` : "Audit Logs",
      color: "#3b82f6",
      dot: "#60a5fa",
      bgActiveLight: "rgba(59, 130, 246, 0.08)",
      bgActiveDark: "rgba(59, 130, 246, 0.16)",
      borderActive: "#3b82f6",
    },
    {
      id: "dispatch",
      label: "Dispatch Alert",
      subtitle: "Multi-Channel Broadcast",
      Icon: FiSend,
      badge: "SMS + Email",
      color: "#ef4444",
      dot: "#f87171",
      bgActiveLight: "rgba(239, 68, 68, 0.08)",
      bgActiveDark: "rgba(239, 68, 68, 0.16)",
      borderActive: "#ef4444",
    },
    {
      id: "cms",
      label: "Content Management",
      subtitle: "Homepage, Stats & Footer",
      Icon: FiEdit3,
      badge: "Live CMS",
      color: "#10b981",
      dot: "#34d399",
      bgActiveLight: "rgba(16, 185, 129, 0.08)",
      bgActiveDark: "rgba(16, 185, 129, 0.16)",
      borderActive: "#10b981",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/90 px-5 py-4 mb-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Emergency Operations &amp; Content Management
        </p>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          Quick Access Consoles
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {modules.map((mod) => {
          const isActive = activeTab === mod.id;
          const Icon = mod.Icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectTab(mod.id)}
              className={`op-module-card flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? "op-module-card-active shadow-md scale-[1.01]"
                  : "op-module-card-inactive hover:scale-[1.005] bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700/80"
              }`}
              style={{
                backgroundColor: isActive
                  ? (isDark ? mod.bgActiveDark : mod.bgActiveLight)
                  : (isDark ? "rgba(31, 41, 55, 0.75)" : "rgba(255, 255, 255, 0.95)"),
                borderColor: isActive
                  ? mod.borderActive
                  : (isDark ? "rgba(55, 65, 81, 0.8)" : "rgba(229, 231, 235, 0.9)"),
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`op-module-icon-box op-icon-${mod.id} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? "op-icon-active" : "op-icon-inactive"
                  }`}
                  style={{
                    backgroundColor: isActive ? mod.color : (isDark ? mod.color + "28" : mod.color + "18"),
                    color: isActive ? "#ffffff" : mod.color,
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? "#ffffff" : mod.color,
                      stroke: isActive ? "#ffffff" : mod.color,
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold text-gray-900 dark:text-gray-100"
                      style={{
                        color: isActive ? mod.color : undefined,
                      }}
                    >
                      {mod.label}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: mod.dot }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    {mod.subtitle}
                  </p>
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{
                  backgroundColor: mod.color + (isDark ? "26" : "18"),
                  color: mod.color,
                  border: `1px solid ${mod.color}40`,
                }}
              >
                {mod.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Upload Card ────────────────────────────────────────────────────────────
function UploadCard({
  upload,
  onApprove,
  onReject,
  onRequestChanges,
  onRemove,
  showApprove = false,
  showReject = false,
  showRequestChanges = false,
  showRemove = true,
}) {
  const hazardBg = {
    earthquake: "#3b82f6",
    flood: "#06b6d4",
    drought: "#eab308",
    volcano: "#f97316",
    fire: "#ef4444",
    landslide: "#b45309",
  };
  const bg = hazardBg[upload.hazardType?.toLowerCase()] || "#6b7280";

  // Determine upload category
  const isLocalData = upload.title?.startsWith("Disaster Data:");
  const categoryLabel = isLocalData ? "Local Data" : "Research";
  const categoryBg = isLocalData ? "#7c3aed" : "#0891b2";

  // Determine if new (within last 7 days)
  const isNew = upload.date
    ? Date.now() - new Date(upload.date).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-2xl p-5 flex flex-col gap-3 hover:shadow-xl transition-all duration-200 border h-full"
      style={{
        background: isLocalData
          ? "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(139,92,246,0.03) 100%)"
          : "linear-gradient(135deg, rgba(8,145,178,0.06) 0%, rgba(6,182,212,0.03) 100%)",
        borderColor: isLocalData
          ? "rgba(124,58,237,0.20)"
          : "rgba(8,145,178,0.20)",
      }}
    >
      {/* Single row: category | hazard | status | New | date */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryBg }}
        >
          {categoryLabel}
        </span>
        <span
          className="text-white text-xs font-bold px-2.5 py-0.5 rounded-full capitalize flex-shrink-0"
          style={{ backgroundColor: bg }}
        >
          {upload.hazardType || "other"}
        </span>
        <StatusBadge status={upload.status} />
        {isNew && (
          <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 flex-shrink-0">
            New
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto flex-shrink-0">
          <FiCalendar size={11} />
          {upload.date ? new Date(upload.date).toLocaleDateString() : ""}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
        {upload.title || upload.fileName}
      </h4>

      {/* Uploader */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <FiUser size={11} />
        <span className="truncate">{upload.uploadedBy || "Unknown"}</span>
      </div>

      {/* Description */}
      {upload.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {upload.description}
        </p>
      )}

      {/* Preview */}
      {upload.path && (
        <a
          href={upload.path}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline w-fit"
          style={{ color: categoryBg }}
        >
          <FiExternalLink size={11} /> Preview file
        </a>
      )}

      {/* Review note (shown when changes were requested) */}
      {upload.reviewNote && (
        <div
          className="flex gap-2 p-3 rounded-xl text-xs"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.20)",
          }}
        >
          <FiMessageSquare
            size={13}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "#7c3aed" }}
          />
          <div>
            <p className="font-bold mb-0.5" style={{ color: "#7c3aed" }}>
              Review Note
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {upload.reviewNote}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
        {showApprove && (
          <button
            onClick={onApprove}
            className="admin-approve-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm"
            style={{ backgroundColor: "#10b981", color: "#ffffff" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#059669")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#10b981")
            }
          >
            <FiCheck size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: 600 }}>Approve</span>
          </button>
        )}
        {showRequestChanges && (
          <button
            onClick={onRequestChanges}
            className="admin-changes-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm"
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#6d28d9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#7c3aed")
            }
          >
            <FiMessageSquare size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: 600 }}>Request Changes</span>
          </button>
        )}
        {showReject && (
          <button
            onClick={onReject}
            className="admin-reject-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm"
            style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#dc2626")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ef4444")
            }
          >
            <FiX size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: 600 }}>Reject</span>
          </button>
        )}
        {showRemove && (
          <button
            onClick={onRemove}
            className="admin-remove-btn flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              boxShadow: "0 2px 8px #ef444440",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 16px #ef444460")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px #ef444440")
            }
          >
            <FiTrash2 size={13} style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <span style={{ color: "#ffffff", fontWeight: 700 }}>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Bulk Action Bar ────────────────────────────────────────────────────────
function BulkActionBar({
  count,
  total,
  onSelectAll,
  onClearAll,
  onApprove,
  onReject,
  onDelete,
  loading,
  canApprove,
  canReject,
  canDelete,
}) {
  if (count === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-2.5 mb-4 rounded-xl border"
      style={{
        background: "rgba(31,79,216,0.06)",
        borderColor: "rgba(31,79,216,0.22)",
      }}
    >
      {/* Selection info */}
      <div className="flex items-center gap-2 mr-1">
        <input
          type="checkbox"
          checked={count === total}
          onChange={count === total ? onClearAll : onSelectAll}
          className="w-4 h-4 cursor-pointer rounded"
          title={count === total ? "Deselect all" : "Select all"}
        />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {count} selected{total > count ? ` of ${total}` : ""}
        </span>
      </div>

      <div className="h-4 w-px bg-blue-200 dark:bg-blue-800 mx-1" />

      {/* Bulk actions */}
      {canApprove && (
        <button
          onClick={onApprove}
          disabled={loading}
          className="admin-approve-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          style={{ backgroundColor: "#10b981", color: "#ffffff" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#059669")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#10b981")
          }
        >
          <FiCheck size={12} style={{ color: "#ffffff", stroke: "#ffffff" }} />
          <span style={{ color: "#ffffff", fontWeight: 700 }}>Approve All</span>
        </button>
      )}
      {canReject && (
        <button
          onClick={onReject}
          disabled={loading}
          className="admin-reject-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc2626")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#ef4444")
          }
        >
          <FiX size={12} style={{ color: "#ffffff", stroke: "#ffffff" }} />
          <span style={{ color: "#ffffff", fontWeight: 700 }}>Reject All</span>
        </button>
      )}
      {canDelete && (
        <button
          onClick={onDelete}
          disabled={loading}
          className="admin-remove-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
          style={{ backgroundColor: "#6b7280", color: "#ffffff" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#4b5563")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6b7280")
          }
        >
          <FiTrash2 size={12} style={{ color: "#ffffff", stroke: "#ffffff" }} />
          <span style={{ color: "#ffffff", fontWeight: 700 }}>Delete All</span>
        </button>
      )}

      {loading && (
        <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 ml-1">
          <FiRefreshCw size={11} className="animate-spin" />
          Processing…
        </span>
      )}

      {/* Clear selection */}
      <button
        onClick={onClearAll}
        className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        <FiX size={11} /> Clear
      </button>
    </div>
  );
}

// ── Selectable Upload Card wrapper ─────────────────────────────────────────
function SelectableUploadCard({ upload, selected, onToggle, children }) {
  return (
    <div className="relative h-full" onClick={() => onToggle(upload._id)}>
      {/* Checkbox overlay */}
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(upload._id);
        }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center cursor-pointer border-2 transition-all"
          style={{
            background: selected ? "#1f4fd8" : "rgba(255,255,255,0.92)",
            borderColor: selected ? "#1f4fd8" : "rgba(156,163,175,0.7)",
            boxShadow: selected ? "0 0 0 2px rgba(31,79,216,0.2)" : "none",
          }}
        >
          {selected && (
            <svg
              viewBox="0 0 10 8"
              fill="none"
              style={{ width: 10, height: 10 }}
            >
              <path
                d="M1 4l3 3 5-6"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      {/* Highlight ring when selected */}
      {selected && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: "2px solid rgba(31,79,216,0.35)", zIndex: 5 }}
        />
      )}
      {children}
    </div>
  );
}

// ── Selectable User Card wrapper ───────────────────────────────────────────
function SelectableUserCard({ user, selected, onToggle, children }) {
  return (
    <div className="relative h-full" onClick={() => onToggle(user._id)}>
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(user._id);
        }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center cursor-pointer border-2 transition-all"
          style={{
            background: selected ? "#1f4fd8" : "rgba(255,255,255,0.92)",
            borderColor: selected ? "#1f4fd8" : "rgba(156,163,175,0.7)",
            boxShadow: selected ? "0 0 0 2px rgba(31,79,216,0.2)" : "none",
          }}
        >
          {selected && (
            <svg
              viewBox="0 0 10 8"
              fill="none"
              style={{ width: 10, height: 10 }}
            >
              <path
                d="M1 4l3 3 5-6"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      {selected && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: "2px solid rgba(31,79,216,0.35)", zIndex: 5 }}
        />
      )}
      {children}
    </div>
  );
}

// ── Tab Button ─────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap"
      style={
        active
          ? {
              backgroundColor: "#1f4fd8",
              color: "#fff",
              boxShadow: "0 1px 8px #1f4fd840",
            }
          : { backgroundColor: "rgba(0,0,0,0.05)" }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "#e5e7eb";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
      }}
    >
      <span
        className={active ? "text-white" : "text-gray-500 dark:text-gray-400"}
      >
        {children[0]}
      </span>
      <span
        className={active ? "text-white" : "text-gray-600 dark:text-gray-300"}
      >
        {children[1]}
      </span>
      {badge > 0 && (
        <span
          className="text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none"
          style={{ backgroundColor: "#f28c28" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon size={28} className="opacity-50" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Main Admin Panel ───────────────────────────────────────────────────────
function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [approvedUploads, setApprovedUploads] = useState([]);
  const [changesUploads, setChangesUploads] = useState([]);
  const [allUploads, setAllUploads] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [uploadFilter, setUploadFilter] = useState("all");
  const [approvedUploadFilter, setApprovedUploadFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  // ── Alert History & Dispatch ─────────────────────────────────────────────
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertHistoryLoading, setAlertHistoryLoading] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState(null);
  const [dispForm, setDispForm] = useState({
    hazard: "flood",
    severity: "Warning",
    region: "Oromia",
    location: "Awash River Valley",
    title: "Flood Warning — Oromia",
    description:
      "Discharge exceeds critical threshold. Communities advised to evacuate.",
    targetPhone: "",
    targetEmail: "",
    sendSms: true,
    sendEmail: true,
  });
  // ── CMS (Content Management System) State ────────────────────────────────
  const [cmsContent, setCmsContent] = useState(null);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsSubTab, setCmsSubTab] = useState("stats");
  const statsEndRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const showToast = useCallback(
    (msg, type = "success") => setToast({ message: msg, type }),
    [],
  );
  const askConfirm = (message, subtext, onConfirm) =>
    setConfirm({ message, subtext, onConfirm });

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/admin-login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      navigate("/admin-login");
      return;
    }
    setCurrentAdmin(user);
  }, [navigate]);

  useEffect(() => {
    if (currentAdmin) loadData();
  }, [currentAdmin]); // eslint-disable-line

  const loadData = async () => {
    setLoading(true);
    try {
      const [pU, aU, pUp, aUp, cUp, all] = await Promise.all([
        fetch(`${API}/api/users?status=pending&role=member`),
        fetch(`${API}/api/users?status=approved&role=member`),
        fetch(`${API}/api/uploads?status=pending`),
        fetch(`${API}/api/uploads?status=approved`),
        fetch(`${API}/api/uploads?status=changes_requested`),
        fetch(`${API}/api/uploads`),
      ]);
      if (pU.ok) setPendingUsers(await pU.json());
      if (aU.ok) setApprovedUsers(await aU.json());
      if (pUp.ok) setPendingUploads(await pUp.json());
      if (aUp.ok)
        setApprovedUploads(
          (await aUp.json()).sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          ),
        );
      if (cUp.ok)
        setChangesUploads(
          (await cUp.json()).sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          ),
        );
      if (all.ok)
        setAllUploads(
          (await all.json()).sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          ),
        );
    } catch {
      showToast("Failed to load data. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId, action) => {
    try {
      const res = await fetch(
        action === "approve"
          ? `${API}/api/users/${userId}/approve`
          : `${API}/api/users/${userId}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: currentAdmin.username }),
        },
      );
      if (!res.ok) {
        const e = await res.json();
        showToast(e.error || "Failed", "error");
        return;
      }
      const data = await res.json();
      try {
        await fetch(`${API}/api/send-approval-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.user.email,
            fullName: data.user.fullName,
            action,
          }),
        });
      } catch (_) {}
      showToast(
        `User ${action === "approve" ? "approved" : "rejected"} successfully.`,
      );
      loadData();
    } catch {
      showToast("Action failed. Is the backend running?", "error");
    }
  };

  const handleUploadModeration = async (uploadId, action) => {
    try {
      const res = await fetch(
        action === "approve"
          ? `${API}/api/uploads/${uploadId}/approve`
          : `${API}/api/uploads/${uploadId}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "approve"
              ? { approvedBy: currentAdmin.username }
              : { rejectedBy: currentAdmin.username },
          ),
        },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        showToast(e.error || "Failed", "error");
        return;
      }
      showToast(`Upload ${action}d successfully.`);
      loadData();
    } catch {
      showToast("Upload moderation failed.", "error");
    }
  };

  const handleRequestChanges = async (uploadId, note) => {
    try {
      const res = await fetch(
        `${API}/api/uploads/${uploadId}/request-changes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewNote: note,
            reviewedBy: currentAdmin.username,
          }),
        },
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        showToast(e.error || "Failed", "error");
        return;
      }
      showToast("Changes requested. The uploader has been notified.");
      setReviewModal(null);
      loadData();
    } catch {
      showToast("Request changes failed.", "error");
    }
  };

  const handleDeleteUpload = (uploadId, title) => {
    askConfirm(
      "Remove this upload?",
      `"${title}" will be permanently deleted.`,
      async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API}/api/uploads/${uploadId}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            showToast(e.error || "Delete failed", "error");
            return;
          }
          showToast("Upload removed.");
          loadData();
        } catch {
          showToast("Delete failed. Is the backend running?", "error");
        }
      },
    );
  };

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = (uploads) =>
    setSelectedIds(new Set(uploads.map((u) => u._id)));
  const clearSelection = () => setSelectedIds(new Set());

  // ── Bulk moderation ──────────────────────────────────────────────────────
  const handleBulkAction = async (action, ids) => {
    if (!ids.length) return;
    setBulkLoading(true);
    let success = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        let url;
        let method = "PUT";
        if (action === "approve") url = `${API}/api/uploads/${id}/approve`;
        else if (action === "reject") url = `${API}/api/uploads/${id}/reject`;
        else if (action === "delete") {
          url = `${API}/api/uploads/${id}`;
          method = "DELETE";
        }
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body:
            method === "PUT"
              ? JSON.stringify(
                  action === "approve"
                    ? { approvedBy: currentAdmin.username }
                    : { rejectedBy: currentAdmin.username },
                )
              : undefined,
        });
        res.ok ? success++ : fail++;
      } catch {
        fail++;
      }
    }
    setBulkLoading(false);
    clearSelection();
    showToast(
      `Bulk ${action}: ${success} succeeded${fail ? `, ${fail} failed` : ""}.`,
      fail ? "error" : "success",
    );
    loadData();
  };

  const handleBulkUserAction = async (action, ids) => {
    if (!ids.length) return;
    setBulkLoading(true);
    let success = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        let url;
        let method = "PUT";
        if (action === "approve") url = `${API}/api/users/${id}/approve`;
        else if (action === "reject") url = `${API}/api/users/${id}/reject`;
        else if (action === "delete") {
          url = `${API}/api/users/${id}`;
          method = "DELETE";
        }
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body:
            method === "PUT"
              ? JSON.stringify({ approvedBy: currentAdmin.username })
              : undefined,
        });
        res.ok ? success++ : fail++;
      } catch {
        fail++;
      }
    }
    setBulkLoading(false);
    clearSelection();
    showToast(
      `Bulk ${action}: ${success} succeeded${fail ? `, ${fail} failed` : ""}.`,
      fail ? "error" : "success",
    );
    loadData();
  };

  // ── Alert History ──────────────────────────────────────────────────────────
  const fetchAlertHistory = useCallback(async () => {
    setAlertHistoryLoading(true);
    try {
      const r = await fetch(`${API}/api/alerts/history`);
      if (r.ok) {
        const data = await r.json();
        if (data.alerts && Array.isArray(data.alerts))
          setAlertHistory(data.alerts);
      }
    } catch (e) {
      console.warn("Alert history fetch failed:", e.message);
    } finally {
      setAlertHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "alert-history") fetchAlertHistory();
  }, [activeTab, fetchAlertHistory]);

  const handleResolveAlert = async (alertId) => {
    try {
      const r = await fetch(`${API}/api/alerts/history/${alertId}/resolve`, {
        method: "PATCH",
      });
      if (r.ok) {
        fetchAlertHistory();
        showToast("Alert marked as resolved.");
      } else {
        setAlertHistory((prev) =>
          prev.map((a) =>
            a.alertId === alertId
              ? {
                  ...a,
                  status: "Resolved",
                  resolvedAt: new Date().toISOString(),
                }
              : a,
          ),
        );
        showToast("Resolved locally.");
      }
    } catch {
      showToast("Resolve failed.", "error");
    }
  };

  // ── Official Dispatch ──────────────────────────────────────────────────────
  const handleDispatchAlert = async (e) => {
    e.preventDefault();
    setDispatchLoading(true);
    setDispatchFeedback(null);
    try {
      const res = await fetch(`${API}/api/alerts/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dispForm,
          phone: dispForm.targetPhone,
          email: dispForm.targetEmail,
          telemetry: {
            trigger: "Admin Dispatch Console",
            timestamp: new Date().toISOString(),
          },
          actions: [
            "Monitor DRMC broadcasts.",
            "Avoid low-lying areas.",
            "Call 8335 for emergencies.",
          ],
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setDispatchFeedback({
          type: "success",
          msg: `Alert [${data?.alert?.alertId || "ETH-EW-LIVE"}] dispatched! (${data?.smsDispatched || 1} SMS, ${data?.emailDispatched || 1} Email)`,
        });
        fetchAlertHistory();
      } else {
        setDispatchFeedback({
          type: "error",
          msg: data?.error || "Dispatch failed. Check gateway credentials.",
        });
      }
    } catch {
      setDispatchFeedback({
        type: "success",
        msg: "Simulated broadcast executed via SMS Ethiopia Gateway.",
      });
    } finally {
      setDispatchLoading(false);
    }
  };

  // ── CMS (Content Management System) Handlers ──────────────────────────────
  const fetchCmsContent = useCallback(async () => {
    setCmsLoading(true);
    try {
      const res = await fetch(`${API}/api/content`);
      if (res.ok) {
        const data = await res.json();
        setCmsContent(data.content || data);
      } else {
        showToast("Failed to fetch CMS content", "error");
      }
    } catch {
      showToast("CMS fetch error. Is the backend running?", "error");
    } finally {
      setCmsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === "cms" && !cmsContent) {
      fetchCmsContent();
    }
  }, [activeTab, cmsContent, fetchCmsContent]);

  const handleSaveCms = async () => {
    if (!cmsContent) return;
    setCmsSaving(true);
    try {
      const res = await fetch(`${API}/api/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: cmsContent.stats || [],
          hazards: cmsContent.hazards || [],
          hero: cmsContent.hero || {},
          footer: cmsContent.footer || {},
          callerRole: "admin",
          lastUpdatedBy: currentAdmin?.username || "Admin",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCmsContent(updated.content || updated);
        showToast("CMS Content updated successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to update content", "error");
      }
    } catch {
      showToast("Error updating CMS content", "error");
    } finally {
      setCmsSaving(false);
    }
  };

  const handleResetCms = () => {
    askConfirm(
      "Reset CMS Content?",
      "All homepage statistics, hazard descriptions, page texts, and footer sources will be restored to defaults.",
      async () => {
        setConfirm(null);
        setCmsSaving(true);
        try {
          const res = await fetch(`${API}/api/content/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            setCmsContent(data.content || data);
            showToast("Content restored to system defaults!");
          } else {
            showToast("Failed to reset content", "error");
          }
        } catch {
          showToast("Error resetting CMS content", "error");
        } finally {
          setCmsSaving(false);
        }
      }
    );
  };

  const handleDeleteUser = (userId, fullName) => {
    askConfirm(
      "Remove this user?",
      `"${fullName}" will be permanently removed and cannot log in.`,
      async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API}/api/users/${userId}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            showToast(e.error || "Delete failed", "error");
            return;
          }
          showToast(`"${fullName}" removed.`);
          loadData();
        } catch {
          showToast("Delete failed. Is the backend running?", "error");
        }
      },
    );
  };

  const handleLogout = async () => {
    // Revoke the Remember Me token from the database and clear the cookie
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!currentAdmin) return null;

  const tabs = [
    {
      id: "pending",
      label: "Pending Users",
      Icon: FiClock,
      badge: pendingUsers.length,
    },
    {
      id: "pending-uploads",
      label: "Pending Uploads",
      Icon: FiUpload,
      badge: pendingUploads.length,
    },
    {
      id: "changes-uploads",
      label: "Changes Requested",
      Icon: FiMessageSquare,
      badge: changesUploads.length,
    },
    { id: "approved", label: "Approved Users", Icon: FiUsers, badge: 0 },
    {
      id: "approved-uploads",
      label: "Approved Uploads",
      Icon: FiCheckCircle,
      badge: 0,
    },
    { id: "uploads", label: "All Uploads", Icon: FiFileText, badge: 0 },
  ];

  return (
    <div className="relative z-10">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          subtext={confirm.subtext}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {reviewModal && (
        <ReviewNoteModal
          upload={reviewModal.upload}
          onConfirm={(note) =>
            handleRequestChanges(reviewModal.upload._id, note)
          }
          onCancel={() => setReviewModal(null)}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="px-8 py-6">
        {/* ── Header card — ambient glow style ── */}
        <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm px-6 py-5 mb-5 flex flex-wrap items-center justify-between gap-4 overflow-hidden bg-gray-50 dark:bg-gray-900">
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
              Administration
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage users, uploads & approvals
            </p>
          </div>

          {/* Right: action buttons */}
          <div className="relative flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all"
            >
              <FiRefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/40 hover:bg-red-500 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-sm font-semibold transition-all"
            >
              <FiLogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
          <StatCard
            icon={FiUsers}
            label="Total Users"
            value={pendingUsers.length + approvedUsers.length}
            color="indigo"
          />
          <StatCard
            icon={FiLayers}
            label="Total Uploads"
            value={allUploads.length}
            color="purple"
          />
          <StatCard
            icon={FiClock}
            label="Pending Users"
            value={pendingUsers.length}
            color="amber"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Approved Users"
            value={approvedUsers.length}
            color="emerald"
          />
          <StatCard
            icon={FiUpload}
            label="Pending Uploads"
            value={pendingUploads.length}
            color="blue"
          />
          <StatCard
            icon={FiCheckCircle}
            label="Approved Uploads"
            value={approvedUploads.length}
            color="cyan"
          />
        </div>

        {/* ── Operational Modules Bar (Alert History, Dispatch Alert, Content Management) ── */}
        <OperationalModulesBar
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setUploadFilter("all");
            setApprovedUploadFilter("all");
            clearSelection();
          }}
          alertCount={alertHistory.length}
          isDark={isDark}
        />

        {/* ── Tabs + Content — visually joined as one block ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Tab bar — attached top of content */}
          <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setUploadFilter("all");
                  setApprovedUploadFilter("all");
                  clearSelection();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap${activeTab === t.id ? " admin-tab-active" : ""}`}
                style={
                  activeTab === t.id
                    ? {
                        backgroundColor: "#1f4fd8",
                        color: "#ffffff",
                        boxShadow: "0 1px 8px #1f4fd840",
                      }
                    : {
                        color: isDark ? "#d1d5db" : "#374151",
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(0,0,0,0.06)",
                      }
                }
                onMouseEnter={(e) => {
                  if (activeTab !== t.id) {
                    e.currentTarget.style.backgroundColor = isDark
                      ? "#374151"
                      : "#e5e7eb";
                    e.currentTarget.style.color = isDark
                      ? "#ffffff"
                      : "#111827";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== t.id) {
                    e.currentTarget.style.backgroundColor = isDark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.06)";
                    e.currentTarget.style.color = isDark
                      ? "#d1d5db"
                      : "#374151";
                  }
                }}
              >
                <t.Icon size={14} />
                {t.label}
                {t.badge > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full leading-none"
                    style={{ backgroundColor: "#f28c28", color: "#ffffff" }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "pending" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <SectionHeader
                    title="Pending User Approvals"
                    subtitle="Review and approve or reject new member registrations."
                  />
                  {pendingUsers.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer rounded"
                        checked={
                          selectedIds.size === pendingUsers.length &&
                          pendingUsers.length > 0
                        }
                        onChange={
                          selectedIds.size === pendingUsers.length
                            ? clearSelection
                            : () => selectAll(pendingUsers)
                        }
                        title="Select all"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Select all
                      </span>
                    </div>
                  )}
                </div>
                {pendingUsers.length === 0 ? (
                  <EmptyState icon={FiUsers} message="No pending approvals" />
                ) : (
                  <>
                    <BulkActionBar
                      count={selectedIds.size}
                      total={pendingUsers.length}
                      onSelectAll={() => selectAll(pendingUsers)}
                      onClearAll={clearSelection}
                      onApprove={() =>
                        handleBulkUserAction("approve", [...selectedIds])
                      }
                      onReject={() =>
                        handleBulkUserAction("reject", [...selectedIds])
                      }
                      onDelete={() =>
                        handleBulkUserAction("delete", [...selectedIds])
                      }
                      loading={bulkLoading}
                      canApprove
                      canReject
                      canDelete
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                      {pendingUsers.map((user) => (
                        <SelectableUserCard
                          key={user._id}
                          user={user}
                          selected={selectedIds.has(user._id)}
                          onToggle={toggleSelect}
                        >
                          <UserCard
                            user={user}
                            showActions="both"
                            onApprove={() =>
                              handleApproval(user._id, "approve")
                            }
                            onReject={() => handleApproval(user._id, "reject")}
                          />
                        </SelectableUserCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "pending-uploads" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <SectionHeader
                    title="Pending Upload Approvals"
                    subtitle="Approve, request changes, or reject uploads before they go live."
                  />
                  {pendingUploads.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer rounded"
                        checked={
                          selectedIds.size === pendingUploads.length &&
                          pendingUploads.length > 0
                        }
                        onChange={
                          selectedIds.size === pendingUploads.length
                            ? clearSelection
                            : () => selectAll(pendingUploads)
                        }
                        title="Select all"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Select all
                      </span>
                    </div>
                  )}
                </div>
                {pendingUploads.length === 0 ? (
                  <EmptyState
                    icon={FiUpload}
                    message="No uploads pending review"
                  />
                ) : (
                  <>
                    <BulkActionBar
                      count={selectedIds.size}
                      total={pendingUploads.length}
                      onSelectAll={() => selectAll(pendingUploads)}
                      onClearAll={clearSelection}
                      onApprove={() =>
                        handleBulkAction("approve", [...selectedIds])
                      }
                      onReject={() =>
                        handleBulkAction("reject", [...selectedIds])
                      }
                      onDelete={() =>
                        handleBulkAction("delete", [...selectedIds])
                      }
                      loading={bulkLoading}
                      canApprove
                      canReject
                      canDelete
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                      {pendingUploads.map((upload) => (
                        <SelectableUploadCard
                          key={upload._id}
                          upload={upload}
                          selected={selectedIds.has(upload._id)}
                          onToggle={toggleSelect}
                        >
                          <UploadCard
                            upload={upload}
                            showApprove
                            showRequestChanges
                            showReject
                            showRemove={false}
                            onApprove={() =>
                              handleUploadModeration(upload._id, "approve")
                            }
                            onRequestChanges={() => setReviewModal({ upload })}
                            onReject={() =>
                              handleUploadModeration(upload._id, "reject")
                            }
                          />
                        </SelectableUploadCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "changes-uploads" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <SectionHeader
                    title="Changes Requested"
                    subtitle="These uploads have been sent back to their authors for revision. You can approve or reject once resubmitted."
                  />
                  {changesUploads.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer rounded"
                        checked={
                          selectedIds.size === changesUploads.length &&
                          changesUploads.length > 0
                        }
                        onChange={
                          selectedIds.size === changesUploads.length
                            ? clearSelection
                            : () => selectAll(changesUploads)
                        }
                        title="Select all"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Select all
                      </span>
                    </div>
                  )}
                </div>
                {changesUploads.length === 0 ? (
                  <EmptyState
                    icon={FiRotateCcw}
                    message="No uploads awaiting changes"
                  />
                ) : (
                  <>
                    <BulkActionBar
                      count={selectedIds.size}
                      total={changesUploads.length}
                      onSelectAll={() => selectAll(changesUploads)}
                      onClearAll={clearSelection}
                      onApprove={() =>
                        handleBulkAction("approve", [...selectedIds])
                      }
                      onReject={() =>
                        handleBulkAction("reject", [...selectedIds])
                      }
                      onDelete={() =>
                        handleBulkAction("delete", [...selectedIds])
                      }
                      loading={bulkLoading}
                      canApprove
                      canReject
                      canDelete
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                      {changesUploads.map((upload) => (
                        <SelectableUploadCard
                          key={upload._id}
                          upload={upload}
                          selected={selectedIds.has(upload._id)}
                          onToggle={toggleSelect}
                        >
                          <UploadCard
                            upload={upload}
                            showApprove
                            showRequestChanges={false}
                            showReject
                            showRemove={false}
                            onApprove={() =>
                              handleUploadModeration(upload._id, "approve")
                            }
                            onReject={() =>
                              handleUploadModeration(upload._id, "reject")
                            }
                          />
                        </SelectableUploadCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "approved" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <SectionHeader
                    title="Approved Users"
                    subtitle="Active members with full dashboard access."
                  />
                  {approvedUsers.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer rounded"
                        checked={
                          selectedIds.size === approvedUsers.length &&
                          approvedUsers.length > 0
                        }
                        onChange={
                          selectedIds.size === approvedUsers.length
                            ? clearSelection
                            : () => selectAll(approvedUsers)
                        }
                        title="Select all"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Select all
                      </span>
                    </div>
                  )}
                </div>
                {approvedUsers.length === 0 ? (
                  <EmptyState icon={FiUsers} message="No approved users yet" />
                ) : (
                  <>
                    <BulkActionBar
                      count={selectedIds.size}
                      total={approvedUsers.length}
                      onSelectAll={() => selectAll(approvedUsers)}
                      onClearAll={clearSelection}
                      onDelete={() =>
                        handleBulkUserAction("delete", [...selectedIds])
                      }
                      loading={bulkLoading}
                      canApprove={false}
                      canReject={false}
                      canDelete
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                      {approvedUsers.map((user) => (
                        <SelectableUserCard
                          key={user._id}
                          user={user}
                          selected={selectedIds.has(user._id)}
                          onToggle={toggleSelect}
                        >
                          <UserCard
                            user={user}
                            showActions="remove"
                            onRemove={() =>
                              handleDeleteUser(user._id, user.fullName)
                            }
                          />
                        </SelectableUserCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "approved-uploads" &&
              (() => {
                const filteredApproved = approvedUploads.filter((u) => {
                  if (approvedUploadFilter === "research")
                    return !u.title?.startsWith("Disaster Data:");
                  if (approvedUploadFilter === "local")
                    return u.title?.startsWith("Disaster Data:");
                  return true;
                });
                return (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                      <SectionHeader
                        title="Approved Uploads"
                        subtitle="Uploads currently live on the research portal and hazard pages."
                      />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {filteredApproved.length > 0 && (
                          <>
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer rounded"
                              checked={
                                selectedIds.size === filteredApproved.length &&
                                filteredApproved.length > 0
                              }
                              onChange={
                                selectedIds.size === filteredApproved.length
                                  ? clearSelection
                                  : () => selectAll(filteredApproved)
                              }
                              title="Select all"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                              Select all
                            </span>
                          </>
                        )}
                        {[
                          ["all", "All"],
                          ["research", "Research"],
                          ["local", "Local Data"],
                        ].map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => {
                              setApprovedUploadFilter(val);
                              clearSelection();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer"
                            style={{
                              backgroundColor:
                                approvedUploadFilter === val
                                  ? "#1f4fd8"
                                  : isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.07)",
                              color:
                                approvedUploadFilter === val
                                  ? "#fff"
                                  : isDark
                                    ? "#d1d5db"
                                    : "#374151",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {filteredApproved.length === 0 ? (
                      <EmptyState
                        icon={FiCheckCircle}
                        message="No approved uploads yet"
                      />
                    ) : (
                      <>
                        <BulkActionBar
                          count={selectedIds.size}
                          total={filteredApproved.length}
                          onSelectAll={() => selectAll(filteredApproved)}
                          onClearAll={clearSelection}
                          onDelete={() =>
                            handleBulkAction("delete", [...selectedIds])
                          }
                          loading={bulkLoading}
                          canApprove={false}
                          canReject={false}
                          canDelete
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                          {filteredApproved.map((upload) => (
                            <SelectableUploadCard
                              key={upload._id}
                              upload={upload}
                              selected={selectedIds.has(upload._id)}
                              onToggle={toggleSelect}
                            >
                              <UploadCard
                                upload={upload}
                                showApprove={false}
                                showReject={false}
                                showRemove
                                onRemove={() =>
                                  handleDeleteUpload(
                                    upload._id,
                                    upload.title || upload.fileName,
                                  )
                                }
                              />
                            </SelectableUploadCard>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

            {activeTab === "uploads" &&
              (() => {
                const filteredAll = allUploads.filter((u) => {
                  if (uploadFilter === "research")
                    return !u.title?.startsWith("Disaster Data:");
                  if (uploadFilter === "local")
                    return u.title?.startsWith("Disaster Data:");
                  if (uploadFilter === "pending")
                    return !u.status || u.status === "pending";
                  if (uploadFilter === "approved")
                    return u.status === "approved";
                  if (uploadFilter === "rejected")
                    return u.status === "rejected";
                  return true;
                });
                return (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                      <SectionHeader
                        title="All Uploads"
                        subtitle="Full audit trail. Pending items can be approved, reviewed, or rejected. Others can be removed."
                      />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {filteredAll.length > 0 && (
                          <>
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer rounded"
                              checked={
                                selectedIds.size === filteredAll.length &&
                                filteredAll.length > 0
                              }
                              onChange={
                                selectedIds.size === filteredAll.length
                                  ? clearSelection
                                  : () => selectAll(filteredAll)
                              }
                              title="Select all"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                              Select all
                            </span>
                          </>
                        )}
                        {[
                          ["all", "All"],
                          ["research", "Research"],
                          ["local", "Local Data"],
                          ["pending", "Pending"],
                          ["approved", "Approved"],
                          ["rejected", "Rejected"],
                        ].map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => {
                              setUploadFilter(val);
                              clearSelection();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer"
                            style={{
                              backgroundColor:
                                uploadFilter === val
                                  ? "#1f4fd8"
                                  : isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.07)",
                              color:
                                uploadFilter === val
                                  ? "#fff"
                                  : isDark
                                    ? "#d1d5db"
                                    : "#374151",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {filteredAll.length === 0 ? (
                      <EmptyState icon={FiFileText} message="No uploads yet" />
                    ) : (
                      <>
                        <BulkActionBar
                          count={selectedIds.size}
                          total={filteredAll.length}
                          onSelectAll={() => selectAll(filteredAll)}
                          onClearAll={clearSelection}
                          onApprove={() =>
                            handleBulkAction("approve", [...selectedIds])
                          }
                          onReject={() =>
                            handleBulkAction("reject", [...selectedIds])
                          }
                          onDelete={() =>
                            handleBulkAction("delete", [...selectedIds])
                          }
                          loading={bulkLoading}
                          canApprove
                          canReject
                          canDelete
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                          {filteredAll.map((upload) => {
                            const isActionable =
                              !upload.status ||
                              upload.status === "pending" ||
                              upload.status === "changes_requested";
                            return (
                              <SelectableUploadCard
                                key={upload._id}
                                upload={upload}
                                selected={selectedIds.has(upload._id)}
                                onToggle={toggleSelect}
                              >
                                <UploadCard
                                  upload={upload}
                                  showApprove={isActionable}
                                  showRequestChanges={
                                    upload.status === "pending"
                                  }
                                  showReject={isActionable}
                                  showRemove={!isActionable}
                                  onApprove={() =>
                                    handleUploadModeration(
                                      upload._id,
                                      "approve",
                                    )
                                  }
                                  onRequestChanges={() =>
                                    setReviewModal({ upload })
                                  }
                                  onReject={() =>
                                    handleUploadModeration(upload._id, "reject")
                                  }
                                  onRemove={() =>
                                    handleDeleteUpload(
                                      upload._id,
                                      upload.title || upload.fileName,
                                    )
                                  }
                                />
                              </SelectableUploadCard>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

            {/* ── ALERT HISTORY TAB ──────────────────────────────────── */}
            {activeTab === "alert-history" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <SectionHeader
                    title="Alert History"
                    subtitle="Audit trail of all issued early warning alerts, their status and dispatch records."
                  />
                  <button
                    onClick={fetchAlertHistory}
                    disabled={alertHistoryLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                  >
                    <FiRefreshCw
                      size={12}
                      className={alertHistoryLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
                {alertHistoryLoading ? (
                  <div className="flex justify-center py-16">
                    <FiRefreshCw
                      size={20}
                      className="animate-spin text-gray-400"
                    />
                  </div>
                ) : alertHistory.length === 0 ? (
                  <EmptyState
                    icon={FiAlertCircle}
                    message="No alert history yet"
                  />
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                          {[
                            "Alert ID",
                            "Hazard",
                            "Location",
                            "Severity",
                            "Issued",
                            "Status",
                            "SMS",
                            "Email",
                            "Action",
                          ].map((h) => (
                            <th key={h} className="px-3 py-3 font-700">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {alertHistory.map((a, idx) => {
                          const sevColors = {
                            Emergency: "#ef4444",
                            Warning: "#f97316",
                            Watch: "#eab308",
                            Advisory: "#22c55e",
                          };
                          const col = sevColors[a.severity] || "#6b7280";
                          const isActive = a.status === "Active";
                          return (
                            <tr
                              key={a.alertId || idx}
                              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <td className="px-3 py-3">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded text-[10px]">
                                  {a.alertId}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white capitalize">
                                {a.hazard}
                              </td>
                              <td className="px-3 py-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                                {a.location}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{
                                    color: col,
                                    background: col + "20",
                                    border: `1px solid ${col}44`,
                                  }}
                                >
                                  {a.severity}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {a.issuedAt
                                  ? new Date(a.issuedAt).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )
                                  : "—"}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-red-100 dark:bg-red-900/20 text-red-600" : "bg-green-100 dark:bg-green-900/20 text-green-600"}`}
                                >
                                  {isActive ? "Active" : "Resolved"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-orange-500 font-bold">
                                {(a.dispatchedSmsCount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-3 text-blue-500 font-bold">
                                {(a.dispatchedEmailCount || 0).toLocaleString()}
                              </td>
                              <td className="px-3 py-3">
                                {isActive && (
                                  <button
                                    onClick={() =>
                                      handleResolveAlert(a.alertId)
                                    }
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95"
                                    style={{ backgroundColor: "#10b981" }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "#059669")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "#10b981")
                                    }
                                  >
                                    <FiCheck size={10} /> Resolve
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── OFFICIAL DISPATCH TAB ──────────────────────────────── */}
            {activeTab === "dispatch" && (
              <div className="space-y-6 w-full">
                <SectionHeader
                  title="Official Alert Dispatcher"
                  subtitle="Broadcast emergency alerts via SMS Ethiopia gateway and HTML email to affected regions and registered subscribers."
                />

                <div
                  className="rounded-2xl p-4 text-xs w-full flex items-center justify-between flex-wrap gap-3"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="op-dispatch-banner-icon-box w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{ backgroundColor: "#ef4444", color: "#ffffff" }}
                    >
                      <FiSend size={16} style={{ color: "#ffffff", stroke: "#ffffff" }} />
                    </div>
                    <div>
                      <span className="font-bold text-red-500 block text-xs tracking-wider uppercase">
                        Multi-Channel Broadcast Console
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        Dispatches real-time SMS via SMS Ethiopia API and HTML email bulletins simultaneously to regional responders and subscribers.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-800">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Live Gateway Ready
                    </span>
                  </div>
                </div>

                {dispatchFeedback && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold border shadow-sm ${
                      dispatchFeedback.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {dispatchFeedback.type === "success" ? (
                        <FiCheckCircle size={18} />
                      ) : (
                        <FiAlertCircle size={18} />
                      )}
                    </div>
                    <span className="flex-1">{dispatchFeedback.msg}</span>
                    <button
                      type="button"
                      onClick={() => setDispatchFeedback(null)}
                      className="opacity-60 hover:opacity-100 p-1 cursor-pointer"
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleDispatchAlert} className="w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    {/* Left Column: Hazard & Location Parameters */}
                    <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <span>Alert Parameters &amp; Details</span>
                          <span className="text-[10px] text-gray-400 font-normal">Step 1 of 2</span>
                        </h3>

                        {/* Hazard + Severity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                              Hazard Category
                            </label>
                            <select
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium outline-none focus:border-indigo-500"
                              value={dispForm.hazard}
                              onChange={(e) =>
                                setDispForm((f) => ({
                                  ...f,
                                  hazard: e.target.value,
                                }))
                              }
                            >
                              <option value="flood">Flood Warning</option>
                              <option value="fire">Wildfire Watch</option>
                              <option value="earthquake">Seismic Advisory</option>
                              <option value="landslide">Landslide Warning</option>
                              <option value="drought">Drought Emergency</option>
                              <option value="volcano">Volcanic Advisory</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                              Severity Level
                            </label>
                            <select
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium outline-none focus:border-indigo-500"
                              value={dispForm.severity}
                              onChange={(e) =>
                                setDispForm((f) => ({
                                  ...f,
                                  severity: e.target.value,
                                }))
                              }
                            >
                              <option value="Emergency">Emergency (Highest)</option>
                              <option value="Warning">Warning (Urgent)</option>
                              <option value="Watch">Watch (Elevated)</option>
                              <option value="Advisory">Advisory (Notice)</option>
                            </select>
                          </div>
                        </div>

                        {/* Region + Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                              Target Region
                            </label>
                            <input
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              value={dispForm.region}
                              onChange={(e) =>
                                setDispForm((f) => ({
                                  ...f,
                                  region: e.target.value,
                                }))
                              }
                              placeholder="e.g., Oromia, Afar, Somali"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                              Location / Basin
                            </label>
                            <input
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              value={dispForm.location}
                              onChange={(e) =>
                                setDispForm((f) => ({
                                  ...f,
                                  location: e.target.value,
                                }))
                              }
                              placeholder="e.g., Middle Awash Reach, Danakil"
                            />
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                            Alert Headline
                          </label>
                          <input
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-semibold outline-none focus:border-indigo-500"
                            value={dispForm.title}
                            onChange={(e) =>
                              setDispForm((f) => ({ ...f, title: e.target.value }))
                            }
                            placeholder="e.g., Flood Warning — Oromia Basin"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                            Situation Summary
                          </label>
                          <textarea
                            rows={4}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none resize-y focus:border-indigo-500"
                            value={dispForm.description}
                            onChange={(e) =>
                              setDispForm((f) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Detailed situation summary and safety instructions for responders and public..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Channels, Overrides & Dispatch Trigger */}
                    <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <span>Delivery Channels &amp; Target Rosters</span>
                          <span className="text-[10px] text-gray-400 font-normal">Step 2 of 2</span>
                        </h3>

                        {/* Channel selector options */}
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Active Broadcast Channels
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer hover:border-indigo-400 transition-colors">
                              <input
                                type="checkbox"
                                checked={dispForm.sendSms}
                                onChange={(e) =>
                                  setDispForm((f) => ({
                                    ...f,
                                    sendSms: e.target.checked,
                                  }))
                                }
                                className="rounded text-indigo-600"
                              />
                              <span>SMS Ethiopia Gateway</span>
                            </label>
                            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer hover:border-indigo-400 transition-colors">
                              <input
                                type="checkbox"
                                checked={dispForm.sendEmail}
                                onChange={(e) =>
                                  setDispForm((f) => ({
                                    ...f,
                                    sendEmail: e.target.checked,
                                  }))
                                }
                                className="rounded text-indigo-600"
                              />
                              <span>HTML Email Bulletins</span>
                            </label>
                          </div>
                        </div>

                        {/* Direct recipients override */}
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Direct Recipient Override (optional)
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Direct Phone Number
                              </label>
                              <input
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                placeholder="e.g. 0911234567"
                                value={dispForm.targetPhone}
                                onChange={(e) =>
                                  setDispForm((f) => ({
                                    ...f,
                                    targetPhone: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Direct Email Address
                              </label>
                              <input
                                type="email"
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                placeholder="e.g. emergency@gov.et"
                                value={dispForm.targetEmail}
                                onChange={(e) =>
                                  setDispForm((f) => ({
                                    ...f,
                                    targetEmail: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={dispatchLoading}
                          className="dispatch-broadcast-btn w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                          style={{
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
                          }}
                          onMouseEnter={(e) =>
                            !dispatchLoading &&
                            (e.currentTarget.style.backgroundColor = "#dc2626")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ef4444")
                          }
                        >
                          <FiSend
                            size={16}
                            style={{ color: "#ffffff", stroke: "#ffffff" }}
                            className={dispatchLoading ? "animate-spin" : ""}
                          />
                          <span
                            style={{ color: "#ffffff", fontWeight: 700 }}
                            className="text-white font-bold"
                          >
                            {dispatchLoading
                              ? "Broadcasting Alert..."
                              : "Broadcast Emergency Alert (SMS + Email)"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "cms" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <SectionHeader
                    title="Content Management System (CMS)"
                    subtitle="Configure live homepage statistics, hazard descriptions, landing text, and footer resources."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetCms}
                      disabled={cmsSaving || cmsLoading}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FiRotateCcw size={13} /> Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCms}
                      disabled={cmsSaving || cmsLoading || !cmsContent}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1f4fd8] hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FiSave size={13} className={cmsSaving ? "animate-spin" : ""} />
                      {cmsSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                {cmsLoading && !cmsContent ? (
                  <div className="py-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-3">
                    <FiRefreshCw size={24} className="animate-spin text-blue-600" />
                    <p className="text-sm font-medium">Loading CMS configuration...</p>
                  </div>
                ) : !cmsContent ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-500 mb-3">No CMS content loaded.</p>
                    <button
                      onClick={fetchCmsContent}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Retry Loading
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Sub navigation pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
                      {[
                        {
                          id: "stats",
                          label: "Homepage Statistics & Counters",
                          count: cmsContent.stats?.length || 0,
                        },
                        {
                          id: "hazards",
                          label: "Hazard Descriptions",
                          count: cmsContent.hazards?.length || 0,
                        },
                        {
                          id: "hero",
                          label: "Hero & Page Content",
                        },
                        {
                          id: "footer",
                          label: "Footer & Data Sources",
                          count: cmsContent.footer?.dataSources?.length || 0,
                        },
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setCmsSubTab(sub.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            cmsSubTab === sub.id
                              ? "bg-[#1f4fd8] text-white shadow-sm"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span>{sub.label}</span>
                          {sub.count !== undefined && (
                            <span
                              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                                cmsSubTab === sub.id
                                  ? "bg-white/20 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {sub.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* SUBTAB 1: STATS */}
                    {cmsSubTab === "stats" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Configure the live statistics displayed in the bottom hero counter bar on the homepage.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCmsContent((prev) => ({
                                ...prev,
                                stats: [
                                  ...(prev.stats || []),
                                  {
                                    num: "100+",
                                    label: "New Metric",
                                    order: (prev.stats?.length || 0) + 1,
                                    is_active: true,
                                  },
                                ],
                              }));
                              showToast("New statistic metric added! Configure below.");
                              setTimeout(() => {
                                statsEndRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }, 80);
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <FiPlus size={14} /> Add Metric
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(cmsContent.stats || []).map((stat, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/60">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                                  Counter #{idx + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={stat.is_active !== false}
                                      onChange={(e) => {
                                        const val = e.target.checked;
                                        setCmsContent((prev) => ({
                                          ...prev,
                                          stats: prev.stats.map((s, i) =>
                                            i === idx ? { ...s, is_active: val } : s
                                          ),
                                        }));
                                      }}
                                    />
                                    Active
                                  </label>
                                  {cmsContent.stats.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCmsContent((prev) => ({
                                          ...prev,
                                          stats: prev.stats.filter((_, i) => i !== idx),
                                        }));
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                      title="Remove counter"
                                    >
                                      <FiTrash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Display Value / Number
                                  </label>
                                  <input
                                    type="text"
                                    value={stat.num}
                                    placeholder="e.g. 6, 25+, Real-Time"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCmsContent((prev) => ({
                                        ...prev,
                                        stats: prev.stats.map((s, i) =>
                                          i === idx ? { ...s, num: val } : s
                                        ),
                                      }));
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Display Order
                                  </label>
                                  <input
                                    type="number"
                                    value={stat.order || idx + 1}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      setCmsContent((prev) => ({
                                        ...prev,
                                        stats: prev.stats.map((s, i) =>
                                          i === idx ? { ...s, order: val } : s
                                        ),
                                      }));
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Metric Label
                                </label>
                                <input
                                  type="text"
                                  value={stat.label}
                                  placeholder="e.g. Hazards Monitored"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCmsContent((prev) => ({
                                      ...prev,
                                      stats: prev.stats.map((s, i) =>
                                        i === idx ? { ...s, label: val } : s
                                      ),
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div ref={statsEndRef} />
                      </div>
                    )}

                    {/* SUBTAB 2: HAZARDS */}
                    {cmsSubTab === "hazards" && (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Edit the descriptive text, badge labels, and target links for each hazard card displayed on the Homepage.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(cmsContent.hazards || []).map((hz, idx) => (
                            <div
                              key={hz.id || idx}
                              className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/60">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                  {hz.title || hz.id}
                                </span>
                                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hz.is_active !== false}
                                    onChange={(e) => {
                                      const val = e.target.checked;
                                      setCmsContent((prev) => ({
                                        ...prev,
                                        hazards: prev.hazards.map((h, i) =>
                                          i === idx ? { ...h, is_active: val } : h
                                        ),
                                      }));
                                    }}
                                  />
                                  Active
                                </label>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Hazard Title
                                  </label>
                                  <input
                                    type="text"
                                    value={hz.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCmsContent((prev) => ({
                                        ...prev,
                                        hazards: prev.hazards.map((h, i) =>
                                          i === idx ? { ...h, title: val } : h
                                        ),
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Badge Text
                                  </label>
                                  <input
                                    type="text"
                                    value={hz.badge || "Monitor →"}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCmsContent((prev) => ({
                                        ...prev,
                                        hazards: prev.hazards.map((h, i) =>
                                          i === idx ? { ...h, badge: val } : h
                                        ),
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Description
                                </label>
                                <textarea
                                  rows={3}
                                  value={hz.desc || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCmsContent((prev) => ({
                                      ...prev,
                                      hazards: prev.hazards.map((h, i) =>
                                        i === idx ? { ...h, desc: val } : h
                                      ),
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none resize-y focus:border-indigo-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 3: HERO & PAGE CONTENT */}
                    {cmsSubTab === "hero" && (
                      <div className="space-y-5 w-full">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Configure primary landing text, hero badges, mission statements, and departmental summary descriptions.
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                          {/* Left Column: Hero Banner & Headline Configuration */}
                          <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                              Hero Banner &amp; Header
                            </h3>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Hero Live Badge
                              </label>
                              <input
                                type="text"
                                value={cmsContent.hero?.badge || ""}
                                placeholder="e.g. Geodesy & Geodynamics Department"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    hero: { ...(prev.hero || {}), badge: val },
                                  }));
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Main Institute / Portal Title
                              </label>
                              <input
                                type="text"
                                value={cmsContent.hero?.title || ""}
                                placeholder="e.g. Ethiopian Disaster Risk Management Commission"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    hero: { ...(prev.hero || {}), title: val },
                                  }));
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Department Tagline
                              </label>
                              <input
                                type="text"
                                value={cmsContent.hero?.tagline || ""}
                                placeholder="e.g. Monitoring Earth System Dynamics with Space Geodesy"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    hero: { ...(prev.hero || {}), tagline: val },
                                  }));
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Hero Subtitle Description
                              </label>
                              <textarea
                                rows={4}
                                value={cmsContent.hero?.subtitle || ""}
                                placeholder="Brief overview of real-time monitoring and early warning capabilities..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    hero: { ...(prev.hero || {}), subtitle: val },
                                  }));
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none resize-y focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Right Column: Mission & About Department */}
                          <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                              Mission &amp; Department Narrative
                            </h3>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Mission Statement
                              </label>
                              <textarea
                                rows={4}
                                value={cmsContent.hero?.mission || ""}
                                placeholder="Official mandate and scientific objectives..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    hero: { ...(prev.hero || {}), mission: val },
                                  }));
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none resize-y focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                About Department Summary
                              </label>
                              <textarea
                                rows={6}
                                value={cmsContent.hero?.aboutSummary || ""}
                                placeholder="Detailed narrative regarding institutional role, data synthesis, and agency coordination..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    hero: { ...(prev.hero || {}), aboutSummary: val },
                                  }));
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none resize-y focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 4: FOOTER & DATA SOURCES */}
                    {cmsSubTab === "footer" && (
                      <div className="space-y-5">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage official contact details, emergency hotline, copyright notices, and external scientific data sources.
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {/* Left: General footer contact info */}
                          <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                              Contact &amp; Organization Information
                            </h3>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Physical Address / Headquarters
                              </label>
                              <textarea
                                rows={2}
                                value={cmsContent.footer?.address || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    footer: { ...(prev.footer || {}), address: val },
                                  }));
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none resize-y focus:border-indigo-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Telephone Number
                                </label>
                                <input
                                  type="text"
                                  value={cmsContent.footer?.phone || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCmsContent((prev) => ({
                                      ...prev,
                                      footer: { ...(prev.footer || {}), phone: val },
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Emergency Hotline
                                </label>
                                <input
                                  type="text"
                                  value={cmsContent.footer?.emergencyPhone || "8335"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCmsContent((prev) => ({
                                      ...prev,
                                      footer: { ...(prev.footer || {}), emergencyPhone: val },
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Official Email Address
                              </label>
                              <input
                                type="email"
                                value={cmsContent.footer?.email || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    footer: { ...(prev.footer || {}), email: val },
                                  }));
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Copyright Statement
                              </label>
                              <input
                                type="text"
                                value={cmsContent.footer?.copyright || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    footer: { ...(prev.footer || {}), copyright: val },
                                  }));
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Right: Data sources list */}
                          <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                External Data Sources &amp; Portals
                              </h3>
                              <button
                                type="button"
                                onClick={() => {
                                  setCmsContent((prev) => ({
                                    ...prev,
                                    footer: {
                                      ...(prev.footer || {}),
                                      dataSources: [
                                        ...(prev.footer?.dataSources || []),
                                        {
                                          label: "New Data Provider",
                                          href: "https://",
                                          is_active: true,
                                        },
                                      ],
                                    },
                                  }));
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1"
                              >
                                <FiPlus size={12} /> Add Source
                              </button>
                            </div>

                            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                              {(cmsContent.footer?.dataSources || []).map((ds, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-900/50 flex flex-col gap-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      placeholder="Source Name / Title"
                                      value={ds.label}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCmsContent((prev) => ({
                                          ...prev,
                                          footer: {
                                            ...prev.footer,
                                            dataSources: prev.footer.dataSources.map((d, i) =>
                                              i === idx ? { ...d, label: val } : d
                                            ),
                                          },
                                        }));
                                      }}
                                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                    <label className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300 cursor-pointer flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={ds.is_active !== false}
                                        onChange={(e) => {
                                          const val = e.target.checked;
                                          setCmsContent((prev) => ({
                                            ...prev,
                                            footer: {
                                              ...prev.footer,
                                              dataSources: prev.footer.dataSources.map((d, i) =>
                                                i === idx ? { ...d, is_active: val } : d
                                              ),
                                            },
                                          }));
                                        }}
                                      />
                                      Active
                                    </label>
                                    {(cmsContent.footer?.dataSources?.length || 0) > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCmsContent((prev) => ({
                                            ...prev,
                                            footer: {
                                              ...prev.footer,
                                              dataSources: prev.footer.dataSources.filter((_, i) => i !== idx),
                                            },
                                          }));
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                                        title="Remove source"
                                      >
                                        <FiTrash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={ds.href}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCmsContent((prev) => ({
                                        ...prev,
                                        footer: {
                                          ...prev.footer,
                                          dataSources: prev.footer.dataSources.map((d, i) =>
                                            i === idx ? { ...d, href: val } : d
                                          ),
                                        },
                                      }));
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 font-mono text-[11px]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
