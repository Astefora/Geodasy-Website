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

// ── Shared password strength helper ──────────────────────────────────────
function getStrength(pw) {
  if (!pw) return null;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSpec = /[^A-Za-z0-9]/.test(pw);
  const score = [pw.length >= 8, hasUpper, hasLower, hasNum, hasSpec].filter(
    Boolean,
  ).length;
  if (score <= 2) return { label: "Weak", color: "#ef5350", width: "33%" };
  if (score <= 3) return { label: "Fair", color: "#ff9800", width: "60%" };
  return { label: "Strong", color: "#4caf50", width: "100%" };
}

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
  const [errorCode, setErrorCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState(""); // shown under the phone field
  // phoneDigits holds only the 9-digit part the user types; we prepend +251 on submit
  const [phoneDigits, setPhoneDigits] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setEmailError("");
    setPhoneError("");
    setSuccess("");
    if (!agree) return setError("You must accept the terms of the agreement.");
    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match");
    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters");
    const pwStrength = getStrength(formData.password);
    if (pwStrength && pwStrength.label === "Weak")
      return setError(
        "Password is too weak. Add uppercase letters, numbers, or symbols.",
      );
    // Phone validation — required, must be exactly 9 digits
    if (!/^\d{9}$/.test(phoneDigits)) {
      setPhoneError(
        phoneDigits === ""
          ? "Phone number is required"
          : "Enter exactly 9 digits after +251 (e.g. 912345678)",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          // Send full Ethiopian number or empty string
          phone: phoneDigits ? "+251" + phoneDigits : "",
          password: formData.password,
          fullName: formData.fullName,
          department: formData.department,
          designation: formData.designation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_REJECTED") {
          // Show error directly under the email field
          setEmailError(
            data.error || "This email address could not be verified.",
          );
          setErrorCode("EMAIL_REJECTED");
        } else {
          setError(data.error || "Registration failed");
          setErrorCode(data.code || "");
        }
        setLoading(false);
        return;
      }
      setSuccess(
        "Registration successful! Please check your email to verify your address.",
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
      setPhoneDigits("");
      setTimeout(() => navigate("/verify-email"), 2000);
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
              <FieldWrap icon={<FiUser size={14} />} required>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Full Name"
                  style={inputStyle}
                />
              </FieldWrap>
              <FieldWrap icon={<FiUser size={14} />} required>
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
              {/* ── Ethiopian phone field ── same flex:1 as FieldWrap ── */}
              <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "10px",
                    border: phoneError
                      ? "1.5px solid #ef5350"
                      : "1.5px solid #d8d4f0",
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.80)",
                    height: "36px",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Fixed +251 — no background fill, just a right divider line */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0 8px 0 10px",
                      borderRight: "1.5px solid #d8d4f0",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#3949ab",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                      flexShrink: 0,
                      height: "100%",
                    }}
                  >
                    <FiPhone size={13} color="#9c9cb8" />
                    +251
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phoneDigits}
                    placeholder="9 digits"
                    maxLength={9}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 9);
                      setPhoneDigits(digits);
                      if (phoneError) setPhoneError("");
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      padding: "0 10px",
                      fontSize: "12px",
                      color: "#333",
                      background: "transparent",
                      minWidth: 0,
                      height: "100%",
                    }}
                  />
                </div>
                {/* Red * badge — matches FieldWrap positioning */}
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "6px",
                    color: "#ef5350",
                    fontSize: "13px",
                    fontWeight: 700,
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  *
                </span>
                {phoneError && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "11px",
                      color: "#ef5350",
                      fontWeight: 500,
                      paddingLeft: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ⚠ {phoneError}
                  </p>
                )}
              </div>

              {/* ── Email field ── */}
              <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
                <FieldWrap icon={<FiMail size={14} />} required>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleChange(e);
                      if (emailError) setEmailError("");
                    }}
                    required
                    placeholder="Email"
                    style={{
                      ...inputStyle,
                      border: emailError
                        ? "1.5px solid #ef5350"
                        : "1.5px solid #d8d4f0",
                    }}
                  />
                </FieldWrap>
                {emailError && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "11px",
                      color: "#ef5350",
                      fontWeight: 500,
                      paddingLeft: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ⚠ {emailError}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Password + Confirm */}
            <div style={rowStyle}>
              <FieldWrap
                icon={<FiLock size={14} />}
                required
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
                required
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

            {/* Password strength bar */}
            {(() => {
              const s = getStrength(formData.password);
              if (!s) return null;
              return (
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
                        width: s.width,
                        background: s.color,
                        borderRadius: "4px",
                        transition: "width 0.3s, background 0.3s",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: s.color,
                      margin: "3px 0 0",
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                    {s.label === "Weak" && (
                      <span style={{ color: "#888", fontWeight: 400 }}>
                        {" "}
                        — add uppercase, numbers, or symbols
                      </span>
                    )}
                  </p>
                </div>
              );
            })()}

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
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: "28px",
                  }}
                >
                  <option value="LEO">LEO (Leader Executive Officer)</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Student">Student Researcher</option>
                </select>
                {/* Custom dropdown arrow */}
                <span
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#9c9cb8",
                    fontSize: "10px",
                    lineHeight: 1,
                  }}
                >
                  ▼
                </span>
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
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "center",
                  borderLeft: "3px solid #ef5350",
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
              disabled={
                loading || getStrength(formData.password)?.label === "Weak"
              }
              style={{
                ...primaryBtn,
                background:
                  getStrength(formData.password)?.label === "Weak"
                    ? "#bbb"
                    : BRAND,
                opacity: loading ? 0.7 : 1,
                cursor:
                  loading || getStrength(formData.password)?.label === "Weak"
                    ? "not-allowed"
                    : "pointer",
                marginTop: "4px",
                transition: "background 0.3s",
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
function FieldWrap({ icon, extra, children, required: isRequired }) {
  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 0",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "11px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#9c9cb8",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {icon}
      </span>
      {children}
      {extra}
      {isRequired && (
        <span
          style={{
            position: "absolute",
            top: "4px",
            right: "6px",
            color: "#ef5350",
            fontSize: "13px",
            fontWeight: 700,
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          *
        </span>
      )}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
// Using `flex: 1 1 0` + `minWidth: 0` on the row forces both columns to
// start from zero width and grow equally, regardless of content.
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
  height: "36px",
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
