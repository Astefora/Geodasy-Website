import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    department: "",
    designation: "LEO",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          department: formData.department,
          designation: formData.designation,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        return setError(data.error || "Registration failed");
      }

      setSuccess(
        "Registration successful! Your account is pending admin approval.",
      );
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        department: "",
        designation: "LEO",
      });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError("Could not reach the server. Make sure the backend is running.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2>Register as LEO Member</h2>
          <p>Leader Executive Officer Registration</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Choose a username"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control"
                placeholder="Your department"
              />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="form-control"
              >
                <option value="LEO">LEO (Leader Executive Officer)</option>
                <option value="Researcher">Researcher</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Student Researcher</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="auth-btn">
            Register for Approval
          </button>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
            <p className="notice">* Your account requires admin approval.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
