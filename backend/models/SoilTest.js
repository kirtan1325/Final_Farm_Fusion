const mongoose = require("mongoose");

const soilTestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sampleDate: {
      type: Date,
      default: Date.now,
    },
    location: { type: String, trim: true },
    nitrogen: { type: Number, required: true }, // kg/ha
    phosphorus: { type: Number, required: true }, // kg/ha
    potassium: { type: Number, required: true }, // kg/ha
    phLevel: { type: Number, required: true },
    organicCarbon: { type: Number }, // percentage
    
    // Auto-generated fields
    healthScore: { type: Number },
    deficiencies: [{ type: String }],
    recommendations: {
      crops: [{ type: String }],
      fertilizers: [{ type: String }],
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SoilTest", soilTestSchema);
