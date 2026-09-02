// models/User.js
// Defines the shape of a "User" document stored in MongoDB.
// Every registered customer or admin is saved using this schema.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // This will be stored as a bcrypt HASH, never plain text
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false, // becomes true only after the user confirms the OTP sent to their email
    },
    otp: {
      type: String, // 6-digit one-time code, stored temporarily
      default: null,
    },
    otpExpiry: {
      type: Date, // OTP is only valid for a short window (10 minutes)
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
