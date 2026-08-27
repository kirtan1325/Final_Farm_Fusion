// backend/controllers/notificationController.js
const Notification = require("../models/Notification");
const { emitToUser, emitToRole } = require("../config/socketManager");

// ── Helper: create + emit a real-time notification ──────
const createNotification = async ({ recipient, sender, type, title, message, link, data }) => {
  try {
    const notif = await Notification.create({ recipient, sender, type, title, message, link, data });

    // Populate sender info for the real-time event
    const populated = await Notification.findById(notif._id).populate("sender", "name avatar role");

    // Push via Socket.IO instantly
    emitToUser(recipient, "new_notification", populated);

    return populated;
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};

// ── Helper: notify all buyers (for farmer crop activity) ──
const notifyAllBuyers = async ({ sender, type, title, message, link, data }) => {
  const User = require("../models/User");
  try {
    const buyers = await User.find({ role: "buyer", isActive: true }).select("_id");

    const notifications = buyers.map(buyer => ({
      recipient: buyer._id,
      sender,
      type,
      title,
      message,
      link,
      data,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);

      // Emit to all buyers via Socket.IO role room
      emitToRole("buyer", "new_notification", {
        sender,
        type,
        title,
        message,
        link,
        data,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.error("Failed to notify buyers:", err.message);
  }
};

// @desc  Get notifications for logged-in user
// @route GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === "true") filter.isRead = false;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate("sender", "name avatar role")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.json({ success: true, total, unreadCount, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark single notification as read
// @route PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { returnDocument: "after" }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark ALL notifications as read
// @route PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get unread count only (for bell badge)
// @route GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createNotification,
  notifyAllBuyers,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
