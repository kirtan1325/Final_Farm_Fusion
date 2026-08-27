// backend/routes/cropPriceRoutes.js
const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getCropPrices, getCropPrice, addCropPrice, updateCropPrice } = require("../controllers/cropPriceController");

router.get("/",     protect, getCropPrices);
router.get("/:id",  protect, getCropPrice);
router.post("/",    protect, authorize("admin"), addCropPrice);
router.put("/:id",  protect, authorize("admin"), updateCropPrice);

module.exports = router;
