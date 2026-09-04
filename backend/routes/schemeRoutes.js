const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getSchemes, getScheme, createScheme, updateScheme, deleteScheme, checkEligibility, suggestAiSchemes } = require("../controllers/schemeController");

router.get("/",        protect, getSchemes);
router.post("/suggest-ai", protect, suggestAiSchemes);
router.post("/check-eligibility", protect, checkEligibility);
router.get("/:id",     protect, getScheme);
router.post("/",       protect, authorize("admin"), createScheme);
router.put("/:id",     protect, authorize("admin"), updateScheme);
router.delete("/:id",  protect, authorize("admin"), deleteScheme);

module.exports = router;

