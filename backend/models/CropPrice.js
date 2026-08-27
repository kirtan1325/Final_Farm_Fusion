// backend/models/CropPrice.js
const mongoose = require("mongoose");

const cropPriceSchema = new mongoose.Schema(
  {
    cropName:   { type: String, required: true, trim: true },
    emoji:      { type: String, default: "🌾" },
    category:   { type: String, enum: ["vegetables", "fruits", "grains", "herbs", "other"], default: "grains" },
    minPrice:   { type: Number, required: true },  // ₹ per quintal
    maxPrice:   { type: Number, required: true },
    modalPrice: { type: Number, required: true },  // most common price
    unit:       { type: String, default: "quintal" },
    market:     { type: String, default: "National Average" }, // mandi name
    state:      { type: String },
    date:       { type: Date, default: Date.now },
    trend:      { type: String, enum: ["up", "down", "stable"], default: "stable" },
    changePercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropPrice", cropPriceSchema);