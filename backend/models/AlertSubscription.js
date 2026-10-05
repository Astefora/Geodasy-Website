const mongoose = require("mongoose");

const alertSubscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Official Contact", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    channel: {
      type: String,
      enum: ["both", "sms", "email"],
      default: "both",
    },
    regions: {
      type: [String],
      default: ["All"],
    },
    hazards: {
      type: [String],
      default: ["all"],
    },
    minSeverity: {
      type: String,
      enum: ["Advisory", "Watch", "Warning", "Emergency"],
      default: "Warning",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlertSubscription", alertSubscriptionSchema);
