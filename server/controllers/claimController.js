// controllers/claimController.js
// Contains all logic related to insurance claims:
// uploading, OCR text extraction, hashing, fraud scoring, listing, and status updates.

const path = require("path");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const Claim = require("../models/Claim");
const { generateFileHash } = require("../utils/hash");

// Simple rule-based fraud score (NO machine learning, as required)
function calculateFraudScore(amount) {
  if (amount < 50000) return "Low";
  if (amount >= 50000 && amount <= 100000) return "Medium";
  return "High";
}

// POST /uploadClaim  (protected route, expects a file field named "document")
async function uploadClaim(req, res) {
  try {
    const { customerName, policyNumber, claimAmount } = req.body;

    if (!customerName || !policyNumber || !claimAmount) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a claim document (PDF or image)." });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    // 1. Generate SHA-256 hash of the uploaded file (simulated blockchain proof)
    const documentHash = generateFileHash(filePath);

    // 2. Run OCR on the document to extract text.
    //    Tesseract works directly on images. If a PDF is uploaded, OCR is skipped
    //    gracefully (kept simple for a hackathon-scope project).
    let extractedText = "";
    const isImage = req.file.mimetype.startsWith("image/");

    if (isImage) {
      try {
        const result = await Tesseract.recognize(filePath, "eng");
        extractedText = result.data.text.trim();
      } catch (ocrError) {
        console.error("OCR failed:", ocrError.message);
        extractedText = "(OCR could not read this document)";
      }
    } else {
      extractedText = "(OCR skipped: PDF uploaded — image files are OCR-scanned)";
    }

    // 3. Calculate a simple, rule-based fraud score
    const fraudScore = calculateFraudScore(Number(claimAmount));

    // 4. Save everything to MongoDB
    const claim = await Claim.create({
      customerName,
      policyNumber,
      claimAmount: Number(claimAmount),
      document: fileName,
      extractedText,
      documentHash,
      fraudScore,
      status: "Pending",
      submittedBy: req.user.id,
    });

    res.status(201).json({ message: "Claim submitted successfully.", claim });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while uploading claim." });
  }
}

// GET /claims  (returns all claims for admin, or only the logged-in user's claims for customers)
async function getClaims(req, res) {
  try {
    let claims;
    if (req.user.role === "admin") {
      claims = await Claim.find().sort({ createdAt: -1 });
    } else {
      claims = await Claim.find({ submittedBy: req.user.id }).sort({ createdAt: -1 });
    }
    res.json({ claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching claims." });
  }
}

// GET /claim/:id
async function getClaimById(req, res) {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }
    res.json({ claim });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching claim." });
  }
}

// PUT /approve/:id  (admin only)
async function approveClaim(req, res) {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: "Approved" },
      { new: true }
    );
    if (!claim) return res.status(404).json({ message: "Claim not found." });
    res.json({ message: "Claim approved.", claim });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while approving claim." });
  }
}

// PUT /reject/:id  (admin only)
async function rejectClaim(req, res) {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected" },
      { new: true }
    );
    if (!claim) return res.status(404).json({ message: "Claim not found." });
    res.json({ message: "Claim rejected.", claim });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while rejecting claim." });
  }
}

// DELETE /claim/:id  (customer can withdraw ONLY their own claim, and ONLY while it's Pending)
async function deleteClaim(req, res) {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found." });
    }

    // Admins can delete any claim; customers may only delete their own
    const isOwner = claim.submittedBy.toString() === req.user.id;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "You can only withdraw your own claims." });
    }

    // Customers may only withdraw a claim while it's still Pending
    if (req.user.role !== "admin" && claim.status !== "Pending") {
      return res.status(400).json({ message: "Only pending claims can be withdrawn." });
    }

    // Remove the uploaded document from disk, if it still exists
    const filePath = path.join(__dirname, "..", "uploads", claim.document);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Claim.findByIdAndDelete(req.params.id);

    res.json({ message: "Claim withdrawn successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while withdrawing claim." });
  }
}

// GET /claims/export  (admin only) — downloads all claims as a CSV file
async function exportClaimsCSV(req, res) {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });

    const header = [
      "Claim ID",
      "Customer Name",
      "Policy Number",
      "Claim Amount",
      "Fraud Score",
      "Document Hash",
      "Status",
      "Submitted On",
    ];

    // Wrap each value in quotes and escape any existing quotes, so commas/quotes in data don't break the CSV
    const escapeCSV = (value) => `"${String(value).replace(/"/g, '""')}"`;

    const rows = claims.map((c) =>
      [
        c._id,
        c.customerName,
        c.policyNumber,
        c.claimAmount,
        c.fraudScore,
        c.documentHash,
        c.status,
        new Date(c.createdAt).toLocaleString(),
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csvContent = [header.map(escapeCSV).join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=smartclaim_export.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while exporting claims." });
  }
}

module.exports = {
  uploadClaim,
  getClaims,
  getClaimById,
  approveClaim,
  rejectClaim,
  deleteClaim,
  exportClaimsCSV,
};
