import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiGlobe,
  FiRadio,
} from "react-icons/fi";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const DATA_SOURCES = [
  { label: "NASA FIRMS (Fire)", href: "https://firms.modaps.eosdis.nasa.gov" },
  { label: "USGS Earthquakes", href: "https://earthquake.usgs.gov" },
  { label: "NASA GIBS (Imagery)", href: "https://earthdata.nasa.gov" },
  {
    label: "COMET Volcanoes",
    href: "https://cometarchive.leeds.ac.uk/comet-volcano-portal/",
  },
  { label: "Sentinel-1 / ESA", href: "https://sentinels.copernicus.eu" },
];

const HAZARD_LINKS = [
  {
    label: "Volcano",
    to: "/hazards/volcano",
    img: "/icons/icons8-volcano-48.png",
  },
  {
    label: "Earthquake",
    to: "/hazards/earthquake",
    img: "/icons/icons8-earthquake-100.png",
  },
  { label: "Fire", to: "/hazards/fire", img: "/icons/icons8-fire-48.png" },
  { label: "Flood", to: "/hazards/flood", img: "/icons/icons8-flood-64.png" },
  {
    label: "Landslide",
    to: "/hazards/landslide",
    img: "/icons/icons8-landslide-100.png",
  },
  {
    label: "Drought",
    to: "/hazards/drought",
    img: "/icons/icons8-drought-32.png",
  },
];

/* ── Footer arrow-link helper ─────────────────────────────────────────────── */
function FooterLink({ label, to, external, img }) {
  const style = {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "13px",
    color: "var(--text-muted)",
    textDecoration: "none",
    transition: "color 0.18s",
    lineHeight: 1,
  };
  const enter = (e) => (e.currentTarget.style.color = "var(--accent-blue)");
  const leave = (e) => (e.currentTarget.style.color = "var(--text-muted)");

  const inner = (
    <>
      {img && (
        <img
          src={img}
          alt={label}
          width={14}
          height={14}
          style={{ objectFit: "contain", flexShrink: 0 }}
        />
      )}
      {!img && (
        <FiArrowRight size={11} style={{ flexShrink: 0, opacity: 0.55 }} />
      )}
      {label}
    </>
  );

  return external ? (
    <a
      href={to}
      target="_blank"
      rel="noreferrer"
      style={style}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      {inner}
    </a>
  ) : (
    <Link to={to} style={style} onMouseEnter={enter} onMouseLeave={leave}>
      {inner}
    </Link>
  );
}

/* ── Section heading ──────────────────────────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text-primary)",
        }}
      >
        {children}
      </span>
      <div
        style={{
          width: "24px",
          height: "2px",
          borderRadius: "2px",
          background: "var(--accent-orange)",
          marginTop: "6px",
        }}
      />
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState("idle"); // idle | sending | sent | error
  const [subError, setSubError] = useState("");

  // ── Dynamic CMS Content with fallbacks ──────────────────────────────────
  const [dataSources, setDataSources] = useState(DATA_SOURCES);
  const [contactInfo, setContactInfo] = useState({
    address: "Addis Ababa, Ethiopia\nEthiopian Space Science & Geospatial Institute",
    phone: "+251 (0) 11 XXX XXXX",
    email: "geodesy@ssgi.gov.et",
  });

  useEffect(() => {
    let isMounted = true;
    fetch("/api/content")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const footer = data.footer || data.content?.footer;
        if (!footer) return;
        if (footer.dataSources && Array.isArray(footer.dataSources)) {
          const active = footer.dataSources.filter(
            (s) => s.is_active !== false,
          );
          if (active.length > 0) {
            setDataSources(active);
          }
        }
        setContactInfo({
          address:
            footer.address ||
            "Addis Ababa, Ethiopia\nEthiopian Space Science & Geospatial Institute",
          phone: footer.phone || "+251 (0) 11 XXX XXXX",
          email: footer.email || "geodesy@ssgi.gov.et",
        });
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubStatus("sending");
    setSubError("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubError(data.error || "Subscription failed. Please try again.");
        setSubStatus("error");
        return;
      }
      setSubStatus("sent");
      setEmail("");
      // Reset after 5s so user can see the success message
      setTimeout(() => setSubStatus("idle"), 5000);
    } catch {
      setSubError("Could not reach the server. Please try again.");
      setSubStatus("error");
    }
  };

  return (
    <footer
      style={{
        // backgroundColor: "color-mix(in srgb, var(--bg-card) 70%, transparent)",
        // backdropFilter: "blur(4px)",
        // WebkitBackdropFilter: "blur(4px)",
        borderTop: "1px solid var(--border-light)",
        color: "var(--text-muted)",
        fontFamily: "'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
        marginTop: "20px",
      }}
    >
      {/* Subtle ambient glow — top-left */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,170,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Top bar: brand + socials ────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          padding: "20px 32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/ggd_logo.png"
            alt="Logo"
            style={{ width: "32px", height: "32px", borderRadius: "8px" }}
          />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "14px",
                color: "var(--accent-blue)",
                lineHeight: 1.2,
              }}
            >
              Geodesy &amp; Geodynamics
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Ethiopian Space Science &amp; Geospatial Institute
            </div>
          </div>
        </div>

        {/* Social / external icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {[
            {
              icon: FiGlobe,
              href: "https://disaster.ssgi.gov.et/",
              label: "Geoportal",
            },
            {
              icon: FiRadio,
              href: "/early-warning",
              label: "Early Warning",
              internal: true,
            },
            {
              icon: FiMail,
              href: "mailto:hilwinnasir@gmail.com?subject=Inquiry - Geodesy & Geodynamics Department",
              label: "Email",
              mailto: true,
            },
          ].map(({ icon: Icon, href, label, internal, mailto: isMailto }) =>
            internal ? (
              <Link
                key={label}
                to={href}
                title={label}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-muted)",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                  e.currentTarget.style.color = "var(--accent-blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Icon size={14} />
              </Link>
            ) : (
              <a
                key={label}
                href={href}
                {...(!isMailto && { target: "_blank", rel: "noreferrer" })}
                title={label}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-muted)",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-blue)";
                  e.currentTarget.style.color = "var(--accent-blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Icon size={14} />
              </a>
            ),
          )}
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 32px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "40px",
        }}
      >
        {/* Hazards */}
        <div>
          <SectionHead>Hazards</SectionHead>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 24px",
            }}
          >
            {HAZARD_LINKS.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <SectionHead>Data Sources</SectionHead>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {dataSources.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.18s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent-blue)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                <FiArrowRight
                  size={11}
                  style={{ flexShrink: 0, opacity: 0.55 }}
                />
                {label} ↗
              </a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <SectionHead>Contact Us</SectionHead>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {[
              {
                Icon: FiMapPin,
                text: contactInfo.address,
              },
              { Icon: FiPhone, text: contactInfo.phone },
              { Icon: FiMail, text: contactInfo.email },
            ].map(({ Icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  gap: "9px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,170,255,0.08)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <Icon size={13} style={{ color: "var(--accent-blue)" }} />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.6,
                    color: "var(--text-muted)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <SectionHead>Stay Updated</SectionHead>
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginBottom: "14px",
              marginTop: 0,
            }}
          >
            Subscribe for hazard alerts and research updates from the
            department.
          </p>
          <form
            onSubmit={handleSubscribe}
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (subStatus === "error") setSubStatus("idle");
              }}
              placeholder="Your email address"
              required
              style={{
                padding: "9px 13px",
                borderRadius: "8px",
                border: `1px solid ${subStatus === "error" ? "#ef4444" : "var(--border-color)"}`,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {subStatus === "error" && (
              <p style={{ margin: 0, fontSize: "11px", color: "#ef4444" }}>
                ⚠ {subError}
              </p>
            )}
            <button
              type="submit"
              disabled={subStatus === "sending"}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                border: "none",
                background:
                  subStatus === "sent" ? "#10b981" : "var(--accent-orange)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: subStatus === "sending" ? "not-allowed" : "pointer",
                transition: "opacity 0.18s, background 0.2s",
                alignSelf: "flex-start",
                opacity: subStatus === "sending" ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (subStatus !== "sending")
                  e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {subStatus === "sending"
                ? "…"
                : subStatus === "sent"
                  ? "✓ Subscribed!"
                  : "Sign up"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          padding: "14px 32px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          © {year} SSGI — Geodesy &amp; Geodynamics Department. All rights
          reserved.
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Data for research and monitoring purposes only.
        </span>
      </div>
    </footer>
  );
}
