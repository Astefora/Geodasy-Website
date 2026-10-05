import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FiSun, FiMoon } from "react-icons/fi";
import Header from "./Componenet/Header";
import Footer from "./Componenet/Footer";
import TopographicBackground from "./Componenet/TopographicBackground";
import Home from "./Pages/Home";
import { useTheme } from "./ThemeContext";

// Hazard pages
import Landslide from "./Pages/Landslide";
import Flood from "./Pages/Flood";
import Drought from "./Pages/Drought";
import Volcano from "./Pages/Volcano";
import Fire from "./Pages/Fire";
import Earthquake from "./Pages/Earthquake";

// Other pages
import Research from "./Pages/Research";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import VerifyEmail from "./Pages/VerifyEmail";
import Dashboard from "./Pages/Dashboard";
import AdminPanel from "./Pages/AdminApproval";
import AdminLogin from "./Pages/AdminLogin";
import UploadPage from "./Pages/UploadPage";
import About from "./Pages/About";
import EarlyWarning from "./Pages/EarlyWarning";
import Contact from "./Pages/Contact";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
        /* Bigger: 88×44 */
        width: "88px",
        height: "44px",
        borderRadius: "999px",
        /* Use `border` shorthand — theme.css can't override shorthand border */
        border: isDark
          ? "2px solid rgba(255,255,255,0.22)"
          : "2px solid rgba(0,0,0,0.18)",
        cursor: "pointer",
        padding: 0,
        outline: "none",
        /* `background` shorthand bypasses theme.css `background-color` !important */
        background: isDark ? "#111118" : "#f8f9fb",
        boxShadow: isDark
          ? "0 6px 24px rgba(0,0,0,0.80), inset 0 2px 8px rgba(0,0,0,0.90)"
          : "0 4px 16px rgba(0,0,0,0.18), inset 0 2px 6px rgba(0,0,0,0.10)",
        transition: "background 0.3s, box-shadow 0.3s, border-color 0.3s",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Sun — left slot */}
      <span
        style={{
          position: "absolute",
          left: "13px",
          display: "flex",
          alignItems: "center",
          color: isDark ? "rgba(251,191,36,0.35)" : "#d97706",
          transition: "color 0.3s",
          pointerEvents: "none",
        }}
      >
        <FiSun size={16} strokeWidth={2.5} />
      </span>

      {/* Moon — right slot */}
      <span
        style={{
          position: "absolute",
          right: "13px",
          display: "flex",
          alignItems: "center",
          color: isDark ? "#a78bfa" : "rgba(109,40,217,0.25)",
          transition: "color 0.3s",
          pointerEvents: "none",
        }}
      >
        <FiMoon size={15} strokeWidth={2.5} />
      </span>

      {/* Sliding knob */}
      <span
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: isDark ? "47px" : "5px",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          /* Knob inverts the track: dark track → light knob, light track → dark knob */
          background: isDark
            ? "linear-gradient(145deg, #e8eaf0, #d0d4de)"
            : "linear-gradient(145deg, #1e1e2e, #111118)",
          boxShadow: isDark
            ? "0 3px 10px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.80)"
            : "0 3px 12px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)",
          transition: "left 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* Gloss layer */}
        <span
          style={{
            position: "absolute",
            inset: "3px",
            borderRadius: "50%",
            background: isDark
              ? "linear-gradient(145deg, rgba(255,255,255,0.50) 0%, transparent 55%)"
              : "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        {/* Active icon — contrasts against knob */}
        {isDark ? (
          <FiMoon
            size={14}
            strokeWidth={2.5}
            style={{ color: "#1e1e2e", position: "relative", zIndex: 1 }}
          />
        ) : (
          <FiSun
            size={15}
            strokeWidth={2.5}
            style={{ color: "#fbbf24", position: "relative", zIndex: 1 }}
          />
        )}
      </span>
    </button>
  );
}

function PageShell({ children }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    /*
      ONE root element owns the entire page background.
      - bg-gray-50 / dark:bg-gray-950 is the base colour
      - TopographicBackground renders as position:fixed z-0 inside this
      - Header renders as position:fixed z-50 inside this
      - <main> is position:relative z-10 with pt-20 to clear the navbar
      - No marginTop div, no spacer, no separate background regions
      - DevTools shows this element as the single background owner
    */
    <div className="relative min-h-screen">
      {/* z-0: Topographic contour SVG — fixed, behind everything */}
      <TopographicBackground isDark={isDark} />

      {/* z-50: Glass navbar — fixed, floats above background and content */}
      <Header />

      {/*
        z-10: All page content.
        pt-20 = navbar height (64px) + 12px top gap + 4px buffer.
        This is the only place clearance is applied — at the layout level.
      */}
      <main className="relative pt-20">{children}</main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <PageShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hazards/landslide" element={<Landslide />} />
          <Route path="/hazards/flood" element={<Flood />} />
          <Route path="/hazards/drought" element={<Drought />} />
          <Route path="/hazards/volcano" element={<Volcano />} />
          <Route path="/hazards/fire" element={<Fire />} />
          <Route path="/hazards/earthquake" element={<Earthquake />} />
          <Route path="/research" element={<Research />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/about" element={<About />} />
          <Route path="/early-warning" element={<EarlyWarning />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </PageShell>
      <ThemeToggle />
    </Router>
  );
}

export default App;
