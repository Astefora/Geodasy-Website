import { Link } from "react-router-dom";

function About() {
  return (
    <div
      style={{
        paddingTop: "120px",
        paddingBottom: "80px",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "120px 24px 80px",
        color: "var(--text-primary)",
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h1
          style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "16px" }}
        >
          <span style={{ color: "#1f4fd8" }}>About</span>{" "}
          <span style={{ color: "#f28c28" }}>Geodesy & Geodynamics</span>
        </h1>
        <p
          style={{
            fontSize: "17px",
            color: "var(--text-secondary)",
            lineHeight: "1.8",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          The Geodesy & Geodynamics Department operates under the Ethiopian
          Space Science and Geospatial Institute (SSGI), dedicated to monitoring
          Earth's dynamic processes and natural hazards across Ethiopia using
          advanced satellite geodesy and geophysical methods.
        </p>
      </div>

      {/* Mission & Vision */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "50px",
        }}
      >
        {[
          {
            icon: "🎯",
            title: "Mission",
            text: "To monitor, analyze, and communicate geophysical hazards and Earth deformation across Ethiopia using state-of-the-art satellite geodesy, InSAR, GPS, and remote sensing technologies — supporting disaster risk reduction and sustainable development.",
          },
          {
            icon: "🔭",
            title: "Vision",
            text: "To be the leading center of excellence in geodetic research and near-real-time hazard monitoring in East Africa, bridging the gap between scientific observation and actionable disaster preparedness.",
          },
        ].map(({ icon, title, text }) => (
          <div
            key={title}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: "12px",
              padding: "28px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
            <h3
              style={{
                color: "#f28c28",
                marginBottom: "12px",
                fontSize: "20px",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: "1.7",
                margin: 0,
              }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* What We Do */}
      <div style={{ marginBottom: "50px" }}>
        <h2
          style={{
            color: "#00aaff",
            fontSize: "26px",
            marginBottom: "24px",
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "12px",
          }}
        >
          What We Do
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              icon: "🛰️",
              title: "Satellite Geodesy",
              desc: "InSAR and GPS measurements to track ground deformation at millimeter precision across volcanic, seismic, and landslide-prone zones.",
            },
            {
              icon: "🌋",
              title: "Volcano Monitoring",
              desc: "Continuous tracking of surface deformation at Ethiopian rift volcanoes using Sentinel-1 SAR data and COMET portal integration.",
            },
            {
              icon: "🌍",
              title: "Earthquake Seismology",
              desc: "Real-time seismic monitoring and post-event analysis using USGS feeds and local ground truth data.",
            },
            {
              icon: "🔥",
              title: "Fire Detection",
              desc: "Near-real-time fire hotspot detection using NASA FIRMS VIIRS data to track wildfires across Ethiopian landscapes.",
            },
            {
              icon: "🌊",
              title: "Flood & Drought Analysis",
              desc: "Monitoring of land surface temperature, soil moisture and rainfall anomalies using MODIS and Sentinel satellites.",
            },
            {
              icon: "📡",
              title: "Research & Data Sharing",
              desc: "Publishing open datasets and peer-reviewed research through our LEO member portal to support national and international collaborations.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: "10px",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "26px", marginBottom: "8px" }}>
                {icon}
              </div>
              <h4
                style={{
                  color: "#00aaff",
                  marginBottom: "8px",
                  fontSize: "15px",
                }}
              >
                {title}
              </h4>
              <p
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  margin: 0,
                  fontSize: "13px",
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Institution */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "50px",
        }}
      >
        <h2
          style={{ color: "#00aaff", fontSize: "22px", marginBottom: "16px" }}
        >
          🏛️ Ethiopian Space Science and Geospatial Institute (SSGI)
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            lineHeight: "1.8",
            margin: 0,
          }}
        >
          SSGI is Ethiopia's premier institution for space science, geodesy, and
          geospatial research. The institute coordinates satellite operations,
          Earth observation programs, and geoscience education — playing a
          critical role in national development planning, disaster response, and
          climate resilience initiatives across the Horn of Africa.
        </p>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
          Explore our hazard monitoring dashboard or access published research.
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/research"
            style={{
              padding: "12px 28px",
              borderRadius: "8px",
              border: "1px solid #f28c28",
              color: "#f28c28",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            Research Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default About;
