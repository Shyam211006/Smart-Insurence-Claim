// config/db.js
// This file is responsible for ONE thing only: connecting our backend to MongoDB.
// We keep it separate so server.js stays clean and easy to read.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    // Stop the app if the database is not available, since nothing will work without it.
    process.exit(1);
  }
};

module.exports = connectDB;
