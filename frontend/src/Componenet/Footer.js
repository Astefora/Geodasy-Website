import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border-light)",
        color: "var(--text-muted)",
        fontFamily: "'Segoe UI', sans-serif",
        marginTop: "60px",
      }}
    >
      {/* Main footer grid */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "36px",
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <img
              src="/ggd_logo.png"
              alt="SSGI Logo"
              style={{ width: "36px", height: "36px" }}
            />
            <span
              style={{ color: "#00aaff", fontWeight: "700", fontSize: "15px" }}
            >
              Geodesy & Geodynamics
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              lineHeight: "1.7",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Near-real-time hazard monitoring and geodetic research for Ethiopia,
            operated by the Ethiopian Space Science and Geospatial Institute
            (SSGI).
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4
            style={{
              color: "var(--text-primary)",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "14px",
              marginTop: 0,
            }}
          >
            Navigation
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {[
              { label: "Home", to: "/" },
              { label: "About", to: "/about" },
              { label: "Hazards", to: "/hazards" },
              { label: "Research Portal", to: "/research" },
              { label: "Dashboard", to: "/dashboard" },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "13px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00aaff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Hazards */}
        <div>
          <h4
            style={{
              color: "var(--text-primary)",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "14px",
              marginTop: 0,
            }}
          >
            Hazards
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {[
              { label: "🌋 Volcano", to: "/hazards/volcano" },
              { label: "🌍 Earthquake", to: "/hazards/earthquake" },
              { label: "🔥 Fire", to: "/hazards/fire" },
              { label: "🌊 Flood", to: "/hazards/flood" },
              { label: "⛰️ Landslide", to: "/hazards/landslide" },
              { label: "☀️ Drought", to: "/hazards/drought" },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "13px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f28c28")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <h4
            style={{
              color: "var(--text-primary)",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "14px",
              marginTop: 0,
            }}
          >
            Data Sources
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {[
              {
                label: "NASA FIRMS (Fire)",
                href: "https://firms.modaps.eosdis.nasa.gov",
              },
              {
                label: "USGS Earthquakes",
                href: "https://earthquake.usgs.gov",
              },
              {
                label: "NASA GIBS (Imagery)",
                href: "https://earthdata.nasa.gov",
              },
              {
                label: "COMET Volcanoes",
                href: "https://cometarchive.leeds.ac.uk/comet-volcano-portal/",
              },
              {
                label: "Sentinel-1 / ESA",
                href: "https://sentinels.copernicus.eu",
              },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: "13px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00aaff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          padding: "16px 24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © {year} Ethiopian Space Science and Geospatial Institute (SSGI) —
          Geodesy & Geodynamics Department
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Data for research and monitoring purposes only
        </span>
      </div>
    </footer>
  );
}

export default Footer;
