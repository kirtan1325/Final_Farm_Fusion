const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema(
  {
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    farmer:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    crop:    { type: mongoose.Schema.Types.ObjectId, ref: "Crop", required: true },

    quantity:   { type: Number, required: true, min: 1 },
    unit:       { type: String, default: "kg" },
    totalPrice: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },

    message:       { type: String },          // buyer's note
    rejectedReason:{ type: String },          // farmer fills if rejected
    isPaid:        { type: Boolean, default: false },
    paidAt:        { type: Date },

    deliveryAddress: { type: String },
    requestedDeliveryDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);