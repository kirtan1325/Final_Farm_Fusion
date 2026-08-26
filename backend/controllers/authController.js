const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || "7d" });

// @desc  Register
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, farmName, companyName, location } = req.body;

    // ── Validation ──────────────────────────────────────
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: "Full name is required" });

    if (!email || !email.trim())
      return res.status(400).json({ success: false, message: "Email is required" });

    if (!password)
      return res.status(400).json({ success: false, message: "Password is required" });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const allowedRoles = ["farmer", "buyer"];
    const userRole = allowedRoles.includes(role) ? role : "buyer";

    // ── Check duplicate email ───────────────────────────
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(400).json({ success: false, message: "An account with this email already exists" });

    // ── Create user ─────────────────────────────────────
    const userData = {
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      role:     userRole,
      location: location || undefined,
    };

    if (userRole === "farmer" && farmName)    userData.farmName    = farmName.trim();
    if (userRole === "buyer"  && companyName) userData.companyName = companyName.trim();

    const user  = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user });

  } catch (err) {
    // Log full error in terminal so you can see exactly what went wrong
    console.error("REGISTER ERROR:", err.message);
    console.error(err);

    // Send back a readable message
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }

    res.status(500).json({ success: false, message: err.message || "Server error during registration" });
  }
};

// @desc  Login
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ success: false, message: "No account found with this email" });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: "Your account has been deactivated" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Incorrect password" });

    const token = generateToken(user._id);
    res.json({ success: true, token, user });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message || "Server error during login" });
  }
};

// @desc  Get logged-in user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { register, login, getMe };