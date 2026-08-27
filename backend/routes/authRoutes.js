const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ── Test route — open http://localhost:5000/api/auth/test in browser ──
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes working",
    env: {
      jwtSecret:  process.env.JWT_SECRET  ? "✅ set" : "❌ MISSING",
      mongoUri:   process.env.MONGO_URI   ? "✅ set" : "❌ MISSING",
      clientUrl:  process.env.CLIENT_URL  ? "✅ set" : "❌ MISSING",
    }
  });
});

// ── Email / Password ───────────────────────────────────
router.post("/register", register);
router.post("/login",    login);
router.get("/me",        protect, getMe);

// ── Google OAuth ───────────────────────────────────────
router.get("/google", (req, res, next) => {
  const configured =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here";

  if (!configured) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  }
  const passport = require("../config/passport");
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  const configured =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here";

  if (!configured) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  }
  const passport = require("../config/passport");
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user.toJSON()))}`);
  })(req, res, next);
});

// ── Facebook OAuth ─────────────────────────────────────
router.get("/facebook", (req, res, next) => {
  const configured =
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_ID !== "your_facebook_app_id_here";

  if (!configured) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=facebook_not_configured`);
  }
  const passport = require("../config/passport");
  passport.authenticate("facebook", { scope: ["email"], session: false })(req, res, next);
});

router.get("/facebook/callback", (req, res, next) => {
  const configured =
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_ID !== "your_facebook_app_id_here";

  if (!configured) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=facebook_not_configured`);
  }
  const passport = require("../config/passport");
  passport.authenticate("facebook", { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${process.env.CLIENT_URL}/login?error=facebook_failed`);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user.toJSON()))}`);
  })(req, res, next);
});

module.exports = router;