/**
 * server.js — Express backend for Ethiopia Disaster Dashboard
 *
 * Responsibilities:
 *   • Serve REST API for file uploads (POST/GET/DELETE /api/uploads)
 *   • Serve uploaded files as static assets at /uploads/*
 *   • Proxy FIRMS fire data requests to avoid browser CORS restrictions
 *   • Connect to MongoDB via Mongoose
 *
 * Run:  node server.js          (backend only)
 *       npm run dev             (backend + frontend together via concurrently)
 *
 * Common ECONNREFUSED causes:
 *   1. Backend not started — run `npm run server` or `npm run dev`
 *   2. Wrong port — backend must be on 5002 to match package.json proxy
 *   3. MongoDB not running — start with `mongod` or MongoDB Compass
 *   4. Firewall blocking localhost:5002
 */

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const https = require("https");
require("dotenv").config();

const Upload = require("./models/Upload");
const User = require("./models/User");

// ── App setup ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.BACKEND_PORT || 5002;

// ── CORS — allow React dev server (port 3000) and same-origin ─────────────
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Upload directory setup ─────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`[server] Created uploads directory: ${UPLOAD_DIR}`);
}

// ── Multer storage config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Sanitise filename: replace spaces, keep extension
    const safe = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (_req, file, cb) => {
    // Allow common research file types
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/geo+json",
      "application/json",
      "text/csv",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// ── Serve uploaded files as static assets ─────────────────────────────────
// Files are accessible at: http://localhost:5002/uploads/<filename>
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".csv": "text/csv",
        ".json": "application/json",
        ".txt": "text/plain",
      };
      if (mimeTypes[ext]) res.setHeader("Content-Type", mimeTypes[ext]);
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);

// ── MongoDB connection ─────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/geod";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`[server] MongoDB connected → ${MONGO_URI}`);

    // ── Seed admin account on startup ─────────────────────────────────────
    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      await User.create({
        username: "admin",
        email: "admin@geodesy.et",
        password: "Admin@1234",
        fullName: "System Administrator",
        role: "admin",
        designation: "Administrator",
        department: "Geodesy & Geodynamics",
        status: "approved",
      });
      console.log(
        "[server] Admin account seeded: admin@geodesy.et / Admin@1234",
      );
    }

    // Seed demo LEO member
    const existingLeo = await User.findOne({ email: "leo@geodesy.et" });
    if (!existingLeo) {
      await User.create({
        username: "leo_member",
        email: "leo@geodesy.et",
        password: "Leo@1234",
        fullName: "Demo LEO Member",
        role: "member",
        designation: "Research Officer",
        department: "Geodesy & Geodynamics",
        status: "approved",
      });
      console.log("[server] Demo LEO member seeded: leo@geodesy.et / Leo@1234");
    }
  })
  .catch((err) => {
    console.error("[server] MongoDB connection FAILED:", err.message);
    console.error("[server] Make sure MongoDB is running (mongod or Compass)");
    process.exit(1);
  });

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", message: "API server is running" }),
);
app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    port: PORT,
  }),
);

// ── POST /api/register — register a new user (pending approval) ───────────
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, fullName, designation, department } =
      req.body;
    if (!username || !email || !password || !fullName) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled." });
    }

    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "User with this email or username already exists." });
    }

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      designation: designation || "",
      department: department || "",
      status: "pending",
      role: "member",
    });

    console.log(`[server] New user registered (pending): ${user.email}`);
    res.status(201).json({
      message: "Registration successful. Pending admin approval.",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("[server] Register error:", err.message);
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

// ── POST /api/login — authenticate user ───────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required." });

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.status === "pending") {
      return res
        .status(403)
        .json({ error: "Your account is pending admin approval." });
    }
    if (user.status === "rejected") {
      return res.status(403).json({ error: "Your account has been rejected." });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        designation: user.designation,
        department: user.department,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("[server] Login error:", err.message);
    res.status(500).json({ error: "Login failed." });
  }
});

// ── GET /api/users — list users (admin only, filtered by status) ──────────
app.get("/api/users", async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.role) query.role = req.query.role;
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("[server] GET /api/users error:", err.message);
    res.status(500).json({ error: "Could not fetch users." });
  }
});

// ── PUT /api/users/:id/approve — approve a user ──────────────────────────
app.put("/api/users/:id/approve", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvedBy: req.body.approvedBy || "admin",
        approvedAt: new Date(),
      },
      { new: true },
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    console.log(`[server] User approved: ${user.email}`);
    res.json({ message: "User approved.", user });
  } catch (err) {
    res.status(500).json({ error: "Approval failed." });
  }
});

// ── PUT /api/users/:id/reject — reject a user ────────────────────────────
app.put("/api/users/:id/reject", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true },
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    console.log(`[server] User rejected: ${user.email}`);
    res.json({ message: "User rejected.", user });
  } catch (err) {
    res.status(500).json({ error: "Rejection failed." });
  }
});

// ── POST /api/uploads — upload a file ─────────────────────────────────────
app.post("/api/uploads", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { title, hazardType, description, uploadedBy, uploadType, content } =
      req.body;

    // Build the public URL for this file
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    // For link/text entries the "path" is the content itself (stored as a tiny .txt)
    // but we preserve the original content string for rendering
    const resolvedUploadType = uploadType || "file";
    const resolvedPath = resolvedUploadType === "file" ? fileUrl : fileUrl;

    const fileEntry = new Upload({
      title: title || req.file.originalname,
      hazardType: (hazardType || "other").toLowerCase(),
      uploadType: resolvedUploadType,
      description: description || "",
      fileName: req.file.originalname,
      storedName: req.file.filename,
      path: resolvedPath,
      content: content || "", // original link URL or text body
      fileType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: uploadedBy || "Anonymous",
      date: new Date(),
    });

    const saved = await fileEntry.save();
    console.log(
      `[server] Uploaded: ${saved.title} (${saved.fileType}, ${saved.size} bytes)`,
    );
    res.status(201).json(saved);
  } catch (err) {
    console.error("[server] Upload error:", err.message);
    res.status(500).json({ error: err.message || "Upload failed." });
  }
});

// ── GET /api/uploads — list all uploads (optional ?hazardType= filter) ────
app.get("/api/uploads", async (req, res) => {
  try {
    const query = {};
    if (req.query.hazardType) {
      query.hazardType = req.query.hazardType.toLowerCase();
    }
    if (req.query.status) {
      query.status = req.query.status.toLowerCase();
    }
    const uploads = await Upload.find(query).sort({ date: -1 });
    res.json(uploads);
  } catch (err) {
    console.error("[server] GET /api/uploads error:", err.message);
    res.status(500).json({ error: "Could not fetch uploads." });
  }
});

// ── PUT /api/uploads/:id/approve — approve upload for local hazard display ──
app.put("/api/uploads/:id/approve", async (req, res) => {
  try {
    const uploadRecord = await Upload.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvedBy: req.body.approvedBy || "admin",
        approvedAt: new Date(),
        rejectedBy: "",
        rejectedAt: null,
      },
      { new: true },
    );
    if (!uploadRecord) {
      return res.status(404).json({ error: "Upload not found." });
    }
    console.log(`[server] Upload approved: ${uploadRecord.title}`);
    res.json({ message: "Upload approved.", upload: uploadRecord });
  } catch (err) {
    console.error("[server] Upload approval error:", err.message);
    res.status(500).json({ error: "Upload approval failed." });
  }
});

// ── PUT /api/uploads/:id/reject — reject upload from local hazard display ───
app.put("/api/uploads/:id/reject", async (req, res) => {
  try {
    const uploadRecord = await Upload.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedBy: req.body.rejectedBy || "admin",
        rejectedAt: new Date(),
      },
      { new: true },
    );
    if (!uploadRecord) {
      return res.status(404).json({ error: "Upload not found." });
    }
    console.log(`[server] Upload rejected: ${uploadRecord.title}`);
    res.json({ message: "Upload rejected.", upload: uploadRecord });
  } catch (err) {
    console.error("[server] Upload rejection error:", err.message);
    res.status(500).json({ error: "Upload rejection failed." });
  }
});

// ── GET /api/uploads/:id — get single upload by ID ────────────────────────
app.get("/api/uploads/:id", async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: "Upload not found." });
    res.json(upload);
  } catch (err) {
    console.error("[server] GET /api/uploads/:id error:", err.message);
    res.status(500).json({ error: "Could not fetch upload." });
  }
});

// ── DELETE /api/uploads/:id — delete upload + file from disk ──────────────
app.delete("/api/uploads/:id", async (req, res) => {
  try {
    const record = await Upload.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Upload not found." });

    // Delete physical file from disk
    if (record.storedName) {
      const filePath = path.join(UPLOAD_DIR, record.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[server] Deleted file: ${filePath}`);
      }
    }

    await Upload.findByIdAndDelete(req.params.id);
    res.json({ message: "Upload deleted successfully." });
  } catch (err) {
    console.error("[server] DELETE /api/uploads/:id error:", err.message);
    res.status(500).json({ error: "Could not delete upload." });
  }
});

// ── Email approval notification ────────────────────────────────────────────
// POST /api/send-approval-email — sends approval email to a user
const nodemailer = require("nodemailer");

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/send-approval-email", async (req, res) => {
  const { email, fullName, action } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[server] Email not configured — skipping send");
    return res.json({ message: "Email not configured, skipped", sent: false });
  }

  const isApproved = action === "approve";
  const subject = isApproved
    ? "✅ Your LEO Account Has Been Approved"
    : "❌ Your LEO Account Registration Was Rejected";

  const html = isApproved
    ? `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#1f4fd8;">Account Approved!</h2>
        <p>Dear <strong>${fullName || "User"}</strong>,</p>
        <p>Your LEO membership account has been approved by the administrator.</p>
        <p>You can now log in to the Geodesy & Geodynamics dashboard:</p>
        <a href="http://localhost:3000/login" style="display:inline-block;padding:12px 24px;background:#1f4fd8;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">Login Now</a>
        <p style="margin-top:20px;color:#666;font-size:12px;">— Geodesy & Geodynamics Department</p>
      </div>`
    : `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#dc3545;">Registration Rejected</h2>
        <p>Dear <strong>${fullName || "User"}</strong>,</p>
        <p>Unfortunately, your LEO membership registration has been rejected by the administrator.</p>
        <p>If you believe this is an error, please contact the department directly.</p>
        <p style="margin-top:20px;color:#666;font-size:12px;">— Geodesy & Geodynamics Department</p>
      </div>`;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });
    console.log(`[server] Approval email sent to ${email}`);
    res.json({ message: "Email sent successfully", sent: true });
  } catch (err) {
    console.error("[server] Email send failed:", err.message);
    res.status(500).json({
      error: "Failed to send email",
      detail: err.message,
      sent: false,
    });
  }
});

// ── NASA Landslide Catalog proxy ──────────────────────────────────────────
// GET /api/landslides → https://data.nasa.gov/resource/tfkf-kniw.json
// data.nasa.gov blocks direct browser requests (no CORS header).
// This proxy fetches server-side and forwards the JSON.
app.get("/api/landslides", (req, res) => {
  const limit = parseInt(req.query.limit) || 5000;
  const nasaUrl = `https://data.nasa.gov/resource/tfkf-kniw.json?$limit=${limit}`;

  console.log(`[server] Landslide proxy → ${nasaUrl}`);

  https
    .get(nasaUrl, { headers: { Accept: "application/json" } }, (nasaRes) => {
      let body = "";
      nasaRes.on("data", (chunk) => {
        body += chunk;
      });
      nasaRes.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(nasaRes.statusCode).send(body);
      });
    })
    .on("error", (err) => {
      console.error("[server] Landslide proxy error:", err.message);
      res
        .status(502)
        .json({ error: "Landslide proxy failed", detail: err.message });
    });
});

// ── FIRMS proxy ────────────────────────────────────────────────────────────
// GET /api/firms/* → https://firms.modaps.eosdis.nasa.gov/*
// Bypasses browser CORS restrictions for FIRMS fire data CSV.
app.get("/api/firms/*", (req, res) => {
  const firmsPath = req.url.replace(/^\/api\/firms/, "");
  const firmsUrl = `https://firms.modaps.eosdis.nasa.gov${firmsPath}`;

  console.log(`[server] FIRMS proxy → ${firmsUrl}`);

  https
    .get(firmsUrl, (firmsRes) => {
      res.setHeader(
        "Content-Type",
        firmsRes.headers["content-type"] || "text/csv",
      );
      res.setHeader("Access-Control-Allow-Origin", "*");
      firmsRes.pipe(res);
    })
    .on("error", (err) => {
      console.error("[server] FIRMS proxy error:", err.message);
      res
        .status(502)
        .json({ error: "FIRMS proxy failed", detail: err.message });
    });
});

// ── COMET Volcano Portal proxy ─────────────────────────────────────────────
// GET /api/comet-volcanoes → https://cometarchive.leeds.ac.uk/wp-json/volcanodb/v1/volcanoes
// The COMET API doesn't send CORS headers, so we proxy server-side.
app.get("/api/comet-volcanoes", (_req, res) => {
  // Use the Africa & Red Sea region endpoint (location id 42) which returns
  // all volcanoes in the region including all Ethiopian ones in a single response.
  const cometUrl =
    "https://cometarchive.leeds.ac.uk/wp-json/volcanodb/v1/location/42";

  console.log(`[server] COMET proxy → ${cometUrl}`);

  const request = https.get(
    cometUrl,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; GeodDashboard/1.0)",
      },
    },
    (cometRes) => {
      // Follow a single redirect if needed (301/302)
      if (
        (cometRes.statusCode === 301 || cometRes.statusCode === 302) &&
        cometRes.headers.location
      ) {
        console.log(`[server] COMET redirect → ${cometRes.headers.location}`);
        https
          .get(
            cometRes.headers.location,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; GeodDashboard/1.0)",
              },
            },
            (redirectRes) => {
              const chunks = [];
              redirectRes.on("data", (c) => chunks.push(c));
              redirectRes.on("end", () => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.status(200).send(Buffer.concat(chunks));
              });
            },
          )
          .on("error", (err) => {
            console.error("[server] COMET redirect error:", err.message);
            res
              .status(502)
              .json({ error: "COMET redirect failed", detail: err.message });
          });
        return;
      }

      const chunks = [];
      cometRes.on("data", (c) => chunks.push(c));
      cometRes.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(200).send(Buffer.concat(chunks));
      });
    },
  );

  request.on("error", (err) => {
    console.error("[server] COMET proxy error:", err.message);
    res.status(502).json({ error: "COMET proxy failed", detail: err.message });
  });

  request.setTimeout(15000, () => {
    request.destroy();
    res.status(504).json({ error: "COMET proxy timeout" });
  });
});

// ── Serve built frontend in production ────────────────────────────────────
const CLIENT_BUILD_DIR = path.join(__dirname, "../frontend/build");
if (fs.existsSync(CLIENT_BUILD_DIR)) {
  app.use(express.static(CLIENT_BUILD_DIR));

  app.get("*", (req, res) => {
    if (
      req.originalUrl.startsWith("/api") ||
      req.originalUrl.startsWith("/uploads")
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"));
  });
}

// ── Multer error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (
    err instanceof multer.MulterError ||
    err.message?.includes("not allowed")
  ) {
    return res.status(400).json({ error: err.message });
  }
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log("─────────────────────────────────────────");
  console.log(`[server] Backend running → http://localhost:${PORT}`);
  console.log(`[server] Health check   → http://localhost:${PORT}/api/health`);
  console.log(`[server] Uploads API    → http://localhost:${PORT}/api/uploads`);
  console.log(`[server] Static files   → http://localhost:${PORT}/uploads/`);
  console.log("─────────────────────────────────────────");
});
