import React, { useEffect, useMemo, useState } from "react";
import ImageModal from "../Componenet/ImageModal";

// Ensure upload path is a full URL pointing to the backend server
function getFileUrl(uploadPath) {
  if (!uploadPath) return "#";
  if (uploadPath.startsWith("http")) return uploadPath;
  // Relative path like "uploads/filename.pdf" → point to backend directly
  const cleanPath = uploadPath.replace(/^\//, "");
  return `http://localhost:5002/${cleanPath}`;
}

const researchTopics = [
  "Landslide",
  "Volcano",
  "Flood",
  "Earthquake",
  "Fire",
  "Drought",
];

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg|tef)(\?.*)?$/i.test(url);
}

function getFileLabel(upload) {
  if (upload.fileType?.includes("pdf")) return "PDF File";
  if (upload.fileType?.startsWith("image/")) return "Image File";
  if (
    /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml)/.test(
      upload.fileType || "",
    )
  ) {
    return "Document File";
  }
  return "File";
}

function uploadMatchesTopic(upload, topic) {
  const normalizedTopic = topic.toLowerCase();
  if (upload.hazardType) {
    return upload.hazardType.toLowerCase() === normalizedTopic;
  }

  const text =
    `${upload.title || ""} ${upload.description || ""}`.toLowerCase();
  return text.includes(normalizedTopic);
}

function Research() {
  const [selectedTopic, setSelectedTopic] = useState("Landslide");
  const [uploads, setUploads] = useState([]);
  const [modalImage, setModalImage] = useState({
    isOpen: false,
    src: "",
    alt: "",
  });

  useEffect(() => {
    const loadUploads = async () => {
      try {
        const response = await fetch("/api/uploads");
        if (!response.ok) {
          console.error(
            "Failed to fetch uploads:",
            response.status,
            response.statusText,
          );
          setUploads([]);
          return;
        }
        const saved = await response.json();
        setUploads(saved);
      } catch (error) {
        console.error(
          "Error loading uploads (is the backend running?):",
          error.message,
        );
        setUploads([]);
      }
    };

    loadUploads();
    // Refresh when tab regains focus (user returns from upload page)
    window.addEventListener("focus", loadUploads);
    // Also poll every 5 seconds so new uploads appear without needing a tab switch
    const pollId = setInterval(loadUploads, 5000);
    return () => {
      window.removeEventListener("focus", loadUploads);
      clearInterval(pollId);
    };
  }, []);

  const topicUploads = useMemo(
    () => uploads.filter((upload) => uploadMatchesTopic(upload, selectedTopic)),
    [uploads, selectedTopic],
  );

  const openModal = (src, alt) => {
    setModalImage({ isOpen: true, src, alt });
  };

  const closeModal = () => {
    setModalImage({ isOpen: false, src: "", alt: "" });
  };

  return (
    <div
      style={{
        padding: "100px 24px 40px",
        maxWidth: "1100px",
        margin: "0 auto",
        color: "#fff",
      }}
    >
      <h2 style={{ color: "#00aaff", marginBottom: "8px" }}>
        Research Conducted in the Department
      </h2>
      <p style={{ color: "#aaa", marginTop: 0 }}>
        Select a research topic to view LEO member dashboard uploads.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          margin: "24px 0",
        }}
      >
        {researchTopics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => setSelectedTopic(topic)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border:
                selectedTopic === topic
                  ? "1px solid #f28c28"
                  : "1px solid #333",
              background: selectedTopic === topic ? "#f28c2822" : "#111",
              color: selectedTopic === topic ? "#fff" : "#aaa",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {topic} hazard research projects
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <h3 style={{ color: "#f28c28", marginTop: 0 }}>
          {selectedTopic} Research Uploads
        </h3>

        {topicUploads.length === 0 ? (
          <p style={{ color: "#888", marginBottom: 0 }}>
            No uploaded research found for {selectedTopic} yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {topicUploads.map((upload) => (
              <div
                key={upload._id || upload.id}
                style={{
                  background: "#0b0b0b",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <h4 style={{ color: "#fff", margin: 0 }}>{upload.title}</h4>
                  <span style={{ color: "#777", fontSize: "12px" }}>
                    {upload.date
                      ? new Date(upload.date).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <p style={{ color: "#ccc", lineHeight: 1.6 }}>
                  {upload.description}
                </p>

                {upload.uploadType === "link" && (
                  <>
                    {isImageUrl(upload.content) ? (
                      <img
                        src={upload.content}
                        alt={upload.title}
                        onClick={() => openModal(upload.content, upload.title)}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                          maxHeight: "300px",
                          objectFit: "contain",
                          borderRadius: "6px",
                          backgroundColor: "#000",
                          marginBottom: "8px",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.transform = "scale(1)")
                        }
                      />
                    ) : (
                      <a
                        href={upload.content}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#8ab4ff",
                          textDecoration: "none",
                          wordBreak: "break-word",
                        }}
                      >
                        Open uploaded research
                      </a>
                    )}
                  </>
                )}

                {upload.uploadType === "file" && (
                  <div>
                    {upload.fileType?.startsWith("image/") ? (
                      <img
                        src={getFileUrl(upload.path)}
                        alt={upload.fileName || upload.title}
                        onClick={() =>
                          openModal(
                            getFileUrl(upload.path),
                            upload.fileName || upload.title,
                          )
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                          maxHeight: "300px",
                          objectFit: "contain",
                          borderRadius: "6px",
                          backgroundColor: "#000",
                          marginBottom: "8px",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.transform = "scale(1.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.transform = "scale(1)")
                        }
                      />
                    ) : (
                      <div style={{ color: "#ccc", marginBottom: "8px" }}>
                        <strong>{getFileLabel(upload)}:</strong>{" "}
                        <a
                          href={getFileUrl(upload.path)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#8ab4ff",
                            textDecoration: "underline",
                            wordBreak: "break-word",
                          }}
                        >
                          {upload.fileName || upload.path}
                        </a>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#888",
                            marginTop: "4px",
                          }}
                        >
                          {upload.fileType || "Unknown file type"}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {upload.uploadType === "text" && (
                  <div
                    style={{
                      color: "#ddd",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {upload.content}
                  </div>
                )}

                <p
                  style={{
                    color: "#777",
                    margin: "12px 0 0",
                    fontSize: "12px",
                  }}
                >
                  Uploaded by: {upload.uploadedBy || "LEO member"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ImageModal
        isOpen={modalImage.isOpen}
        imageSrc={modalImage.src}
        altText={modalImage.alt}
        onClose={closeModal}
      />
    </div>
  );
}

export default Research;
