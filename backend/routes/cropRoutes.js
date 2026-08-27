// backend/routes/cropRoutes.js
const express = require("express");
const router  = express.Router();
const { getCrops, getMyCrops, createCrop, updateCrop, deleteCrop } = require("../controllers/cropController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/",        getCrops);
router.get("/mine",    protect, authorize("farmer"), getMyCrops);
router.post("/",       protect, authorize("farmer"), createCrop);
router.put("/:id",     protect, authorize("farmer"), updateCrop);
router.delete("/:id",  protect, authorize("farmer"), deleteCrop);

module.exports = router;