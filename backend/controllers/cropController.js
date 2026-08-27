const Crop = require("../models/Crop");
const { notifyAllBuyers } = require("./notificationController");

// Helper — convert empty string badge to null
const sanitizeBadge = (data) => ({
  ...data,
  badge: data.badge === "" || data.badge === undefined ? null : data.badge,
});

// @desc  Get all crops (marketplace - public)
// @route GET /api/crops
const getCrops = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, status, search } = req.query;
    const filter = { quantity: { $gt: 0 } };

    if (category)             filter.category = category;
    if (status)               filter.status   = status;
    if (minPrice || maxPrice) filter.pricePerUnit = {};
    if (minPrice) filter.pricePerUnit.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerUnit.$lte = Number(maxPrice);
    if (search)   filter.name = { $regex: search, $options: "i" };

    const crops = await Crop.find(filter)
      .populate("farmer", "name farmName location avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: crops.length, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get farmer's own crops (My Crop Listings)
// @route GET /api/crops/mine
const getMyCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: crops.length, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create crop
// @route POST /api/crops
const createCrop = async (req, res) => {
  try {
    const crop = await Crop.create({ ...sanitizeBadge(req.body), farmer: req.user._id });
    res.status(201).json({ success: true, data: crop });

    // ── Notify all buyers about new crop ──
    notifyAllBuyers({
      sender: req.user._id,
      type: "crop_added",
      title: "New Crop Listed!",
      message: `${req.user.name} listed "${crop.name}" at $${crop.pricePerUnit}/${crop.unit}.`,
      link: "/marketplace",
      data: { cropId: crop._id, cropName: crop.name, farmerName: req.user.name },
    });
  } catch (err) {
    console.error("CREATE CROP ERROR:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update crop
// @route PUT /api/crops/:id
const updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!crop) return res.status(404).json({ success: false, message: "Crop not found" });

    const oldPrice = crop.pricePerUnit;
    const oldQty   = crop.quantity;
    const oldStatus = crop.status;

    Object.assign(crop, sanitizeBadge(req.body));
    await crop.save();
    res.json({ success: true, data: crop });

    // ── Build smart notification message ──
    const changes = [];
    if (req.body.pricePerUnit !== undefined && Number(req.body.pricePerUnit) !== oldPrice) {
      changes.push(`price updated to $${crop.pricePerUnit}/${crop.unit}`);
    }
    if (req.body.quantity !== undefined && Number(req.body.quantity) !== oldQty) {
      changes.push(`stock updated to ${crop.quantity} ${crop.unit}`);
    }
    if (req.body.status && req.body.status !== oldStatus) {
      changes.push(`status changed to "${crop.status}"`);
    }

    if (changes.length > 0) {
      notifyAllBuyers({
        sender: req.user._id,
        type: "crop_updated",
        title: "Crop Updated",
        message: `${req.user.name} updated "${crop.name}": ${changes.join(", ")}.`,
        link: "/marketplace",
        data: { cropId: crop._id, cropName: crop.name, farmerName: req.user.name },
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete crop
// @route DELETE /api/crops/:id
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
    if (!crop) return res.status(404).json({ success: false, message: "Crop not found" });
    res.json({ success: true, message: "Crop removed" });

    // ── Notify buyers crop removed ──
    notifyAllBuyers({
      sender: req.user._id,
      type: "crop_removed",
      title: "Crop Removed",
      message: `${req.user.name} removed "${crop.name}" from the marketplace.`,
      link: "/marketplace",
      data: { cropId: crop._id, cropName: crop.name, farmerName: req.user.name },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCrops, getMyCrops, createCrop, updateCrop, deleteCrop };