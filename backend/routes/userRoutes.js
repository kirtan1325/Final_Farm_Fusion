const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET profile
router.get("/profile", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT update profile (name, farmName, companyName, location)
router.put("/profile", protect, async (req, res) => {
  try {
    const allowed = ["name", "farmName", "companyName", "location", "avatar"];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { returnDocument: "after", runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT change password
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Current and new password are required" });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    // Re-fetch user WITH password field (toJSON removes it)
    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save(); // pre-save hook hashes it
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;