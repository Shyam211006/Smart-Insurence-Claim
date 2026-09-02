// middleware/auth.js
// This middleware protects routes by checking for a valid JWT token.
// It runs BEFORE the controller function on any route that uses it.

const jwt = require("jsonwebtoken");

// Checks that the request has a valid token. Attaches decoded user info to req.user
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name, email }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// Only allows admins to continue. Use AFTER verifyToken.
function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
}

module.exports = { verifyToken, verifyAdmin };
