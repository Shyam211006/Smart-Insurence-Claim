// controllers/authController.js
// Contains the actual logic for registering, verifying, and logging in users.
// The routes file just points to these functions.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateOTP, sendOTPEmail } = require("../utils/mailer");

// Validates that the email is a properly-formatted Gmail address.
// Gmail's real rules for the part before @: 6-30 characters, letters/numbers/dots only,
// cannot start or end with a dot, and cannot contain two dots in a row.
// NOTE: this only checks the FORMAT. It cannot prove the address is real or belongs
// to this person — that's what the OTP email verification step below is for.
function isValidGmail(email) {
  const gmailPattern = /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9.]{4,28}[a-zA-Z0-9]@gmail\.com$/;
  return gmailPattern.test(String(email).trim().toLowerCase());
}

const OTP_VALID_MINUTES = 10;

// POST /register
// Creates the account as UNVERIFIED and emails a 6-digit OTP.
// The account cannot log in until the OTP is confirmed via /verify-otp.
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!isValidGmail(email)) {
      return res.status(400).json({ message: "Please register with a valid @gmail.com address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Hash the password before saving — we NEVER store plain text passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

    let user;
    if (existingUser && !existingUser.isVerified) {
      // They registered before but never verified — update their details and resend a fresh OTP
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role === "admin" ? "admin" : "customer";
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role === "admin" ? "admin" : "customer",
        isVerified: false,
        otp,
        otpExpiry,
      });
    }

    try {
      await sendOTPEmail(normalizedEmail, otp, name);
    } catch (mailError) {
      console.error("Failed to send OTP email:", mailError.message);
      return res.status(500).json({
        message:
          "Account created, but we couldn't send the verification email. Check your EMAIL_USER/EMAIL_PASS setup in .env and try registering again.",
      });
    }

    res.status(201).json({
      message: "A verification code has been sent to your Gmail address.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration." });
  }
}

// POST /verify-otp
// Confirms the 6-digit code the user received by email. On success, the account
// becomes isVerified: true and can now log in.
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found for this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified. Please log in." });
    }

    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "This code has expired. Please request a new one." });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
}

// POST /resend-otp
// Generates a fresh OTP and re-sends it, for cases where the first email
// never arrived or the code expired.
async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found for this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified. Please log in." });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);
    await user.save();

    await sendOTPEmail(normalizedEmail, otp, user.name);

    res.json({ message: "A new verification code has been sent to your Gmail address." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while resending OTP." });
  }
}

// POST /login
// Blocks login until the account's email has been verified via OTP.
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your Gmail address before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    // Create a JWT token containing basic (non-sensitive) user info
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login." });
  }
}

module.exports = { register, login, verifyOtp, resendOtp };
