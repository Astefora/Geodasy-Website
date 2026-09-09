import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import {
  FiMail,
  FiPhone,
  FiBriefcase,
  FiGrid,
  FiEdit2,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiLogOut,
  FiUser,
  FiShield,
  FiClock,
} from "react-icons/fi";

const API = "http://localhost:5002";

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
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <FiX size={13} />
      </button>
    </div>
  );
}

function EditModal({ user, onSave, onClose, saving }) {
  const [draft, setDraft] = useState({
    fullName: user.fullName || "",
    designation: user.designation || "",
    department: user.department || "",
  });

  // Extract the 9-digit part from the stored +251XXXXXXXXX value
  const initDigits = (user.phone || "")
    .replace(/^\+251/, "")
    .replace(/\s/g, "");
  const [phoneDigits, setPhoneDigits] = useState(
    /^\d{9}$/.test(initDigits) ? initDigits : "",
  );
  const [phoneError, setPhoneError] = useState("");

  const handleSaveClick = () => {
    // Validate phone — required, exactly 9 digits
    if (!/^\d{9}$/.test(phoneDigits)) {
      setPhoneError(
        phoneDigits === ""
          ? "Phone number is required"
          : "Enter exactly 9 digits after +251",
      );
      return;
    }
    onSave({ ...draft, phone: "+251" + phoneDigits });
  };

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FiUser size={11} /> Full Name
            </label>
            <input
              value={draft.fullName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fullName: e.target.value }))
              }
              placeholder="Your full name"
              className="px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Ethiopian phone field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FiPhone size={11} /> Phone
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "12px",
                border: phoneError ? "1.5px solid #ef4444" : "1px solid",
                borderColor: phoneError ? "#ef4444" : undefined,
                overflow: "hidden",
                height: "40px",
                boxSizing: "border-box",
              }}
              className={
                phoneError
                  ? ""
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              }
            >
              {/* Fixed +251 prefix */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "0 8px 0 12px",
                  borderRight: "1px solid",
                  height: "100%",
                  flexShrink: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6366f1",
                  userSelect: "none",
                }}
                className="border-gray-200 dark:border-gray-700"
              >
                <FiPhone size={12} style={{ color: "#9ca3af" }} />
                +251
              </div>
              {/* 9-digit input */}
              <input
                type="tel"
                inputMode="numeric"
                value={phoneDigits}
                placeholder="9 digits"
                maxLength={9}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setPhoneDigits(digits);
                  if (phoneError) setPhoneError("");
                }}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white text-sm px-3 h-full min-w-0"
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-500 font-medium">⚠ {phoneError}</p>
            )}
          </div>

          {/* Designation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FiBriefcase size={11} /> Designation
            </label>
            <input
              value={draft.designation}
              onChange={(e) =>
                setDraft((d) => ({ ...d, designation: e.target.value }))
              }
              placeholder="e.g. Research Officer"
              className="px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FiGrid size={11} /> Department
            </label>
            <input
              value={draft.department}
              onChange={(e) =>
                setDraft((d) => ({ ...d, department: e.target.value }))
              }
              placeholder="e.g. Geodesy & Geodynamics"
              className="px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FiMail size={11} /> Email
            </span>
            <span className="text-sm text-gray-400">{user.email}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FiUser size={11} /> Username
            </span>
            <span className="text-sm text-gray-400">@{user.username}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
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
                Saving…
              </>
            ) : (
              <>
                <FiCheck size={14} /> Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// InfoRow — icon+label left, value far right, border always visible
function InfoRow({ icon: Icon, label, value, placeholder = "—" }) {
  return (
    <div
      className="flex items-center justify-between py-3 gap-4"
      style={{ borderBottom: "1px solid rgba(156,163,175,0.25)" }}
    >
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <Icon size={14} style={{ color: "#9ca3af" }} />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#6b7280",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: value ? undefined : "#9ca3af",
          fontStyle: value ? "normal" : "italic",
        }}
        className={value ? "text-gray-900 dark:text-white" : ""}
      >
        {value || placeholder}
      </span>
    </div>
  );
}

function LocalTime() {
  const fmt = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return <>{time} local time</>;
}

export default function Contact() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  })();
  const [user, setUser] = useState(storedUser);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleSave = async (draft) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json"))
        throw new Error(
          "Could not reach the server. Make sure the backend is running on port 5002.",
        );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const next = { ...user, ...(data.user || data) };
      setUser(next);
      localStorage.setItem("currentUser", JSON.stringify(next));
      setEditOpen(false);
      setToast({ message: "Profile updated successfully.", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const initials =
    user.fullName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  const statusCls =
    user.status === "approved"
      ? "text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400"
      : user.status === "rejected"
        ? "text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400"
        : "text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400";

  const cardStyle = {
    background: isDark ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: isDark
      ? "1px solid rgba(255,255,255,0.09)"
      : "1px solid rgba(0,0,0,0.08)",
  };

  // Avatar size constants
  const AVA = 155;

  return (
    <div className="min-h-screen pb-3 text-gray-900 dark:text-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {editOpen && (
        <EditModal
          user={user}
          onSave={handleSave}
          onClose={() => setEditOpen(false)}
          saving={saving}
        />
      )}

      {/* ── Hero header card — buttons live INSIDE it ── */}
      <div
        className="mx-4 sm:mx-8 mt-6 mb-7 rounded-2xl overflow-hidden relative shadow-lg"
        style={{ ...cardStyle, minHeight: `${AVA + 48}px` }}
      >
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
        {/* Top bar inside the card: Dashboard ← on left, Logout on right */}
        <div className="flex items-center justify-between px-8 pt-5 pb-0">
          {/* Back button — theme-aware, works in both light and dark */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md hover:-translate-y-px"
          >
            <FiArrowLeft
              size={15}
              className="text-gray-700 dark:text-gray-300 flex-shrink-0"
            />
            <span className="text-gray-800 dark:text-gray-200">
              Back to Dashboard
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-sm font-semibold transition-all"
          >
            <FiLogOut size={14} />
            <span style={{ color: "inherit" }}>Logout</span>
          </button>
        </div>

        {/* Avatar row: absolute avatar + name centred vertically to avatar height */}
        <div className="flex items-stretch justify-between px-8 pt-4 pb-6">
          {/* Left: avatar + name/meta centred to avatar */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center font-extrabold text-white select-none"
              style={{
                width: `${AVA}px`,
                height: `${AVA}px`,
                fontSize: "52px",
                background: "linear-gradient(135deg,#312e81 0%,#4c1d95 100%)",
                boxShadow: "0 8px 32px rgba(49,46,129,0.35)",
              }}
            >
              {initials}
            </div>

            {/* Name + meta vertically centred to avatar */}
            <div
              className="flex flex-col justify-center"
              style={{ height: `${AVA}px` }}
            >
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-2">
                {user.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <FiClock size={13} />
                  <LocalTime />
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <FiMail size={13} />
                  {user.email}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${statusCls}`}
                >
                  {user.status || "pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Edit profile at bottom */}
          <div className="flex flex-col justify-end pb-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <FiEdit2 size={14} /> Edit profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="px-4 sm:px-8 pb-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account — left 2/3 */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1 rounded-2xl shadow-sm p-5" style={cardStyle}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Account
            </h2>
            <InfoRow icon={FiUser} label="Full Name" value={user.fullName} />
            <InfoRow
              icon={FiUser}
              label="Username"
              value={`@${user.username}`}
            />
            <InfoRow icon={FiMail} label="Email" value={user.email} />
            <InfoRow
              icon={FiShield}
              label="Role"
              value={
                user.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Member"
              }
            />
            <InfoRow
              icon={FiCheckCircle}
              label="Status"
              value={
                user.status
                  ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                  : "Pending"
              }
            />
            {user.approvedBy && (
              <InfoRow
                icon={FiCheck}
                label="Approved by"
                value={user.approvedBy}
              />
            )}
            {user.approvedAt && (
              <InfoRow
                icon={FiClock}
                label="Approved on"
                value={new Date(user.approvedAt).toLocaleDateString()}
              />
            )}
          </div>
        </div>

        {/* Right 1/3 — Contact Info + Role stacked */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl shadow-sm p-5" style={cardStyle}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Contact Info
            </h2>
            <InfoRow icon={FiMail} label="Email" value={user.email} />
            <InfoRow
              icon={FiPhone}
              label="Phone"
              value={user.phone}
              placeholder="Not set"
            />
          </div>
          <div className="rounded-2xl shadow-sm p-5" style={cardStyle}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Role & Department
            </h2>
            <InfoRow
              icon={FiBriefcase}
              label="Designation"
              value={user.designation}
              placeholder="Not set"
            />
            <InfoRow
              icon={FiGrid}
              label="Department"
              value={user.department}
              placeholder="Not set"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
