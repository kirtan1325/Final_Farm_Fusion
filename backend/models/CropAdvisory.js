// backend/models/CropAdvisory.js
const mongoose = require("mongoose");

const cropAdvisorySchema = new mongoose.Schema(
  {
    cropName:    { type: String, required: true, trim: true },
    emoji:       { type: String, default: "🌾" },
    season:      { type: String, enum: ["Kharif", "Rabi", "Zaid", "All Year"], required: true },
    soilType:    { type: String },
    waterNeeds:  { type: String, enum: ["Low", "Medium", "High"], required: true },
    temperature: { type: String },  // e.g. "20°C – 35°C"
    sowingTime:  { type: String },
    harvestTime: { type: String },
    fertilizer:  { type: String },
    commonPests: { type: String },
    tips:        [{ type: String }],
    diseases:    [{ name: String, symptom: String, remedy: String }],
    category:    { type: String, enum: ["vegetables", "fruits", "grains", "herbs", "other"], default: "grains" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropAdvisory", cropAdvisorySchema);
