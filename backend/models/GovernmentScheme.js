// backend/models/GovernmentScheme.js
const mongoose = require("mongoose");

const governmentSchemeSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["subsidy", "loan", "insurance", "training", "equipment", "other"],
      default: "other",
    },
    eligibility:  { type: String },
    benefits:     { type: String },
    howToApply:   { type: String },
    deadline:     { type: Date },
    isActive:     { type: Boolean, default: true },
    tags:         [{ type: String }],
    officialLink: { type: String },
    addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("GovernmentScheme", governmentSchemeSchema);