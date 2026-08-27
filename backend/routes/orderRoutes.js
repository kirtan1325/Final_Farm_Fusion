// backend/routes/orderRoutes.js
const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const Order = require("../models/Order");

// GET buyer's orders
router.get("/my", protect, authorize("buyer"), async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("crop",   "name emoji unit")
      .populate("farmer", "name farmName location")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET farmer's fulfilled orders
router.get("/fulfilled", protect, authorize("farmer"), async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .populate("crop",  "name emoji unit")
      .populate("buyer", "name companyName")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update delivery status (farmer)
router.patch("/:id/status", protect, authorize("farmer"), async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === "delivered") update.deliveredAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, { returnDocument: "after" });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;