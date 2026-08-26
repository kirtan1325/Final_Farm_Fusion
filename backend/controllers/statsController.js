const Crop            = require("../models/Crop");
const PurchaseRequest = require("../models/PurchaseRequest");
const Order           = require("../models/Order");

// @desc  Farmer dashboard stats
// @route GET /api/stats/farmer
const getFarmerStats = async (req, res) => {
  try {
    const farmerId = req.user._id;

    const [activeListings, totalSalesAgg, pendingRequests] = await Promise.all([
      Crop.countDocuments({ farmer: farmerId, status: "available" }),
      Order.aggregate([
        { $match: { farmer: farmerId } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      PurchaseRequest.countDocuments({ farmer: farmerId, status: "pending" }),
    ]);

    res.json({
      success: true,
      data: {
        activeListings,
        totalSales:      totalSalesAgg[0]?.total || 0,
        pendingRequests,
      },
    });
  } catch (err) {
    console.error("FARMER STATS ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Buyer dashboard stats
// @route GET /api/stats/buyer
const getBuyerStats = async (req, res) => {
  try {
    const buyerId = req.user._id;

    const [activeRequests, recentPurchases, savedAgg] = await Promise.all([
      PurchaseRequest.countDocuments({ buyer: buyerId, status: "pending" }),
      Order.countDocuments({ buyer: buyerId }),
      Order.aggregate([
        { $match: { buyer: buyerId } },
        { $group: { _id: null, totalKg: { $sum: "$quantity" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        activeRequests,
        cropsSaved:      savedAgg[0]?.totalKg || 0,
        recentPurchases,
      },
    });
  } catch (err) {
    console.error("BUYER STATS ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Request management stats (farmer)
// @route GET /api/stats/requests
const getRequestStats = async (req, res) => {
  try {
    const farmerId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingValueAgg, acceptedToday, totalHandled, totalReceived] = await Promise.all([
      PurchaseRequest.aggregate([
        { $match: { farmer: farmerId, status: "pending" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      PurchaseRequest.countDocuments({
        farmer:    farmerId,
        status:    "accepted",
        updatedAt: { $gte: today },
      }),
      PurchaseRequest.countDocuments({
        farmer: farmerId,
        status: { $in: ["accepted", "rejected"] },
      }),
      PurchaseRequest.countDocuments({ farmer: farmerId }),
    ]);

    const responseRate = totalReceived > 0
      ? ((totalHandled / totalReceived) * 100).toFixed(1)
      : "0.0";

    res.json({
      success: true,
      data: {
        pendingValue:  pendingValueAgg[0]?.total || 0,
        acceptedToday,
        responseRate:  `${responseRate}%`,
      },
    });
  } catch (err) {
    console.error("REQUEST STATS ERROR:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFarmerStats, getBuyerStats, getRequestStats };