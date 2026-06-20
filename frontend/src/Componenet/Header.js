import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
const logo = "/ggd_logo.png";

function Header() {
  const [hazardOpen, setHazardOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const toggleHazard = () => setHazardOpen(!hazardOpen);

  // Close dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!hazardOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setHazardOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hazardOpen]);

  const hazards = [
    { name: "Landslide", path: "/hazards/landslide" },
    { name: "Flood", path: "/hazards/flood" },
    { name: "Drought", path: "/hazards/drought" },
    { name: "Volcano", path: "/hazards/volcano" },
    { name: "Fire", path: "/hazards/fire" },
    { name: "Earthquake", path: "/hazards/earthquake" },
  ];

  return (
    <header
      className="site-header"
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        backgroundColor: "var(--header-bg)",
        padding: "15px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--header-border)",
        zIndex: 1000,
        fontFamily: "'Segoe UI', sans-serif",
        transition: "background-color 0.3s, border-color 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <img
          src={logo}
          alt="SSGI Logo"
          style={{ width: "45px", height: "45px" }}
        />
        <h2
          style={{
            color: "var(--accent-blue)",
            margin: 0,
            fontSize: "20px",
            fontWeight: "600",
          }}
        >
          Geodesy & Geodynamics LE
        </h2>
      </div>

      <nav
        className="site-nav"
        style={{
          display: "flex",
          gap: "24px",
          position: "relative",
          alignItems: "center",
        }}
      >
        <Link
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "500",
          }}
          to="/"
        >
          Home
        </Link>

        <Link
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "500",
          }}
          to="/about"
        >
          About
        </Link>

        <Link
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "500",
          }}
          to="/early-warning"
        >
          Early Warning
        </Link>

        <div style={{ position: "relative" }} ref={dropdownRef}>
          <span
            onClick={toggleHazard}
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Near Real-Time Hazard Monitoring ▼
          </span>
          {hazardOpen && (
            <div
              style={{
                position: "absolute",
                top: "35px",
                right: 0,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minWidth: "180px",
                boxShadow: "0 4px 10px var(--shadow)",
                zIndex: 1000,
              }}
            >
              {hazards.map((hazard) => (
                <span
                  key={hazard.name}
                  style={{
                    padding: "12px 20px",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-light)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--accent-brand)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  onClick={() => {
                    navigate(hazard.path);
                    setHazardOpen(false);
                  }}
                >
                  {hazard.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <span
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
          }}
          onClick={() => {
            const isAuth = localStorage.getItem("isAuthenticated");
            navigate(isAuth ? "/dashboard" : "/login");
          }}
        >
          Research
        </span>
      </nav>
    </header>
  );
}

export default Header;
