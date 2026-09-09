import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft } from "react-icons/fi";

const BRAND = "#3949ab";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setStatus("sent");
      setMessage(data.message || "Reset link sent! Check your inbox.");
    } catch {
      setStatus("error");
      setMessage(
        "Could not reach the server. Make sure the backend is running.",
      );
    }
  };

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
          {/* Back link */}
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: BRAND,
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "24px",
            }}
          >
            <FiArrowLeft size={14} /> Back to Login
          </Link>

          <h2
            style={{
              textAlign: "center",
              color: BRAND,
              fontWeight: 700,
              fontSize: "22px",
              marginBottom: "8px",
            }}
          >
            Forgot Password?
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              fontSize: "13px",
              marginBottom: "28px",
            }}
          >
            Enter your email and we'll send you a reset link.
          </p>

          {status === "sent" ? (
            /* ── Success state ── */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
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
                ✉️
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
              <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>
                Check your spam folder if you don't see it within a few minutes.
              </p>
              <Link
                to="/login"
                style={{ color: BRAND, fontSize: "13px", fontWeight: 500 }}
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Email field */}
              <div style={{ position: "relative" }}>
                <FiMail
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Your registered email"
                  style={{
                    width: "100%",
                    padding: "11px 12px 11px 36px",
                    border: "1.5px solid #d8d4f0",
                    borderRadius: "10px",
                    fontSize: "13px",
                    background: "rgba(255,255,255,0.80)",
                    outline: "none",
                    color: "#333",
                    boxSizing: "border-box",
                  }}
                />
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

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: BRAND,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  opacity: status === "loading" ? 0.7 : 1,
                  marginTop: "4px",
                }}
              >
                {status === "loading" ? "Sending…" : "Send Reset Link"}
              </button>
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
          <div style={{ fontSize: "48px" }}>🔑</div>
          <h1
            style={{
              color: "#f0d060",
              fontWeight: 800,
              fontSize: "30px",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Reset
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
            We'll email you a secure link to reset your password.
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.70)",
              fontSize: "12px",
              margin: 0,
            }}
          >
            Remember your password?
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

export default ForgotPassword;
