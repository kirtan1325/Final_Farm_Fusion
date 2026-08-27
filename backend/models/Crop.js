const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    farmer:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:     { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    category: {
      type: String,
      enum: ["vegetables", "fruits", "grains", "herbs", "other"],
      default: "vegetables",
    },
    quantity:  { type: Number, required: true, min: 0 },
    unit:      { type: String, enum: ["kg", "lb", "unit", "bunch"], default: "kg" },
    pricePerUnit: { type: Number, required: true, min: 0 },
    status:    { type: String, enum: ["available", "sold", "reserved"], default: "available" },
    badge:     {
      type: String,
      enum: ["organic", "flash_sale", "new", "best_deal", "limited", null, ""],
      default: null,
      // Convert empty string to null before saving
      set: (v) => (v === "" || v === undefined ? null : v),
    },
    location:  { type: String },
    emoji:     { type: String, default: "🌾" },
    imageUrl:  { type: String },
    harvestedAt: { type: Date },
  },
  { timestamps: true }
);

// Virtual: formatted price
cropSchema.virtual("formattedPrice").get(function () {
  return `$${this.pricePerUnit.toFixed(2)} / ${this.unit}`;
});

cropSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Crop", cropSchema);