const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseRequest", required: true },
    buyer:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    crop:   { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },

    quantity:   { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },

    paymentMethod:  { type: String, enum: ["card", "bank", "upi"], default: "card" },
    transactionId:  { type: String },
    trackingNumber: { type: String },
    deliveredAt:    { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);