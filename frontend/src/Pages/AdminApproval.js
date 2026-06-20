import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [allUploads, setAllUploads] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/admin-login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      navigate("/admin-login");
      return;
    }
    setCurrentAdmin(user);
  }, [navigate]);

  // Fetch users and uploads from backend
  useEffect(() => {
    if (!currentAdmin) return;
    loadData();
  }, [currentAdmin]);

  const loadData = async () => {
    try {
      const [pendingRes, approvedRes, pendingUploadsRes, uploadsRes] =
        await Promise.all([
          fetch("/api/users?status=pending"),
          fetch("/api/users?status=approved"),
          fetch("/api/uploads?status=pending"),
          fetch("/api/uploads"),
        ]);
      if (pendingRes.ok) setPendingUsers(await pendingRes.json());
      if (approvedRes.ok) setApprovedUsers(await approvedRes.json());
      if (pendingUploadsRes.ok)
        setPendingUploads(await pendingUploadsRes.json());
      if (uploadsRes.ok) setAllUploads(await uploadsRes.json());
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  const handleApproval = async (userId, action) => {
    try {
      const endpoint =
        action === "approve"
          ? `/api/users/${userId}/approve`
          : `/api/users/${userId}/reject`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: currentAdmin.username }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
        return;
      }

      const data = await res.json();

      // Send email notification
      try {
        const emailRes = await fetch("/api/send-approval-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.user.email,
            fullName: data.user.fullName,
            action,
          }),
        });
        const emailData = await emailRes.json();
        if (emailData.sent) {
          alert(`✅ User ${action}d and email sent to ${data.user.email}`);
        } else {
          alert(
            `✅ User ${action}d. Email not configured: ${emailData.message || ""}`,
          );
        }
      } catch {
        alert(`✅ User ${action}d. Could not send email (backend issue).`);
      }

      loadData(); // Refresh lists
    } catch (err) {
      alert("Action failed. Is the backend running?");
    }
  };

  const handleUploadModeration = async (uploadId, action) => {
    try {
      const endpoint =
        action === "approve"
          ? `/api/uploads/${uploadId}/approve`
          : `/api/uploads/${uploadId}/reject`;
      const body =
        action === "approve"
          ? { approvedBy: currentAdmin.username }
          : { rejectedBy: currentAdmin.username };

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed: ${err.error || "Upload moderation failed."}`);
        return;
      }

      alert(`Upload ${action}d.`);
      loadData();
    } catch (err) {
      alert("Upload moderation failed. Is the backend running?");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!currentAdmin) return null;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-info">
          <h1>Admin Panel</h1>
          <p>
            Welcome, {currentAdmin.fullName} | Role: {currentAdmin.role}
          </p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Users ({pendingUsers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "pending-uploads" ? "active" : ""}`}
          onClick={() => setActiveTab("pending-uploads")}
          style={{ position: "relative" }}
        >
          Pending Uploads
          {pendingUploads.length > 0 && (
            <span
              style={{
                marginLeft: "6px",
                background: "#f28c28",
                color: "#000",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              {pendingUploads.length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved Users ({approvedUsers.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "uploads" ? "active" : ""}`}
          onClick={() => setActiveTab("uploads")}
        >
          All Uploads ({allUploads.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "pending" && (
          <div>
            <h2>Pending User Approvals</h2>
            {pendingUsers.length === 0 ? (
              <p className="no-data">No pending approvals</p>
            ) : (
              <div className="users-grid">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="user-card">
                    <div className="user-info">
                      <h3>{user.fullName}</h3>
                      <p className="user-detail">
                        <strong>Username:</strong> {user.username}
                      </p>
                      <p className="user-detail">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="user-detail">
                        <strong>Designation:</strong> {user.designation}
                      </p>
                      <p className="user-detail">
                        <strong>Department:</strong> {user.department}
                      </p>
                      <p className="user-detail">
                        <strong>Registered:</strong>{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="user-actions">
                      <button
                        onClick={() => handleApproval(user._id, "approve")}
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(user._id, "reject")}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "pending-uploads" && (
          <div>
            <h2>Pending Upload Approvals</h2>
            <p
              style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}
            >
              These uploads are waiting for your approval before they appear in
              the hazard local data sections.
            </p>
            {pendingUploads.length === 0 ? (
              <p className="no-data">No uploads pending review</p>
            ) : (
              <div className="uploads-grid">
                {pendingUploads.map((upload) => (
                  <div key={upload._id} className="upload-card">
                    <div className="upload-header">
                      <span
                        className="upload-topic"
                        style={{ textTransform: "capitalize" }}
                      >
                        {upload.hazardType}
                      </span>
                      <span className="upload-date">
                        {upload.date
                          ? new Date(upload.date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <p
                      className="upload-status pending"
                      style={{ color: "#f28c28", fontWeight: "600" }}
                    >
                      ⏳ Awaiting Review
                    </p>
                    <p className="upload-file" style={{ fontWeight: "600" }}>
                      {upload.title || upload.fileName}
                    </p>
                    <p className="uploader">Uploaded by: {upload.uploadedBy}</p>
                    {upload.description && (
                      <p className="upload-desc">{upload.description}</p>
                    )}
                    {upload.path && (
                      <a
                        href={upload.path}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "12px",
                          color: "#8ab4ff",
                          display: "inline-block",
                          marginBottom: "10px",
                        }}
                      >
                        Preview file ↗
                      </a>
                    )}
                    <div className="user-actions">
                      <button
                        onClick={() =>
                          handleUploadModeration(upload._id, "approve")
                        }
                        className="approve-btn"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() =>
                          handleUploadModeration(upload._id, "reject")
                        }
                        className="reject-btn"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "approved" && (
          <div>
            <h2>Approved Users</h2>
            {approvedUsers.length === 0 ? (
              <p className="no-data">No approved users yet</p>
            ) : (
              <div className="users-grid">
                {approvedUsers.map((user) => (
                  <div key={user._id} className="user-card">
                    <div className="user-info">
                      <h3>{user.fullName}</h3>
                      <p className="user-detail">
                        <strong>Username:</strong> {user.username}
                      </p>
                      <p className="user-detail">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="user-detail">
                        <strong>Designation:</strong> {user.designation}
                      </p>
                      <p className="user-detail">
                        <strong>Approved By:</strong> {user.approvedBy || "—"}
                      </p>
                      <p className="user-detail">
                        <strong>Approved:</strong>{" "}
                        {user.approvedAt
                          ? new Date(user.approvedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "uploads" && (
          <div>
            <h2>All Uploaded Documents</h2>
            {allUploads.length === 0 ? (
              <p className="no-data">No uploads yet</p>
            ) : (
              <div className="uploads-grid">
                {allUploads.map((upload) => (
                  <div key={upload._id} className="upload-card">
                    <div className="upload-header">
                      <span className="upload-topic">{upload.hazardType}</span>
                      <span className="upload-date">
                        {upload.date
                          ? new Date(upload.date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <p
                      className={`upload-status ${upload.status || "pending"}`}
                    >
                      Status: {upload.status || "pending"}
                    </p>
                    <p className="upload-file">
                      {upload.title || upload.fileName}
                    </p>
                    <p className="uploader">Uploaded by: {upload.uploadedBy}</p>
                    {upload.description && (
                      <p className="upload-desc">{upload.description}</p>
                    )}
                    <div className="user-actions">
                      <button
                        onClick={() =>
                          handleUploadModeration(upload._id, "approve")
                        }
                        className="approve-btn"
                        disabled={upload.status === "approved"}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleUploadModeration(upload._id, "reject")
                        }
                        className="reject-btn"
                        disabled={upload.status === "rejected"}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
