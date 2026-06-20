/**
 * UploadPage.js
 * Allows approved LEO members to upload research files to the backend.
 * Files are stored in /uploads/ on the server and metadata saved to MongoDB.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const HAZARD_TYPES = [
  "Volcano",
  "Landslide",
  "Earthquake",
  "Flood",
  "Fire",
  "Drought",
  "Other",
];

// Human-readable file size
function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [hazardType, setHazardType] = useState("Volcano");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [file, setFile] = useState(null);
  const [approved, setApproved] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success"|"error"|"loading", msg }
  const [recentUploads, setRecentUploads] = useState([]);

  // ── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const isApproved = localStorage.getItem("approved") === "true";
    if (!isAuthenticated) navigate("/login");
    setApproved(isApproved);
    const user = localStorage.getItem("username") || "";
    setUploadedBy(user);
  }, [navigate]);

  // ── Load recent uploads for this session ──────────────────────────────
  const loadRecent = async () => {
    try {
      const res = await fetch("/api/uploads");
      if (!res.ok) return;
      const data = await res.json();
      // Show only uploads by the current user
      const mine = uploadedBy
        ? data.filter((u) => u.uploadedBy === uploadedBy)
        : data;
      setRecentUploads(mine.slice(0, 8));
    } catch {
      /* backend may not be running yet */
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  // ── Handle upload ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file)
      return setStatus({ type: "error", msg: "Please select a file." });
    if (!title)
      return setStatus({ type: "error", msg: "Please enter a title." });

    setStatus({ type: "loading", msg: "Uploading…" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("hazardType", hazardType.toLowerCase());
    formData.append("description", description.trim());
    formData.append("uploadedBy", uploadedBy.trim() || "Anonymous");

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        return setStatus({ type: "error", msg: err.error || "Upload failed." });
      }

      const saved = await res.json();
      setStatus({
        type: "success",
        msg: `"${saved.title}" uploaded. Pending admin approval before it appears on the hazard page.`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh recent list
      loadRecent();
    } catch (err) {
      console.error("Upload error:", err);
      setStatus({
        type: "error",
        msg: "Could not reach the server. Make sure the backend is running (npm run server).",
      });
    }
  };

  // ── Delete an upload ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this upload?")) return;
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      if (res.ok) loadRecent();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ── Not approved ───────────────────────────────────────────────────────
  if (!approved) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h3 style={{ color: "#f28c28", margin: 0 }}>Access Restricted</h3>
          <p style={{ color: "#aaa", marginTop: "10px" }}>
            Your account has not yet been approved by an admin to upload data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* ── Upload form ─────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ color: "#00aaff", marginTop: 0, marginBottom: "20px" }}>
          Upload Research Data
        </h2>

        {/* Hazard type */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Hazard Type</label>
          <select
            value={hazardType}
            onChange={(e) => setHazardType(e.target.value)}
            style={inputStyle}
          >
            {HAZARD_TYPES.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div style={fieldStyle}>
          <label style={labelStyle}>
            Title <span style={{ color: "#ff6060" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. MODIS Fire Analysis — Oromia 2025"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            placeholder="Brief description of the research or dataset…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {/* Uploaded by */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Uploaded By</label>
          <input
            type="text"
            placeholder="Your name or username"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* File picker */}
        <div style={fieldStyle}>
          <label style={labelStyle}>
            File <span style={{ color: "#ff6060" }}>*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.tef,.hdg,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.svg,.geojson,.json,.csv,.zip,.txt"
            onChange={(e) => setFile(e.target.files[0] || null)}
            style={{ ...inputStyle, padding: "8px", cursor: "pointer" }}
          />
          {file && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#888" }}>
              {file.name} — {formatSize(file.size)} —{" "}
              {file.type || "unknown type"}
            </div>
          )}
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#555" }}>
            Supported: .pdf, .tef, .hdg, images, .doc/.docx, .xls/.xlsx, .csv,
            .json, .zip, .txt
          </div>
        </div>

        {/* Status message */}
        {status && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              marginBottom: "14px",
              fontSize: "13px",
              background:
                status.type === "success"
                  ? "#0a2a0a"
                  : status.type === "error"
                    ? "#2a0a0a"
                    : "#0a0a2a",
              border: `1px solid ${
                status.type === "success"
                  ? "#2e7d32"
                  : status.type === "error"
                    ? "#7d2e2e"
                    : "#2e2e7d"
              }`,
              color:
                status.type === "success"
                  ? "#66bb6a"
                  : status.type === "error"
                    ? "#ef5350"
                    : "#90caf9",
            }}
          >
            {status.type === "loading" && "⏳ "}
            {status.type === "success" && "✅ "}
            {status.type === "error" && "⚠️ "}
            {status.msg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleUpload}
          disabled={status?.type === "loading"}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: status?.type === "loading" ? "#333" : "#1f4fd8",
            color: "#fff",
            fontWeight: "700",
            fontSize: "15px",
            cursor: status?.type === "loading" ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {status?.type === "loading" ? "Uploading…" : "Upload File"}
        </button>

        {/* Debugging tip */}
        <p
          style={{
            color: "#555",
            fontSize: "11px",
            marginTop: "14px",
            marginBottom: 0,
          }}
        >
          If upload fails with a proxy error, make sure the backend is running:
          <code style={{ color: "#888", marginLeft: "6px" }}>
            npm run server
          </code>
          &nbsp;or&nbsp;
          <code style={{ color: "#888" }}>npm run dev</code>
        </p>
      </div>

      {/* ── Recent uploads ──────────────────────────────────────────── */}
      {recentUploads.length > 0 && (
        <div style={{ ...cardStyle, marginTop: "20px" }}>
          <h3 style={{ color: "#f28c28", marginTop: 0, marginBottom: "16px" }}>
            My Uploads
          </h3>
          <div style={{ display: "grid", gap: "10px" }}>
            {recentUploads.map((u) => {
              const statusColor =
                u.status === "approved"
                  ? "#4caf50"
                  : u.status === "rejected"
                    ? "#f44336"
                    : "#f28c28";
              const statusLabel =
                u.status === "approved"
                  ? "✅ Approved"
                  : u.status === "rejected"
                    ? "❌ Rejected"
                    : "⏳ Pending Review";
              return (
                <div key={u._id} style={uploadRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.title}
                    </div>
                    <div
                      style={{
                        color: "#888",
                        fontSize: "11px",
                        marginTop: "2px",
                      }}
                    >
                      {u.hazardType} · {u.fileType} · {formatSize(u.size)} ·{" "}
                      {new Date(u.date).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: statusColor,
                          background: `${statusColor}18`,
                          border: `1px solid ${statusColor}44`,
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        {statusLabel}
                      </span>
                      {u.status === "pending" && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          Waiting for admin approval to appear on the hazard
                          page
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <a
                      href={u.path}
                      target="_blank"
                      rel="noreferrer"
                      style={actionBtnStyle("#1f4fd8")}
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(u._id)}
                      style={actionBtnStyle("#7d2e2e")}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const pageStyle = {
  padding: "100px 24px 40px",
  maxWidth: "680px",
  margin: "0 auto",
  color: "#fff",
};
const cardStyle = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "10px",
  padding: "24px",
};
const fieldStyle = {
  marginBottom: "16px",
};
const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#888",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  marginBottom: "6px",
};
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #333",
  background: "#0b0b0b",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
  colorScheme: "dark",
};
const uploadRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 12px",
  background: "#0b0b0b",
  border: "1px solid #222",
  borderRadius: "6px",
};
const actionBtnStyle = (bg) => ({
  padding: "5px 12px",
  borderRadius: "5px",
  border: "none",
  background: bg,
  color: "#fff",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
});

export default UploadPage;
