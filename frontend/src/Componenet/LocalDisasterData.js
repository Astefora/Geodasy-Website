import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import ImageModal from "./ImageModal";

/**
 * Renders metadata for the most recent approved upload for a hazard type.
 * Does NOT render a title (title lives in the parent card header).
 * Does NOT render the image inline — returns image src via onImageReady callback
 * so the parent can render it in the fill area.
 */
function LocalDisasterData({ disasterType, onUploadReady }) {
  const [uploads, setUploads] = useState([]);
  const [modalImage, setModalImage] = useState({
    isOpen: false,
    src: "",
    alt: "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/uploads?hazardType=${disasterType.toLowerCase()}&status=approved`,
        );
        if (!res.ok) throw new Error("Backend unavailable");
        const data = await res.json();
        if (cancelled) return;
        // Only show local disaster data uploads (not research uploads)
        const localOnly = data.filter((u) =>
          u.title?.startsWith("Disaster Data:"),
        );
        const slice = localOnly.slice(0, 1);
        setUploads(slice);
        if (onUploadReady) onUploadReady(slice[0] || null);
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
        const slice = matching.slice(0, 1);
        setUploads(slice);
        if (onUploadReady) onUploadReady(slice[0] || null);
      }
    };
    load();
    window.addEventListener("focus", load);
    const pollId = setInterval(load, 8000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      clearInterval(pollId);
    };
  }, [disasterType]); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = (src, alt) => setModalImage({ isOpen: true, src, alt });
  const closeModal = () => setModalImage({ isOpen: false, src: "", alt: "" });

  const getDate = (upload) => {
    if (!upload.date) return "";
    const d = new Date(upload.date);
    return isNaN(d.getTime()) ? upload.date : d.toLocaleString();
  };

  const getLink = (upload) => {
    if (upload.content && upload.uploadType === "link") return upload.content;
    if (upload.link) return upload.link;
    if (upload.description?.startsWith("Link: "))
      return upload.description.slice(6);
    return null;
  };

  if (uploads.length === 0) {
    return (
      <p style={{ color: "#888", margin: 0, fontSize: "13px" }}>
        No approved local {disasterType.toLowerCase()} data yet.
      </p>
    );
  }

  const upload = uploads[0];
  const dateStr = getDate(upload);
  const link = getLink(upload);
  const isImage = upload.fileType?.startsWith("image/");

  return (
    <div style={{ fontSize: "13px" }}>
      {/* Metadata row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: "6px",
        }}
      >
        <span style={{ color: "#ccc", fontWeight: "600" }}>
          {upload.title || upload.fileName}
        </span>
        {dateStr && (
          <span style={{ color: "#aaa", fontSize: "11px" }}>{dateStr}</span>
        )}
      </div>

      {/* File info */}
      {upload.fileName && (
        <p style={{ color: "#ccc", margin: "0 0 4px" }}>
          <strong style={{ color: "#00aaff" }}>
            {isImage ? "Image" : "File"}:
          </strong>{" "}
          {upload.fileName}
          {upload.path && !isImage && (
            <a
              href={upload.path}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#8ab4ff", marginLeft: "8px", fontSize: "11px" }}
            >
              [View]
            </a>
          )}
        </p>
      )}

      {/* Uploader */}
      <p style={{ color: "#777", margin: 0, fontSize: "11px" }}>
        Uploaded by: {upload.uploadedBy || "LEO member"}
      </p>

      {/* Link type */}
      {link && (
        <div style={{ marginTop: "8px" }}>
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

      {/* Image — rendered inline for modal only; fill display is handled by parent */}
      {isImage && upload.path && (
        <div style={{ marginTop: "8px" }}>
          <span
            style={{ color: "#8ab4ff", fontSize: "11px", cursor: "pointer" }}
            onClick={() => openModal(upload.path, upload.fileName)}
          >
            🔍 Click map area to enlarge
          </span>
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

/**
 * Fills its container with the approved uploaded image (or file link) for a hazard.
 * Used as the fill area when hasLocalUploads is true.
 */
export function UploadedImageFill({ disasterType }) {
  const [upload, setUpload] = useState(null);
  const [modalImage, setModalImage] = useState({
    isOpen: false,
    src: "",
    alt: "",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/uploads?hazardType=${disasterType.toLowerCase()}&status=approved`,
        );
        if (!res.ok) return;
        const data = await res.json();
        // Only show local disaster data uploads (not research uploads)
        const localOnly = data.filter((u) =>
          u.title?.startsWith("Disaster Data:"),
        );
        if (!cancelled && localOnly[0]) setUpload(localOnly[0]);
      } catch {
        /* silent */
      }
    };
    load();
    const pollId = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, [disasterType]);

  if (!upload) return null;

  const isImage = upload.fileType?.startsWith("image/");
  const src = upload.path;

  if (isImage && src) {
    return (
      <>
        <img
          src={src}
          alt={upload.fileName || disasterType}
          onClick={() =>
            setModalImage({ isOpen: true, src, alt: upload.fileName })
          }
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            cursor: "zoom-in",
          }}
        />
        <ImageModal
          isOpen={modalImage.isOpen}
          imageSrc={modalImage.src}
          altText={modalImage.alt}
          onClose={() => setModalImage({ isOpen: false, src: "", alt: "" })}
        />
      </>
    );
  }

  // Non-image file — show centered link
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>📄</div>
        <div style={{ color: "#ccc", marginBottom: "8px", fontSize: "14px" }}>
          {upload.fileName}
        </div>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#8ab4ff", fontSize: "13px" }}
          >
            Open file ↗
          </a>
        )}
      </div>
    </div>
  );
}
