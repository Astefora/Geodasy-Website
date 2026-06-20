/**
 * models/Upload.js
 * Mongoose schema for uploaded research files.
 * Collection: uploads (default Mongoose pluralisation)
 */

const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    // Display title shown in the Research portal
    title: { type: String, required: true, trim: true },

    // Hazard category: earthquake | flood | fire | drought | landslide | volcano | other
    hazardType: { type: String, required: true, lowercase: true, trim: true },

    // "file" | "link" | "text"
    uploadType: { type: String, default: "file" },

    // Optional description / abstract
    description: { type: String, default: "", trim: true },

    // Original filename as uploaded by the user
    fileName: { type: String, required: true },

    // Filename as stored on disk (timestamped, sanitised)
    storedName: { type: String, default: "" },

    // Full public URL: http://localhost:5002/uploads/<storedName>
    path: { type: String, required: true },

    // For link/text upload types: the original URL or text content
    content: { type: String, default: "" },

    // MIME type
    fileType: { type: String, required: true },

    // File size in bytes
    size: { type: Number, default: 0 },

    // Uploader name / username
    uploadedBy: { type: String, default: "Anonymous", trim: true },

    // Admin moderation status before local hazard pages can display the upload
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: { type: String, default: "", trim: true },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: "", trim: true },
    rejectedAt: { type: Date, default: null },

    // Upload timestamp
    date: { type: Date, default: () => new Date() },
  },
  {
    // Adds createdAt / updatedAt automatically
    timestamps: true,
  },
);

module.exports = mongoose.model("Upload", uploadSchema);
