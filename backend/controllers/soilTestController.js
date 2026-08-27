// backend/controllers/soilTestController.js
const SoilTest = require("../models/SoilTest");

// Simple logic to generate report
const analyzeSoil = (data) => {
  const { nitrogen, phosphorus, potassium, phLevel } = data;
  let score = 100;
  let deficiencies = [];
  let crops = [];
  let fertilizers = [];

  // NPK basic checks (very simplified thresholds)
  if (nitrogen < 280) { deficiencies.push("Nitrogen (N)"); score -= 15; fertilizers.push("Urea or Neem Coated Urea"); }
  if (phosphorus < 22) { deficiencies.push("Phosphorus (P)"); score -= 15; fertilizers.push("DAP or Super Phosphate"); }
  if (potassium < 140) { deficiencies.push("Potassium (K)"); score -= 15; fertilizers.push("Muriate of Potash (MOP)"); }

  // pH checks
  if (phLevel < 6.0) { deficiencies.push("Too Acidic"); score -= 10; fertilizers.push("Agricultural Lime"); }
  else if (phLevel > 7.5) { deficiencies.push("Too Alkaline"); score -= 10; fertilizers.push("Gypsum or Elemental Sulfur"); }

  // Crop recommendations based on pH and NPK (mocked logic)
  if (phLevel >= 6.0 && phLevel <= 7.0 && nitrogen > 200) crops.push("Wheat", "Rice", "Maize");
  if (phLevel >= 5.5 && phLevel <= 7.0) crops.push("Cotton", "Soybean");
  if (potassium > 150) crops.push("Potato", "Tomato");
  if (crops.length === 0) crops.push("Millets", "Legumes (for fixing N)");

  return {
    healthScore: Math.max(0, score),
    deficiencies,
    recommendations: {
      crops: [...new Set(crops)],
      fertilizers: [...new Set(fertilizers)]
    }
  };
};

// @desc  Create Soil Test and Generate Card
// @route POST /api/soil-health
const createSoilTest = async (req, res) => {
  try {
    const analysis = analyzeSoil(req.body);
    const test = await SoilTest.create({
      ...req.body,
      farmer: req.user._id,
      ...analysis
    });
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get Farmer's Soil Tests
// @route GET /api/soil-health
const getMySoilTests = async (req, res) => {
  try {
    const tests = await SoilTest.find({ farmer: req.user._id }).sort({ sampleDate: -1 });
    res.json({ success: true, data: tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createSoilTest, getMySoilTests };
