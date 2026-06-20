import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in as admin, redirect
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "admin") navigate("/admin");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid admin credentials");
        return;
      }

      if (data.user.role !== "admin") {
        setError("This account is not an admin. Use the member login page.");
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      navigate("/admin");
    } catch (err) {
      setError("Could not reach the server. Make sure the backend is running.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: "420px" }}>
        <div className="auth-header">
          <h2>🔒 Admin Login</h2>
          <p>System administrator access only</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-control"
              placeholder="admin@geodesy.et"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control"
              placeholder="Enter admin password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-btn">
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
