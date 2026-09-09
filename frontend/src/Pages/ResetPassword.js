import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const BRAND = "#3949ab";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | invalid
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Parse ?id=...&token=... from the URL
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const token = params.get("token");

  useEffect(() => {
    if (!id || !token) {
      setStatus("invalid");
      setMessage("This reset link is invalid or has already been used.");
    }
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (strength && strength.label === "Weak") {
      setStatus("error");
      setMessage(
        "Password is too weak. Add uppercase letters, numbers, or symbols.",
      );
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Reset failed.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Password reset! Redirecting to login…");
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setStatus("error");
      setMessage(
        "Could not reach the server. Make sure the backend is running.",
      );
    }
  };

  /* ── Password strength indicator ── */
  const strength = (() => {
    if (!password) return null;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpec = /[^A-Za-z0-9]/.test(password);
    const score = [
      password.length >= 8,
      hasUpper,
      hasLower,
      hasNum,
      hasSpec,
    ].filter(Boolean).length;
    if (score <= 2) return { label: "Weak", color: "#ef5350", width: "33%" };
    if (score <= 3) return { label: "Fair", color: "#ff9800", width: "60%" };
    return { label: "Strong", color: "#4caf50", width: "100%" };
  })();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
        background: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "820px",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          minHeight: "420px",
        }}
      >
        {/* ── Left: Form panel ── */}
        <div
          style={{
            flex: "1 1 55%",
            background: "#f0eeff",
            padding: "44px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              color: BRAND,
              fontWeight: 700,
              fontSize: "22px",
              marginBottom: "8px",
            }}
          >
            Set New Password
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "13px",
              marginBottom: "28px",
            }}
          >
            Choose a strong password for your account.
          </p>

          {/* Invalid link state */}
          {status === "invalid" && (
            <div
              style={{
                background: "#ffebee",
                color: "#c62828",
                padding: "16px",
                borderRadius: "10px",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              {message}
              <br />
              <Link
                to="/forgot-password"
                style={{ color: BRAND, fontWeight: 600 }}
              >
                Request a new reset link
              </Link>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                padding: "24px",
                background: "#e8f5e9",
                borderRadius: "14px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#4caf50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                }}
              >
                ✅
              </div>
              <p
                style={{
                  color: "#2e7d32",
                  fontWeight: 600,
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                {message}
              </p>
              <Link
                to="/login"
                style={{ color: BRAND, fontSize: "13px", fontWeight: 500 }}
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Form — show unless invalid or success */}
          {status !== "invalid" && status !== "success" && (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* New password */}
              <div style={{ position: "relative" }}>
                <FiLock
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9c9cb8",
                  }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="New password"
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 36px",
                    border: "1.5px solid #d8d4f0",
                    borderRadius: "10px",
                    fontSize: "13px",
                    background: "rgba(255,255,255,0.80)",
                    outline: "none",
                    color: "#333",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9c9cb8",
                    padding: 0,
                  }}
                >
                  {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div>
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "4px",
                      background: "#e0e0e0",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: strength.width,
                        background: strength.color,
                        transition: "width 0.3s, background 0.3s",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: strength.color,
                      margin: "4px 0 0",
                      fontWeight: 600,
                    }}
                  >
                    {strength.label}
                    {strength.label === "Weak" && (
                      <span style={{ color: "#888", fontWeight: 400 }}>
                        {" "}
                        — add uppercase, numbers, or symbols
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Confirm password */}
              <div style={{ position: "relative" }}>
                <FiLock
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9c9cb8",
                  }}
                />
                <input
                  type={showCpw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 36px",
                    border: `1.5px solid ${confirm && confirm !== password ? "#ef5350" : "#d8d4f0"}`,
                    borderRadius: "10px",
                    fontSize: "13px",
                    background: "rgba(255,255,255,0.80)",
                    outline: "none",
                    color: "#333",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCpw(!showCpw)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9c9cb8",
                    padding: 0,
                  }}
                >
                  {showCpw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>

              {/* Error */}
              {status === "error" && (
                <div
                  style={{
                    background: "#ffebee",
                    color: "#c62828",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  status === "loading" ||
                  (strength && strength.label === "Weak")
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  background:
                    strength && strength.label === "Weak" ? "#bbb" : BRAND,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor:
                    status === "loading" ||
                    (strength && strength.label === "Weak")
                      ? "not-allowed"
                      : "pointer",
                  opacity: status === "loading" ? 0.7 : 1,
                  marginTop: "4px",
                  transition: "background 0.3s",
                }}
              >
                {status === "loading" ? "Resetting…" : "Reset Password"}
              </button>

              <div style={{ textAlign: "center" }}>
                <Link to="/login" style={{ color: BRAND, fontSize: "12px" }}>
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* ── Right: Info panel ── */}
        <div
          style={{
            flex: "1 1 45%",
            background: BRAND,
            padding: "44px 36px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px" }}>🔒</div>
          <h1
            style={{
              color: "#f0d060",
              fontWeight: 800,
              fontSize: "30px",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            New
            <br />
            Password
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "13px",
              margin: 0,
              maxWidth: "200px",
            }}
          >
            Make sure it's at least 6 characters and something you'll remember.
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.70)",
              fontSize: "12px",
              margin: 0,
            }}
          >
            Already know your password?
          </p>
          <Link to="/login">
            <button
              style={{
                padding: "9px 28px",
                background: "transparent",
                color: "#fff",
                border: "2px solid rgba(255,255,255,0.80)",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log In
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
