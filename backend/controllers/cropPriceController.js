// backend/controllers/cropPriceController.js
const CropPrice = require("../models/CropPrice");

// @desc  Get all crop prices (strictly filtered by farmer's registered location)
// @route GET /api/prices?category=grains&search=wheat&location=Gujarat
const getCropPrices = async (req, res) => {
  try {
    const { category, search, location, state, showAll } = req.query;
    const filter = {};

    if (category && category.trim() && category.toLowerCase() !== "all") {
      filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }

    // Auto-detect farmer's location from profile if not explicitly passed
    let targetLoc = location || state;
    if (!targetLoc && req.user && req.user.location && showAll !== "true") {
      targetLoc = req.user.location;
    }

    if (targetLoc && targetLoc.trim() && targetLoc.toLowerCase() !== "all" && showAll !== "true") {
      // Split location string (e.g., "Surat, Gujarat, India" -> ["Surat", "Gujarat"])
      const parts = targetLoc
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && p.toLowerCase() !== "india");

      if (parts.length > 0) {
        filter.$or = parts.flatMap((part) => [
          { state: { $regex: part, $options: "i" } },
          { market: { $regex: part, $options: "i" } },
        ]);
      }
    }

    if (search && search.trim()) {
      filter.cropName = { $regex: search.trim(), $options: "i" };
    }

    // Strictly return only matching location prices without falling back to all India
    const prices = await CropPrice.find(filter).sort({ cropName: 1 });

    res.json({
      success: true,
      userLocation: req.user?.location || null,
      appliedLocation: targetLoc || null,
      count: prices.length,
      data: prices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single crop price
// @route GET /api/prices/:id
const getCropPrice = async (req, res) => {
  try {
    const price = await CropPrice.findById(req.params.id);
    if (!price) return res.status(404).json({ success: false, message: "Price not found" });
    res.json({ success: true, data: price });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Add crop price (admin only)
// @route POST /api/prices
const addCropPrice = async (req, res) => {
  try {
    const price = await CropPrice.create(req.body);
    res.status(201).json({ success: true, data: price });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update crop price (admin only)
// @route PUT /api/prices/:id
const updateCropPrice = async (req, res) => {
  try {
    const price = await CropPrice.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after" });
    if (!price) return res.status(404).json({ success: false, message: "Price not found" });
    res.json({ success: true, data: price });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getCropPrices, getCropPrice, addCropPrice, updateCropPrice };
