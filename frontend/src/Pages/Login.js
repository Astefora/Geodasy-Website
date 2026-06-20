import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
        return;
      }

      // Store session
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("approved", "true");
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Could not reach the server. Make sure the backend is running.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2>LEO Member Login</h2>
          <p>Access the research portal with your approved account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email or Username *</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Enter email or username"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Enter password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #1f4fd8",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "14px",
              fontSize: "13px",
              color: "#aaa",
            }}
          >
            🧪 <strong style={{ color: "#f28c28" }}>Demo account:</strong>{" "}
            <span style={{ color: "#fff" }}>leo@geodesy.et</span> /{" "}
            <span style={{ color: "#fff" }}>Leo@1234</span>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>

          <div className="auth-footer">
            <p>
              Not registered?{" "}
              <Link to="/register">Register for LEO membership</Link>
            </p>
            <p>
              <Link to="/">Return to Home</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
