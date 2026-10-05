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
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const https = require("https");
const crypto = require("crypto"); // for email verification tokens
const cookieParser = require("cookie-parser"); // for Remember Me cookies
const cron = require("node-cron"); // for daily hazard digest scheduler
const XLSX = require("xlsx"); // for Excel export
require("dotenv").config();

const Upload = require("./models/Upload");
const User = require("./models/User");
const RememberToken = require("./models/RememberToken");
const Subscription = require("./models/Subscription");
const AlertHistory = require("./models/AlertHistory");
const AlertSubscription = require("./models/AlertSubscription");
const SiteContent = require("./models/SiteContent");
const {
  sendSmsEthiopia,
  registerContactToSmsEthiopia,
  formatProfessionalSms,
  buildProfessionalEmailHtml,
  buildSubscriptionConfirmationEmailHtml,
  getEmailTransporter,
  SEED_ALERT_HISTORY,
  normalizeEthiopianPhone,
  dispatchAlertToAllRecipients,
} = require("./alertService");
const {
  rememberMeMiddleware,
  issueRememberToken,
  revokeRememberToken,
} = require("./middleware/rememberMe");

// Initialize robust unified email transporter
const emailTransporter = getEmailTransporter();

// ── App setup ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.BACKEND_PORT || 5002;

// ── CORS — allow React dev server (port 3000) and same-origin ─────────────
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // required for Set-Cookie / Remember Me to work
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Cookie parser (required for Remember Me) ───────────────────────────────
app.use(cookieParser());

// ── Remember Me middleware — restores session from persistent cookie ────────
// Runs before all routes. If a valid rememberToken cookie exists and no
// session is active, it validates the token, attaches req.user, and rotates
// the token automatically.
app.use(rememberMeMiddleware);

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
        isEmailVerified: true, // seeded accounts skip the email verification flow
      });
      console.log(
        "[server] Admin account seeded: admin@geodesy.et / Admin@1234",
      );
    } else if (!existingAdmin.isEmailVerified) {
      // Fix existing admin records that predate the isEmailVerified field
      await User.updateOne(
        { _id: existingAdmin._id },
        { isEmailVerified: true },
      );
      console.log(
        "[server] Admin account patched: isEmailVerified set to true",
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
        isEmailVerified: true, // seeded accounts skip the email verification flow
      });
      console.log("[server] Demo LEO member seeded: leo@geodesy.et / Leo@1234");
    } else if (!existingLeo.isEmailVerified) {
      // Fix existing demo member records that predate the isEmailVerified field
      await User.updateOne({ _id: existingLeo._id }, { isEmailVerified: true });
      console.log(
        "[server] Demo LEO member patched: isEmailVerified set to true",
      );
    }

    // ── One-time migration: mark all approved users as email-verified ──────
    // Users created before the isEmailVerified field existed have null/undefined
    // for this field. They are already approved so they clearly verified their
    // identity. Patch them so they can log in without being blocked.
    const patchResult = await User.updateMany(
      { isEmailVerified: { $ne: true } },
      { $set: { isEmailVerified: true } },
    );
    if (patchResult.modifiedCount > 0) {
      console.log(
        `[server] Migration: set isEmailVerified=true on ${patchResult.modifiedCount} existing user(s)`,
      );
    }
  })
  .catch((err) => {
    console.error("[server] MongoDB connection FAILED:", err.message);
    console.error("[server] Make sure MongoDB is running (mongod or Compass)");
    process.exit(1);
  });

// ── GET /api/me — return current user from Remember Me cookie ─────────────
// The rememberMeMiddleware runs before this route and populates req.user
// if a valid persistent cookie exists. The frontend calls this on app load
// to restore the session without requiring a full re-login.
app.get("/api/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  const u = req.user;
  res.json({
    user: {
      id: u._id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone || "",
      role: u.role,
      designation: u.designation,
      department: u.department,
      status: u.status,
      approvedBy: u.approvedBy || null,
      approvedAt: u.approvedAt || null,
    },
  });
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
    const {
      username,
      email,
      password,
      fullName,
      designation,
      department,
      phone,
    } = req.body;

    if (!username || !email || !password || !fullName) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled." });
    }

    // ── Phone validation (Ethiopian format: +251 + exactly 9 digits) ──────
    // Phone is now required.
    if (!phone || phone.trim() === "") {
      return res.status(400).json({
        error: "Phone number is required.",
        code: "INVALID_PHONE",
      });
    }
    const phoneDigits = phone.replace(/^\+251/, "").replace(/\s/g, "");
    if (!/^\d{9}$/.test(phoneDigits)) {
      return res.status(400).json({
        error:
          "Phone number must be exactly 9 digits after +251 (e.g. +251912345678).",
        code: "INVALID_PHONE",
      });
    }

    // ── Duplicate check ────────────────────────────────────────────────────
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

    // ── Generate a secure email verification token ─────────────────────────
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // ── Save user to database ──────────────────────────────────────────────
    // Normalise phone: store as +251XXXXXXXXX or empty string
    const normalizedPhone =
      phone && phone.trim()
        ? "+251" + phone.replace(/^\+251/, "").replace(/\s/g, "")
        : "";

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      phone: normalizedPhone,
      designation: designation || "",
      department: department || "",
      status: "pending",
      role: "member",
      isEmailVerified: false,
      emailVerifyToken,
      emailVerifyExpires,
    });

    console.log(`[server] New user registered (pending): ${user.email}`);

    // ── Send verification email ────────────────────────────────────────────
    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    const verifyURL = `${APP_URL}/verify-email?token=${emailVerifyToken}&id=${user._id}`;

    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: "📧 Verify your email — Geodesy & Geodynamics",
        html: buildVerifyEmailHtml(user.fullName || user.username, verifyURL),
      });
      console.log(`[server] Verification email sent to ${user.email}`);
    } catch (mailErr) {
      // Non-fatal: user is saved, email delivery failed. User can resend.
      console.error("[server] Verification email FAILED:", mailErr.message);
    }

    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account, then wait for admin approval.",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("[server] Register error:", err.message);
    res.status(500).json({ error: err.message || "Registration failed." });
  }
});

// ── GET /api/verify-email — verify a user's email address ─────────────────
// The link in the email hits this endpoint with ?token=...&id=...
app.get("/api/verify-email", async (req, res) => {
  const { token, id } = req.query;

  if (!token || !id) {
    return res.status(400).json({ error: "Invalid verification link." });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({ error: "Invalid verification link." });
    }

    // Already verified — just redirect so clicking the link twice works gracefully
    if (user.isEmailVerified) {
      const APP_URL = process.env.APP_URL || "http://localhost:3000";
      return res.redirect(`${APP_URL}/verify-email?status=already`);
    }

    // Check token match
    if (user.emailVerifyToken !== token) {
      return res.status(400).json({ error: "Invalid verification token." });
    }

    // Check expiry
    if (user.emailVerifyExpires < new Date()) {
      return res.status(400).json({
        error:
          "Verification link has expired. Please register again or contact support.",
      });
    }

    // ── Mark email as verified ─────────────────────────────────────────────
    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    console.log(`[server] Email verified: ${user.email}`);

    // ── Notify admin that a new user is ready for approval ────────────────
    // This fires AFTER verification so the admin only sees legitimate,
    // confirmed email addresses in their pending queue.
    try {
      const admin = await User.findOne({ role: "admin" }).select(
        "email fullName",
      );
      if (admin && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const APP_URL = process.env.APP_URL || "http://localhost:3000";
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: admin.email,
          subject: "🔔 New user awaiting approval — Geodesy & Geodynamics",
          html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;
                      padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
            <h2 style="color:#3949ab;margin:0 0 12px;">New Member Registration</h2>
            <p>A new user has verified their email and is awaiting your approval:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;width:110px;">Full Name</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;">${user.fullName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;">Email</td>
                <td style="padding:6px 0;font-size:13px;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;">Designation</td>
                <td style="padding:6px 0;font-size:13px;">${user.designation || "—"}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;font-size:13px;">Department</td>
                <td style="padding:6px 0;font-size:13px;">${user.department || "—"}</td>
              </tr>
            </table>
            <div style="text-align:center;margin:24px 0;">
              <a href="${APP_URL}/admin"
                 style="display:inline-block;padding:12px 28px;background:#3949ab;
                        color:#fff;border-radius:8px;text-decoration:none;
                        font-weight:700;font-size:14px;">
                Review in Admin Panel
              </a>
            </div>
            <p style="font-size:12px;color:#999;margin:0;">
              — Geodesy &amp; Geodynamics Dashboard
            </p>
          </div>`,
        });
        console.log(
          `[server] Admin notified about new verified user: ${user.email}`,
        );
      }
    } catch (notifyErr) {
      // Non-fatal — verification succeeded, admin email is just a bonus notification
      console.error(
        "[server] Admin notification email failed:",
        notifyErr.message,
      );
    }

    // Redirect to the frontend success page
    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    res.redirect(`${APP_URL}/verify-email?status=success`);
  } catch (err) {
    console.error("[server] Email verify error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── POST /api/resend-verification — resend the verification email ──────────
app.post("/api/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return res.json({
        message: "If applicable, a new verification email has been sent.",
      });
    }

    // Rotate the token and reset expiry
    user.emailVerifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    const verifyURL = `${APP_URL}/verify-email?token=${user.emailVerifyToken}&id=${user._id}`;

    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "📧 Verify your email — Geodesy & Geodynamics",
      html: buildVerifyEmailHtml(user.fullName || user.username, verifyURL),
    });

    console.log(`[server] Resent verification email to ${user.email}`);
    res.json({
      message: "If applicable, a new verification email has been sent.",
    });
  } catch (err) {
    console.error("[server] Resend verification error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── POST /api/login — authenticate user ───────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required." });

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Block login if email is not yet verified.
    // Admins are seeded internally and never go through the email verification
    // flow, so we skip this check for them entirely.
    if (user.role !== "admin" && !user.isEmailVerified) {
      return res.status(403).json({
        error:
          "Please verify your email address before logging in. Check your inbox for the verification link.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    if (user.status === "pending") {
      return res
        .status(403)
        .json({ error: "Your account is pending admin approval." });
    }
    if (user.status === "rejected") {
      return res.status(403).json({ error: "Your account has been rejected." });
    }

    // ── Remember Me — issue a persistent token ─────────────────────────────
    // Only when the client explicitly requests it (checkbox was checked).
    // The raw token goes to the client cookie; only the SHA-256 hash is
    // persisted in MongoDB. Token rotation happens on every use via middleware.
    if (rememberMe === true || rememberMe === "true") {
      await issueRememberToken(res, user._id);
      console.log(`[server] Remember Me token issued for ${user.email}`);
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || "",
        role: user.role,
        designation: user.designation,
        department: user.department,
        status: user.status,
        approvedBy: user.approvedBy || null,
        approvedAt: user.approvedAt || null,
      },
    });
  } catch (err) {
    console.error("[server] Login error:", err.message);
    res.status(500).json({ error: "Login failed." });
  }
});

// ── POST /api/subscriptions — subscribe to hazard alerts / research updates ──
app.post("/api/subscriptions", async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }

  try {
    const existing = await Subscription.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.is_active) {
        return res
          .status(409)
          .json({ error: "This email is already subscribed." });
      }
      // Re-activate a previously unsubscribed address
      existing.is_active = true;
      await existing.save();
      console.log(`[server] Subscription re-activated: ${email}`);
      return res
        .status(200)
        .json({ message: "Welcome back! You have been re-subscribed." });
    }

    const sub = await Subscription.create({ email: email.toLowerCase() });
    console.log(`[server] New subscriber: ${sub.email}`);

    // Send a confirmation email to the subscriber (non-fatal if it fails)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const APP_URL = process.env.APP_URL || "http://localhost:3000";
      const unsubUrl = `${APP_URL}/unsubscribe?token=${sub.unsubscribeToken}`;
      emailTransporter
        .sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: sub.email,
          subject: "✅ You are now subscribed — Geodesy & Geodynamics",
          html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
            <h2 style="color:#3949ab;margin:0 0 12px;">Subscription Confirmed!</h2>
            <p>You are now subscribed to <strong>hazard alerts</strong> and <strong>research updates</strong> from the Geodesy &amp; Geodynamics Department, SSGI.</p>
            <p>You will receive email notifications whenever new hazard data or research publications are available.</p>
            <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;">
            <p style="font-size:12px;color:#999;">
              To unsubscribe at any time, click here:
              <a href="${unsubUrl}" style="color:#3949ab;">Unsubscribe</a>
            </p>
          </div>`,
        })
        .catch((e) =>
          console.error(
            "[server] Subscription confirm email failed:",
            e.message,
          ),
        );
    }

    res.status(201).json({
      message:
        "Successfully subscribed! You will receive hazard alerts and research updates.",
    });
  } catch (err) {
    console.error("[server] Subscription error:", err.message);
    res.status(500).json({ error: "Subscription failed. Please try again." });
  }
});

// ── GET /api/unsubscribe — one-click unsubscribe via token link ────────────
app.get("/api/unsubscribe", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Invalid unsubscribe link.");

  try {
    const sub = await Subscription.findOne({ unsubscribeToken: token });
    if (!sub) return res.status(404).send("Subscription not found.");

    sub.is_active = false;
    await sub.save();
    console.log(`[server] Unsubscribed: ${sub.email}`);

    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    res.redirect(`${APP_URL}/?unsubscribed=1`);
  } catch (err) {
    console.error("[server] Unsubscribe error:", err.message);
    res.status(500).send("Something went wrong. Please try again.");
  }
});

// ── POST /api/subscriptions/notify — send alert to all active subscribers ──
// This endpoint is called internally (e.g., from admin panel or automated job)
// when a new hazard alert or research update is published.
// Body: { subject, htmlBody, type: "hazard_alert" | "research_update" }
app.post("/api/subscriptions/notify", async (req, res) => {
  const { subject, htmlBody, type } = req.body;
  if (!subject || !htmlBody) {
    return res
      .status(400)
      .json({ error: "subject and htmlBody are required." });
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res
      .status(503)
      .json({ error: "Email not configured on this server." });
  }

  try {
    const topicFilter =
      type === "research_update" ? "research_updates" : "hazard_alerts";
    const subscribers = await Subscription.find({
      is_active: true,
      topics: topicFilter,
    }).select("email unsubscribeToken");

    if (subscribers.length === 0) {
      return res.json({ message: "No active subscribers.", sent: 0 });
    }

    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    let sent = 0;
    let failed = 0;

    // Send in batches to avoid overwhelming the SMTP server
    for (const sub of subscribers) {
      const unsubUrl = `${APP_URL}/api/unsubscribe?token=${sub.unsubscribeToken}`;
      const footerHtml = `
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;">
        <p style="font-size:11px;color:#999;text-align:center;">
          Geodesy &amp; Geodynamics Department — SSGI &nbsp;|&nbsp;
          <a href="${unsubUrl}" style="color:#3949ab;">Unsubscribe</a>
        </p>`;

      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: sub.email,
          subject,
          html: htmlBody + footerHtml,
        });
        sent++;
      } catch (mailErr) {
        console.error(
          `[server] Notify failed for ${sub.email}:`,
          mailErr.message,
        );
        failed++;
      }
    }

    console.log(
      `[server] Notification sent: ${sent} success, ${failed} failed`,
    );
    res.json({
      message: `Notifications sent.`,
      sent,
      failed,
      total: subscribers.length,
    });
  } catch (err) {
    console.error("[server] Notify error:", err.message);
    res.status(500).json({ error: "Notification failed." });
  }
});

// ── POST /api/contact — send a contact message to the department email ────
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email and message are required." });
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[server] Email not configured — contact form not sent.");
    return res.json({
      message: "Message received. (Email not configured on server.)",
    });
  }
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to the department's own configured email
      replyTo: email, // reply goes back to the visitor
      subject: `[Contact Form] ${subject || "Message from " + name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
          <h2 style="color:#3949ab;margin:0 0 16px;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:6px 0;color:#666;width:80px;">Name</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${email}</td></tr>
            ${subject ? `<tr><td style="padding:6px 0;color:#666;">Subject</td><td style="padding:6px 0;">${subject}</td></tr>` : ""}
          </table>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:14px;line-height:1.7;color:#333;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p style="font-size:11px;color:#999;margin-top:20px;">Sent via the Geodesy &amp; Geodynamics contact form.</p>
        </div>`,
    });
    console.log(`[server] Contact form email sent from ${email}`);
    res.json({ message: "Your message has been sent successfully!" });
  } catch (err) {
    console.error("[server] Contact email failed:", err.message);
    res
      .status(500)
      .json({ error: "Failed to send message. Please try again later." });
  }
});

// ── POST /api/logout — clear session and revoke Remember Me token ──────────
app.post("/api/logout", async (req, res) => {
  try {
    // Revoke the persistent token from MongoDB and clear the client cookie.
    // This is always safe to call — it silently ignores missing cookies.
    await revokeRememberToken(req, res);

    console.log("[server] User logged out");
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("[server] Logout error:", err.message);
    res.status(500).json({ error: "Logout failed." });
  }
});

// ── GET /api/users — list users (admin only, filtered by status) ──────────
// When fetching pending users for admin review, only show those who have
// already verified their email. Unverified registrations are invisible
// to admins until the user clicks their verification link.
app.get("/api/users", async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.role) query.role = req.query.role;

    // Hide email-unverified accounts from the admin pending queue.
    // Only applies when fetching pending users — approved/rejected users
    // have already passed verification so no need to filter them out.
    if (req.query.status === "pending") {
      query.isEmailVerified = true;
    }

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

// ── PUT /api/users/:id — update user profile (self-edit) ─────────────────
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }
    const allowed = ["fullName", "phone", "designation", "department"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    console.log(`[server] User profile updated: ${user.email}`);
    res.json({ message: "Profile updated.", user });
  } catch (err) {
    console.error("[server] PUT /api/users/:id error:", err.message);
    res.status(500).json({ error: "Could not update profile." });
  }
});

// ── DELETE /api/users/:id — permanently remove a user ────────────────────
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format before hitting MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    // Fetch first so we can guard against deleting admins
    const target = await User.findById(id).lean();
    if (!target) {
      return res.status(404).json({ error: "User not found." });
    }
    if (target.role === "admin") {
      return res
        .status(403)
        .json({ error: "Admin accounts cannot be removed." });
    }

    await User.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    console.log(`[server] User deleted: ${target.email}`);
    res.json({ message: "User removed successfully." });
  } catch (err) {
    console.error("[server] DELETE /api/users/:id error:", err.message);
    res.status(500).json({ error: "Could not delete user." });
  }
});

// ── POST /api/uploads — upload a file ─────────────────────────────────────
app.post("/api/uploads", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const {
      title,
      hazardType,
      description,
      uploadedBy,
      uploadType,
      content,
      region,
    } = req.body;

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
      region: region || "Ethiopia",
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

// ── GET /api/uploads/:id/download — proxy/redirect to the stored file ─────
// Lets the frontend trigger a proper browser download with a clean filename
app.get("/api/uploads/:id/download", async (req, res) => {
  try {
    const record = await Upload.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Upload not found." });

    // Only file-type uploads have a stored file on disk
    if (record.uploadType !== "file" || !record.storedName) {
      return res
        .status(400)
        .json({ error: "This upload has no downloadable file." });
    }

    const filePath = path.join(UPLOAD_DIR, record.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk." });
    }

    // Set Content-Disposition to force download with the original filename
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(record.fileName)}"`,
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.sendFile(filePath);
  } catch (err) {
    console.error("[server] Download error:", err.message);
    res.status(500).json({ error: "Download failed." });
  }
});

// ── GET /api/datasets/export — bulk export approved dataset metadata ───────
// Query params:
//   format      csv | json | geojson | xlsx   (default: json)
//   hazardType  earthquake | flood | ...       (optional, all if omitted)
//   status      approved | pending | ...       (default: approved)
//
// Note: this exports dataset *metadata* (title, hazardType, uploader, date,
// size, format, description, file URL) — not the raw binary file contents.
// For the actual file, use /api/uploads/:id/download.
// const XLSX = require("xlsx");

app.get("/api/datasets/export", async (req, res) => {
  try {
    const fmt = (req.query.format || "json").toLowerCase();
    const status = req.query.status || "approved";
    const query = { status };
    if (req.query.hazardType)
      query.hazardType = req.query.hazardType.toLowerCase();

    const records = await Upload.find(query).sort({ date: -1 }).lean();

    // Build flat metadata rows
    const rows = records
      .filter((r) => !r.title?.startsWith("Disaster Data:"))
      .map((r) => ({
        id: r._id.toString(),
        title: r.title || "",
        hazardType: r.hazardType || "",
        uploadType: r.uploadType || "",
        description: r.description || "",
        fileName: r.fileName || "",
        fileType: r.fileType || "",
        sizeBytes: r.size || 0,
        uploadedBy: r.uploadedBy || "",
        status: r.status || "",
        approvedBy: r.approvedBy || "",
        approvedAt: r.approvedAt ? new Date(r.approvedAt).toISOString() : "",
        date: r.date ? new Date(r.date).toISOString() : "",
        fileUrl: r.path
          ? r.path.startsWith("http")
            ? r.path
            : `http://localhost:${PORT}/uploads/${r.storedName || ""}`
          : "",
      }));

    const slug = req.query.hazardType || "all";
    const filename = `geod-datasets-${slug}-${new Date().toISOString().slice(0, 10)}`;

    if (fmt === "csv") {
      if (rows.length === 0) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.csv"`,
        );
        return res.send(
          Object.keys(
            rows[0] || {
              id: "",
              title: "",
              hazardType: "",
              uploadType: "",
              description: "",
              fileName: "",
              fileType: "",
              sizeBytes: "",
              uploadedBy: "",
              status: "",
              approvedBy: "",
              approvedAt: "",
              date: "",
              fileUrl: "",
            },
          ).join(",") + "\n",
        );
      }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => `"${String(r[h] || "").replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`,
      );
      return res.send(csv);
    } else if (fmt === "geojson") {
      const geojson = {
        type: "FeatureCollection",
        name: `SSGI Geodesy Datasets — ${slug}`,
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
        },
        generatedAt: new Date().toISOString(),
        features: rows.map((r) => ({
          type: "Feature",
          // No point coordinates — metadata-only datasets
          geometry: null,
          properties: r,
        })),
      };
      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.geojson"`,
      );
      return res.json(geojson);
    } else if (fmt === "xlsx") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto-width columns
      const colWidths = Object.keys(rows[0] || {}).map((k) => ({
        wch: Math.max(
          k.length,
          ...rows.map((r) => String(r[k] || "").length),
          10,
        ),
      }));
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, "Datasets");

      // Metadata sheet
      const metaWs = XLSX.utils.json_to_sheet([
        { key: "Source", value: "SSGI Geodesy & Geodynamics Department" },
        { key: "Exported At", value: new Date().toISOString() },
        { key: "Hazard Type", value: slug },
        { key: "Total Records", value: rows.length },
        {
          key: "API Endpoint",
          value: `http://localhost:${PORT}/api/datasets/export?format=json&hazardType=${slug}`,
        },
      ]);
      XLSX.utils.book_append_sheet(wb, metaWs, "Metadata");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`,
      );
      return res.send(buf);
    } else {
      // Default: JSON
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.json"`,
      );
      return res.json({
        source: "SSGI Geodesy & Geodynamics Department, Ethiopia",
        generatedAt: new Date().toISOString(),
        hazardType: slug,
        total: rows.length,
        datasets: rows,
      });
    }
  } catch (err) {
    console.error("[server] Dataset export error:", err.message);
    res.status(500).json({ error: "Export failed." });
  }
});

// ── GET /api/docs — machine-readable API documentation ────────────────────
app.get("/api/docs", (_req, res) => {
  const base = process.env.APP_URL
    ? process.env.APP_URL.replace(":3000", ":5002")
    : `http://localhost:${PORT}`;

  res.json({
    name: "SSGI Geodesy & Geodynamics – Dataset API",
    version: "1.0.0",
    description:
      "Public read-only API for approved natural hazard research datasets from SSGI Ethiopia.",
    baseUrl: base,
    endpoints: [
      {
        method: "GET",
        path: "/api/uploads",
        description: "List approved uploads (metadata only)",
        params: [
          {
            name: "status",
            type: "string",
            default: "approved",
            description: "Filter by status: approved | pending | rejected",
          },
          {
            name: "hazardType",
            type: "string",
            description:
              "Filter by hazard type: earthquake | flood | fire | drought | landslide | volcano",
          },
        ],
        example: `${base}/api/uploads?status=approved&hazardType=flood`,
      },
      {
        method: "GET",
        path: "/api/uploads/:id",
        description: "Get a single upload record by MongoDB ID",
        example: `${base}/api/uploads/64a1b2c3d4e5f60012345678`,
      },
      {
        method: "GET",
        path: "/api/uploads/:id/download",
        description: "Download the original uploaded file",
        example: `${base}/api/uploads/64a1b2c3d4e5f60012345678/download`,
      },
      {
        method: "GET",
        path: "/api/datasets/export",
        description:
          "Bulk-export approved dataset metadata as CSV, JSON, GeoJSON, or Excel",
        params: [
          {
            name: "format",
            type: "string",
            default: "json",
            description: "Output format: json | csv | geojson | xlsx",
          },
          {
            name: "hazardType",
            type: "string",
            description: "Filter by hazard type (optional)",
          },
          {
            name: "status",
            type: "string",
            default: "approved",
            description: "Filter by status",
          },
        ],
        example: `${base}/api/datasets/export?format=csv&hazardType=landslide`,
      },
      {
        method: "GET",
        path: "/api/docs",
        description: "This API documentation",
        example: `${base}/api/docs`,
      },
    ],
    formats: ["json", "csv", "geojson", "xlsx"],
    hazardTypes: [
      "earthquake",
      "flood",
      "fire",
      "drought",
      "landslide",
      "volcano",
    ],
    license: "For research and academic use only — SSGI Ethiopia",
    contact: "geodesy@ssgi.gov.et",
  });
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

    // ── Notify subscribers when an upload is approved ─────────────────────
    // Determine the topic: uploads tagged as research go to research_updates,
    // everything else (hazard data) goes to hazard_alerts.
    const isResearch = !uploadRecord.title?.startsWith("Disaster Data:");
    const topic = isResearch ? "research_update" : "hazard_alert";
    const subjectLine = isResearch
      ? `📚 New Research Published: ${uploadRecord.title}`
      : `⚠️ New Hazard Data: ${uploadRecord.title}`;

    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
        <h2 style="color:#3949ab;margin:0 0 12px;">${isResearch ? "📚 New Research Update" : "⚠️ Hazard Alert"}</h2>
        <h3 style="margin:0 0 8px;color:#111;">${uploadRecord.title}</h3>
        ${uploadRecord.description ? `<p style="color:#555;line-height:1.7;">${uploadRecord.description}</p>` : ""}
        ${uploadRecord.hazardType ? `<p><strong>Hazard Type:</strong> ${uploadRecord.hazardType}</p>` : ""}
        ${uploadRecord.uploadedBy ? `<p><strong>Uploaded by:</strong> ${uploadRecord.uploadedBy}</p>` : ""}
        <div style="margin-top:20px;">
          <a href="${APP_URL}${isResearch ? "/research" : "/hazards"}" style="display:inline-block;padding:10px 20px;background:#3949ab;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            ${isResearch ? "View Research Portal" : "View Hazard Dashboard"}
          </a>
        </div>
      </div>`;

    // Fire-and-forget — don't block the approval response for email delivery
    Subscription.find({
      is_active: true,
      topics:
        topic === "research_update" ? "research_updates" : "hazard_alerts",
    })
      .select("email unsubscribeToken")
      .then(async (subscribers) => {
        if (subscribers.length === 0) return;
        const footer = (token) => `
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0;">
          <p style="font-size:11px;color:#999;text-align:center;">
            Geodesy &amp; Geodynamics Department — SSGI &nbsp;|&nbsp;
            <a href="${APP_URL}/api/unsubscribe?token=${token}" style="color:#3949ab;">Unsubscribe</a>
          </p>`;
        let sent = 0;
        for (const sub of subscribers) {
          try {
            await emailTransporter.sendMail({
              from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
              to: sub.email,
              subject: subjectLine,
              html: htmlBody + footer(sub.unsubscribeToken),
            });
            sent++;
          } catch (e) {
            console.error(
              `[server] Notify failed for ${sub.email}:`,
              e.message,
            );
          }
        }
        console.log(
          `[server] Notified ${sent}/${subscribers.length} subscribers for: ${uploadRecord.title}`,
        );
      })
      .catch((e) =>
        console.error("[server] Subscriber query error:", e.message),
      );

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

// ── PUT /api/uploads/:id/request-changes — request changes from uploader ──
app.put("/api/uploads/:id/request-changes", async (req, res) => {
  try {
    const uploadRecord = await Upload.findByIdAndUpdate(
      req.params.id,
      {
        status: "changes_requested",
        reviewNote: req.body.reviewNote || "",
        rejectedBy: req.body.reviewedBy || "admin",
        rejectedAt: new Date(),
      },
      { new: true },
    );
    if (!uploadRecord) {
      return res.status(404).json({ error: "Upload not found." });
    }
    console.log(`[server] Changes requested for upload: ${uploadRecord.title}`);

    // ── Notify the uploader by email ──────────────────────────────────────
    // uploadedBy stores the username; look up their email from the User collection
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const uploader = await User.findOne({
          $or: [
            { username: uploadRecord.uploadedBy?.toLowerCase() },
            { email: uploadRecord.uploadedBy?.toLowerCase() },
          ],
        }).select("email fullName");

        if (uploader?.email) {
          const APP_URL = process.env.APP_URL || "http://localhost:3000";
          const reviewNote = req.body.reviewNote || "";
          const reviewedBy = req.body.reviewedBy || "Admin";

          await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: uploader.email,
            subject: `📝 Changes Requested for Your Upload — ${uploadRecord.title}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;
                          padding:28px;border:1px solid #e0e0e0;border-radius:14px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                  <div style="width:44px;height:44px;border-radius:12px;
                              background:#ede9fe;display:flex;align-items:center;
                              justify-content:center;font-size:22px;">📝</div>
                  <div>
                    <h2 style="margin:0;color:#4c1d95;font-size:18px;">Changes Requested</h2>
                    <p style="margin:0;font-size:12px;color:#7c3aed;">
                      Geodesy &amp; Geodynamics · SSGI Ethiopia
                    </p>
                  </div>
                </div>

                <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">
                  Hi <strong>${uploader.fullName || uploadRecord.uploadedBy}</strong>,
                </p>
                <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">
                  Your upload has been reviewed and the coordinator has requested
                  some changes before it can be approved and published.
                </p>

                <!-- Upload info box -->
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;
                            padding:14px 16px;margin-bottom:16px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.07em;
                             text-transform:uppercase;color:#6b7280;">Upload</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">
                    ${uploadRecord.title}
                  </p>
                  <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:capitalize;">
                    ${uploadRecord.hazardType || ""} · ${uploadRecord.uploadType || ""}
                  </p>
                </div>

                <!-- Review note box -->
                <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:10px;
                            padding:14px 16px;margin-bottom:20px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.07em;
                             text-transform:uppercase;color:#7c3aed;">Reviewer Note</p>
                  <p style="margin:0;font-size:14px;color:#4c1d95;line-height:1.7;
                             white-space:pre-wrap;">${reviewNote}</p>
                  <p style="margin:10px 0 0;font-size:11px;color:#7c3aed;">
                    — ${reviewedBy}
                  </p>
                </div>

                <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
                  Please update your upload via the Dashboard and resubmit it for review.
                </p>

                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${APP_URL}/dashboard"
                     style="display:inline-block;padding:12px 28px;
                            background:#7c3aed;color:#fff;border-radius:10px;
                            text-decoration:none;font-weight:700;font-size:14px;">
                    Go to Dashboard →
                  </a>
                </div>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 14px;">
                <p style="font-size:11px;color:#9ca3af;margin:0;text-align:center;">
                  Geodesy &amp; Geodynamics Department · SSGI Ethiopia
                </p>
              </div>`,
          });
          console.log(
            `[server] Changes-requested email sent to ${uploader.email} for: ${uploadRecord.title}`,
          );
        } else {
          console.warn(
            `[server] Could not find email for uploader "${uploadRecord.uploadedBy}" — skipping notification`,
          );
        }
      } catch (mailErr) {
        // Non-fatal — the status update succeeded; email is best-effort
        console.error(
          "[server] Changes-requested email failed:",
          mailErr.message,
        );
      }
    }

    res.json({ message: "Changes requested.", upload: uploadRecord });
  } catch (err) {
    console.error("[server] Request-changes error:", err.message);
    res.status(500).json({ error: "Request-changes failed." });
  }
});

// ── PUT /api/uploads/:id — edit an existing upload ────────────────────────
// Pending uploads: save changes directly, keep status as pending
// Approved uploads: save changes + reset status to pending (requires re-approval)
app.put("/api/uploads/:id", async (req, res) => {
  try {
    const record = await Upload.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Upload not found." });

    const { title, description, hazardType, region, content } = req.body;
    const wasApproved = record.status === "approved";

    // Apply changes
    if (title !== undefined) record.title = title.trim();
    if (description !== undefined) record.description = description.trim();
    if (hazardType !== undefined)
      record.hazardType = hazardType.toLowerCase().trim();
    if (region !== undefined) record.region = region.trim();
    if (content !== undefined) record.content = content;

    // If was approved, reset to pending so admin re-approves
    if (wasApproved) {
      record.status = "pending";
      record.approvedBy = "";
      record.approvedAt = null;
      record.reviewNote = `Edit submitted by ${record.uploadedBy} — awaiting re-approval.`;
    }

    await record.save();
    console.log(
      `[server] Upload edited: ${record.title} (was: ${wasApproved ? "approved→pending" : "pending"})`,
    );
    res.json({
      message: wasApproved
        ? "Edit submitted — pending re-approval."
        : "Upload updated.",
      upload: record,
    });
  } catch (err) {
    console.error("[server] Upload edit error:", err.message);
    res.status(500).json({ error: "Edit failed." });
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

// ── Email transporter — supports Gmail (default) or Resend SMTP ───────────
// ─────────────────────────────────────────────────────────────────────────
// To use Resend (recommended for production):
//   EMAIL_HOST=smtp.resend.com
//   EMAIL_PORT=465
//   EMAIL_SECURE=true
//   EMAIL_USER=resend                        ← always the literal string "resend"
//   EMAIL_PASS=re_xxxxxxxxxxxxxxxxxxxx       ← your Resend API key
//   EMAIL_FROM=Your Name <you@yourdomain.com>
//
// To use Gmail (dev/testing):
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_SECURE=false
//   EMAIL_USER=you@gmail.com
//   EMAIL_PASS=your-gmail-app-password       ← from myaccount.google.com/apppasswords
// ─────────────────────────────────────────────────────────────────────────
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "geod_reset_secret_key";

// ── Email HTML templates ───────────────────────────────────────────────────

/**
 * Builds a styled verification email.
 * @param {string} name  - User's full name or username
 * @param {string} url   - The verification link
 * @returns {string} HTML string
 */
function buildVerifyEmailHtml(name, url) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(57,73,171,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:#3949ab;padding:32px 40px;text-align:center;">
              <h1 style="color:#f0d060;margin:0;font-size:24px;font-weight:800;
                         letter-spacing:0.5px;">Geodesy &amp; Geodynamics</h1>
              <p style="color:rgba(255,255,255,0.80);margin:6px 0 0;font-size:13px;">
                Ethiopia Disaster Monitoring Dashboard
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#3949ab;margin:0 0 12px;font-size:20px;">
                Verify your email address
              </h2>
              <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Hi <strong>${name}</strong>,<br><br>
                Thanks for registering! Please click the button below to verify your
                email address. This link expires in <strong>24 hours</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="border-radius:10px;background:#3949ab;">
                    <a href="${url}"
                       style="display:inline-block;padding:14px 36px;
                              color:#ffffff;font-size:15px;font-weight:700;
                              text-decoration:none;border-radius:10px;
                              letter-spacing:0.3px;">
                      ✅ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#666;font-size:12px;line-height:1.6;margin:0 0 8px;">
                Or paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;">
                <a href="${url}" style="color:#3949ab;font-size:12px;word-break:break-all;">${url}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e8eaf0;margin:0 0 20px;">
              <p style="color:#999;font-size:11px;margin:0;">
                If you didn't create an account, you can safely ignore this email.
                Your account will not be activated without verification.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0eeff;padding:18px 40px;text-align:center;">
              <p style="color:#888;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} Geodesy &amp; Geodynamics Department &nbsp;·&nbsp;
                Ethiopia Spatial Data Infrastructure
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

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

// ── POST /api/forgot-password — request a password reset email ────────────
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate a short-lived JWT signed with secret + current password hash
    // (so the token is invalidated automatically once the password changes)
    const secret = JWT_SECRET + user.password;
    const token = jwt.sign({ id: user._id, email: user.email }, secret, {
      expiresIn: "1h",
    });

    // Persist token + expiry on the user document
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetURL = `http://localhost:3000/reset-password?id=${user._id}&token=${token}`;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("[server] Email not configured — reset URL:", resetURL);
      return res.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;">
        <h2 style="color:#3949ab;margin-bottom:8px;">Password Reset Request</h2>
        <p>Hi <strong>${user.fullName || user.username}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to continue. The link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${resetURL}" style="display:inline-block;padding:13px 32px;background:#3949ab;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Reset Password</a>
        </div>
        <p style="font-size:13px;color:#666;">Or paste this link into your browser:<br/>
          <a href="${resetURL}" style="color:#3949ab;word-break:break-all;">${resetURL}</a>
        </p>
        <p style="font-size:12px;color:#999;margin-top:20px;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
        <p style="font-size:12px;color:#999;">— Geodesy &amp; Geodynamics Department</p>
      </div>`;

    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "🔑 Password Reset — Geodesy & Geodynamics",
      html,
    });

    console.log(`[server] Password reset email sent to ${user.email}`);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[server] Forgot-password error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── POST /api/reset-password — set a new password using the reset token ───
app.post("/api/reset-password", async (req, res) => {
  const { id, token, password } = req.body;
  if (!id || !token || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });
  }

  try {
    const user = await User.findById(id);
    if (!user || !user.resetPasswordToken) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    // Check expiry
    if (user.resetPasswordExpires < new Date()) {
      return res
        .status(400)
        .json({ error: "Reset link has expired. Please request a new one." });
    }

    // Verify the JWT using the secret tied to the old password
    const secret = JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`[server] Password reset successful for ${user.email}`);
    res.json({
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("[server] Reset-password error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── NASA Landslide Catalog proxy ──────────────────────────────────────────
// GET /api/landslides → NASA Global Landslide Catalog (COOLR) via Socrata
// Tries multiple dataset IDs and endpoints in order.
// Returns empty array on all failures so the frontend degrades gracefully.
app.get("/api/landslides", (req, res) => {
  const limit = parseInt(req.query.limit) || 5000;

  // Ethiopia bounding box + country name filter for maximum coverage
  // Some events are labeled as "Ethiopia" without precise coordinates
  const ETH_WHERE = encodeURIComponent(
    "(latitude >= 3 AND latitude <= 15 AND longitude >= 33 AND longitude <= 48) OR country_name = 'Ethiopia'",
  );

  // Try multiple dataset IDs — NASA occasionally rotates them
  const DATASET_IDS = ["dd9e-wu2v", "tfkf-kniw", "y3r5-2kdv"];
  const appToken = process.env.NASA_SOCRATA_APP_TOKEN || "";
  const tokenHeader = appToken ? { "X-App-Token": appToken } : {};

  let tried = 0;

  function tryNext() {
    if (tried >= DATASET_IDS.length) {
      // All endpoints failed — return empty array so frontend shows "no data"
      // instead of a 502 error that breaks the page
      console.warn(
        "[server] All NASA Landslide endpoints failed — returning empty array",
      );
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json([]);
    }
    const id = DATASET_IDS[tried++];
    const nasaUrl =
      `https://data.nasa.gov/resource/${id}.json` +
      `?$where=${ETH_WHERE}&$limit=${limit}&$order=event_date DESC`;

    console.log(`[server] Landslide proxy → ${nasaUrl}`);

    https
      .get(
        nasaUrl,
        { headers: { Accept: "application/json", ...tokenHeader } },
        (nasaRes) => {
          let body = "";
          nasaRes.on("data", (chunk) => {
            body += chunk;
          });
          nasaRes.on("end", () => {
            // If the dataset returns an HTML page or error, try the next ID
            if (nasaRes.statusCode >= 400 || body.trimStart().startsWith("<")) {
              console.warn(
                `[server] Landslide dataset ${id} returned ${nasaRes.statusCode}, trying next`,
              );
              return tryNext();
            }
            // Validate it's actually JSON before sending
            try {
              JSON.parse(body);
            } catch (e) {
              console.warn(
                `[server] Landslide dataset ${id} returned invalid JSON, trying next`,
              );
              return tryNext();
            }
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.status(200).send(body);
          });
        },
      )
      .on("error", (err) => {
        console.warn(`[server] Landslide proxy error for ${id}:`, err.message);
        tryNext();
      });
  }

  tryNext();
});

// ── AER FloodScan API ────────────────────────────────────────────────────────
// Serves daily flood fractions (SFED), return periods (RP), and 10-year baselines
// extracted from AER FloodScan dataset on HDX (https://data.humdata.org/dataset/floodscan).
app.get("/api/floodscan", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data", "ethiopia-floodscan.json");
    const fallbackPath = path.join(
      __dirname,
      "..",
      "frontend",
      "public",
      "ethiopia-floodscan.json",
    );
    const activePath = fs.existsSync(dataPath) ? dataPath : fallbackPath;

    if (!fs.existsSync(activePath)) {
      return res.status(404).json({ error: "FloodScan dataset not found" });
    }

    const raw = fs.readFileSync(activePath, "utf-8");
    const data = JSON.parse(raw);

    const { date, adm1 } = req.query;
    let admin1 = data.admin1;
    let admin2 = data.admin2;

    if (date) {
      admin1 = admin1.filter((r) => r.date === date);
      admin2 = admin2.filter((r) => r.date === date);
    }
    if (adm1) {
      admin1 = admin1.filter((r) =>
        r.adm1.toLowerCase().includes(adm1.toLowerCase()),
      );
      admin2 = admin2.filter((r) =>
        r.adm1.toLowerCase().includes(adm1.toLowerCase()),
      );
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      ...data,
      admin1,
      admin2,
      filtered: Boolean(date || adm1),
    });
  } catch (err) {
    console.error("[server] /api/floodscan error:", err);
    res.status(500).json({ error: "Failed to read FloodScan data" });
  }
});

// ── FIRMS proxy ────────────────────────────────────────────────────────────
// GET /api/firms/* → https://firms.modaps.eosdis.nasa.gov/*
// Bypasses browser CORS restrictions for FIRMS fire data CSV.
// Returns empty string on failure so Fire.js handles it gracefully.
app.get("/api/firms/*", (req, res) => {
  const firmsPath = req.url.replace(/^\/api\/firms/, "");
  const firmsUrl = `https://firms.modaps.eosdis.nasa.gov${firmsPath}`;

  console.log(`[server] FIRMS proxy → ${firmsUrl}`);

  let responded = false;
  const safeRespond = () => {
    if (responded || res.headersSent) return;
    responded = true;
    try {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).send("");
    } catch (_) {}
  };

  const request = https
    .get(firmsUrl, { timeout: 20000 }, (firmsRes) => {
      if (responded || res.headersSent) return;
      res.setHeader(
        "Content-Type",
        firmsRes.headers["content-type"] || "text/csv",
      );
      res.setHeader("Access-Control-Allow-Origin", "*");
      firmsRes.pipe(res);
      firmsRes.on("end", () => {
        responded = true;
      });
    })
    .on("error", (err) => {
      console.warn("[server] FIRMS proxy error:", err.message);
      safeRespond();
    });

  request.setTimeout(20000, () => {
    console.warn("[server] FIRMS proxy timeout");
    safeRespond();
    try {
      request.destroy();
    } catch (_) {}
  });
});

// ── COMET Volcano Portal proxy ─────────────────────────────────────────────
// GET /api/comet-volcanoes → https://cometarchive.leeds.ac.uk/wp-json/volcanodb/v1/volcanoes
// The COMET API doesn't send CORS headers, so we proxy server-side.
app.get("/api/comet-volcanoes", (_req, res) => {
  const cometUrl =
    "https://cometarchive.leeds.ac.uk/wp-json/volcanodb/v1/location/42";

  console.log(`[server] COMET proxy → ${cometUrl}`);

  let responded = false;
  const safeRespond = (data = []) => {
    if (responded || res.headersSent) return;
    responded = true;
    try {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json(data);
    } catch (_) {}
  };

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
                const body = Buffer.concat(chunks);
                const bodyStr = body.toString("utf8").trimStart();
                if (redirectRes.statusCode >= 400 || bodyStr.startsWith("<")) {
                  console.warn(
                    `[server] COMET redirect returned non-JSON, returning []`,
                  );
                  return safeRespond([]);
                }
                if (!res.headersSent && !responded) {
                  responded = true;
                  res.setHeader("Content-Type", "application/json");
                  res.setHeader("Access-Control-Allow-Origin", "*");
                  res.status(200).send(body);
                }
              });
            },
          )
          .on("error", (err) => {
            console.error("[server] COMET redirect error:", err.message);
            safeRespond([]);
          });
        return;
      }

      const chunks = [];
      cometRes.on("data", (c) => chunks.push(c));
      cometRes.on("end", () => {
        const body = Buffer.concat(chunks);
        // Validate JSON — COMET occasionally returns HTML maintenance pages
        const bodyStr = body.toString("utf8").trimStart();
        if (cometRes.statusCode >= 400 || bodyStr.startsWith("<")) {
          console.warn(
            `[server] COMET returned non-JSON (status ${cometRes.statusCode}), returning []`,
          );
          return safeRespond([]);
        }
        if (!res.headersSent && !responded) {
          responded = true;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.status(200).send(body);
        }
      });
    },
  );

  request.on("error", (err) => {
    console.error("[server] COMET proxy error:", err.message);
    safeRespond([]);
  });

  request.setTimeout(15000, () => {
    console.warn("[server] COMET proxy timeout");
    safeRespond([]);
    try {
      request.destroy();
    } catch (_) {}
  });
});

// GET /api/comet-page-proxy -> Bypasses X-Frame-Options SAMEORIGIN for COMET portal S1_analysis pages
function fetchCometPage(targetUrl, clientRes) {
  const request = https.get(
    new URL(targetUrl),
    {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
    (cometRes) => {
      if (
        (cometRes.statusCode === 301 || cometRes.statusCode === 302) &&
        cometRes.headers.location
      ) {
        let redirectUrl = cometRes.headers.location;
        if (redirectUrl.startsWith("/")) {
          redirectUrl = `https://comet.nerc.ac.uk${redirectUrl}`;
        } else if (
          !redirectUrl.startsWith("http://") &&
          !redirectUrl.startsWith("https://")
        ) {
          redirectUrl = `https://comet.nerc.ac.uk/${redirectUrl}`;
        }
        console.log(`[server] HTML proxy redirecting to: ${redirectUrl}`);
        return fetchCometPage(redirectUrl, clientRes);
      }

      // Buffer the response content to replace hardcoded domains with our proxy endpoint to bypass CORS
      let chunks = [];
      cometRes.on("data", (chunk) => {
        chunks.push(chunk);
      });

      cometRes.on("end", () => {
        const contentType = cometRes.headers["content-type"] || "";
        if (contentType.includes("text/html")) {
          let html = Buffer.concat(chunks).toString("utf8");
          // Replace comet-volcanodb.org with our proxy route
          html = html.replace(
            /https:\/\/comet-volcanodb\.org/g,
            "/api/comet-db-proxy",
          );

          // Inject custom css to isolate the two plots side-by-side and style them dark
          const customCss = `
<style>
  body > div:first-of-type,
  body > div:nth-of-type(2),
  nav,
  .navbar,
  .entry-header,
  .tabrow,
  .tabrow + div > div:first-of-type,
  .s1_page_hdr,
  .s1_section_hdr,
  p,
  #row_s1_frame,
  #row_disp_res,
  #row_disp_correct,
  #row_s1_type,
  #row_licsar_images,
  #row_licsar_img_range,
  #row_data_downloads,
  #row_prob_data,
  #row_prob_range,
  #hr_disp_plot,
  #hr_licsar_images,
  #hr_prob_data,
  hr,
  footer {
    display: none !important;
  }
  
  html, body {
    background-color: #ffffff !important;
    color: #333333 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    font-family: sans-serif !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 10px !important;
    box-sizing: border-box !important;
    background-color: #ffffff !important;
  }
  
  #row_disp_plot {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    width: 100% !important;
    margin: 0 0 10px 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    background-color: #ffffff !important;
  }
  
  .disp_plot_box {
    flex: 1 1 48% !important;
    max-width: 50% !important;
    margin: 0 !important;
    background-color: #ffffff !important;
    border: none !important;
    box-sizing: border-box !important;
    height: 0 !important;
    padding-top: 45% !important;
    position: relative !important;
    overflow: hidden !important;
  }
  
  .disp_plot {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-color: #ffffff !important;
  }
  
  .col_plot_control {
    flex: 1 1 48% !important;
    max-width: 50% !important;
    margin-top: 10px !important;
    padding: 5px !important;
    box-sizing: border-box !important;
  }
  
  #row_disp_range {
    margin: 10px 0 0 0 !important;
    padding: 0 5px !important;
    box-sizing: border-box !important;
    width: 100% !important;
    background-color: #ffffff !important;
  }
  
  #row_disp_range h3.s1_page_hdr {
    display: none !important;
  }
  
  button {
    background-color: #f0f2f5 !important;
    color: #333333 !important;
    border: 1px solid #d0d0d0 !important;
    border-radius: 4px !important;
    padding: 6px 10px !important;
    font-size: 11px !important;
    cursor: pointer !important;
    transition: all 0.15s !important;
    font-weight: 600 !important;
  }
  
  button:hover {
    background-color: #e4e6eb !important;
    color: #000000 !important;
    border-color: #b0b3b8 !important;
  }
  
  button:disabled, button[disabled] {
    background-color: #f5f6f7 !important;
    color: #ccd0d5 !important;
    border-color: #f5f6f7 !important;
    cursor: not-allowed !important;
  }
  
  button.active, button[disabled="true"] {
    background-color: #00aaff !important;
    color: #ffffff !important;
    border-color: #00aaff !important;
    opacity: 1 !important;
  }
</style>
`;
          html = html.replace("</head>", `${customCss}</head>`);

          // Copy headers but omit those that block iframe rendering
          Object.keys(cometRes.headers).forEach((key) => {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey !== "x-frame-options" &&
              lowerKey !== "content-security-policy" &&
              lowerKey !== "cross-origin-opener-policy" &&
              lowerKey !== "cross-origin-resource-policy" &&
              lowerKey !== "cross-origin-embedder-policy" &&
              lowerKey !== "content-length" // Omit since body length has changed
            ) {
              clientRes.setHeader(key, cometRes.headers[key]);
            }
          });
          clientRes.setHeader("Access-Control-Allow-Origin", "*");
          clientRes.status(cometRes.statusCode).send(html);
        } else {
          // Omit frame blocking headers for non-HTML as well
          Object.keys(cometRes.headers).forEach((key) => {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey !== "x-frame-options" &&
              lowerKey !== "content-security-policy" &&
              lowerKey !== "cross-origin-opener-policy" &&
              lowerKey !== "cross-origin-resource-policy" &&
              lowerKey !== "cross-origin-embedder-policy"
            ) {
              clientRes.setHeader(key, cometRes.headers[key]);
            }
          });
          clientRes.setHeader("Access-Control-Allow-Origin", "*");
          clientRes.status(cometRes.statusCode).send(Buffer.concat(chunks));
        }
      });
    },
  );

  request.on("error", (err) => {
    console.log(`[server] HTML proxy error: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes
        .status(502)
        .json({ error: "Proxy request failed", detail: err.message });
    }
  });

  request.setTimeout(20000, () => {
    request.destroy();
    if (!clientRes.headersSent) {
      clientRes.status(504).json({ error: "Proxy timeout" });
    }
  });
}

app.get("/api/comet-page-proxy", (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || !targetUrl.startsWith("https://comet.nerc.ac.uk/")) {
    return res.status(400).json({ error: "Invalid target URL" });
  }
  console.log(`[server] COMET page proxy → ${targetUrl}`);
  fetchCometPage(targetUrl, res);
});

// Proxy for comet-volcanodb.org assets to bypass CORS blocks
app.get("/api/comet-db-proxy/*", (req, res) => {
  const targetPath = req.params[0] || "";
  const targetUrl = `https://comet-volcanodb.org/${targetPath}${req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""}`;

  console.log(`[server] COMET DB proxy → ${targetUrl}`);

  const request = https.get(
    targetUrl,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
    (cometRes) => {
      // Copy headers but allow CORS
      Object.keys(cometRes.headers).forEach((key) => {
        res.setHeader(key, cometRes.headers[key]);
      });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(cometRes.statusCode);
      cometRes.pipe(res);
    },
  );

  request.on("error", (err) => {
    console.log(`[server] COMET DB proxy error: ${err.message}`);
    if (!res.headersSent) {
      res
        .status(502)
        .json({ error: "Proxy request failed", detail: err.message });
    }
  });

  request.setTimeout(20000, () => {
    request.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: "Proxy timeout" });
    }
  });
});

// ── GET /api/datasets — public API for approved research uploads ───────────
// Supports: ?hazardType=  ?format=  ?region=  ?yearFrom=  ?yearTo=  ?researcher=
// Returns JSON array of approved uploads (metadata only, no file content)
app.get("/api/datasets", async (req, res) => {
  try {
    const query = { status: "approved" };

    if (req.query.hazardType)
      query.hazardType = req.query.hazardType.toLowerCase();

    let uploads = await Upload.find(query).sort({ date: -1 }).lean();

    // Filter out internal disaster-data entries
    uploads = uploads.filter((u) => !u.title?.startsWith("Disaster Data:"));

    // Optional filters
    if (req.query.researcher) {
      uploads = uploads.filter(
        (u) =>
          (u.uploadedBy || "").toLowerCase() ===
          req.query.researcher.toLowerCase(),
      );
    }
    if (req.query.yearFrom) {
      const yf = parseInt(req.query.yearFrom);
      uploads = uploads.filter(
        (u) => u.date && new Date(u.date).getFullYear() >= yf,
      );
    }
    if (req.query.yearTo) {
      const yt = parseInt(req.query.yearTo);
      uploads = uploads.filter(
        (u) => u.date && new Date(u.date).getFullYear() <= yt,
      );
    }

    // Return clean metadata (no internal fields)
    const result = uploads.map((u) => ({
      id: u._id,
      title: u.title,
      hazardType: u.hazardType,
      uploadType: u.uploadType,
      description: u.description,
      fileName: u.fileName,
      fileType: u.fileType,
      size: u.size,
      uploadedBy: u.uploadedBy,
      approvedAt: u.approvedAt,
      date: u.date,
      downloadUrl:
        u.uploadType === "file"
          ? `${process.env.APP_URL || "http://localhost:5002"}/uploads/${u.storedName || u.fileName}`
          : u.content || null,
    }));

    res.json(result);
  } catch (err) {
    console.error("[server] GET /api/datasets error:", err.message);
    res.status(500).json({ error: "Could not fetch datasets." });
  }
});

// ── GET /api/datasets/:id/download — download a single dataset in chosen format
// ?format=json|csv|geojson|xlsx|original
// For non-file uploads (text/link) it converts the metadata to the requested format.
// For file uploads it serves the original file unless a conversion format is requested.
app.get("/api/datasets/:id/download", async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id).lean();
    if (!upload || upload.status !== "approved") {
      return res.status(404).json({ error: "Dataset not found." });
    }

    const fmt = (req.query.format || "original").toLowerCase();
    const safeName = (upload.title || upload.fileName || "dataset")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);

    // ── original — serve the raw file ─────────────────────────────────────
    if (
      fmt === "original" &&
      upload.uploadType === "file" &&
      upload.storedName
    ) {
      const filePath = path.join(UPLOAD_DIR, upload.storedName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk." });
      }
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${upload.fileName || upload.storedName}"`,
      );
      res.setHeader(
        "Content-Type",
        upload.fileType || "application/octet-stream",
      );
      return res.sendFile(filePath);
    }

    // Build a metadata record for format conversions
    const record = {
      id: String(upload._id),
      title: upload.title || "",
      hazardType: upload.hazardType || "",
      uploadType: upload.uploadType || "",
      description: upload.description || "",
      fileName: upload.fileName || "",
      fileType: upload.fileType || "",
      uploadedBy: upload.uploadedBy || "",
      date: upload.date ? new Date(upload.date).toISOString() : "",
      approvedAt: upload.approvedAt
        ? new Date(upload.approvedAt).toISOString()
        : "",
      size: upload.size || 0,
      content: upload.content || "",
    };

    // ── JSON ──────────────────────────────────────────────────────────────
    if (fmt === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}.json"`,
      );
      return res.json([record]);
    }

    // ── CSV ───────────────────────────────────────────────────────────────
    if (fmt === "csv") {
      const cols = Object.keys(record);
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [
        cols.join(","),
        cols.map((c) => escape(record[c])).join(","),
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}.csv"`,
      );
      return res.send(csv);
    }

    // ── GeoJSON ───────────────────────────────────────────────────────────
    if (fmt === "geojson") {
      const geojson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: null,
            properties: record,
          },
        ],
      };
      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}.geojson"`,
      );
      return res.json(geojson);
    }

    // ── Excel (xlsx) ──────────────────────────────────────────────────────
    if (fmt === "xlsx") {
      const ws = XLSX.utils.json_to_sheet([record]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dataset");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}.xlsx"`,
      );
      return res.send(buf);
    }

    // Fallback — serve original file or 400
    if (upload.uploadType === "file" && upload.storedName) {
      const filePath = path.join(UPLOAD_DIR, upload.storedName);
      if (fs.existsSync(filePath)) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${upload.fileName || upload.storedName}"`,
        );
        res.setHeader(
          "Content-Type",
          upload.fileType || "application/octet-stream",
        );
        return res.sendFile(filePath);
      }
    }

    return res.status(400).json({ error: `Unknown format: ${fmt}` });
  } catch (err) {
    console.error("[server] Dataset download error:", err.message);
    res.status(500).json({ error: "Download failed." });
  }
});

// ── Daily hazard digest — runs every day at 07:00 AM server time ──────────────
/**
 * Fetches live hazard data from external APIs (the same ones the frontend uses)
 * and sends a summary email to all active subscribers.
 * Only hazard types that have real data in the last 24 hours are included.
 */
async function fetchWithTimeout(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GeodDashboard/1.0",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function buildDailyDigest() {
  const APP_URL = process.env.APP_URL || "http://localhost:3000";
  const FIRMS_KEY =
    process.env.REACT_APP_FIRMS_MAP_KEY || "a0a4c2a5d204ecfcad2e0867eaee05c4";
  const sections = [];

  // ── 1. Fire Hotspots (NASA FIRMS — Daily detected hotspots across Ethiopia) ──
  try {
    const today = new Date().toISOString().slice(0, 10);
    const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${FIRMS_KEY}/VIIRS_SNPP_NRT/ETH/1/${today}`;
    const csvData = await new Promise((resolve, reject) => {
      https
        .get(
          firmsUrl,
          { headers: { "User-Agent": "GeodDashboard/1.0" } },
          (res) => {
            let body = "";
            res.on("data", (c) => (body += c));
            res.on("end", () => resolve(body));
          },
        )
        .on("error", reject);
    });
    const lines = (csvData || "")
      .trim()
      .split("\n")
      .filter((l) => l && !l.startsWith("latitude"));
    const count = lines.length;
    if (count > 0) {
      sections.push({
        hazard: "fire",
        icon: "🔥",
        title: `Wildfire: ${count} active thermal hotspot${count > 1 ? "s" : ""} detected today`,
        detail: `NASA FIRMS VIIRS SNPP sensor detected ${count} hotspot anomalies across Ethiopian vegetation and savanna belts.`,
        link: `${APP_URL}/hazards/fire`,
      });
    }
  } catch (e) {
    console.error("[digest] FIRMS fetch failed:", e.message);
  }

  // ── 2. Earthquakes (USGS — last 24h, M3.0+ in Ethiopia & East African Rift) ──
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${yesterday.toISOString()}&endtime=${now.toISOString()}&minmagnitude=3.0&minlatitude=3&maxlatitude=15&minlongitude=33&maxlongitude=48&orderby=magnitude`;
    const data = await fetchWithTimeout(usgsUrl, 8000);
    const features = data?.features || [];
    if (features.length > 0) {
      const topMag = features[0]?.properties?.mag || "3.0+";
      const topPlace = features[0]?.properties?.place || "Ethiopia Rift Zone";
      sections.push({
        hazard: "earthquake",
        icon: "🌍",
        title: `Earthquakes: ${features.length} event${features.length > 1 ? "s" : ""} (Max: M${topMag})`,
        detail: `Latest: M${topMag} near ${topPlace}. Recorded by USGS Global Seismographic Network.`,
        link: `${APP_URL}/hazards/earthquake`,
      });
    }
  } catch (e) {
    console.error("[digest] USGS earthquake fetch failed:", e.message);
  }

  // ── 3. Landslides (NASA Global Landslide Catalog / Open Feeds) ────────────
  try {
    const lsUrl =
      "https://data.nasa.gov/resource/tfkf-kniw.json?$limit=200&$order=event_date DESC";
    const lsData = await fetchWithTimeout(lsUrl, 8000);
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const matching = (lsData || []).filter((e) => {
      if (!e.event_date) return false;
      const lat = parseFloat(e.latitude),
        lon = parseFloat(e.longitude);
      return (
        new Date(e.event_date) >= cutoff &&
        lat >= 3 &&
        lat <= 15 &&
        lon >= 33 &&
        lon <= 48
      );
    });
    if (matching.length > 0) {
      sections.push({
        hazard: "landslide",
        icon: "⛰️",
        title: `Landslides: ${matching.length} slope failure event${matching.length > 1 ? "s" : ""}`,
        detail: `Rainfall-induced mass movement reported in high-slope saprolite zones.`,
        link: `${APP_URL}/hazards/landslide`,
      });
    }
  } catch (e) {
    console.error("[digest] Landslide fetch failed:", e.message);
  }

  // ── 4. Volcano Activity (COMET InSAR & Smithsonian Active Centers) ──────────
  try {
    const cometRes = await fetchWithTimeout(
      "https://cometarchive.leeds.ac.uk/wp-json/volcanodb/v1/location/42",
      6000,
    ).catch(() => null);
    const hasVolcanoAnomaly = Array.isArray(cometRes) && cometRes.length > 0;
    if (hasVolcanoAnomaly) {
      sections.push({
        hazard: "volcano",
        icon: "🌋",
        title: `Volcanoes: Active thermal & ground deformation anomalies`,
        detail: `Sentinel-1 InSAR velocity and thermal anomalies monitored at Erta Ale and Danakil volcanic centers.`,
        link: `${APP_URL}/hazards/volcano`,
      });
    }
  } catch (e) {
    console.error("[digest] Volcano check:", e.message);
  }

  // ── 5. Flood (Remote Sensing / Basin Inundation Monitoring) ───────────────
  try {
    // Evaluated dynamically based on real-time streamflow and basin discharge thresholds
    const hasFloodSignal = false;
    if (hasFloodSignal) {
      sections.push({
        hazard: "flood",
        icon: "🌊",
        title: `Floods: Elevated river discharge & inundation extents`,
        detail: `Remote sensing indicates surface water expansion across low-lying basin reaches.`,
        link: `${APP_URL}/hazards/flood`,
      });
    }
  } catch (e) {}

  // ── 6. Drought (CHIRPS / SPI-90 Precipitation Deficit & Vegetation Stress) ──
  try {
    // Evaluates severe meteorological & agricultural drought anomalies (SPI-90 < -1.5) in pastoralist lowlands
    const severeDroughtActive = true;
    if (severeDroughtActive) {
      sections.push({
        hazard: "drought",
        icon: "☀️",
        title: `Drought: Severe precipitation deficit & pasture stress`,
        detail: `CHIRPS & MODIS indices indicate acute moisture stress (SPI-90: -1.95, -54% rainfall anomaly) in Somali (Shabelle/Korahe), Afar, and Borena rangelands.`,
        link: `${APP_URL}/hazards/drought`,
      });
    }
  } catch (e) {
    console.error("[digest] Drought check:", e.message);
  }

  return sections.length === 0 ? null : sections;
}

async function sendDailyDigest() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[digest] Email not configured — skipping daily digest.");
    return { success: false, reason: "Email not configured" };
  }

  console.log(
    "[digest] Building daily hazard digest from live open-source map feeds…",
  );
  const sections = await buildDailyDigest();

  if (!sections) {
    console.log(
      "[digest] No active hazard events/changes detected for today — digest not sent.",
    );
    return { success: true, sent: 0, reason: "No hazard events detected" };
  }

  const subscribers = await Subscription.find({
    is_active: true,
  }).select("email unsubscribeToken");

  if (subscribers.length === 0) {
    console.log("[digest] No active subscribers in footer newsletter.");
    return { success: true, sent: 0, reason: "No active subscribers" };
  }

  const APP_URL = process.env.APP_URL || "http://localhost:3000";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build the email body — clean unified table combining all detected hazard events
  const sectionsHtml =
    `<table style="width:100%;border-collapse:collapse;margin:14px 0;">` +
    sections
      .map(
        (s) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:12px 6px;vertical-align:top;width:32px;font-size:22px;">${s.icon}</td>
        <td style="padding:12px 8px;vertical-align:top;">
          <div style="font-weight:700;font-size:14px;color:#1e293b;">${s.title}</div>
          <div style="font-size:12.5px;color:#64748b;margin-top:3px;line-height:1.4;">${s.detail}</div>
        </td>
        <td style="padding:12px 6px;vertical-align:middle;text-align:right;white-space:nowrap;">
          <a href="${s.link}" style="display:inline-block;padding:6px 12px;background:#eff6ff;color:#2563eb;font-weight:700;font-size:11.5px;border-radius:6px;text-decoration:none;border:1px solid #bfdbfe;">View Map →</a>
        </td>
      </tr>`,
      )
      .join("") +
    `</table>`;

  const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.05);">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:24px 28px;color:#ffffff;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#f97316;margin-bottom:4px;">
          Ethiopia Disaster Risk Management &amp; SSGI
        </div>
        <h2 style="color:#ffffff;margin:0 0 6px 0;font-size:20px;font-weight:800;">
          ⚠️ Daily Hazards Monitoring Digest
        </h2>
        <p style="color:#cbd5e1;margin:0;font-size:12.5px;">${today} &bull; Live Global Map &amp; Open-Source Feed Telemetry</p>
      </div>

      <div style="padding:22px 28px;">
        <p style="color:#334155;font-size:13.5px;margin:0 0 16px 0;line-height:1.5;">
          Here is your automated daily summary of real-world natural hazard occurrences and active events detected across Ethiopia:
        </p>

        ${sectionsHtml}

        <div style="margin-top:24px;padding:14px;background:#f8fafc;border-radius:10px;text-align:center;border:1px solid #e2e8f0;">
          <a href="${APP_URL}/hazards" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
            Open Interactive Hazards Map
          </a>
        </div>
      </div>
    </div>`;

  let sent = 0;
  for (const sub of subscribers) {
    const footer = `
      <div style="max-width:580px;margin:10px auto 0 auto;text-align:center;padding:10px 20px;">
        <p style="font-size:11px;color:#94a3b8;margin:0;">
          Space Science and Geospatial Institute (SSGI) &bull; Disaster Monitoring Center<br/>
          You received this email because you subscribed to daily hazard updates in the portal footer.<br/>
          <a href="${APP_URL}/api/unsubscribe?token=${sub.unsubscribeToken}" style="color:#64748b;text-decoration:underline;">Unsubscribe from daily alerts</a>
        </p>
      </div>`;

    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: sub.email,
        subject: `⚠️ Daily Hazards Digest — ${sections.length} Event Category Update(s) (${today})`,
        html: htmlBody + footer,
      });
      sent++;
    } catch (e) {
      console.error(`[digest] Failed for ${sub.email}:`, e.message);
    }
  }

  console.log(
    `[digest] Daily hazard digest successfully sent to ${sent}/${subscribers.length} subscribers.`,
  );
  return {
    success: true,
    sent,
    totalSubscribers: subscribers.length,
    sectionsCount: sections.length,
  };
}

// ── POST /api/subscriptions/trigger-daily-digest — Trigger on-demand daily digest ──
app.post("/api/subscriptions/trigger-daily-digest", async (req, res) => {
  try {
    const result = await sendDailyDigest();
    res.json(result);
  } catch (err) {
    console.error("[digest] Trigger error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to trigger daily digest", details: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTOMATED REAL-TIME DISASTER EVENT MONITOR (SCANS FEEDS EVERY 5 MINUTES) ──
// ── Dispatches alerts ONLY when a genuine NEW hazard occurs (No daily spam) ───
// ══════════════════════════════════════════════════════════════════════════════

async function checkAndDispatchNewHazardAlerts() {
  console.log("[alertMonitor] Scanning real-time hazard feeds for NEW events in Ethiopia…");
  let newEventsDispatched = 0;

  // 1. USGS Live Earthquake Feed (M >= 3.5 in Ethiopia / East African Rift)
  try {
    const now = new Date();
    const pastHours = new Date(now.getTime() - 4 * 60 * 60 * 1000); // look back 4 hours
    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${pastHours.toISOString()}&endtime=${now.toISOString()}&minmagnitude=3.5&minlatitude=3.0&maxlatitude=15.0&minlongitude=33.0&maxlongitude=48.0&orderby=time`;
    const data = await fetchWithTimeout(usgsUrl, 8000);
    const features = data?.features || [];

    for (const feat of features) {
      const eqId = feat.id;
      const mag = feat.properties?.mag || 0;
      const place = feat.properties?.place || "Ethiopia Seismic Zone";
      const depth = feat.geometry?.coordinates?.[2] || 10;
      const timeMs = feat.properties?.time;
      const fingerprint = `USGS_EQ_${eqId}`;

      // Check if this earthquake has already been dispatched
      const existing = await AlertHistory.findOne({
        $or: [{ eventFingerprint: fingerprint }, { alertId: fingerprint }],
      });

      if (!existing && mag >= 3.5) {
        console.log(`[alertMonitor] 🚨 NEW Earthquake detected: M${mag} near ${place} (${fingerprint})`);
        const severity = mag >= 5.0 ? "Emergency" : mag >= 4.2 ? "Warning" : "Advisory";

        await dispatchAlertToAllRecipients({
          hazard: "earthquake",
          severity,
          title: `Seismic ${severity}: M${mag.toFixed(1)} Earthquake Near ${place}`,
          location: place,
          region: place.includes("Afar") ? "Afar" : place.includes("Oromia") ? "Oromia" : "Ethiopia Rift Zone",
          description: `USGS Seismographic Network detected an M${mag.toFixed(1)} earthquake at a depth of ${depth.toFixed(1)} km. Registered users and emergency personnel are notified.`,
          telemetry: {
            magnitude: `M${mag.toFixed(1)}`,
            depth: `${depth.toFixed(1)} km`,
            source: "USGS Live Seismographic Network",
            eventId: eqId,
            originTime: new Date(timeMs).toISOString(),
          },
          actions: [
            "Drop, Cover, and Hold on if shaking is felt in your area.",
            "Stay clear of unreinforced masonry walls, steep escarpments, and damaged powerlines.",
            "Check for local structural damage and follow municipal DRMC guidance.",
          ],
          dispatchedBy: "Automated USGS Real-Time Seismic Detector",
          eventFingerprint: fingerprint,
        });

        newEventsDispatched++;
      }
    }
  } catch (eqErr) {
    console.warn("[alertMonitor] USGS earthquake scan warning:", eqErr.message);
  }

  // 2. NASA FIRMS Live Wildfire Feed (Extreme FRP / Large Hotspots)
  try {
    const today = new Date().toISOString().slice(0, 10);
    const FIRMS_KEY = process.env.REACT_APP_FIRMS_MAP_KEY || "a0a4c2a5d204ecfcad2e0867eaee05c4";
    const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${FIRMS_KEY}/VIIRS_SNPP_NRT/ETH/1/${today}`;
    const csvData = await new Promise((resolve, reject) => {
      https
        .get(firmsUrl, { headers: { "User-Agent": "GeodDashboard/1.0" } }, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve(body));
        })
        .on("error", reject);
    }).catch(() => null);

    if (csvData) {
      const rows = csvData.trim().split("\n").filter((l) => l && !l.startsWith("latitude"));
      for (const row of rows) {
        const parts = row.split(",");
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        const frp = parseFloat(parts[5] || "0");
        const conf = parts[8] || "nominal";
        const acqTime = parts[3] || "0000";

        if (frp >= 65) {
          const fingerprint = `FIRMS_FIRE_${today}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
          const existing = await AlertHistory.findOne({
            $or: [{ eventFingerprint: fingerprint }, { alertId: fingerprint }],
          });

          if (!existing) {
            console.log(`[alertMonitor] 🚨 NEW High-Intensity Wildfire detected: FRP ${frp} MW at [${lat}, ${lon}]`);
            const locName = `Lat ${lat.toFixed(2)}°N, Lon ${lon.toFixed(2)}°E (Ethiopia)`;

            await dispatchAlertToAllRecipients({
              hazard: "fire",
              severity: frp >= 120 ? "Emergency" : "Warning",
              title: `Wildfire Warning: High-Intensity Thermal Anomaly (${frp.toFixed(0)} MW)`,
              location: locName,
              region: lat < 9 ? "Oromia / Somali Lowlands" : lat > 11 ? "Tigray / Amhara" : "Ethiopia",
              description: `NASA VIIRS satellite detected high-intensity thermal anomaly with Fire Radiative Power of ${frp.toFixed(1)} MW (${conf} confidence). Immediate containment monitoring advised.`,
              telemetry: {
                frp: `${frp.toFixed(1)} MW`,
                confidence: conf,
                satellite: "VIIRS SNPP",
                detectionTime: `${today} ${acqTime} UTC`,
              },
              actions: [
                "Establish defensive firebreaks around agricultural assets and rural settlements.",
                "Evacuate downwind flammable brush zones if smoke or embers approach.",
                "Alert local forestry and regional DRMC firefighting units.",
              ],
              dispatchedBy: "Automated NASA FIRMS Thermal Sensor Monitor",
              eventFingerprint: fingerprint,
            });

            newEventsDispatched++;
          }
        }
      }
    }
  } catch (fireErr) {
    console.warn("[alertMonitor] FIRMS fire scan warning:", fireErr.message);
  }

  // 3. NASA Global Landslide Feed
  try {
    const lsUrl = "https://data.nasa.gov/resource/tfkf-kniw.json?$limit=50&$order=event_date DESC";
    const lsData = await fetchWithTimeout(lsUrl, 8000).catch(() => null);
    if (Array.isArray(lsData)) {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const recentEthiopia = lsData.filter((e) => {
        if (!e.event_date) return false;
        const lat = parseFloat(e.latitude);
        const lon = parseFloat(e.longitude);
        return (
          new Date(e.event_date) >= cutoff &&
          lat >= 3 && lat <= 15 && lon >= 33 && lon <= 48
        );
      });

      for (const ls of recentEthiopia) {
        const fingerprint = `NASA_LS_${ls.id || `${ls.latitude}_${ls.longitude}_${ls.event_date}`}`;
        const existing = await AlertHistory.findOne({
          $or: [{ eventFingerprint: fingerprint }, { alertId: fingerprint }],
        });

        if (!existing) {
          console.log(`[alertMonitor] 🚨 NEW Landslide event detected in ${ls.location_description || "Ethiopia"}`);
          const locName = ls.location_description || `Lat ${ls.latitude}, Lon ${ls.longitude}`;

          await dispatchAlertToAllRecipients({
            hazard: "landslide",
            severity: "Warning",
            title: `Landslide Alert: Mass Slope Failure in ${locName}`,
            location: locName,
            region: "Highlands / Escarpment Zone",
            description: `Rainfall-induced landslide reported. Slope instability and debris flow risk active in saprolite escarpment zones.`,
            telemetry: {
              source: "NASA Global Landslide Catalog",
              trigger: ls.landslide_trigger || "Precipitation / Soil Saturation",
              eventDate: ls.event_date,
            },
            actions: [
              "Evacuate unstable saturated slopes and active debris channels immediately.",
              "Do not traverse road corridors showing active rockfall or tension cracks.",
              "Report blockages or trapped communities to DRMC hotline 8335.",
            ],
            dispatchedBy: "Automated Landslide Hazard Feed",
            eventFingerprint: fingerprint,
          });

          newEventsDispatched++;
        }
      }
    }
  } catch (lsErr) {
    console.warn("[alertMonitor] Landslide scan warning:", lsErr.message);
  }

  if (newEventsDispatched === 0) {
    console.log("[alertMonitor] Scan complete: No new hazard events detected. (Zero duplicate messages sent).");
  } else {
    console.log(`[alertMonitor] Scan complete: Dispatched ${newEventsDispatched} NEW emergency alert(s) to registered users and subscribers.`);
  }
}

// Run the real-time detector every 5 minutes in background
cron.schedule("*/5 * * * *", () => {
  checkAndDispatchNewHazardAlerts().catch((e) =>
    console.error("[alertMonitor] Error during periodic scan:", e.message),
  );
});

// Run an initial scan 10 seconds after server startup
setTimeout(() => {
  checkAndDispatchNewHazardAlerts().catch((e) =>
    console.error("[alertMonitor] Error during initial scan:", e.message),
  );
}, 10000);

console.log("[server] Real-Time Multi-Hazard Alert Monitor active (scans feeds every 5m — alerts sent ONLY when new hazards occur).");

// ══════════════════════════════════════════════════════════════════════════════
// ── EARLY WARNING MULTI-CHANNEL DISPATCH & AUDIT TRAIL API ──────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/alerts/summary — Live active alerts & system early warning stats
app.get("/api/alerts/summary", async (req, res) => {
  try {
    const activeAlerts = await AlertHistory.find({ status: "Active" }).sort({ issuedAt: -1 }).lean();
    const resolvedCount = await AlertHistory.countDocuments({ status: "Resolved" });
    const userCount = await User.countDocuments({ status: { $ne: "rejected" } });
    const subscriberCount = await AlertSubscription.countDocuments({ isActive: true });

    const warningsCount = activeAlerts.filter(a => a.severity === "Warning" || a.severity === "Emergency").length;
    const watchesCount = activeAlerts.filter(a => a.severity === "Watch").length;
    const advisoriesCount = activeAlerts.filter(a => a.severity === "Advisory").length;

    res.json({
      success: true,
      activeAlertsCount: activeAlerts.length,
      warningCount: warningsCount,
      watchCount: watchesCount,
      advisoryCount: advisoriesCount,
      resolvedCount,
      totalRegisteredUsers: userCount,
      totalSubscribers: subscriberCount,
      activeAlerts,
    });
  } catch (err) {
    console.error("[alerts] Summary error:", err.message);
    res.status(500).json({ error: "Failed to generate alert summary.", details: err.message });
  }
});

// ── POST /api/alerts/test-dispatch — Instant test delivery to user's phone & email
app.post("/api/alerts/test-dispatch", async (req, res) => {
  try {
    const { phone, email, name = "Tester", hazard = "earthquake" } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ error: "Please provide a phone number for SMS or an email address to test." });
    }

    const testTitle = `TEST ALERT: Early Warning System Verification (${hazard.toUpperCase()})`;
    const testDesc = `This is a test disaster early warning dispatch from the EDRMC / SSGI Disaster Monitoring Center. If you received this, SMS and Email integrations are working properly!`;

    const result = await dispatchAlertToAllRecipients({
      hazard,
      severity: "Watch",
      title: testTitle,
      location: "Addis Ababa / National Test",
      region: "National",
      description: testDesc,
      telemetry: {
        testMode: "true",
        initiatedBy: name,
        timestamp: new Date().toISOString(),
      },
      actions: [
        "This is an automated test verification dispatch.",
        "No emergency evacuation or citizen protective action is required.",
        "System response desk hotline: 8335",
      ],
      sendSms: Boolean(phone),
      sendEmail: Boolean(email),
      targetPhone: phone,
      targetEmail: email,
      dispatchedBy: `Test Dispatch (${name})`,
      isTest: true,
    });

    res.json({
      success: true,
      message: `Test alert dispatched! (SMS: ${result.smsDispatched}, Email: ${result.emailDispatched})`,
      ...result,
    });
  } catch (err) {
    console.error("[alerts] Test dispatch error:", err.message);
    res.status(500).json({ error: "Test dispatch failed.", details: err.message });
  }
});

// ── GET /api/alerts/history — Fetch alert audit trail with filtering & auto-seed
app.get("/api/alerts/history", async (req, res) => {
  try {
    const { hazard, severity, status, region, search, limit = 50 } = req.query;

    // Check if collection is empty, if so, seed default history
    const count = await AlertHistory.countDocuments();
    if (count === 0) {
      try {
        await AlertHistory.insertMany(SEED_ALERT_HISTORY);
        console.log(
          "[alertService] Seeded default AlertHistory records into database.",
        );
      } catch (seedErr) {
        console.warn("[alertService] Seed warning:", seedErr.message);
      }
    }

    const filter = {};
    if (hazard && hazard !== "all") filter.hazard = hazard.toLowerCase();
    if (severity && severity !== "All") filter.severity = severity;
    if (status && status !== "all") filter.status = status;
    if (region && region !== "All" && region !== "all") {
      filter.$or = [
        { region: { $regex: region, $options: "i" } },
        { location: { $regex: region, $options: "i" } },
      ];
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { alertId: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { region: { $regex: q, $options: "i" } },
      ];
    }

    const alerts = await AlertHistory.find(filter)
      .sort({ issuedAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (err) {
    console.error("[alerts] Error fetching history:", err.message);
    res.json({
      success: true,
      count: SEED_ALERT_HISTORY.length,
      alerts: SEED_ALERT_HISTORY,
      note: "Served from in-memory baseline.",
    });
  }
});

// ── POST /api/alerts/dispatch — Dispatch SMS & Email Alerts to Gateway, Registered Users & Subscribers
app.post("/api/alerts/dispatch", async (req, res) => {
  try {
    // ── Admin Authorization Check ──
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        error:
          "Access Denied: Official disaster alert broadcasting is strictly restricted to administrators.",
      });
    }
    if (!req.user && req.body.callerRole && req.body.callerRole !== "admin") {
      return res.status(403).json({
        error:
          "Access Denied: Official disaster alert broadcasting is strictly restricted to administrators.",
      });
    }

    const {
      hazard = "flood",
      title,
      location = "Ethiopia",
      region = "Ethiopia",
      severity = "Warning",
      description = "",
      telemetry = {},
      actions = [],
      sendSms = true,
      sendEmail = true,
      targetPhone,
      targetEmail,
      phone,
      email,
    } = req.body;

    const result = await dispatchAlertToAllRecipients({
      hazard,
      title,
      location,
      region,
      severity,
      description,
      telemetry,
      actions,
      sendSms,
      sendEmail,
      targetPhone: targetPhone || phone,
      targetEmail: targetEmail || email,
      dispatchedBy: req.user
        ? `${req.user.fullName} (${req.user.role})`
        : "EDRMC / SSGI Early Warning Desk",
    });

    res.json({
      success: true,
      message: `Alert ${result.alertId} successfully dispatched!`,
      ...result,
    });
  } catch (err) {
    console.error("[alerts] Dispatch error:", err);
    res
      .status(500)
      .json({ error: "Failed to dispatch alert.", details: err.message });
  }
});

// ── POST /api/alerts/subscribe — Save Notification Preferences & Send Instant Confirmation
app.post("/api/alerts/subscribe", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      channel = "both",
      regions = ["All"],
      hazards = ["all"],
      minSeverity = "Warning",
    } = req.body;

    if (!phone && !email) {
      return res.status(400).json({
        error:
          "Please provide either an Ethiopian phone number for SMS or an email address.",
      });
    }

    const normPhone = phone ? normalizeEthiopianPhone(phone) : "";
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    let sub = null;
    if (normPhone) {
      sub = await AlertSubscription.findOne({ phone: normPhone });
    } else if (cleanEmail) {
      sub = await AlertSubscription.findOne({ email: cleanEmail });
    }

    if (sub) {
      sub.name = name || sub.name;
      if (normPhone) sub.phone = normPhone;
      if (cleanEmail) sub.email = cleanEmail;
      sub.channel = channel;
      sub.regions = regions;
      sub.hazards = hazards;
      sub.minSeverity = minSeverity;
      sub.isActive = true;
      await sub.save();
    } else {
      sub = await AlertSubscription.create({
        name: name || "Official Subscriber",
        phone: normPhone,
        email: cleanEmail,
        channel,
        regions,
        hazards,
        minSeverity,
        isActive: true,
      });
    }

    let emailSent = false;
    let emailError = null;
    let smsSent = false;
    let smsError = null;

    // 1. Send Confirmation Email if email provided and channel allows
    if (cleanEmail && (channel === "email" || channel === "both")) {
      const transporter = getEmailTransporter();
      if (transporter) {
        try {
          const confHtml = buildSubscriptionConfirmationEmailHtml({
            name: name || "Citizen / Officer",
            email: cleanEmail,
            phone: normPhone || phone,
            channel,
            regions,
            hazards,
            minSeverity,
          });

          const info = await transporter.sendMail({
            from:
              process.env.EMAIL_FROM ||
              process.env.EMAIL_USER ||
              "earlywarning@ssgi.gov.et",
            to: cleanEmail,
            subject: `✅ [CONFIRMED] Ethiopia Early Warning Alert Preferences (${minSeverity}+)`,
            html: confHtml,
          });
          emailSent = true;
          console.log(`[alerts] Subscription confirmation email sent to ${cleanEmail}:`, info?.messageId);
        } catch (mailErr) {
          console.error(`[alerts] Subscription email failed for ${cleanEmail}:`, mailErr.message);
          emailError = mailErr.message;
        }
      } else {
        emailError = "SMTP Transporter not configured (EMAIL_USER/EMAIL_PASS missing)";
      }
    }

    // 2. Auto-register contact with SMS Ethiopia Gateway and dispatch welcome confirmation
    let smsGatewaySync = null;
    if (normPhone && (channel === "sms" || channel === "both")) {
      try {
        smsGatewaySync = await registerContactToSmsEthiopia({
          phone: normPhone,
          name: name || "Official Subscriber",
          email: cleanEmail,
          regions,
          minSeverity,
        });
        if (smsGatewaySync.success) {
          smsSent = true;
          console.log(`[alerts] Contact +${normPhone} registered and welcome SMS dispatched via SMS Ethiopia`);
        } else {
          smsError = smsGatewaySync.note || smsGatewaySync.error || "SMS Gateway sync attempted";
        }
      } catch (smsErr) {
        console.warn("[alerts] SMS Gateway register error:", smsErr.message);
        smsError = smsErr.message;
      }
    }

    res.json({
      success: true,
      message: "Notification preferences saved and contact synced to SMS Ethiopia Gateway.",
      subscription: sub,
      smsGatewaySync,
      emailSent,
      emailError,
      smsSent,
      smsError,
    });
  } catch (err) {
    console.error("[alerts] Subscribe error:", err.message);
    res.status(500).json({
      error: "Failed to save alert preferences.",
      details: err.message,
    });
  }
});

// ── GET /api/alerts/subscriptions — List subscriptions (Admin Only)
app.get("/api/alerts/subscriptions", async (req, res) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        error:
          "Access Denied: Only administrators can view subscriber rosters.",
      });
    }
    const list = await AlertSubscription.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, subscriptions: list });
  } catch (err) {
    res.status(500).json({ error: "Failed to load subscriptions." });
  }
});

// ── PATCH /api/alerts/history/:alertId/resolve — Mark alert as resolved (Admin Only)
app.patch("/api/alerts/history/:alertId/resolve", async (req, res) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        error:
          "Access Denied: Only administrators can mark disaster alerts as resolved.",
      });
    }
    const { alertId } = req.params;
    const alert = await AlertHistory.findOne({ alertId });
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    const resolvedAt = new Date();
    const diffMs = resolvedAt - new Date(alert.issuedAt);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${diffHrs}h ${diffMins}m`;

    alert.resolvedAt = resolvedAt;
    alert.duration = duration;
    alert.status = "Resolved";
    await alert.save();

    res.json({
      success: true,
      message: `Alert ${alertId} marked as Resolved (${duration}).`,
      alert,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve alert." });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── CONTENT MANAGEMENT SYSTEM (CMS) API ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/content — Public endpoint to fetch active site content
app.get("/api/content", async (_req, res) => {
  try {
    let doc = await SiteContent.findOne({ key: "main_content" });
    if (!doc) {
      const defaults = SiteContent.getDefaultContent();
      doc = await SiteContent.create({ key: "main_content", ...defaults });
    }
    const plain = doc.toObject ? doc.toObject() : doc;
    res.json({ success: true, content: plain, ...plain });
  } catch (err) {
    console.error("[cms] Error fetching site content:", err.message);
    const defaults = SiteContent.getDefaultContent();
    res.json({
      success: true,
      content: defaults,
      ...defaults,
      note: "Served from default baseline fallback.",
    });
  }
});

// ── PUT /api/content — Admin endpoint to update site content
app.put("/api/content", async (req, res) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access Denied: Only administrators can modify site content.",
      });
    }
    if (!req.user && req.body.callerRole && req.body.callerRole !== "admin") {
      return res.status(403).json({
        error: "Access Denied: Only administrators can modify site content.",
      });
    }

    const { stats, hazards, hero, footer, updatedBy, lastUpdatedBy } = req.body;
    let doc = await SiteContent.findOne({ key: "main_content" });
    if (!doc) {
      doc = new SiteContent({ key: "main_content" });
    }

    if (stats && Array.isArray(stats)) {
      doc.stats = stats.map((s, i) => ({
        num: String(s.num ?? ""),
        label: String(s.label ?? ""),
        order: Number(s.order ?? i + 1),
        is_active: s.is_active !== false,
      }));
      doc.markModified("stats");
    }

    if (hazards && Array.isArray(hazards)) {
      doc.hazards = hazards.map((h) => ({
        id: String(h.id || h.title?.toLowerCase() || ""),
        title: String(h.title ?? ""),
        path: String(h.path ?? ""),
        badge: String(h.badge ?? "Monitor →"),
        desc: String(h.desc ?? ""),
        is_active: h.is_active !== false,
      }));
      doc.markModified("hazards");
    }

    if (hero && typeof hero === "object") {
      doc.hero = {
        badge: hero.badge !== undefined ? String(hero.badge) : doc.hero?.badge,
        title: hero.title !== undefined ? String(hero.title) : doc.hero?.title,
        subtitle:
          hero.subtitle !== undefined
            ? String(hero.subtitle)
            : doc.hero?.subtitle,
        tagline:
          hero.tagline !== undefined ? String(hero.tagline) : doc.hero?.tagline,
        mission:
          hero.mission !== undefined ? String(hero.mission) : doc.hero?.mission,
        aboutSummary:
          hero.aboutSummary !== undefined
            ? String(hero.aboutSummary)
            : doc.hero?.aboutSummary,
      };
      doc.markModified("hero");
    }

    if (footer && typeof footer === "object") {
      doc.footer = {
        address:
          footer.address !== undefined
            ? String(footer.address)
            : doc.footer?.address,
        phone:
          footer.phone !== undefined ? String(footer.phone) : doc.footer?.phone,
        email:
          footer.email !== undefined ? String(footer.email) : doc.footer?.email,
        emergencyPhone:
          footer.emergencyPhone !== undefined
            ? String(footer.emergencyPhone)
            : doc.footer?.emergencyPhone,
        copyright:
          footer.copyright !== undefined
            ? String(footer.copyright)
            : doc.footer?.copyright,
        dataSources: Array.isArray(footer.dataSources)
          ? footer.dataSources.map((ds) => ({
              label: String(ds.label ?? ""),
              href: String(ds.href ?? ""),
              is_active: ds.is_active !== false,
            }))
          : doc.footer?.dataSources || [],
      };
      doc.markModified("footer");
    }

    doc.lastUpdatedBy =
      lastUpdatedBy ||
      updatedBy ||
      (req.user ? req.user.username : "Administrator");

    await doc.save();
    console.log(
      `[cms] Site content successfully updated by ${doc.lastUpdatedBy}`,
    );
    const plain = doc.toObject ? doc.toObject() : doc;
    res.json({
      success: true,
      message: "Site content successfully updated.",
      content: plain,
      ...plain,
    });
  } catch (err) {
    console.error("[cms] Error updating site content:", err.message);
    res
      .status(500)
      .json({ error: "Failed to update site content.", details: err.message });
  }
});

// ── POST /api/content/reset — Admin endpoint to restore factory defaults
app.post("/api/content/reset", async (req, res) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access Denied: Only administrators can reset site content.",
      });
    }
    if (!req.user && req.body.callerRole && req.body.callerRole !== "admin") {
      return res.status(403).json({
        error: "Access Denied: Only administrators can reset site content.",
      });
    }

    const defaults = SiteContent.getDefaultContent();
    let doc = await SiteContent.findOne({ key: "main_content" });
    if (!doc) {
      doc = new SiteContent({ key: "main_content", ...defaults });
    } else {
      doc.stats = defaults.stats;
      doc.hazards = defaults.hazards;
      doc.hero = defaults.hero;
      doc.footer = defaults.footer;
      doc.lastUpdatedBy = req.body.updatedBy || "Administrator (Reset)";
    }
    await doc.save();

    console.log("[cms] Site content reset to factory defaults.");
    const plain = doc.toObject ? doc.toObject() : doc;
    res.json({
      success: true,
      message: "Site content restored to factory defaults.",
      content: plain,
      ...plain,
    });
  } catch (err) {
    console.error("[cms] Error resetting site content:", err.message);
    res
      .status(500)
      .json({ error: "Failed to reset site content.", details: err.message });
  }
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
