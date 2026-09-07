import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

// Brand color from existing .auth-btn
const BRAND = "#3949ab";
const BRAND_DARK = "#2c3899";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("approved", "true");
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (data.user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
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
      {/* Outer container */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "820px",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          minHeight: "480px",
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
              marginBottom: "28px",
            }}
          >
            Log In
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Username */}
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
                placeholder="Username or Email"
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
                placeholder="Password"
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

            {/* Remember + Forgot */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  style={{ accentColor: BRAND, width: "14px", height: "14px" }}
                />
                Remember me
              </label>
              <Link
                to="#"
                style={{
                  color: BRAND,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Demo box */}
            <div
              style={{
                background: "rgba(57,73,171,0.08)",
                border: `1px solid ${BRAND}44`,
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#555",
              }}
            >
              🧪 <strong style={{ color: BRAND }}>Demo:</strong> leo@geodesy.et
              / Leo@1234
            </div>

            {error && (
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
                {error}
              </div>
            )}

            {/* Log In button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Logging in…" : "Log In"}
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
            <div style={dotActive} />
            <div style={dotInactive} />
            <div style={dotInactive} />
          </div>
        </div>

        {/* ── Right: Welcome panel ── */}
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
          <h1
            style={{
              color: "#f0d060",
              fontWeight: 800,
              fontSize: "32px",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Welcome
            <br />
            Back!
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: "13px",
              margin: 0,
              maxWidth: "200px",
            }}
          >
            Please enter your details
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.70)",
              fontSize: "12px",
              margin: 0,
            }}
          >
            Don't have an account?
          </p>
          <Link to="/register">
            <button style={outlineBtn}>Sign Up</button>
          </Link>
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

const primaryBtn = {
  width: "100%",
  padding: "12px",
  background: BRAND,
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: "4px",
};

const outlineBtn = {
  padding: "9px 28px",
  background: "transparent",
  color: "#fff",
  border: "2px solid rgba(255,255,255,0.80)",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
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

export default Login;
