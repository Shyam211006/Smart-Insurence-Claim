// middleware/upload.js
// Configures Multer to handle file uploads (claim documents: PDF or images).
// Uploaded files are saved inside the /uploads folder with a unique name.

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    // Example: 1721650000000-claimDocument.pdf
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// Only allow common image and PDF formats
function fileFilter(req, file, cb) {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, JPEG, and PDF files are allowed."));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

module.exports = upload;
