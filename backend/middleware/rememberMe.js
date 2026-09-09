/**
 * middleware/rememberMe.js
 *
 * Express middleware that handles persistent "Remember Me" authentication.
 *
 * Flow:
 *  1. Check if the request already carries a valid session user — if so, skip.
 *  2. Check for the `rememberToken` HTTP-only cookie.
 *  3. Hash the cookie value with SHA-256 and look it up in MongoDB.
 *  4. If found and not expired, attach the user to `req.user`.
 *  5. ROTATE the token: delete the old DB record + cookie, issue a fresh
 *     token so the old one can never be replayed (prevents theft exploitation).
 *
 * This middleware should be mounted BEFORE any protected routes but AFTER
 * cookie-parser, e.g.:
 *
 *   app.use(cookieParser());
 *   app.use(rememberMeMiddleware);
 */

const crypto = require("crypto");
const RememberToken = require("../models/RememberToken");
const User = require("../models/User");

// ── Constants ──────────────────────────────────────────────────────────────
const COOKIE_NAME = "rememberToken";
const TOKEN_BYTES = 64; // 64 random bytes = 128-char hex string
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// ── Helper: build cookie options ───────────────────────────────────────────
function cookieOptions() {
  return {
    httpOnly: true, // not accessible via JS
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // blocks CSRF from third-party origins
    maxAge: MAX_AGE_MS,
    path: "/",
  };
}

// ── Helper: hash a raw token ────────────────────────────────────────────────
function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ── Helper: issue a brand-new remember-me token ────────────────────────────
async function issueRememberToken(res, userId) {
  // 1. Generate cryptographically secure random bytes
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");

  // 2. Only store the hash in the database
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + MAX_AGE_MS);

  await RememberToken.create({ userId, tokenHash, expiresAt });

  // 3. Send the raw token to the client in a secure, HTTP-only cookie
  res.cookie(COOKIE_NAME, rawToken, cookieOptions());

  return rawToken; // returned only for logging — never stored raw
}

// ── Helper: revoke a remember-me token ────────────────────────────────────
async function revokeRememberToken(req, res) {
  const rawToken = req.cookies?.[COOKIE_NAME];

  if (rawToken) {
    // Remove the hashed record from MongoDB
    const tokenHash = hashToken(rawToken);
    await RememberToken.deleteOne({ tokenHash }).catch(() => {}); // non-fatal
  }

  // Clear the cookie on the client regardless
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// ── Middleware ─────────────────────────────────────────────────────────────
async function rememberMeMiddleware(req, res, next) {
  // Skip if we already have a session user attached
  if (req.user) return next();

  const rawToken = req.cookies?.[COOKIE_NAME];
  if (!rawToken) return next();

  try {
    const tokenHash = hashToken(rawToken);

    // Find the token record — TTL index may have already deleted it if expired
    const record = await RememberToken.findOne({ tokenHash });

    if (!record) {
      // Token not found or already expired/rotated — clear the stale cookie
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return next();
    }

    // Double-check expiry in code (belt-and-suspenders; TTL index is async)
    if (record.expiresAt < new Date()) {
      await RememberToken.deleteOne({ _id: record._id });
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return next();
    }

    // Load the associated user
    const user = await User.findById(record.userId).select("-password");

    if (!user || user.status !== "approved") {
      // User was deleted or de-approved — revoke their persistent token
      await RememberToken.deleteOne({ _id: record._id });
      res.clearCookie(COOKIE_NAME, { path: "/" });
      return next();
    }

    // ── TOKEN ROTATION ────────────────────────────────────────────────────
    // Delete the old token record and issue a fresh one.
    // This ensures a stolen cookie cannot be replayed after the next
    // legitimate use because the old hash no longer exists in the database.
    await RememberToken.deleteOne({ _id: record._id });
    await issueRememberToken(res, user._id);

    // Attach the user to the request so downstream handlers can use it
    req.user = user;
    console.log(
      `[rememberMe] Restored session for ${user.email} (token rotated)`,
    );
  } catch (err) {
    // Middleware errors must not crash the server — log and continue
    console.error("[rememberMe] Middleware error:", err.message);
  }

  return next();
}

module.exports = {
  rememberMeMiddleware,
  issueRememberToken,
  revokeRememberToken,
  cookieOptions,
  COOKIE_NAME,
};
