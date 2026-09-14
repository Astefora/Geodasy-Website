/**
 * models/Subscription.js
 *
 * Stores newsletter / hazard-alert subscribers.
 * is_active = false means the subscriber has unsubscribed.
 */
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // prevents duplicates at DB level
      trim: true,
      lowercase: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    topics: {
      type: [String],
      default: ["hazard_alerts", "research_updates"],
    },
    // Token used for one-click unsubscribe links in emails
    unsubscribeToken: {
      type: String,
      default: () => require("crypto").randomBytes(24).toString("hex"),
    },
  },
  { timestamps: true }, // adds createdAt + updatedAt automatically
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
