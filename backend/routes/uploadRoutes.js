// backend/routes/uploadRoutes.js
const express = require("express");
const router  = express.Router();
const { uploadImageToCloudinary } = require("../controllers/uploadController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Protected upload endpoint for farmers
router.post("/cloudinary", protect, authorize("farmer"), uploadImageToCloudinary);

module.exports = router;
