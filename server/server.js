// server.js
// This is the entry point of our backend application.
// It sets up Express, connects to MongoDB, and wires up all the routes.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const claimRoutes = require("./routes/claimRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend (client folder) as static files
app.use(express.static(path.join(__dirname, "..", "client")));

// Serve uploaded documents (so hashes/OCR previews can be checked if needed)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api", authRoutes); // -> /api/register, /api/login
app.use("/api", claimRoutes); // -> /api/uploadClaim, /api/claims, etc.

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "SmartClaim AI backend is running." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SmartClaim AI server running on http://localhost:${PORT}`);
});
