/**
 * models/RememberToken.js
 *
 * Stores SHA-256 hashes of "Remember Me" tokens mapped to a userId.
 * The raw token is NEVER stored — only the hash — so a database breach
 * cannot be used to replay stolen tokens.
 *
 * MongoDB TTL index automatically deletes expired documents, so there is
 * no need for a manual cleanup job.
 */

const mongoose = require("mongoose");

const rememberTokenSchema = new mongoose.Schema({
  // Which user this token belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // SHA-256 hash of the raw token sent to the client.
  // Indexed for fast lookup on every authenticated request.
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },

  // Absolute expiry date. Also drives the TTL index below.
  expiresAt: {
    type: Date,
    required: true,
  },
});

// ── MongoDB TTL index ──────────────────────────────────────────────────────
// MongoDB will automatically remove documents when `expiresAt` is reached.
// The `expireAfterSeconds: 0` means "expire exactly at the date stored in
// the field" rather than N seconds after document creation.
rememberTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RememberToken", rememberTokenSchema);
