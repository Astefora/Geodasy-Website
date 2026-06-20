import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Componenet/Header";
import Footer from "./Componenet/Footer";
import Home from "./Pages/Home";
import Hazards from "./Pages/Hazards";
import { useTheme } from "./ThemeContext";

// Hazard pages
import Landslide from "./Pages/Landslide";
import Flood from "./Pages/Flood";
import Drought from "./Pages/Drought";
import Volcano from "./Pages/Volcano";
import Fire from "./Pages/Fire";
import Earthquake from "./Pages/Earthquake ";

// Other pages
import Research from "./Pages/Research";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import AdminPanel from "./Pages/AdminApproval";
import AdminLogin from "./Pages/AdminLogin";
import UploadPage from "./Pages/UploadPage";
import About from "./Pages/About";
import EarlyWarning from "./Pages/EarlyWarning";

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
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "1px solid var(--border-color)",
        background: "var(--bg-card)",
        boxShadow: "0 2px 12px var(--shadow)",
        cursor: "pointer",
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

function App() {
  return (
    <Router>
      <Header />
      <div style={{ marginTop: "80px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hazards" element={<Hazards />} />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/about" element={<About />} />
          <Route path="/early-warning" element={<EarlyWarning />} />
        </Routes>
      </div>
      <Footer />
      <ThemeToggle />
    </Router>
  );
}

export default App;
