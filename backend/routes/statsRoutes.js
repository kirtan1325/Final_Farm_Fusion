// backend/routes/statsRoutes.js
const express = require("express");
const router  = express.Router();
const { getFarmerStats, getBuyerStats, getRequestStats } = require("../controllers/statsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/farmer",   protect, authorize("farmer"), getFarmerStats);
router.get("/buyer",    protect, authorize("buyer"),  getBuyerStats);
router.get("/requests", protect, authorize("farmer"), getRequestStats);

module.exports = router;