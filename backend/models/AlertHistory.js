const mongoose = require("mongoose");

const alertHistorySchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true, trim: true },
    hazard: {
      type: String,
      required: true,
      enum: ["flood", "fire", "earthquake", "landslide", "drought", "volcano"],
      lowercase: true,
    },
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    region: { type: String, default: "Ethiopia", trim: true },
    severity: {
      type: String,
      required: true,
      enum: ["Advisory", "Watch", "Warning", "Emergency"],
      default: "Warning",
    },
    issuedAt: { type: Date, required: true, default: Date.now },
    resolvedAt: { type: Date, default: null },
    duration: { type: String, default: "Ongoing" },
    status: {
      type: String,
      enum: ["Active", "Resolved", "Escalated", "Monitored"],
      default: "Active",
    },
    description: { type: String, default: "", trim: true },
    telemetry: { type: mongoose.Schema.Types.Mixed, default: {} },
    dispatchedSmsCount: { type: Number, default: 0 },
    dispatchedEmailCount: { type: Number, default: 0 },
    dispatchedBy: { type: String, default: "EDRMC / SSGI Early Warning Desk" },
    eventFingerprint: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlertHistory", alertHistorySchema);
