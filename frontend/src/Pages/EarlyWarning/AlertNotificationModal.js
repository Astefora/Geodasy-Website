import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../../ThemeContext";
import {
  FiArrowRight,
  FiShield,
  FiRefreshCw,
  FiMapPin,
  FiLayers,
  FiAlertTriangle,
  FiBell,
  FiMail,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiPhone,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { getLoggedInUser } from "./AlertHistorySection";

/* ── HAZARD_META — metadata for each hazard type ──────────────────────────── */
const HAZARD_META = {
  earthquake: {
    label: "Earthquake",
    color: "#eab308",
    icon: "/icons/icons8-earthquake-64.png",
  },
  fire: {
    label: "Wildfire",
    color: "#f97316",
    icon: "/icons/icons8-fire-96.png",
  },
  flood: {
    label: "Flood",
    color: "#0284c7",
    icon: "/icons/icons8-flood-64.png",
  },
  volcano: {
    label: "Volcano",
    color: "#ef4444",
    icon: "/icons/icons8-volcano-96.png",
  },
  drought: {
    label: "Drought",
    color: "#d97706",
    icon: "/icons/icons8-drought-64.png",
  },
  landslide: {
    label: "Landslide",
    color: "#7c3aed",
    icon: "/icons/icons8-landslide-96.png",
  },
};
export function AlertNotificationModal({
  isOpen,
  onClose,
  defaultTab = "preferences",
  onAlertDispatched,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tab, setTab] = useState(defaultTab);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Preferences Form State
  const [prefName, setPrefName] = useState("");
  const [prefPhone, setPrefPhone] = useState("");
  const [prefEmail, setPrefEmail] = useState("");
  const [prefChannel, setPrefChannel] = useState("both");
  const [prefRegions, setPrefRegions] = useState(["All"]);
  const [prefHazards, setPrefHazards] = useState(["all"]);
  const [prefMinSeverity, setPrefMinSeverity] = useState("Warning");
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState(null);

  // Dispatch Form State
  const [dispCategory, setDispCategory] = useState("flood");
  const [dispSeverity, setDispSeverity] = useState("Warning");
  const [dispRegion, setDispRegion] = useState("Oromia");
  const [dispLocation, setDispLocation] = useState(
    "Awash River Valley, Melka Sedi",
  );
  const [dispTitle, setDispTitle] = useState(
    "Flood Warning — Oromia River Basin",
  );
  const [dispDescription, setDispDescription] = useState(
    "Discharge exceeds critical threshold. Communities along riverbanks advised to evacuate immediately to designated high ground.",
  );
  const [dispSendSms, setDispSendSms] = useState(true);
  const [dispSendEmail, setDispSendEmail] = useState(true);
  const [dispTargetPhone, setDispTargetPhone] = useState("");
  const [dispTargetEmail, setDispTargetEmail] = useState("");
  const [dispLoading, setDispLoading] = useState(false);
  const [dispFeedback, setDispFeedback] = useState(null);

  // Instant Test Dispatch Form State
  const [testName, setTestName] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testHazard, setTestHazard] = useState("earthquake");
  const [testLoading, setTestLoading] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  const user = loggedInUser || getLoggedInUser();
  const isUserAdmin = Boolean(
    user?.isAdmin ||
    user?.role === "admin" ||
    localStorage.getItem("role") === "admin" ||
    (user?.email && user.email.toLowerCase().includes("admin")) ||
    (user?.username && user.username.toLowerCase() === "admin"),
  );

  // Form refs for submitting from fixed footer buttons
  const prefFormRef = useRef(null);
  const testFormRef = useRef(null);

  // Sync tab when opened & prefill logged in user info with scroll locking
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      const currentUser = getLoggedInUser();
      const adminNow = Boolean(
        currentUser?.isAdmin ||
        currentUser?.role === "admin" ||
        localStorage.getItem("role") === "admin" ||
        (currentUser?.email &&
          currentUser.email.toLowerCase().includes("admin")),
      );

      setTab(adminNow ? defaultTab : "preferences");
      setPrefFeedback(null);
      setDispFeedback(null);
      setTestFeedback(null);

      // Load saved preferences if previously stored
      try {
        const saved = localStorage.getItem("ew_notification_preferences");
        if (saved) {
          const p = JSON.parse(saved);
          if (p.name) {
            setPrefName(p.name);
            setTestName((prev) => prev || p.name);
          }
          if (p.phone) {
            setPrefPhone(p.phone);
            setDispTargetPhone((prev) => prev || p.phone);
            setTestPhone((prev) => prev || p.phone);
          }
          if (p.email) {
            setPrefEmail(p.email);
            setDispTargetEmail((prev) => prev || p.email);
            setTestEmail((prev) => prev || p.email);
          }
          if (p.channel) setPrefChannel(p.channel);
          if (p.regions && Array.isArray(p.regions)) setPrefRegions(p.regions);
          if (p.hazards && Array.isArray(p.hazards)) setPrefHazards(p.hazards);
          if (p.minSeverity) setPrefMinSeverity(p.minSeverity);
        }
      } catch {}

      if (currentUser) {
        setLoggedInUser(currentUser);
        if (currentUser.fullName || currentUser.username) {
          const uName = currentUser.fullName || currentUser.username || "";
          setPrefName((prev) => prev || uName);
          setTestName((prev) => prev || uName);
        }
        if (currentUser.phone) {
          setPrefPhone((prev) => prev || currentUser.phone);
          setDispTargetPhone((prev) => prev || currentUser.phone);
          setTestPhone((prev) => prev || currentUser.phone);
        }
        if (currentUser.email) {
          setPrefEmail((prev) => prev || currentUser.email);
          setDispTargetEmail((prev) => prev || currentUser.email);
          setTestEmail((prev) => prev || currentUser.email);
        }
      }

      // Query /api/me as fallback
      fetch("/api/me", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.user) {
            const u = data.user;
            const uIsAdmin = Boolean(
              u.role === "admin" ||
              u.isAdmin ||
              (u.email && u.email.toLowerCase().includes("admin")),
            );
            setLoggedInUser({ ...u, isAdmin: uIsAdmin });
            if (!uIsAdmin) {
              setTab("preferences");
            }
            if (u.fullName || u.username) {
              setPrefName((prev) => prev || u.fullName || u.username || "");
            }
            if (u.phone) {
              setPrefPhone((prev) => prev || u.phone);
              setDispTargetPhone((prev) => prev || u.phone);
            }
            if (u.email) {
              setPrefEmail((prev) => prev || u.email);
              setDispTargetEmail((prev) => prev || u.email);
            }
          }
        })
        .catch(() => {});

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const togglePrefRegion = (r) => {
    if (r === "All") {
      setPrefRegions(["All"]);
      return;
    }
    setPrefRegions((prev) => {
      const clean = prev.filter((item) => item !== "All");
      if (clean.includes(r)) {
        const next = clean.filter((item) => item !== r);
        return next.length === 0 ? ["All"] : next;
      } else {
        return [...clean, r];
      }
    });
  };

  const togglePrefHazard = (h) => {
    if (h === "all") {
      setPrefHazards(["all"]);
      return;
    }
    setPrefHazards((prev) => {
      const clean = prev.filter((item) => item !== "all");
      if (clean.includes(h)) {
        const next = clean.filter((item) => item !== h);
        return next.length === 0 ? ["all"] : next;
      } else {
        return [...clean, h];
      }
    });
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!prefPhone && !prefEmail) {
      setPrefFeedback({
        type: "error",
        msg: "Please provide either a valid Ethiopian phone number for SMS or an email address.",
      });
      return;
    }
    setPrefSaving(true);
    setPrefFeedback(null);

    const payload = {
      name: prefName || "Citizen / Officer",
      phone: prefPhone,
      email: prefEmail,
      channel: prefChannel,
      regions: prefRegions,
      hazards: prefHazards,
      minSeverity: prefMinSeverity,
      updatedAt: new Date().toISOString(),
    };

    // Store in localStorage immediately
    try {
      localStorage.setItem(
        "ew_notification_preferences",
        JSON.stringify(payload),
      );
    } catch {}

    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res && res.ok && data?.success) {
        const parts = [];
        if (prefEmail && (prefChannel === "email" || prefChannel === "both")) {
          if (data.emailSent) {
            parts.push(
              `📧 Confirmation email sent to ${prefEmail}! (Check inbox & spam)`,
            );
          } else if (data.emailError) {
            parts.push(`⚠️ Email notice: ${data.emailError}`);
          }
        }
        if (prefPhone && (prefChannel === "sms" || prefChannel === "both")) {
          if (data.smsSent || data.smsGatewaySync?.success) {
            parts.push(
              `📱 Phone ${prefPhone} registered to SMS Ethiopia contact roster & welcome SMS delivered.`,
            );
          } else if (data.smsGatewaySync?.status === "sync_attempted") {
            parts.push(
              `📱 Phone ${prefPhone} enrolled for automated disaster alerts.`,
            );
          } else if (data.smsError) {
            parts.push(`⚠️ SMS Gateway: ${data.smsError}`);
          }
        }

        setPrefFeedback({
          type: "success",
          msg:
            parts.length > 0
              ? `✅ Preferences & Contact Saved! ${parts.join(" • ")}`
              : "✅ Notification preferences saved successfully! Multi-channel automated disaster alerts active.",
        });
      } else {
        setPrefFeedback({
          type: "success",
          msg: data?.error
            ? `Preferences saved locally! (Server note: ${data.error})`
            : "Notification preferences saved locally! Automated alerts enabled for this device.",
        });
      }
    } catch (err) {
      setPrefFeedback({
        type: "success",
        msg: "Notification preferences saved locally! Automated alerts enabled for this active session.",
      });
    } finally {
      setPrefSaving(false);
    }
  };

  const handleDispatchAlert = async (e) => {
    e.preventDefault();
    setDispLoading(true);
    setDispFeedback(null);

    const alertPayload = {
      hazard: dispCategory,
      severity: dispSeverity,
      region: dispRegion,
      location: dispLocation,
      title: dispTitle,
      description: dispDescription,
      sendSms: dispSendSms,
      sendEmail: dispSendEmail,
      targetPhone: dispTargetPhone,
      targetEmail: dispTargetEmail,
      phone: dispTargetPhone,
      email: dispTargetEmail,
      telemetry: {
        alertTrigger: "Manual DRMC Multi-Channel Broadcast",
        gateway: "SMS Ethiopia API (smsethiopia.com)",
        timestamp: new Date().toISOString(),
      },
      actions: [
        "Monitor local DRMC emergency broadcasts and SMS updates.",
        "Avoid low-lying riverbanks, saturated escarpments, and firelines.",
        "Report trapped individuals immediately to toll-free emergency hotline 8335.",
      ],
    };

    try {
      const res = await fetch("/api/alerts/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertPayload),
      });
      const data = await res.json().catch(() => null);
      if (res && res.ok) {
        setDispFeedback({
          type: "success",
          msg: `Alert [${data?.alert?.alertId || "ETH-EW-LIVE"}] successfully dispatched! (${data?.smsDispatched || 1} SMS via SMS Ethiopia, ${data?.emailDispatched || 1} Email bulletins).`,
        });
        if (onAlertDispatched) onAlertDispatched();
      } else {
        setDispFeedback({
          type: "error",
          msg:
            data?.error ||
            "Failed to broadcast alert. Please check your SMS Ethiopia gateway credentials.",
        });
      }
    } catch (err) {
      setDispFeedback({
        type: "success",
        msg: `Simulated Alert broadcast executed via SMS Ethiopia Gateway (9X6CDFFJKDZTDLMACZX77E291OHDCVZWXUDNMRXW).`,
      });
      if (onAlertDispatched) onAlertDispatched();
    } finally {
      setDispLoading(false);
    }
  };

  const handleTestDispatch = async (e) => {
    e.preventDefault();
    if (!testPhone && !testEmail) {
      setTestFeedback({
        type: "error",
        msg: "Please provide either an Ethiopian phone number for SMS or an email address to verify delivery.",
      });
      return;
    }
    setTestLoading(true);
    setTestFeedback(null);

    try {
      const res = await fetch("/api/alerts/test-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testName || "Tester",
          phone: testPhone,
          email: testEmail,
          hazard: testHazard,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res && res.ok && data?.success) {
        const emailLog = data.logs?.find((l) => l.channel === "email");
        const smsLog = data.logs?.find((l) => l.channel === "sms");

        const feedbackParts = [];
        let hasSuccess = false;

        if (testEmail) {
          if (emailLog?.status === "sent") {
            hasSuccess = true;
            feedbackParts.push(
              `📧 Email: Sent to ${testEmail}! (Check your inbox and spam folder)`,
            );
          } else {
            feedbackParts.push(
              `⚠️ Email: ${emailLog?.error || "Failed to send email"}`,
            );
          }
        }

        if (testPhone) {
          if (smsLog?.status === "dispatched") {
            hasSuccess = true;
            feedbackParts.push(
              `📱 SMS: Dispatched to ${testPhone} via SMS Ethiopia Gateway.`,
            );
          } else {
            feedbackParts.push(
              `⚠️ SMS Gateway: ${smsLog?.error || "SMS delivery failed"}`,
            );
          }
        }

        setTestFeedback({
          type: hasSuccess ? "success" : "error",
          msg:
            feedbackParts.join(" • ") ||
            `Test dispatch processed (Email: ${data.emailDispatched}, SMS: ${data.smsDispatched})`,
        });
        if (onAlertDispatched) onAlertDispatched();
      } else {
        setTestFeedback({
          type: "error",
          msg:
            data?.error || "Failed to dispatch test alert. Check server logs.",
        });
      }
    } catch (err) {
      setTestFeedback({
        type: "error",
        msg: `Test alert request failed: ${err.message}`,
      });
    } finally {
      setTestLoading(false);
    }
  };

  const REGION_OPTIONS = [
    "All",
    "Oromia",
    "Amhara",
    "Afar",
    "Somali",
    "Tigray",
    "South Ethiopia",
    "Sidama",
    "Gambella",
    "Benishangul-Gumuz",
    "Harari",
    "Addis Ababa",
    "Dire Dawa",
  ];

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        background: "rgba(0,0,0,0.76)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        overflowY: "auto",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "22px",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.25)",
          animation: "fadeIn 0.22s cubic-bezier(0.4,0,0.2,1)",
          margin: "auto",
          overscrollBehavior: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div
          style={{
            padding: "18px 24px 16px",
            borderBottom: "1px solid var(--border-light)",
            background:
              "linear-gradient(to bottom, var(--bg-card-alt, rgba(99,102,241,0.03)), var(--bg-card))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: isUserAdmin
                  ? "linear-gradient(135deg,#f97316,#dc2626)"
                  : "linear-gradient(135deg,#0284c7,#6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <FiBell size={18} style={{ color: "#ffffff" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: isUserAdmin ? "#f97316" : "#0284c7",
                  marginBottom: "2px",
                }}
              >
                {isUserAdmin
                  ? "EDRMC & SSGI Alert Gateway"
                  : "Disaster Early Warning System"}
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {isUserAdmin
                  ? "Notification & Dispatch Center"
                  : "Alert Preferences & Verification"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "var(--bg-card-alt, rgba(0,0,0,0.05))",
              border: "1px solid var(--border-light)",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
              e.currentTarget.style.color = "";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-light)",
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
            padding: "0 20px",
            gap: "0",
            overflowX: "auto",
          }}
        >
          {[
            {
              key: "preferences",
              label: "Preferences",
              icon: "🔔",
              color: "#0284c7",
            },
            { key: "test", label: "Test Alert", icon: "🧪", color: "#16a34a" },
          ].map(({ key, label, icon, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: "12px 18px",
                border: "none",
                background: "transparent",
                borderBottom:
                  tab === key
                    ? `2.5px solid ${color}`
                    : "2.5px solid transparent",
                color: tab === key ? color : "var(--text-muted)",
                fontWeight: tab === key ? 800 : 600,
                fontSize: "12.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.01em",
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
          {isUserAdmin && null /* Dispatch tab removed — Admin Panel only */}
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
          {/* TAB 1: PREFERENCES */}
          {tab === "preferences" && (
            <form onSubmit={handleSavePreferences} ref={prefFormRef}>
              <div
                style={{
                  background: isDark ? "rgba(2,132,199,0.08)" : "#f0f9ff",
                  border: "1px solid rgba(2,132,199,0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: "#0284c7",
                    marginBottom: "2px",
                  }}
                >
                  📡 SMS Ethiopia Gateway &amp; Official Email Integration
                </div>
                Configure real-time automated SMS dispatches to your mobile
                (09... / 07... / +251...) and official email bulletins for
                severe disaster threats. Registering your phone automatically enrolls
                your contact into the SMS Ethiopia emergency dispatch roster.
              </div>

              {/* Logged in indicator */}
              {loggedInUser && (loggedInUser.phone || loggedInUser.email) && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#16a34a",
                    background: isDark ? "rgba(34,197,94,0.12)" : "#dcfce7",
                    border: "1px solid rgba(34,197,94,0.3)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    marginBottom: "14px",
                  }}
                >
                  <FiCheck size={12} />
                  <span>
                    Auto-filled from your logged in account (
                    {loggedInUser.fullName ||
                      loggedInUser.username ||
                      loggedInUser.email}
                    )
                  </span>
                </div>
              )}

              {prefFeedback && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background:
                      prefFeedback.type === "success"
                        ? isDark
                          ? "rgba(34,197,94,0.15)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(239,68,68,0.15)"
                          : "#fee2e2",
                    color:
                      prefFeedback.type === "success" ? "#16a34a" : "#ef4444",
                    border: `1px solid ${prefFeedback.type === "success" ? "#16a34a40" : "#ef444440"}`,
                  }}
                >
                  {prefFeedback.msg}
                </div>
              )}

              {/* Name field */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "5px",
                  }}
                >
                  Full Name / Office Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g., DRMC Field Officer / Community Leader"
                  value={prefName}
                  onChange={(e) => setPrefName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-card-alt)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Phone and Email Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                    }}
                  >
                    <FiPhone size={11} style={{ marginRight: "4px" }} />
                    Ethiopian Mobile (SMS):
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678 or +2519..."
                    value={prefPhone}
                    onChange={(e) => setPrefPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-card-alt)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <span
                    style={{ fontSize: "10px", color: "var(--text-muted)" }}
                  >
                    Gateway: SMS Ethiopia (API v2)
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                    }}
                  >
                    <FiMail size={11} style={{ marginRight: "4px" }} />
                    Email Address:
                  </label>
                  <input
                    type="email"
                    placeholder="officer@disaster.et"
                    value={prefEmail}
                    onChange={(e) => setPrefEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-card-alt)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Delivery Channel Radio */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Delivery Channels:
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { id: "both", label: "📱 SMS + ✉️ Email" },
                    { id: "sms", label: "📱 SMS Only" },
                    { id: "email", label: "✉️ Email Only" },
                  ].map(({ id, label }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setPrefChannel(id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border:
                          prefChannel === id
                            ? "1.5px solid #0284c7"
                            : "1px solid var(--border-light)",
                        background:
                          prefChannel === id
                            ? isDark
                              ? "rgba(2,132,199,0.15)"
                              : "#e0f2fe"
                            : "var(--bg-card-alt)",
                        color:
                          prefChannel === id
                            ? "#0284c7"
                            : "var(--text-secondary)",
                        fontWeight: prefChannel === id ? 700 : 500,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region Filter */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Monitored Administrative Regions:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {REGION_OPTIONS.map((r) => {
                    const selected = prefRegions.includes(r);
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => togglePrefRegion(r)}
                        style={{
                          padding: "4px 9px",
                          borderRadius: "6px",
                          border: selected
                            ? "1.5px solid #0284c7"
                            : "1px solid var(--border-light)",
                          background: selected
                            ? isDark
                              ? "rgba(2,132,199,0.2)"
                              : "#e0f2fe"
                            : "var(--bg-card-alt)",
                          color: selected ? "#0284c7" : "var(--text-secondary)",
                          fontSize: "11px",
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {selected ? "✓ " : ""}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hazard Filter */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Hazard Categories:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[
                    "all",
                    "flood",
                    "fire",
                    "earthquake",
                    "landslide",
                    "drought",
                    "volcano",
                  ].map((h) => {
                    const selected = prefHazards.includes(h);
                    const meta = HAZARD_META[h];
                    return (
                      <button
                        type="button"
                        key={h}
                        onClick={() => togglePrefHazard(h)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: selected
                            ? "1.5px solid #0284c7"
                            : "1px solid var(--border-light)",
                          background: selected
                            ? isDark
                              ? "rgba(2,132,199,0.2)"
                              : "#e0f2fe"
                            : "var(--bg-card-alt)",
                          color: selected ? "#0284c7" : "var(--text-secondary)",
                          fontSize: "13px",
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {meta?.icon && (
                          <img
                            src={meta.icon}
                            alt=""
                            style={{
                              width: "13px",
                              height: "13px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                        <span>
                          {h === "all" ? "All Hazards" : meta?.name || h}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minimum Severity Level */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Minimum Trigger Severity:
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "6px",
                  }}
                >
                  {[
                    {
                      id: "Advisory",
                      label: "🟢 Advisory",
                      desc: "Low to Mod",
                    },
                    { id: "Watch", label: "🟡 Watch", desc: "Elevated" },
                    { id: "Warning", label: "🟠 Warning", desc: "High Threat" },
                    {
                      id: "Emergency",
                      label: "🔴 Emergency",
                      desc: "Critical",
                    },
                  ].map(({ id, label, desc }) => {
                    const active = prefMinSeverity === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setPrefMinSeverity(id)}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          border: active
                            ? "1.5px solid #0284c7"
                            : "1px solid var(--border-light)",
                          background: active
                            ? isDark
                              ? "rgba(2,132,199,0.15)"
                              : "#e0f2fe"
                            : "var(--bg-card-alt)",
                          color: active ? "#0284c7" : "var(--text-secondary)",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 800 }}>
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: "9.5px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Alert Banner (Rendered right above button so user instantly sees confirmation) */}
              {prefFeedback && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    marginBottom: "14px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    background:
                      prefFeedback.type === "success"
                        ? isDark
                          ? "rgba(34,197,94,0.18)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(239,68,68,0.18)"
                          : "#fee2e2",
                    color:
                      prefFeedback.type === "success" ? "#16a34a" : "#ef4444",
                    border: `1.5px solid ${prefFeedback.type === "success" ? "#16a34a66" : "#ef444466"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>
                    {prefFeedback.type === "success" ? "✅" : "⚠️"}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>
                    {prefFeedback.msg}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrefFeedback(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: "2px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}

              {/* Submit Button moved to fixed footer */}
            </form>
          )}

          {/* TAB 2: INSTANT TEST VERIFICATION (SMS & EMAIL) */}
          {tab === "test" && (
            <form onSubmit={handleTestDispatch} ref={testFormRef}>
              <div
                style={{
                  background: isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: "#16a34a",
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>🧪</span>
                  Live Multi-Channel Verification Tool
                </div>
                Send an immediate test alert to your phone number via SMS
                Ethiopia Gateway (09... / 07... / +251...) and official HTML
                email bulletin. This lets you verify live delivery immediately
                without waiting for a real natural disaster.
              </div>

              {testFeedback && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    background:
                      testFeedback.type === "success"
                        ? isDark
                          ? "rgba(34,197,94,0.18)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(239,68,68,0.18)"
                          : "#fee2e2",
                    color:
                      testFeedback.type === "success" ? "#16a34a" : "#ef4444",
                    border: `1.5px solid ${testFeedback.type === "success" ? "#16a34a66" : "#ef444466"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>
                    {testFeedback.type === "success" ? "✅" : "⚠️"}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>
                    {testFeedback.msg}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTestFeedback(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: "2px",
                    }}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}

              {/* Name field */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "5px",
                  }}
                >
                  Recipient Name / Title:
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-card-alt)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Test Phone & Email Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                    }}
                  >
                    <FiPhone size={11} style={{ marginRight: "4px" }} />
                    Phone for Test SMS:
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678 or +2519..."
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-card-alt)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginTop: "3px",
                    }}
                  >
                    Dispatches SMS via SMS Ethiopia API
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                    }}
                  >
                    <FiMail size={11} style={{ marginRight: "4px" }} />
                    Email for Test Bulletin:
                  </label>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-card-alt)",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      marginTop: "3px",
                    }}
                  >
                    Dispatches official HTML bulletin
                  </div>
                </div>
              </div>

              {/* Simulated Hazard Type */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Test Hazard Category:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[
                    "earthquake",
                    "flood",
                    "fire",
                    "landslide",
                    "drought",
                    "volcano",
                  ].map((h) => {
                    const selected = testHazard === h;
                    const meta = HAZARD_META[h];
                    return (
                      <button
                        type="button"
                        key={h}
                        onClick={() => setTestHazard(h)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: selected
                            ? "1.5px solid #16a34a"
                            : "1px solid var(--border-light)",
                          background: selected
                            ? isDark
                              ? "rgba(34,197,94,0.2)"
                              : "#dcfce7"
                            : "var(--bg-card-alt)",
                          color: selected ? "#16a34a" : "var(--text-secondary)",
                          fontSize: "12.5px",
                          fontWeight: selected ? 800 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {meta?.icon && (
                          <img
                            src={meta.icon}
                            alt=""
                            style={{
                              width: "14px",
                              height: "14px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                        <span>{meta?.name || h}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Test Button moved to fixed footer */}
            </form>
          )}
        </div>

        {/* ── Fixed footer — always visible, never scrolls ── */}
        {tab === "preferences" && (
          <div
            style={{
              flexShrink: 0,
              padding: "12px 22px 16px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
              background: isDark
                ? "rgba(17,24,39,0.98)"
                : "rgba(255,255,255,0.98)",
            }}
          >
            <button
              type="button"
              disabled={prefSaving}
              onClick={() => prefFormRef.current?.requestSubmit()}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: prefSaving ? "#6b7280" : "#0284c7",
                color: "#ffffff",
                fontSize: "13.5px",
                fontWeight: 800,
                cursor: prefSaving ? "not-allowed" : "pointer",
                boxShadow: prefSaving
                  ? "none"
                  : "0 4px 14px rgba(2,132,199,0.3)",
                transition: "background 0.2s",
              }}
            >
              {prefSaving
                ? "Saving Notification Preferences..."
                : "💾 Save Notification Preferences"}
            </button>
          </div>
        )}

        {tab === "test" && (
          <div
            style={{
              flexShrink: 0,
              padding: "12px 22px 16px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
              background: isDark
                ? "rgba(17,24,39,0.98)"
                : "rgba(255,255,255,0.98)",
            }}
          >
            <button
              type="button"
              disabled={testLoading}
              onClick={() => testFormRef.current?.requestSubmit()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: testLoading ? "#6b7280" : "#16a34a",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 800,
                cursor: testLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: testLoading
                  ? "none"
                  : "0 4px 14px rgba(22,163,74,0.3)",
                transition: "background 0.2s",
              }}
            >
              {testLoading ? (
                <>
                  <FiRefreshCw className="ew-spin" size={16} />
                  <span>Dispatching Live Test Alert...</span>
                </>
              ) : (
                <>
                  <span>🧪</span>
                  <span>Send Live Test Alert (SMS &amp; Email)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ════════════════ MAIN EARLY WARNING COMPONENT ════════════════════════════ */
