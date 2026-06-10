const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    aadhaarFile: String,
    panFile: String,
    resumeFile: String,
    marksheetFile: String,

    extractedData: {
      aadhaar: Object,
      pan: Object,
      resume: Object,
      marksheet: Object
    },

    checks: {
      nameMatch: Boolean,
      dobMatch: Boolean,
      missingFields: Boolean,
      blurryDocument: Boolean,
      duplicateDocument: Boolean
    },

    trustScore: Number,
    riskLevel: String,
    recommendation: String,
    reportPath: String,

    recruiterStatus: {
      type: String,
      enum: ["Pending Review", "Approved", "Rejected", "Needs Clarification"],
      default: "Pending Review"
    },

    recruiterNotes: {
      type: String,
      default: ""
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Verification", verificationSchema);
