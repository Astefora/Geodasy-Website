import { useState, useEffect, useCallback } from "react";
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
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm"
            style={{ backgroundColor: danger ? "#ef4444" : "#f59e0b" }}
          >
            Confirm
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
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border"
      style={
        type === "success"
          ? {
              backgroundColor: "#022c22",
              borderColor: "#059669",
              color: "#6ee7b7",
            }
          : {
              backgroundColor: "#2d0a0a",
              borderColor: "#dc2626",
              color: "#fca5a5",
            }
      }
    >
      {type === "success" ? (
        <FiCheckCircle size={17} />
      ) : (
        <FiAlertCircle size={17} />
      )}
      {message}
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
  };
  const darkStyles = {
    pending: "dark:bg-amber-900/30 dark:text-amber-400",
    approved: "dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "dark:bg-red-900/30 dark:text-red-400",
  };
  const icons = {
    pending: <FiClock size={11} />,
    approved: <FiCheckCircle size={11} />,
    rejected: <FiX size={11} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${darkStyles[s]}`}
      style={styles[s]}
    >
      {icons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

// ── Stat Card — uses named CSS classes to survive theme.css !important rules ──
const iconClasses = {
  amber: "admin-icon-amber",
  emerald: "admin-icon-emerald",
  blue: "admin-icon-blue",
  cyan: "admin-icon-cyan",
};
const badgeInfo = {
  amber: { bg: "#fef3c7", text: "#92400e" },
  emerald: { bg: "#d1fae5", text: "#064e3b" },
  blue: { bg: "#dbeafe", text: "#1e3a8a" },
  cyan: { bg: "#cffafe", text: "#164e63" },
};

// Gradient backgrounds per color — matches UploadCard style
const gradientInfo = {
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 relative overflow-hidden">
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all active:scale-95"
              style={{ backgroundColor: "#10b981" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#059669")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#10b981")
              }
            >
              <FiCheck size={13} /> Approve
            </button>
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all active:scale-95"
              style={{ backgroundColor: "#ef4444" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc2626")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#ef4444")
              }
            >
              <FiX size={13} /> Reject
            </button>
          </>
        )}
        {showActions === "remove" && (
          <button
            onClick={onRemove}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              boxShadow: "0 2px 8px #ef444440",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 16px #ef444460")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px #ef444440")
            }
          >
            <FiTrash2 size={13} /> Remove User
          </button>
        )}
      </div>
    </div>
  );
}

// ── Upload Card ────────────────────────────────────────────────────────────
function UploadCard({
  upload,
  onApprove,
  onReject,
  onRemove,
  showApprove = false,
  showReject = false,
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
      className="rounded-2xl p-5 flex flex-col gap-3 hover:shadow-xl transition-all duration-200 border"
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

      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
        {showApprove && (
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold active:scale-95 transition-all"
            style={{ backgroundColor: "#10b981" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#059669")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#10b981")
            }
          >
            <FiCheck size={13} /> Approve
          </button>
        )}
        {showReject && (
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold active:scale-95 transition-all"
            style={{ backgroundColor: "#ef4444" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#dc2626")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ef4444")
            }
          >
            <FiX size={13} /> Reject
          </button>
        )}
        {showRemove && (
          <button
            onClick={onRemove}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              boxShadow: "0 2px 8px #ef444440",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 16px #ef444460")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px #ef444440")
            }
          >
            <FiTrash2 size={13} /> Remove
          </button>
        )}
      </div>
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
  const [allUploads, setAllUploads] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [uploadFilter, setUploadFilter] = useState("all"); // "all" | "research" | "local"
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
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
      const [pU, aU, pUp, aUp, all] = await Promise.all([
        fetch(`${API}/api/users?status=pending&role=member`),
        fetch(`${API}/api/users?status=approved&role=member`),
        fetch(`${API}/api/uploads?status=pending`),
        fetch(`${API}/api/uploads?status=approved`),
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

  const handleLogout = () => {
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <StatCard
            icon={FiClock}
            label="Pending Users"
            value={pendingUsers.length}
            color="amber"
          />
          <StatCard
            icon={FiUsers}
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
                <SectionHeader
                  title="Pending User Approvals"
                  subtitle="Review and approve or reject new member registrations."
                />
                {pendingUsers.length === 0 ? (
                  <EmptyState icon={FiUsers} message="No pending approvals" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingUsers.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        showActions="both"
                        onApprove={() => handleApproval(user._id, "approve")}
                        onReject={() => handleApproval(user._id, "reject")}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "pending-uploads" && (
              <>
                <SectionHeader
                  title="Pending Upload Approvals"
                  subtitle="Approve uploads to make them visible on hazard and research pages."
                />
                {pendingUploads.length === 0 ? (
                  <EmptyState
                    icon={FiUpload}
                    message="No uploads pending review"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingUploads.map((upload) => (
                      <UploadCard
                        key={upload._id}
                        upload={upload}
                        showApprove
                        showReject={false}
                        showRemove
                        onApprove={() =>
                          handleUploadModeration(upload._id, "approve")
                        }
                        onRemove={() =>
                          handleDeleteUpload(
                            upload._id,
                            upload.title || upload.fileName,
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "approved" && (
              <>
                <SectionHeader
                  title="Approved Users"
                  subtitle="Active members with full dashboard access."
                />
                {approvedUsers.length === 0 ? (
                  <EmptyState icon={FiUsers} message="No approved users yet" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {approvedUsers.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        showActions="remove"
                        onRemove={() =>
                          handleDeleteUser(user._id, user.fullName)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "approved-uploads" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <SectionHeader
                    title="Approved Uploads"
                    subtitle="Uploads currently live on the research portal and hazard pages."
                  />
                  <div className="flex gap-1.5 flex-shrink-0">
                    {[
                      ["all", "All"],
                      ["research", "Research"],
                      ["local", "Local Data"],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setUploadFilter(val)}
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
                {approvedUploads.filter((u) => {
                  if (uploadFilter === "research")
                    return !u.title?.startsWith("Disaster Data:");
                  if (uploadFilter === "local")
                    return u.title?.startsWith("Disaster Data:");
                  return true;
                }).length === 0 ? (
                  <EmptyState
                    icon={FiCheckCircle}
                    message="No approved uploads yet"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {approvedUploads
                      .filter((u) => {
                        if (uploadFilter === "research")
                          return !u.title?.startsWith("Disaster Data:");
                        if (uploadFilter === "local")
                          return u.title?.startsWith("Disaster Data:");
                        return true;
                      })
                      .map((upload) => (
                        <UploadCard
                          key={upload._id}
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
                      ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "uploads" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <SectionHeader
                    title="All Uploads"
                    subtitle="Pending items can be approved or rejected. Approved and rejected items can be removed."
                  />
                  <div className="flex gap-1.5 flex-shrink-0">
                    {[
                      ["all", "All"],
                      ["research", "Research"],
                      ["local", "Local Data"],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setUploadFilter(val)}
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
                {allUploads.filter((u) => {
                  if (uploadFilter === "research")
                    return !u.title?.startsWith("Disaster Data:");
                  if (uploadFilter === "local")
                    return u.title?.startsWith("Disaster Data:");
                  return true;
                }).length === 0 ? (
                  <EmptyState icon={FiFileText} message="No uploads yet" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allUploads
                      .filter((u) => {
                        if (uploadFilter === "research")
                          return !u.title?.startsWith("Disaster Data:");
                        if (uploadFilter === "local")
                          return u.title?.startsWith("Disaster Data:");
                        return true;
                      })
                      .map((upload) => {
                        const isPending =
                          !upload.status || upload.status === "pending";
                        return (
                          <UploadCard
                            key={upload._id}
                            upload={upload}
                            showApprove={isPending}
                            showReject={isPending}
                            showRemove={!isPending}
                            onApprove={() =>
                              handleUploadModeration(upload._id, "approve")
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
                        );
                      })}
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
