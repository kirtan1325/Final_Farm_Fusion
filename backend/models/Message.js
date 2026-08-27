const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  purchaseRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseRequest",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isBidOffer: {
    type: Boolean,
    default: false
  },
  proposedPrice: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
