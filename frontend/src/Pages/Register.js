import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiGrid,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const BRAND = "#3949ab";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    department: "",
    designation: "LEO",
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!agree) return setError("You must accept the terms of the agreement.");
    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match");
    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          fullName: formData.fullName,
          department: formData.department,
          designation: formData.designation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      setSuccess(
        "Registration successful! Your account is pending admin approval.",
      );
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        department: "",
        designation: "LEO",
      });
      setTimeout(() => navigate("/login"), 3000);
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
          maxWidth: "860px",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          minHeight: "520px",
        }}
      >
        {/* ── Left: Form panel ── */}
        <div
          style={{
            flex: "1 1 60%",
            background: "#f0eeff",
            padding: "36px 40px",
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
              fontSize: "20px",
              marginBottom: "22px",
            }}
          >
            Create Account
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Row 1: Full Name + Username */}
            <div style={rowStyle}>
              <FieldWrap icon={<FiUser size={14} />}>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Full Name"
                  style={inputStyle}
                />
              </FieldWrap>
              <FieldWrap icon={<FiUser size={14} />}>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Username"
                  style={inputStyle}
                />
              </FieldWrap>
            </div>

            {/* Row 2: Phone + Email */}
            <div style={rowStyle}>
              <FieldWrap icon={<FiPhone size={14} />}>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone (optional)"
                  style={inputStyle}
                />
              </FieldWrap>
              <FieldWrap icon={<FiMail size={14} />}>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email"
                  style={inputStyle}
                />
              </FieldWrap>
            </div>

            {/* Row 3: Password + Confirm */}
            <div style={rowStyle}>
              <FieldWrap
                icon={<FiLock size={14} />}
                extra={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={eyeBtn}
                  >
                    {showPw ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                  </button>
                }
              >
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Password"
                  style={{ ...inputStyle, paddingRight: "36px" }}
                />
              </FieldWrap>
              <FieldWrap
                icon={<FiLock size={14} />}
                extra={
                  <button
                    type="button"
                    onClick={() => setShowCpw(!showCpw)}
                    style={eyeBtn}
                  >
                    {showCpw ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                  </button>
                }
              >
                <input
                  name="confirmPassword"
                  type={showCpw ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm Password"
                  style={{ ...inputStyle, paddingRight: "36px" }}
                />
              </FieldWrap>
            </div>

            {/* Row 4: Department + Designation */}
            <div style={rowStyle}>
              <FieldWrap icon={<FiGrid size={14} />}>
                <input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Department"
                  style={inputStyle}
                />
              </FieldWrap>
              <FieldWrap icon={<FiBriefcase size={14} />}>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  style={{ ...inputStyle, appearance: "none" }}
                >
                  <option value="LEO">LEO (Leader Executive Officer)</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Student">Student Researcher</option>
                </select>
              </FieldWrap>
            </div>

            {/* Agree checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "12px",
                color: "#555",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={agree}
                onChange={() => setAgree(!agree)}
                style={{ accentColor: BRAND, width: "14px", height: "14px" }}
              />
              I accept the terms of the agreement
            </label>

            {error && (
              <div
                style={{
                  background: "#ffebee",
                  color: "#c62828",
                  padding: "9px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  padding: "9px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                {success}
              </div>
            )}

            {/* Sign Up button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "4px",
              }}
            >
              {loading ? "Registering…" : "Sign Up"}
            </button>
          </form>

          {/* Carousel dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              marginTop: "18px",
            }}
          >
            <div style={dotInactive} />
            <div style={dotActive} />
            <div style={dotInactive} />
          </div>
        </div>

        {/* ── Right: Get Started panel ── */}
        <div
          style={{
            flex: "1 1 40%",
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
            Get
            <br />
            Started
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: "13px",
              margin: 0,
              maxWidth: "200px",
            }}
          >
            Already have an account?
          </p>
          <Link to="/login">
            <button style={outlineBtn}>Log In</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Helper: field wrapper with left icon and optional right element ────────
function FieldWrap({ icon, extra, children }) {
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <span
        style={{
          position: "absolute",
          left: "11px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#9c9cb8",
          pointerEvents: "none",
        }}
      >
        {icon}
      </span>
      {children}
      {extra}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const rowStyle = { display: "flex", gap: "10px" };

const inputStyle = {
  width: "100%",
  padding: "10px 12px 10px 34px",
  border: "1.5px solid #d8d4f0",
  borderRadius: "10px",
  fontSize: "12px",
  background: "rgba(255,255,255,0.80)",
  outline: "none",
  color: "#333",
  boxSizing: "border-box",
};

const eyeBtn = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#9c9cb8",
  padding: 0,
};

const primaryBtn = {
  width: "100%",
  padding: "11px",
  background: BRAND,
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
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

export default Register;
