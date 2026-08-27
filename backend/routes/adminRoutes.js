// backend/routes/adminRoutes.js
const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAdminStats, getUsers, approveUser, suspendUser,
  deleteUser, getAdminCrops, removeCrop, togglePinPost,
} = require("../controllers/adminController");

// All admin routes require admin role
router.use(protect, authorize("admin"));

router.get("/stats",                getAdminStats);
router.get("/users",                getUsers);
router.patch("/users/:id/approve",  approveUser);
router.patch("/users/:id/suspend",  suspendUser);
router.delete("/users/:id",         deleteUser);
router.get("/crops",                getAdminCrops);
router.delete("/crops/:id",         removeCrop);
router.patch("/forum/:id/pin",      togglePinPost);

module.exports = router;
