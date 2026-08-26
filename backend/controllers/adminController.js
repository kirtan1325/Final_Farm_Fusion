// backend/controllers/adminController.js
const User            = require("../models/User");
const Crop            = require("../models/Crop");
const PurchaseRequest = require("../models/PurchaseRequest");
const GovernmentScheme = require("../models/GovernmentScheme");
const ForumPost       = require("../models/ForumPost");

// @desc  Admin dashboard summary
// @route GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalFarmers, totalBuyers, pendingFarmers,
           totalCrops, totalRequests, totalSchemes, totalPosts] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "buyer" }),
      User.countDocuments({ role: "farmer", isActive: false }),
      Crop.countDocuments(),
      PurchaseRequest.countDocuments(),
      GovernmentScheme.countDocuments({ isActive: true }),
      ForumPost.countDocuments({ isRemoved: false }),
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalFarmers, totalBuyers, pendingFarmers, totalCrops, totalRequests, totalSchemes, totalPosts },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all users
// @route GET /api/admin/users?role=farmer&search=john
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10, status } = req.query;
    const filter = { role: { $ne: "admin" } };
    if (role)   filter.role = role;
    if (status === "active")   filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, total, pages: Math.ceil(total / limit), data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve farmer (set isActive = true)
// @route PATCH /api/admin/users/:id/approve
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { returnDocument: "after" }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user, message: `${user.name} approved successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Suspend user
// @route PATCH /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: "after" }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user, message: `${user.name} suspended` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete user
// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all crops (admin view)
// @route GET /api/admin/crops
const getAdminCrops = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    const total = await Crop.countDocuments(filter);
    const crops = await Crop.find(filter)
      .populate("farmer", "name farmName")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, total, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Remove a crop post
// @route DELETE /api/admin/crops/:id
const removeCrop = async (req, res) => {
  try {
    await Crop.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Crop listing removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Pin/unpin forum post
// @route PATCH /api/admin/forum/:id/pin
const togglePinPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ success: true, isPinned: post.isPinned });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAdminStats, getUsers, approveUser, suspendUser, deleteUser, getAdminCrops, removeCrop, togglePinPost };
