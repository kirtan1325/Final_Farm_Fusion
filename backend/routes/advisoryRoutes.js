// backend/routes/advisoryRoutes.js
const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAdvisory, getCropNames, getAdvisoryById, createAdvisory, updateAdvisory } = require("../controllers/advisoryController");

router.get("/",        protect, getAdvisory);
router.get("/crops",   protect, getCropNames);
router.get("/:id",     protect, getAdvisoryById);
router.post("/",       protect, authorize("admin"), createAdvisory);
router.put("/:id",     protect, authorize("admin"), updateAdvisory);

module.exports = router;
