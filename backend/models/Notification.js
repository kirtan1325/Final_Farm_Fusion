// backend/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        // Buyer → Farmer
        "request_received",    // farmer gets new request from buyer
        "request_cancelled",   // farmer: buyer cancelled
        "payment_received",    // farmer: buyer paid
        "buyer_message",       // farmer: buyer sent a message

        // Farmer → Buyer
        "request_accepted",    // buyer: farmer accepted
        "request_rejected",    // buyer: farmer rejected
        "order_shipped",       // buyer: order shipped
        "order_delivered",     // buyer: order delivered

        // Farmer activity → all interested buyers
        "crop_added",          // farmer added new crop
        "crop_updated",        // farmer updated crop (price, stock, etc.)
        "crop_removed",        // farmer removed crop
        "farmer_profile_update", // farmer updated profile

        // System
        "system",              // general platform notification
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String },   // frontend route to navigate to on click
    isRead:  { type: Boolean, default: false },
    data:    { type: mongoose.Schema.Types.Mixed }, // extra payload (requestId, cropId, etc.)
  },
  { timestamps: true }
);

// Indexes for fast queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);