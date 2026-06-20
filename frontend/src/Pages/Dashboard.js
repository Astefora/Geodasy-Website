import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 9999,
        background: type === "success" ? "#1a3a1a" : "#3a1a1a",
        border: `1px solid ${type === "success" ? "#00c853" : "#ff1744"}`,
        color: type === "success" ? "#00e676" : "#ff5252",
        padding: "14px 22px",
        borderRadius: "10px",
        boxShadow: `0 0 18px ${type === "success" ? "#00c85355" : "#ff174455"}`,
        fontSize: "15px",
        fontWeight: "600",
      }}
    >
      {type === "success" ? "✅ " : "❌ "}
      {message}
    </div>
  );
}

// ── Disaster dynamic fields config ────────────────────────────────────────
const DISASTER_FIELDS = {
  Earthquake: [
    {
      name: "magnitude",
      label: "Magnitude",
      type: "number",
      placeholder: "e.g. 6.5",
    },
    {
      name: "depth",
      label: "Depth (km)",
      type: "number",
      placeholder: "e.g. 10",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Addis Ababa",
    },
    { name: "datetime", label: "Date / Time", type: "datetime-local" },
  ],
  Landslide: [
    {
      name: "soilType",
      label: "Soil Type",
      type: "text",
      placeholder: "e.g. Clay, Loam",
    },
    {
      name: "slopeAngle",
      label: "Slope Angle (°)",
      type: "number",
      placeholder: "e.g. 35",
    },
    {
      name: "rainfallLevel",
      label: "Rainfall Level (mm)",
      type: "number",
      placeholder: "e.g. 120",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Debark",
    },
  ],
  Flood: [
    {
      name: "waterLevel",
      label: "Water Level (m)",
      type: "number",
      placeholder: "e.g. 3.2",
    },
    {
      name: "rainfallIntensity",
      label: "Rainfall Intensity (mm/hr)",
      type: "number",
      placeholder: "e.g. 45",
    },
    {
      name: "riverName",
      label: "River Name",
      type: "text",
      placeholder: "e.g. Awash River",
    },
    {
      name: "affectedArea",
      label: "Affected Area (km²)",
      type: "number",
      placeholder: "e.g. 200",
    },
  ],
  Drought: [
    {
      name: "duration",
      label: "Duration (days)",
      type: "number",
      placeholder: "e.g. 90",
    },
    {
      name: "rainfallDeficit",
      label: "Rainfall Deficit (mm)",
      type: "number",
      placeholder: "e.g. 150",
    },
    {
      name: "affectedArea",
      label: "Affected Area (km²)",
      type: "number",
      placeholder: "e.g. 500",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Somali Region",
    },
  ],
  Volcano: [
    {
      name: "volcanoName",
      label: "Volcano Name",
      type: "text",
      placeholder: "e.g. Erta Ale",
    },
    {
      name: "alertLevel",
      label: "Alert Level",
      type: "text",
      placeholder: "e.g. Orange, Red",
    },
    {
      name: "lavaFlowRate",
      label: "Lava Flow Rate (m³/s)",
      type: "number",
      placeholder: "e.g. 12",
    },
    { name: "datetime", label: "Date / Time", type: "datetime-local" },
  ],
  Fire: [
    {
      name: "burnedArea",
      label: "Burned Area (ha)",
      type: "number",
      placeholder: "e.g. 300",
    },
    {
      name: "fireIntensity",
      label: "Fire Intensity",
      type: "text",
      placeholder: "e.g. High, Medium",
    },
    {
      name: "cause",
      label: "Cause",
      type: "text",
      placeholder: "e.g. Lightning, Human",
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g. Bale Mountains",
    },
  ],
};

const DISASTER_ICONS = {
  Earthquake: "🌍",
  Landslide: "⛰️",
  Flood: "🌊",
  Drought: "☀️",
  Volcano: "🌋",
  Fire: "🔥",
};
const DISASTER_COLORS = {
  Earthquake: "#1f4fd8",
  Landslide: "#d2691e",
  Flood: "#4169e1",
  Drought: "#daa520",
  Volcano: "#ff4500",
  Fire: "#ff6347",
};

// ── Shared input style ─────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#111",
  border: "1px solid #333",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#aaa",
  fontSize: "13px",
  fontWeight: "600",
};

const cardStyle = {
  background: "#111",
  borderRadius: "14px",
  padding: "28px",
  border: "1px solid #1f4fd8",
  boxShadow: "0 0 20px #1f4fd822",
  flex: 1,
};

// ── Research Upload Panel ─────────────────────────────────────────────────
// Uploads research files to the backend API (/api/uploads → MongoDB).
// Research.js fetches from the same API, so uploads appear there immediately.
function ResearchPanel({ currentUser }) {
  const [form, setForm] = useState({
    title: "",
    topic: "Earthquake",
    description: "",
    uploadType: "file",
    link: "",
    text: "",
  });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const fileRef = useRef();

  // Load recent uploads from the backend on mount
  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        // Show only this user's uploads in the history panel
        const mine = data.filter(
          (u) =>
            u.uploadedBy === (currentUser?.fullName || currentUser?.username),
        );
        setHistory(mine.slice(0, 5));
      })
      .catch(() => {});
  }, [currentUser]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const validate = () => {
    if (!form.title.trim()) return "Research title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (form.uploadType === "file" && !file) return "Please select a file.";
    if (form.uploadType === "link" && !form.link.trim())
      return "Please enter a URL.";
    if (form.uploadType === "text" && !form.text.trim())
      return "Please enter research text.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }

    setLoading(true);

    try {
      let saved;

      if (form.uploadType === "file") {
        // ── File upload → multipart POST to /api/uploads ──────────────────
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", form.title.trim());
        formData.append("hazardType", form.topic.toLowerCase());
        formData.append("description", form.description.trim());
        formData.append(
          "uploadedBy",
          currentUser?.fullName || currentUser?.username || "LEO member",
        );

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error ${res.status}`);
        }
        saved = await res.json();
      } else {
        // ── Link / text → POST JSON to /api/research ──────────────────────
        // For non-file types we still need a "file" field in the schema.
        // We create a tiny text blob so multer isn't involved.
        const content = form.uploadType === "link" ? form.link : form.text;
        const blob = new Blob([content], { type: "text/plain" });
        const pseudoFile = new File([blob], `${form.uploadType}-entry.txt`, {
          type: "text/plain",
        });

        const formData = new FormData();
        formData.append("file", pseudoFile);
        formData.append("title", form.title.trim());
        formData.append("hazardType", form.topic.toLowerCase());
        formData.append("description", form.description.trim());
        formData.append(
          "uploadedBy",
          currentUser?.fullName || currentUser?.username || "LEO member",
        );
        formData.append("uploadType", form.uploadType);
        formData.append("content", content);

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error ${res.status}`);
        }
        saved = await res.json();
      }

      console.log(
        "[Dashboard] Upload saved to MongoDB:",
        saved._id,
        saved.title,
      );

      // Reset form
      setForm({
        title: "",
        topic: "Earthquake",
        description: "",
        uploadType: "file",
        link: "",
        text: "",
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";

      // Refresh history from backend
      fetch("/api/uploads")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const mine = data.filter(
            (u) =>
              u.uploadedBy === (currentUser?.fullName || currentUser?.username),
          );
          setHistory(mine.slice(0, 5));
        })
        .catch(() => {});

      setLoading(false);
      setToast({
        message: "Research submitted successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("[Dashboard] Upload failed:", error);
      setLoading(false);
      setToast({
        message: error.message.includes("fetch")
          ? "Could not reach the server. Make sure the backend is running (npm run server)."
          : error.message,
        type: "error",
      });
    }
  };

  return (
    <div style={cardStyle}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h2
        style={{
          color: "#f28c28",
          fontSize: "22px",
          marginBottom: "22px",
          fontWeight: "bold",
        }}
      >
        📚 Upload Research
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Research Title *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Enter research title"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Research Topic *</label>
          <select
            style={inputStyle}
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
          >
            <option value="Earthquake">Earthquake</option>
            <option value="Landslide">Landslide</option>
            <option value="Flood">Flood</option>
            <option value="Drought">Drought</option>
            <option value="Volcano">Volcano</option>
            <option value="Fire">Fire</option>
          </select>
        </div>

        {/* Description + char counter */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              ...labelStyle,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Description *</span>
            <span
              style={{
                color: form.description.length > 400 ? "#ff5252" : "#555",
              }}
            >
              {form.description.length}/500
            </span>
          </label>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
            value={form.description}
            maxLength={500}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe your research..."
          />
        </div>

        {/* Upload type */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Upload Type *</label>
          <select
            style={inputStyle}
            value={form.uploadType}
            onChange={(e) => set("uploadType", e.target.value)}
          >
            <option value="file">File Upload</option>
            <option value="link">External Link</option>
            <option value="text">Text Entry</option>
          </select>
        </div>

        {/* Conditional fields */}
        {form.uploadType === "file" && (
          <div
            style={{ marginBottom: "16px" }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragging ? "#f28c28" : "#1f4fd8"}`,
                borderRadius: "10px",
                padding: "28px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "#1a1a2e" : "#0d0d0d",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "32px" }}>{file ? "✅" : "📁"}</div>
              <p
                style={{
                  color: file ? "#00e676" : "#888",
                  margin: "8px 0 4px",
                }}
              >
                {file ? file.name : "Drag & drop or click to select"}
              </p>
              <small style={{ color: "#555" }}>PDF, DOCX, PPTX, Images</small>
            </div>
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
        )}

        {form.uploadType === "link" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>URL *</label>
            <input
              style={inputStyle}
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
        )}

        {form.uploadType === "text" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Research Text *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              value={form.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder="Write your research content here..."
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: loading
              ? "#333"
              : "linear-gradient(135deg, #1f4fd8, #f28c28)",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: loading ? "none" : "0 0 14px #1f4fd855",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = "scale(1.02)";
              e.target.style.boxShadow = "0 0 22px #f28c2866";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 0 14px #1f4fd855";
          }}
        >
          {loading ? "Submitting..." : "Submit Research"}
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: "28px" }}>
          <h3
            style={{ color: "#1f4fd8", fontSize: "16px", marginBottom: "12px" }}
          >
            📋 Previous Uploads
          </h3>
          {history.slice(0, 3).map((r) => (
            <div
              key={r._id || r.id}
              style={{
                background: "#0d0d0d",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "8px",
                border: "1px solid #222",
              }}
            >
              <p style={{ color: "#fff", fontWeight: "600", margin: 0 }}>
                {r.title}
              </p>
              <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0" }}>
                {r.date ? new Date(r.date).toLocaleString() : ""} ·{" "}
                {r.hazardType || r.uploadType}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Disaster Data Upload Panel ────────────────────────────────────────────
// Uploads disaster data (file or link) to the backend API → MongoDB.
// LocalDisasterData component fetches from the same API to display it.
function DisasterPanel({ currentUser }) {
  const [disasterType, setDisasterType] = useState("");
  const [file, setFile] = useState(null);
  const [uploadLink, setUploadLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const fileRef = useRef();

  // Load history from backend
  useEffect(() => {
    fetch("/api/uploads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const mine = data.filter(
          (u) =>
            u.uploadedBy === (currentUser?.fullName || currentUser?.username) &&
            u.title?.startsWith("Disaster Data:"),
        );
        setHistory(mine.slice(0, 6));
      })
      .catch(() => {});
  }, [currentUser]);

  const validate = () => {
    if (!disasterType) return "Please select a disaster type.";
    if (!file && !uploadLink.trim())
      return "Please attach a file/image or add a link.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const uploaderName =
        currentUser?.fullName || currentUser?.username || "LEO member";

      if (file) {
        // File upload
        formData.append("file", file);
      } else {
        // Link-only: create a tiny placeholder file so multer accepts the request
        const blob = new Blob([uploadLink], { type: "text/plain" });
        const pseudoFile = new File([blob], "link-entry.txt", {
          type: "text/plain",
        });
        formData.append("file", pseudoFile);
        formData.append("uploadType", "link");
        formData.append("content", uploadLink.trim());
      }

      formData.append("title", `Disaster Data: ${disasterType}`);
      formData.append("hazardType", disasterType.toLowerCase());
      formData.append(
        "description",
        uploadLink.trim() ? `Link: ${uploadLink.trim()}` : "",
      );
      formData.append("uploadedBy", uploaderName);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const saved = await res.json();
      console.log("[Dashboard] Disaster data saved to MongoDB:", saved._id);

      // Also keep in localStorage for LocalDisasterData backward compat
      const entry = {
        id: saved._id,
        userId: currentUser?.id,
        uploadedBy: uploaderName,
        disasterType,
        fileName: saved.fileName,
        fileType: saved.fileType,
        fileData: null, // not storing base64 anymore — use path URL
        path: saved.path,
        link: uploadLink.trim() || null,
        status: saved.status || "pending",
        date: new Date().toLocaleString(),
      };
      const all = JSON.parse(localStorage.getItem("disasterUploads") || "[]");
      const updated = [
        ...all.filter((u) => u.disasterType !== disasterType),
        entry,
      ];
      localStorage.setItem("disasterUploads", JSON.stringify(updated));

      // Refresh history
      setHistory((h) =>
        [entry, ...h.filter((u) => u.disasterType !== disasterType)].slice(
          0,
          6,
        ),
      );
      setDisasterType("");
      setFile(null);
      setUploadLink("");
      if (fileRef.current) fileRef.current.value = "";
      setLoading(false);
      setToast({
        message: "Disaster data submitted. It will appear after admin approval.",
        type: "success",
      });
    } catch (error) {
      console.error("[Dashboard] Disaster upload failed:", error);
      setLoading(false);
      setToast({
        message: error.message.includes("fetch")
          ? "Could not reach the server. Make sure the backend is running."
          : error.message,
        type: "error",
      });
    }
  };

  const accentColor = disasterType ? DISASTER_COLORS[disasterType] : "#1f4fd8";
  const hasUpload = Boolean(file || uploadLink.trim());

  return (
    <div
      style={{
        ...cardStyle,
        border: `1px solid ${accentColor}`,
        boxShadow: `0 0 20px ${accentColor}22`,
      }}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h2
        style={{
          color: "#f28c28",
          fontSize: "22px",
          marginBottom: "22px",
          fontWeight: "bold",
        }}
      >
        🌐 Upload Disaster Data
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Disaster type selector cards */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Disaster Type *</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {Object.keys(DISASTER_FIELDS).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setDisasterType(type);
                }}
                style={{
                  padding: "16px 8px",
                  borderRadius: "10px",
                  border: `2px solid ${disasterType === type ? DISASTER_COLORS[type] : "#333"}`,
                  background:
                    disasterType === type
                      ? `${DISASTER_COLORS[type]}22`
                      : "#0d0d0d",
                  color: disasterType === type ? "#fff" : "#888",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.2s",
                  boxShadow:
                    disasterType === type
                      ? `0 0 12px ${DISASTER_COLORS[type]}55`
                      : "none",
                }}
              >
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>
                  {DISASTER_ICONS[type]}
                </div>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* File, image, or link upload */}
        {disasterType && (
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Attach File or Image</label>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: `1px dashed ${accentColor}`,
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                cursor: "pointer",
                background: "#0d0d0d",
              }}
            >
              <span
                style={{ color: file ? "#00e676" : "#666", fontSize: "13px" }}
              >
                {file
                  ? `📎 ${file.name}`
                  : "📎 Click to attach PDF, image, CSV, or sensor data"}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              accept="image/*,.csv,.json,.txt,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#555" }}>
              Supported: PDF, images, CSV, JSON, TXT, DOC/DOCX, XLS/XLSX
            </div>

            <label style={{ ...labelStyle, marginTop: "14px" }}>
              Or Add Link
            </label>
            <input
              style={{ ...inputStyle, borderColor: accentColor }}
              type="url"
              placeholder="https://example.com/local-disaster-data"
              value={uploadLink}
              onChange={(e) => setUploadLink(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !disasterType || !hasUpload}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              !disasterType || !hasUpload || loading
                ? "#333"
                : `linear-gradient(135deg, ${accentColor}, #f28c28)`,
            color: "#fff",
            fontWeight: "bold",
            fontSize: "15px",
            cursor:
              !disasterType || !hasUpload || loading
                ? "not-allowed"
                : "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow:
              disasterType && !loading ? `0 0 14px ${accentColor}55` : "none",
          }}
          onMouseEnter={(e) => {
            if (disasterType && !loading) {
              e.target.style.transform = "scale(1.02)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          {loading ? "Submitting..." : "Submit Data"}
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: "28px" }}>
          <h3
            style={{
              color: accentColor,
              fontSize: "16px",
              marginBottom: "12px",
            }}
          >
            📋 Previous Submissions
          </h3>
          {history.slice(0, 3).map((r) => (
            <div
              key={r._id || r.id}
              style={{
                background: "#0d0d0d",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "8px",
                border: "1px solid #222",
              }}
            >
              <p style={{ color: "#fff", fontWeight: "600", margin: 0 }}>
                {DISASTER_ICONS[
                  r.disasterType ||
                    r.hazardType?.charAt(0).toUpperCase() +
                      r.hazardType?.slice(1)
                ] || "🌐"}{" "}
                {r.disasterType || r.title || r.hazardType}
              </p>
              <p style={{ color: "#666", fontSize: "12px", margin: "4px 0 0" }}>
                {r.date ? new Date(r.date).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);

    // Check for unread approval notifications
    const notifications = JSON.parse(
      localStorage.getItem("notifications") || "[]",
    );
    const unread = notifications.find(
      (n) => n.userId === user.id && !n.read && n.type === "approve",
    );
    if (unread) {
      setNotification(unread.message);
      // Mark as read
      const updated = notifications.map((n) =>
        n.id === unread.id ? { ...n, read: true } : n,
      );
      localStorage.setItem("notifications", JSON.stringify(updated));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        paddingTop: "100px",
        paddingBottom: "60px",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 36px",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
            <span style={{ color: "#1f4fd8" }}>LEO </span>
            <span style={{ color: "#f28c28" }}>Member Dashboard</span>
          </h1>
          <p style={{ color: "#888", margin: "6px 0 0", fontSize: "14px" }}>
            Welcome,{" "}
            <span style={{ color: "#fff" }}>{currentUser.fullName}</span>
            {currentUser.designation && (
              <span style={{ color: "#f28c28" }}>
                {" "}
                · {currentUser.designation}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleLogout}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1px solid #f28c28",
              background: "transparent",
              color: "#f28c28",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Approval notification banner */}
      {notification && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto 20px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "#0a2a0a",
              border: "1px solid #2e7d32",
              borderRadius: "10px",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "24px" }}>🎉</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#66bb6a", margin: 0, fontWeight: "600" }}>
                {notification}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          gap: "28px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 340px", minWidth: "300px" }}>
          <ResearchPanel currentUser={currentUser} />
        </div>
        <div style={{ flex: "1 1 340px", minWidth: "300px" }}>
          <DisasterPanel currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
