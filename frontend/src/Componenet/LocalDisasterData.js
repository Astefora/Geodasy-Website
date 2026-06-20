import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import ImageModal from "./ImageModal";

function LocalDisasterData({ disasterType }) {
  const [uploads, setUploads] = useState([]);
  const [modalImage, setModalImage] = useState({
    isOpen: false,
    src: "",
    alt: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadFromBackend = async () => {
      try {
        const res = await fetch(
          `/api/uploads?hazardType=${disasterType.toLowerCase()}&status=approved`,
        );
        if (!res.ok) throw new Error("Backend unavailable");
        const data = await res.json();
        if (cancelled) return;
        setUploads(data.slice(0, 1));
      } catch {
        if (cancelled) return;
        const saved = JSON.parse(
          localStorage.getItem("disasterUploads") || "[]",
        );
        const matching = saved
          .filter(
            (u) => u.disasterType === disasterType && u.status === "approved",
          )
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        setUploads(matching.slice(0, 1));
      }
    };

    loadFromBackend();
    const handleFocus = () => loadFromBackend();
    window.addEventListener("focus", handleFocus);
    const pollId = setInterval(loadFromBackend, 8000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      clearInterval(pollId);
    };
  }, [disasterType]);

  const openModal = (src, alt) => setModalImage({ isOpen: true, src, alt });
  const closeModal = () => setModalImage({ isOpen: false, src: "", alt: "" });

  const getImageSrc = (upload) => {
    if (upload.path && upload.fileType?.startsWith("image/"))
      return upload.path;
    if (upload.fileData) return upload.fileData;
    return null;
  };

  const getLink = (upload) => {
    if (upload.content && upload.uploadType === "link") return upload.content;
    if (upload.link) return upload.link;
    if (upload.description?.startsWith("Link: "))
      return upload.description.slice(6);
    return null;
  };

  const getDate = (upload) => {
    if (upload.date) {
      const d = new Date(upload.date);
      return isNaN(d.getTime()) ? upload.date : d.toLocaleString();
    }
    return "";
  };

  return (
    <div style={{ textAlign: "left" }}>
      {uploads.length === 0 ? (
        <p style={{ color: "#888", marginBottom: 0 }}>
          No local {disasterType.toLowerCase()} data has been uploaded yet.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {uploads.map((upload) => {
            const imgSrc = getImageSrc(upload);
            const link = getLink(upload);
            const dateStr = getDate(upload);

            return (
              <div
                key={upload._id || upload.id}
                style={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* ── Description/metadata on TOP (matches Global Data layout) ── */}
                <div style={{ padding: "12px 12px 8px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ color: "#fff", fontSize: "14px" }}>
                      Local {disasterType} Data
                    </strong>
                    <span style={{ color: "#aaa", fontSize: "11px" }}>
                      {dateStr}
                    </span>
                  </div>
                  {upload.fileName && (
                    <p
                      style={{
                        color: "#ccc",
                        margin: "0 0 4px",
                        fontSize: "13px",
                      }}
                    >
                      <strong style={{ color: "#00aaff" }}>
                        {upload.fileType?.startsWith("image/")
                          ? "Image"
                          : "File"}
                        :
                      </strong>{" "}
                      {upload.fileName}
                      {upload.path &&
                        !upload.fileType?.startsWith("image/") && (
                          <a
                            href={upload.path}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#8ab4ff",
                              marginLeft: "8px",
                              fontSize: "11px",
                            }}
                          >
                            [View]
                          </a>
                        )}
                    </p>
                  )}
                  <p style={{ color: "#777", margin: 0, fontSize: "11px" }}>
                    Uploaded by: {upload.uploadedBy || "LEO member"}
                  </p>
                </div>

                {/* ── Image/content BELOW the description ── */}
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt={upload.fileName || `${disasterType} upload`}
                    onClick={() =>
                      openModal(
                        imgSrc,
                        upload.fileName || `${disasterType} upload`,
                      )
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      backgroundColor: "#000",
                      cursor: "pointer",
                    }}
                  />
                )}

                {link && (
                  <div style={{ padding: "8px 12px 12px" }}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#8ab4ff",
                        fontSize: "12px",
                        wordBreak: "break-word",
                      }}
                    >
                      {link}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ImageModal
        isOpen={modalImage.isOpen}
        imageSrc={modalImage.src}
        altText={modalImage.alt}
        onClose={closeModal}
      />
    </div>
  );
}

export default LocalDisasterData;
