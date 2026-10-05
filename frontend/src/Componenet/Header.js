import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import "../styles/Header.css";
import {
  FiHome,
  FiInfo,
  FiAlertTriangle,
  FiChevronDown,
  FiLayout,
  FiExternalLink,
  FiActivity,
  FiMenu,
  FiX,
  FiBookOpen,
} from "react-icons/fi";

import { WARNING_COUNT, fetchLiveMultiHazardWarningStats } from "../hazardData";

const logo = "/ggd_logo.png";

const hazards = [
  {
    name: "Landslide",
    path: "/hazards/landslide",
    img: "/icons/icons8-landslide-100.png",
  },
  { name: "Flood", path: "/hazards/flood", img: "/icons/icons8-flood-64.png" },
  {
    name: "Drought",
    path: "/hazards/drought",
    img: "/icons/icons8-drought-64.png",
  },
  {
    name: "Volcano",
    path: "/hazards/volcano",
    img: "/icons/icons8-volcano-96.png",
  },
  { name: "Fire", path: "/hazards/fire", img: "/icons/icons8-fire-96.png" },
  {
    name: "Earthquake",
    display: "Quake",
    path: "/hazards/earthquake",
    img: "/icons/icons8-earthquake-100.png",
  },
];

const navItems = [
  { label: "Home", path: "/", icon: FiHome },
  { label: "About", path: "/about", icon: FiInfo },
  { label: "Research", path: "/research", icon: FiBookOpen },
  { label: "Early Warning", path: "/early-warning", icon: FiAlertTriangle },
  { label: "Hazards", path: "/hazards", icon: FiActivity, hasDropdown: true },
  { label: "Dashboard", path: "/dashboard", icon: FiLayout, auth: true },
];

export default function Header() {
  const [hazardOpen, setHazardOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // True when we're on the home page AND haven't scrolled past the hero section.
  // Used to force dark navbar styling over the dark hero image in light mode.
  const [overHero, setOverHero] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // forceDark = true when navbar should show dark styling (dark mode OR light+over hero)
  const forceDark = isDark || (overHero && !isDark);

  // Track window width for tablet title shortening
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tablet = desktop nav visible but not enough room for full title (769–900px)
  const isTablet = windowWidth >= 769 && windowWidth <= 900;
  const headerTitle = isTablet ? "DMC" : "Disaster Monitoring Center";

  /* Real-time live multi-hazard warning count synchronized across site */
  const [warningCount, setWarningCount] = useState(() => {
    try {
      const cached = localStorage.getItem("ew_live_warning_count");
      if (cached !== null && !isNaN(parseInt(cached, 10))) {
        return parseInt(cached, 10);
      }
    } catch {}
    return WARNING_COUNT;
  });

  useEffect(() => {
    let isMounted = true;

    // Listen to real-time updates dispatched from the Early Warning page
    const handleEwUpdate = (e) => {
      if (typeof e.detail === "number" && isMounted) {
        setWarningCount(e.detail);
      }
    };
    window.addEventListener("ew_warning_count_updated", handleEwUpdate);

    async function fetchRealWarningCount() {
      try {
        const count = await fetchLiveMultiHazardWarningStats();
        if (isMounted) {
          setWarningCount(count);
        }
      } catch {
        if (isMounted) setWarningCount(WARNING_COUNT);
      }
    }

    fetchRealWarningCount();
    const interval = setInterval(fetchRealWarningCount, 60000); // refresh every 1 min
    return () => {
      isMounted = false;
      window.removeEventListener("ew_warning_count_updated", handleEwUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Hero section is only on the home page. Its approximate height is ~520px
      // (pt-24 + content + pb-16 + stats bar). We check against heroRef if available,
      // or fall back to 560px so we don't import heroRef here.
      const heroEl = document.querySelector('[data-hero="true"]');
      const heroBottom = heroEl
        ? heroEl.getBoundingClientRect().bottom + y
        : 560;
      setOverHero(location.pathname === "/" && y < heroBottom - 80);
    };
    update();
    window.addEventListener("scroll", update);
    return () => window.removeEventListener("scroll", update);
  }, [location.pathname]);

  useEffect(() => {
    const fn = (e) => {
      // Don't close hazard dropdown on outside click when mobile drawer is open
      // (the mobile drawer is not inside dropdownRef, so every tap would close it)
      if (mobileOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setHazardOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setHazardOpen(false);
  }, [location]);

  const isActive = (item) => {
    if (item.hasDropdown) return location.pathname.startsWith("/hazards");
    if (item.auth) return ["/dashboard", "/upload"].includes(location.pathname);
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  };

  const handleNav = (item) => {
    if (item.hasDropdown) {
      setHazardOpen((o) => !o);
      return;
    }
    if (item.auth) {
      navigate(
        localStorage.getItem("isAuthenticated") ? "/dashboard" : "/login",
      );
      return;
    }
    navigate(item.path);
  };

  /*
    The navbar is position:fixed, z-50 — it floats above the root
    layout container defined in App.js. It does NOT affect document flow.

    Glass effect:
    - bg is semi-transparent (page bg bleeds through)
    - backdrop-blur blurs what's behind it
    - rounded-2xl gives the floating pill shape
    - subtle border makes the pill edge visible
    - shadow grounds it visually

    When not scrolled: slightly more transparent, no shadow — blends with page top.
    When scrolled: stronger opacity + shadow — clearly floating above content.
    Background driven via CSS class nav-glass / nav-glass.nav-scrolled in Header.css
    to bypass theme.css inline-style attr-selector overrides.
  */

  return (
    <>
      {/*
        Position: fixed — floats above the root layout container.
        left/right: 16px — leaves space so the rounded pill floats
        visually separated from the viewport edges.
        top: 12px — small gap from top so the pill appears to float.
        The root bg-gray-50/bg-gray-950 of App.js is visible in this
        12px gap AND behind the transparent pill — all one colour, no seam.
      */}
      <nav
        className="fixed"
        style={{
          top: "12px",
          left: "8px",
          right: "8px",
          zIndex: 9000,
          boxSizing: "border-box",
        }}
      >
        {/* Glass pill */}
        <div
          className={[
            "nav-glass",
            scrolled ? "nav-scrolled" : "",
            overHero ? "nav-over-hero" : "",
            "flex items-center justify-between gap-2 px-2.5 py-1.5 xl:gap-3 xl:px-4 xl:py-2.5",
            "rounded-2xl transition-all duration-300 w-full max-w-full box-border",
          ].join(" ")}
          style={{
            // Inline background so theme.css div-transparency rules can't override it
            // overHero is only true in light mode on home page within hero section
            background:
              overHero && !isDark
                ? scrolled
                  ? "rgba(15,23,42,0.96)" // light + over hero + scrolled
                  : "rgba(15,23,42,0.90)" // light + over hero
                : isDark
                  ? scrolled
                    ? "rgba(3,7,18,0.92)" // dark + scrolled (unchanged)
                    : "rgba(3,7,18,0.88)" // dark (unchanged)
                  : scrolled
                    ? "rgba(249,250,251,0.96)" // light + scrolled
                    : "rgba(249,250,251,0.90)", // light default
            border:
              (overHero && !isDark) || isDark
                ? "1px solid rgba(255,255,255,0.15)"
                : "1px solid rgba(0,0,0,0.14)",
            boxShadow: scrolled
              ? (overHero && !isDark) || isDark
                ? "0 8px 32px rgba(0,0,0,0.5)"
                : "0 0 0 1.5px rgba(31,79,216,0.45), 0 8px 32px rgba(31,79,216,0.12)"
              : (overHero && !isDark) || isDark
                ? "0 2px 16px rgba(0,0,0,0.35)"
                : "0 0 0 1.5px rgba(31,79,216,0.35), 0 4px 24px rgba(31,79,216,0.08)",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 bg-transparent border-none cursor-pointer p-0 group"
          >
            <img
              src={logo}
              alt="Logo"
              className="w-7 h-7 xl:w-9 xl:h-9 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-150"
            />
            <span
              className="header-title font-extrabold tracking-tight whitespace-nowrap truncate min-w-0 text-xs sm:text-sm md:text-base"
              style={{ color: forceDark ? "#60a5fa" : "#1f4fd8" }}
            >
              {headerTitle}
            </span>
          </button>

          {/* Desktop nav pill-within-pill */}
          <nav
            className="header-desktop-nav hidden md:flex items-center gap-0 rounded-full px-0.5 py-0.5 xl:gap-0.5 xl:px-1.5 xl:py-1 flex-shrink-0"
            style={{
              background: forceDark
                ? "rgba(30,41,59,0.95)" /* slate-800 inner pill */
                : "rgba(0,0,0,0.08)",
              border: forceDark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  ref={item.hasDropdown ? dropdownRef : undefined}
                  className="relative"
                  style={{ position: "relative" }}
                >
                  {/* Warning badge — top-right of the button, absolutely positioned */}
                  {item.path === "/early-warning" && warningCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        zIndex: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "17px",
                        height: "17px",
                        padding: "0 4px",
                        borderRadius: "999px",
                        background: "#ef4444",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: 0,
                        pointerEvents: "none",
                        boxShadow: "0 0 0 2px rgba(239,68,68,0.30)",
                        animation: "navBadgePulse 2s ease-in-out infinite",
                      }}
                    >
                      {warningCount}
                    </span>
                  )}
                  <button
                    onClick={() => handleNav(item)}
                    className={[
                      "flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium xl:gap-1.5 xl:px-3.5 xl:text-sm",
                      "transition-all duration-150 whitespace-nowrap border-none cursor-pointer",
                      active ? "font-bold shadow-sm" : "bg-transparent",
                    ].join(" ")}
                    style={
                      active
                        ? {
                            backgroundColor: forceDark ? "#e5e7eb" : "#111827",
                            color: forceDark ? "#111827" : "#ffffff",
                          }
                        : {
                            color: forceDark ? "#d1d5db" : "#4b5563",
                          }
                    }
                  >
                    <Icon
                      size={13}
                      className={active ? "text-inherit" : ""}
                      style={
                        active
                          ? {}
                          : { color: forceDark ? "#9ca3af" : "#6b7280" }
                      }
                    />
                    {item.label}
                    {item.hasDropdown && (
                      <FiChevronDown
                        size={12}
                        style={{
                          color: active
                            ? "inherit"
                            : forceDark
                              ? "#9ca3af"
                              : "#6b7280",
                        }}
                        className={[
                          "transition-transform duration-200",
                          hazardOpen ? "rotate-180" : "rotate-0",
                        ].join(" ")}
                      />
                    )}
                  </button>

                  {/* Hazard dropdown */}
                  {item.hasDropdown && hazardOpen && (
                    <div className="hazard-dropdown absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-2 min-w-[260px] shadow-xl grid grid-cols-2 gap-1">
                      {hazards.map((h) => {
                        const hActive = location.pathname === h.path;
                        return (
                          <button
                            key={h.name}
                            onClick={() => {
                              navigate(h.path);
                              setHazardOpen(false);
                            }}
                            className={[
                              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-full",
                              "transition-colors duration-150 text-left border-none cursor-pointer",
                              !(overHero && !isDark) &&
                                (hActive
                                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold"
                                  : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"),
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            style={
                              overHero && !isDark
                                ? { color: hActive ? "#93c5fd" : "#e2e8f0" }
                                : {}
                            }
                            onMouseEnter={(e) => {
                              if (overHero && !isDark) {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(255,255,255,0.10)";
                                e.currentTarget.style.color = "#ffffff";
                              } else if (!isDark) {
                                e.currentTarget.style.backgroundColor =
                                  "#f3f4f6";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (overHero && !isDark) {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                                e.currentTarget.style.color = hActive
                                  ? "#93c5fd"
                                  : "#e2e8f0";
                              } else if (!isDark) {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }
                            }}
                          >
                            <img
                              src={h.img}
                              alt={h.name}
                              width={18}
                              height={18}
                              style={{ objectFit: "contain", flexShrink: 0 }}
                            />
                            {h.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right: Geoportal + hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="https://disaster.ssgi.gov.et/"
              target="_blank"
              rel="noreferrer"
              className="geoportal-hide-mobile geoportal-btn hidden sm:flex items-center gap-1 text-white font-semibold no-underline rounded-full whitespace-nowrap transition-all duration-200 hover:-translate-y-px px-2.5 py-1.5 text-xs lg:gap-1.5 lg:px-4 lg:py-2 lg:text-sm"
              style={{
                background: "#1f4fd8",
                boxShadow: "0 2px 10px rgba(31,79,216,0.40)",
              }}
            >
              <FiExternalLink size={13} className="text-white" />
              <span className="text-white">National Geoportal</span>
            </a>

            <button
              className="header-hamburger md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8 transition-colors flex-shrink-0"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer — sits inside the root bg container */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[8999] bg-gray-50 dark:bg-gray-950 flex flex-col px-4 pt-24 pb-8 gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <div key={item.label} style={{ position: "relative" }}>
                {/* Warning badge — mobile, top-right of button */}
                {item.path === "/early-warning" && warningCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "12px",
                      zIndex: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "19px",
                      height: "19px",
                      padding: "0 5px",
                      borderRadius: "999px",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 800,
                      lineHeight: 1,
                      pointerEvents: "none",
                      boxShadow: "0 0 0 2px rgba(239,68,68,0.25)",
                    }}
                  >
                    {warningCount}
                  </span>
                )}
                <button
                  onClick={() => handleNav(item)}
                  className={[
                    "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-base font-medium",
                    "transition-colors duration-150 text-left border-none cursor-pointer",
                  ].join(" ")}
                  style={
                    active
                      ? {
                          background: isDark ? "#f3f4f6" : "#111827",
                          color: isDark ? "#111827" : "#ffffff",
                          fontWeight: 700,
                        }
                      : {
                          background: "transparent",
                          color: isDark ? "#d1d5db" : "#374151",
                        }
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-inherit"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  />
                  {item.label}
                  {item.hasDropdown && (
                    <FiChevronDown
                      size={15}
                      className={[
                        "ml-auto transition-transform duration-200",
                        active ? "text-inherit" : "text-gray-400",
                        hazardOpen ? "rotate-180" : "rotate-0",
                      ].join(" ")}
                    />
                  )}
                </button>
                {item.hasDropdown && hazardOpen && (
                  <div className="pl-4 flex flex-col gap-0.5 mt-1">
                    {hazards.map((h) => {
                      const hActive = location.pathname === h.path;
                      return (
                        <button
                          key={h.name}
                          onClick={() => {
                            navigate(h.path);
                            setHazardOpen(false);
                            setMobileOpen(false);
                          }}
                          className={[
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                            "transition-colors duration-150 text-left border-none cursor-pointer",
                            hActive
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold"
                              : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                          ].join(" ")}
                        >
                          <img
                            src={h.img}
                            alt={h.name}
                            width={20}
                            height={20}
                            style={{ objectFit: "contain", flexShrink: 0 }}
                          />
                          {h.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-auto pt-4">
            <a
              href="https://disaster.ssgi.gov.et/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-white font-semibold text-base no-underline w-full py-4 rounded-2xl transition-all duration-200"
              style={{ background: "#1f4fd8" }}
            >
              <FiExternalLink size={16} className="text-white" />
              <span className="text-white">National Geoportal</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
