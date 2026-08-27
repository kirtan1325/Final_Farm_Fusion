// backend/controllers/advisoryController.js
const CropAdvisory = require("../models/CropAdvisory");

// @desc  Get advisory for a crop
// @route GET /api/advisory?crop=Rice&season=Kharif
const getAdvisory = async (req, res) => {
  try {
    const { crop, season, category } = req.query;
    const filter = {};

    if (crop)     filter.cropName = { $regex: crop, $options: "i" };
    if (season)   filter.$or = [{ season }, { season: "All Year" }];
    if (category) filter.category = category;

    const advisories = await CropAdvisory.find(filter).sort({ cropName: 1 });
    res.json({ success: true, count: advisories.length, data: advisories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all crop names (for search dropdown)
// @route GET /api/advisory/crops
const getCropNames = async (req, res) => {
  try {
    const crops = await CropAdvisory.distinct("cropName");
    res.json({ success: true, data: crops.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single advisory by id
// @route GET /api/advisory/:id
const getAdvisoryById = async (req, res) => {
  try {
    const advisory = await CropAdvisory.findById(req.params.id);
    if (!advisory) return res.status(404).json({ success: false, message: "Advisory not found" });
    res.json({ success: true, data: advisory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create advisory (admin only)
// @route POST /api/advisory
const createAdvisory = async (req, res) => {
  try {
    const advisory = await CropAdvisory.create(req.body);
    res.status(201).json({ success: true, data: advisory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update advisory (admin only)
// @route PUT /api/advisory/:id
const updateAdvisory = async (req, res) => {
  try {
    const advisory = await CropAdvisory.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after" });
    if (!advisory) return res.status(404).json({ success: false, message: "Advisory not found" });
    res.json({ success: true, data: advisory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getAdvisory, getCropNames, getAdvisoryById, createAdvisory, updateAdvisory };
