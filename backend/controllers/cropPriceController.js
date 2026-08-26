// backend/controllers/cropPriceController.js
const CropPrice = require("../models/CropPrice");

// @desc  Get all crop prices (with optional filter)
// @route GET /api/prices?category=grains&search=wheat
const getCropPrices = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search)   filter.cropName = { $regex: search, $options: "i" };

    const prices = await CropPrice.find(filter).sort({ cropName: 1 });
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
