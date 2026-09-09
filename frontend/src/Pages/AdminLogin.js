import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiShield } from "react-icons/fi";

const BRAND = "#3949ab";

function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "admin") navigate("/admin");
      } catch {}
      return;
    }
    // Auto-restore admin session from Remember Me cookie
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.role === "admin") {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          navigate("/admin");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid admin credentials");
        setLoading(false);
        return;
      }

      if (data.user.role !== "admin") {
        setError("This account is not an admin. Use the member login page.");
        setLoading(false);
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      navigate("/admin");
    } catch {
      setError("Could not reach the server. Make sure the backend is running.");
      setLoading(false);
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
          minHeight: "440px",
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
            Admin Login
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#888",
              fontSize: "12px",
              marginBottom: "28px",
            }}
          >
            System administrator access only
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Email / Username */}
            <div style={{ position: "relative" }}>
              <FiUser
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Admin email or username"
                style={inputStyle}
              />
            </div>

            {/* Password */}
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
                name="password"
                type={showPw ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Admin password"
                style={{ ...inputStyle, paddingRight: "40px" }}
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

            {error && (
              <div
                style={{
                  background: "#ffebee",
                  color: "#c62828",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: BRAND,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: "4px",
              }}
            >
              {loading ? "Logging in…" : "Login as Admin"}
            </button>
          </form>

          {/* Carousel dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              marginTop: "28px",
            }}
          >
            <div style={dotInactive} />
            <div style={dotInactive} />
            <div style={dotActive} />
          </div>
        </div>

        {/* ── Right: Brand panel ── */}
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
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiShield size={28} color="#f0d060" />
          </div>
          <h1
            style={{
              color: "#f0d060",
              fontWeight: 800,
              fontSize: "30px",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Admin
            <br />
            Portal
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "13px",
              margin: 0,
              maxWidth: "200px",
              lineHeight: 1.6,
            }}
          >
            Restricted access. Authorised personnel only.
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "11px",
              margin: 0,
            }}
          >
            Geodesy & Geodynamics Department
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "11px 12px 11px 36px",
  border: "1.5px solid #d8d4f0",
  borderRadius: "10px",
  fontSize: "13px",
  background: "rgba(255,255,255,0.80)",
  outline: "none",
  color: "#333",
  boxSizing: "border-box",
};

const dotActive = {
  width: "20px",
  height: "8px",
  borderRadius: "4px",
  background: "rgba(255,255,255,0.90)",
};
const dotInactive = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.35)",
};

export default AdminLogin;
