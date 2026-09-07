import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiGlobe,
  FiRadio,
  FiMap,
  FiBell,
} from "react-icons/fi";

/* ── Custom SVG hazard icons ──────────────────────────────────────────────── */
function EarthquakeIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="24"
        width="28"
        height="4"
        rx="1"
        fill="#8B7355"
        opacity="0.4"
      />
      <path
        d="M10 24 L12 28 M16 24 L14 28 M22 24 L24 28"
        stroke="#6B5A3E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polyline
        points="2,16 6,16 8,10 10,22 12,8 14,20 16,13 18,19 20,10 22,20 24,14 26,16 30,16"
        stroke="#3B82F6"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="10,22 12,8 14,20 16,13 18,19 20,10 22,20"
        stroke="#60A5FA"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      <circle
        cx="16"
        cy="24"
        r="2"
        fill="none"
        stroke="#EF4444"
        strokeWidth="1.2"
        opacity="0.7"
      />
      <circle
        cx="16"
        cy="24"
        r="4"
        fill="none"
        stroke="#EF4444"
        strokeWidth="0.8"
        opacity="0.4"
      />
    </svg>
  );
}
function LandslideIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 28 L12 8 L22 28 Z" fill="#A78BFA" opacity="0.15" />
      <path
        d="M2 28 L12 8 L22 28"
        stroke="#7C3AED"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M14 12 Q19 10 22 14 Q25 18 22 22 Q18 25 14 22 Q10 19 11 15 Q12 12 14 12Z"
        fill="#78716C"
        stroke="#44403C"
        strokeWidth="1.5"
      />
      <rect
        x="24"
        y="16"
        width="4"
        height="4"
        rx="1"
        fill="#A8A29E"
        stroke="#78716C"
        strokeWidth="1"
        transform="rotate(20 26 18)"
      />
      <rect
        x="22"
        y="22"
        width="3"
        height="3"
        rx="0.8"
        fill="#A8A29E"
        stroke="#78716C"
        strokeWidth="0.8"
        transform="rotate(-15 23 23)"
      />
      <circle cx="28" cy="18" r="1" fill="#D6D3D1" />
      <circle cx="25" cy="25" r="0.8" fill="#A8A29E" />
      <ellipse cx="24" cy="26" rx="4" ry="2" fill="#D6D3D1" opacity="0.35" />
      <path
        d="M2 28 L30 28"
        stroke="#78716C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 14 L8 16 M12 17 L9 19 M13 20 L10 22"
        stroke="#7C3AED"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
function FloodIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4 L6 8 M10 2 L10 7 M14 4 L14 8 M18 2 L18 7 M22 4 L22 8 M26 2 L26 7"
        stroke="#60A5FA"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M8 9 Q7 6 10 6 Q11 3 15 4 Q18 3 19 6 Q22 6 22 9 Z"
        fill="#93C5FD"
        stroke="#3B82F6"
        strokeWidth="1"
      />
      <path
        d="M10 22 L10 17 L16 13 L22 17 L22 22 Z"
        fill="#D97706"
        stroke="#92400E"
        strokeWidth="1.2"
      />
      <path
        d="M13 22 L13 19 L16 19 L16 22 Z"
        fill="#78350F"
        stroke="#92400E"
        strokeWidth="0.8"
      />
      <path
        d="M9 17 L16 12 L23 17"
        stroke="#92400E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M2 22 Q5 20 8 22 Q11 24 14 22 Q17 20 20 22 Q23 24 26 22 Q29 20 30 22"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 25 Q5 23 8 25 Q11 27 14 25 Q17 23 20 25 Q23 27 26 25 Q29 23 30 25"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 22 Q5 20 8 22 Q11 24 14 22 Q17 20 20 22 Q23 24 26 22 Q29 20 30 22 L30 30 L2 30 Z"
        fill="#3B82F6"
        opacity="0.18"
      />
    </svg>
  );
}
function VolcanoIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="16" cy="29" rx="10" ry="2" fill="#FF5722" opacity="0.25" />
      <path
        d="M2 28 L11 14 L16 10 L21 14 L30 28 Z"
        fill="#78716C"
        stroke="#57534E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <ellipse
        cx="16"
        cy="10"
        rx="3"
        ry="1.5"
        fill="#1C1917"
        stroke="#44403C"
        strokeWidth="0.8"
      />
      <path
        d="M16 10 Q14 5 13 2"
        stroke="#FF5722"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M16 10 Q18 4 19 1"
        stroke="#FF8C00"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M16 10 Q16 5 17 3"
        stroke="#FFC107"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="13" cy="2" r="1.5" fill="#FF5722" />
      <circle cx="19" cy="1.5" r="1.2" fill="#FF8C00" />
      <circle cx="15" cy="3" r="2" fill="#9CA3AF" opacity="0.3" />
      <circle cx="17" cy="2" r="1.5" fill="#9CA3AF" opacity="0.25" />
    </svg>
  );
}
function FireIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2C16 2 24 7 24 15C24 21.6274 19.5228 26 14 26C8.47715 26 5 21.6274 5 15C5 10 9 5 12 3C10.5 7 12 11 14 12C15.5 10 16 2 16 2Z"
        fill="#FF5722"
        stroke="#CC3300"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 9C15.5 9 20 12.5 20 16.5C20 19.5 17.5 22 14.5 22C11.5 22 9.5 19.5 9.5 16.5C9.5 13.5 12 10.5 13.5 9.5C12.5 12 13.5 14 14.5 14.5C15.5 13.5 15.5 9 15.5 9Z"
        fill="#FFC107"
        stroke="#E08800"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="10" r="1" fill="#FF8C00" opacity="0.8" />
      <circle cx="22" cy="14" r="0.8" fill="#FF5722" opacity="0.6" />
      <ellipse cx="14" cy="27" rx="6" ry="1.5" fill="#FF5722" opacity="0.15" />
    </svg>
  );
}
function DroughtIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="16"
        cy="10"
        r="5"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="1.2"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="4"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="18"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="10"
        x2="6"
        y2="10"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="10"
        x2="26"
        y2="10"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="10.3"
        y1="4.3"
        x2="9"
        y2="3"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21.7"
        y1="15.7"
        x2="23"
        y2="17"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21.7"
        y1="4.3"
        x2="23"
        y2="3"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="10.3"
        y1="15.7"
        x2="9"
        y2="17"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 22 L30 22"
        stroke="#92400E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 22 L8 26 L10 28"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 22 L15 26 L13 29"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 22 L24 25 L22 28"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2 22 L30 22 L30 30 L2 30 Z" fill="#D97706" opacity="0.12" />
      <rect
        x="14"
        y="18"
        width="4"
        height="4"
        rx="0.5"
        fill="#92400E"
        stroke="#78350F"
        strokeWidth="0.8"
      />
      <path
        d="M14 18 L12 15 M16 18 L16 14 M18 18 L20 15"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Hazard data ─────────────────────────────────────────────────────────── */
const HAZARDS = [
  {
    img: "/icons/icons8-earthquake-100.png",
    title: "Earthquake",
    path: "/hazards/earthquake",
    accent: "from-blue-600 to-blue-400",
    border: "border-blue-500/40",
    glow: "hover:shadow-blue-500/20",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    desc: "We monitor seismic activity to provide early warnings and assess structural vulnerabilities in high-risk zones.",
  },
  {
    img: "/icons/icons8-landslide-100.png",
    title: "Landslide",
    path: "/hazards/landslide",
    accent: "from-amber-700 to-amber-500",
    border: "border-amber-600/40",
    glow: "hover:shadow-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    desc: "Slope stability analysis and identification of areas prone to landslides during heavy rainfall events.",
  },
  {
    img: "/icons/icons8-flood-100.png",
    title: "Flood",
    path: "/hazards/flood",
    accent: "from-indigo-600 to-cyan-500",
    border: "border-indigo-500/40",
    glow: "hover:shadow-indigo-500/20",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    desc: "Tracking rainfall patterns and river levels to help communities prepare and respond to flooding.",
  },
  {
    img: "/icons/icons8-volcano-100.png",
    title: "Volcano",
    path: "/hazards/volcano",
    accent: "from-red-600 to-orange-500",
    border: "border-red-500/40",
    glow: "hover:shadow-red-500/20",
    badge: "bg-red-500/10 text-red-600 dark:text-red-300",
    desc: "Monitoring volcanic activity, ground deformation and gas emissions to predict potential eruptions.",
  },
  {
    img: "/icons/icons8-fire-100.png",
    title: "Fire",
    path: "/hazards/fire",
    accent: "from-orange-600 to-yellow-500",
    border: "border-orange-500/40",
    glow: "hover:shadow-orange-500/20",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
    desc: "Satellite imagery and weather data to detect fire hotspots and assess risk in vulnerable regions.",
  },
  {
    img: "/icons/icons8-drought-100.png",
    title: "Drought",
    path: "/hazards/drought",
    accent: "from-yellow-500 to-amber-400",
    border: "border-yellow-500/40",
    glow: "hover:shadow-yellow-500/20",
    badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-300",
    desc: "Analyzing precipitation trends and soil moisture to support agricultural planning and water management.",
  },
];

const STATS = [
  { num: "6", label: "Hazards Monitored" },
  { num: "25+", label: "Ethiopian Volcanoes" },
  { num: "Real-Time", label: "Fire Detection" },
  { num: "InSAR+GPS", label: "Geodetic Methods" },
];

const TECH = [
  {
    Icon: FiGlobe,
    title: "Satellite Geodesy",
    desc: "InSAR and GPS-based ground deformation monitoring at sub-centimeter accuracy.",
  },
  {
    Icon: FiRadio,
    title: "Remote Sensing",
    desc: "Multi-spectral satellite imagery for fire, flood, drought and land-cover change.",
  },
  {
    Icon: FiMap,
    title: "Geospatial Analysis",
    desc: "GIS-based hazard mapping and spatial risk modelling across Ethiopia.",
  },
  {
    Icon: FiBell,
    title: "Early Warning",
    desc: "Near real-time alert pipelines feeding national disaster response systems.",
  },
];

/* ── Animated counter ─────────────────────────────────────────────────── */
function useCountUp(target, duration = 1600, trigger) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const isNum = /^\d+$/.test(target);
    if (!isNum) {
      setValue(target);
      return;
    }
    const end = parseInt(target, 10);
    const step = Math.ceil(end / (duration / 16));
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, end);
      setValue(cur);
      if (cur >= end) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration, trigger]);
  return value;
}

function StatCard({ num, label, trigger }) {
  const clean = num
    .replace("+", "")
    .replace("Real-Time", "")
    .replace("InSAR+GPS", "");
  const displayed = useCountUp(clean, 1400, trigger);
  const suffix = num.endsWith("+") ? "+" : "";
  const raw = /^\d/.test(num) ? `${displayed}${suffix}` : num;
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl md:text-3xl font-extrabold text-orange-400 leading-none">
        {raw}
      </span>
      <span className="mt-1 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

/* ── Hazard card ──────────────────────────────────────────────────────── */
function HazardCard({ h, index }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = h;
  return (
    <Link
      to={h.path}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative h-full rounded-2xl border ${h.border} p-6 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${h.glow} overflow-hidden cursor-pointer`}
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${h.accent} rounded-t-2xl`}
        />
        <div className="flex items-start justify-between mt-1">
          <img
            src={h.img}
            alt={h.title}
            width={40}
            height={40}
            className="object-contain"
            style={{ imageRendering: "auto" }}
          />
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${h.badge}`}
          >
            Monitor →
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {h.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
          {h.desc}
        </p>
        <div
          className={`flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-all duration-200 ${hovered ? "translate-x-1 opacity-100" : "opacity-0"}`}
        >
          View live data <FiArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const statsRef = useRef(null);
  const heroRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const onHeroMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: nx * 12, y: ny * 8 });
  };

  const onHeroLeave = () => setParallax({ x: 0, y: 0 });

  return (
    <div className="text-gray-900 dark:text-white transition-colors duration-300">
      {/* ── HERO — full-bleed, terrain-first composition ──────────────── */}
      <section
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        className="relative overflow-hidden pt-24 pb-16 px-4 sm:px-8 lg:px-16"
      >
        {/* Ultra-light wash — keeps terrain readable */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-white/[0.12] dark:bg-gray-950/[0.18]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-white/25 to-transparent dark:from-gray-950/30"
        />

        <div
          className="relative z-10 mx-auto w-full max-w-4xl text-center"
          style={{
            transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300 dark:border-orange-500/40 bg-orange-50/60 dark:bg-orange-500/10 px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-orange-600 dark:text-orange-400">
              Live Monitoring — SSGI Ethiopia
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="text-blue-700 dark:text-blue-400">Disaster</span>{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Monitoring
            </span>
            <br />
            <span className="text-blue-700 dark:text-blue-400">Center</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Real-time satellite monitoring of natural hazards across Ethiopia —
            earthquake fault lines, volcanic deformation, floods, fires,
            droughts and landslides.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              to="/hazards/earthquake"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold px-6 py-3 text-sm sm:text-base shadow-lg shadow-blue-700/30 hover:shadow-blue-600/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore Hazards
              <FiArrowRight size={16} />
            </Link>
            <Link
              to="/early-warning"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white font-bold px-6 py-3 text-sm sm:text-base transition-all duration-200 hover:-translate-y-0.5"
            >
              <FiAlertTriangle size={16} /> Early Warning
            </Link>
            <Link
              to="/research"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500 font-semibold px-6 py-3 text-sm sm:text-base transition-all duration-200 hover:-translate-y-0.5"
            >
              Research Portal
            </Link>
          </div>

          {/* Stats bar */}
          <div
            ref={statsRef}
            className="mx-auto mt-16 max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 border-t border-gray-200/40 dark:border-gray-800/40 pt-10"
          >
            {STATS.map((s) => (
              <StatCard
                key={s.label}
                num={s.num}
                label={s.label}
                trigger={statsVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── HAZARD CARDS — full width, flush ──────────────────────────── */}
      <section
        className="w-full py-16 px-4 sm:px-8 lg:px-16"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
            What we monitor
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Natural Hazards
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            Six hazard domains covered using InSAR, GPS, satellite imagery and
            ground sensors.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {HAZARDS.map((h, i) => (
            <HazardCard key={h.title} h={h} index={i} />
          ))}
        </div>
      </section>

      {/* ── TECHNOLOGY — full width, flush ────────────────────────────── */}
      <section
        className="w-full py-16 px-4 sm:px-8 lg:px-16"
        style={{
          background: "rgba(31,79,216,0.04)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">
            Our toolkit
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Science &amp; Technology
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {TECH.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl border border-gray-200/40 dark:border-gray-800/40 p-6 flex flex-col gap-3 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 w-fit">
                <t.Icon
                  size={22}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER — full width, flush ────────────────────────────── */}
      <section
        className="w-full py-16 px-4 sm:px-8 lg:px-16"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 sm:p-14 text-center shadow-2xl shadow-blue-700/30 max-w-7xl mx-auto">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5"
          />
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">
            Geodesy &amp; Geodynamics Department — SSGI
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 relative z-10">
            About the Department
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto leading-relaxed mb-8 relative z-10 text-sm sm:text-base">
            Using satellite geodesy, InSAR, GPS, and remote sensing to monitor
            ground deformation and natural hazards — supporting disaster
            preparedness and sustainable development across Ethiopia.
          </p>
          <div className="flex flex-wrap gap-3 justify-center relative z-10">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
            >
              Learn More <FiArrowRight size={14} />
            </Link>
            <a
              href="https://disaster.ssgi.gov.et/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 text-white hover:bg-white/10 font-semibold px-6 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              National Geoportal <FiArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
