// models/Claim.js
// Defines the shape of a "Claim" document.
// Every insurance claim submitted by a customer is saved using this schema.

const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    policyNumber: {
      type: String,
      required: true,
    },
    claimAmount: {
      type: Number,
      required: true,
    },
    document: {
      type: String, // stores the uploaded file's path/filename
      required: true,
    },
    extractedText: {
      type: String, // text pulled out of the document by OCR (Tesseract.js)
      default: "",
    },
    fraudScore: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    documentHash: {
      type: String, // SHA-256 hash of the uploaded document (simulated blockchain proof)
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // createdAt & updatedAt are added automatically
);

module.exports = mongoose.model("Claim", claimSchema);
