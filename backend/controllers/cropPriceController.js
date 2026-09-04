// backend/controllers/cropPriceController.js
const CropPrice = require("../models/CropPrice");

// @desc  Get crop prices (prioritizing farmer's registered location)
// @route GET /api/prices?category=grains&search=wheat&location=Gujarat
const getCropPrices = async (req, res) => {
  try {
    const { category, search, location, state, showAll } = req.query;
    const baseFilter = {};

    if (category && category.trim() && category.toLowerCase() !== "all") {
      baseFilter.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }
    if (search && search.trim()) {
      baseFilter.cropName = { $regex: search.trim(), $options: "i" };
    }

    // Auto-detect farmer's location from profile if not explicitly passed
    let targetLoc = location || state;
    if (!targetLoc && req.user && req.user.location && showAll !== "true") {
      targetLoc = req.user.location;
    }

    let isExactMatch = false;
    let prices = [];

    // 1. Try strict location filter first
    if (targetLoc && targetLoc.trim() && targetLoc.toLowerCase() !== "all" && showAll !== "true") {
      const parts = targetLoc
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && p.toLowerCase() !== "india");

      if (parts.length > 0) {
        const locationFilter = {
          ...baseFilter,
          $or: parts.flatMap((part) => [
            { state: { $regex: part, $options: "i" } },
            { market: { $regex: part, $options: "i" } },
          ]),
        };
        prices = await CropPrice.find(locationFilter).sort({ cropName: 1 });
        if (prices.length > 0) {
          isExactMatch = true;
        }
      }
    }

    // 2. Fallback to all available rates if no location specified or no prices found for exact location
    if (prices.length === 0) {
      prices = await CropPrice.find(baseFilter).sort({ cropName: 1 });
    }

    res.json({
      success: true,
      userLocation: req.user?.location || null,
      appliedLocation: targetLoc || null,
      isExactMatch,
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
