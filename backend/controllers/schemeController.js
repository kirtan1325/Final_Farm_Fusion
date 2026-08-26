// backend/controllers/schemeController.js
const GovernmentScheme = require("../models/GovernmentScheme");

// @desc  Get all schemes (public)
// @route GET /api/schemes?category=subsidy&search=kisan
const getSchemes = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags:        { $in: [new RegExp(search, "i")] } },
      ];
    }

    const schemes = await GovernmentScheme.find(filter)
      .populate("addedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: schemes.length, data: schemes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single scheme
// @route GET /api/schemes/:id
const getScheme = async (req, res) => {
  try {
    const scheme = await GovernmentScheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: "Scheme not found" });
    res.json({ success: true, data: scheme });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create scheme (admin only)
// @route POST /api/schemes
const createScheme = async (req, res) => {
  try {
    const scheme = await GovernmentScheme.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, data: scheme });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update scheme (admin only)
// @route PUT /api/schemes/:id
const updateScheme = async (req, res) => {
  try {
    const scheme = await GovernmentScheme.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after" });
    if (!scheme) return res.status(404).json({ success: false, message: "Scheme not found" });
    res.json({ success: true, data: scheme });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete scheme (admin only)
// @route DELETE /api/schemes/:id
const deleteScheme = async (req, res) => {
  try {
    await GovernmentScheme.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "Scheme removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Check scheme eligibility based on farmer profile
// @route POST /api/schemes/check-eligibility
const checkEligibility = async (req, res) => {
  try {
    const { landSize, cropType, category } = req.body;
    const filter = { isActive: true };
    
    // basic mock eligibility logic
    const allSchemes = await GovernmentScheme.find(filter).sort({ createdAt: -1 });
    
    const eligibleSchemes = allSchemes.filter(s => {
      let isEligible = false;
      const textChunk = (s.title + " " + s.description + " " + (s.eligibility || "") + " " + (s.tags || []).join(" ")).toLowerCase();
      
      // If cropType matches scheme keywords
      if (cropType && textChunk.includes(cropType.toLowerCase())) isEligible = true;
      // If category matches
      if (category && category !== "All" && s.category === category) isEligible = true;
      // If small land size, usually eligible for more subsidies
      if (Number(landSize) < 5 && textChunk.includes("small")) isEligible = true;
      
      // If no strict filters, return scheme to populate list
      if (!cropType && (!category || category === "All")) isEligible = true;

      return isEligible;
    });

    res.json({ success: true, count: eligibleSchemes.length, data: eligibleSchemes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSchemes, getScheme, createScheme, updateScheme, deleteScheme, checkEligibility };
