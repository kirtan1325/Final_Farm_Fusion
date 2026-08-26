// backend/controllers/cropPriceController.js
const CropPrice = require("../models/CropPrice");

// @desc  Get all crop prices (with optional filter for category, search, location, state)
// @route GET /api/prices?category=grains&search=wheat&location=Punjab
const getCropPrices = async (req, res) => {
  try {
    const { category, search, location, state } = req.query;
    const filter = {};
    if (category && category.toLowerCase() !== "all") {
      filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }

    const queryTerm = search || location || state;
    if (queryTerm && queryTerm.trim()) {
      const term = queryTerm.trim();
      filter.$or = [
        { cropName: { $regex: term, $options: "i" } },
        { state: { $regex: term, $options: "i" } },
        { market: { $regex: term, $options: "i" } }
      ];
    }

    let prices = await CropPrice.find(filter).sort({ cropName: 1 });
    if (prices.length === 0 && (location || state) && !search) {
      delete filter.$or;
      prices = await CropPrice.find(filter).sort({ cropName: 1 });
    }

    res.json({ success: true, count: prices.length, data: prices });
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
