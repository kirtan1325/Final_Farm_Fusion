// backend/routes/schemeRoutes.js
const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getSchemes, getScheme, createScheme, updateScheme, deleteScheme, checkEligibility } = require("../controllers/schemeController");

router.get("/",        protect, getSchemes);
router.post("/check-eligibility", protect, checkEligibility);
router.get("/:id",     protect, getScheme);
router.post("/",       protect, authorize("admin"), createScheme);
router.put("/:id",     protect, authorize("admin"), updateScheme);
router.delete("/:id",  protect, authorize("admin"), deleteScheme);

module.exports = router;
