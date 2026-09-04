// backend/controllers/cropPriceController.js
const CropPrice = require("../models/CropPrice");

// Indian City/District to State Mapping Dictionary
const CITY_STATE_MAP = {
  navsari: "Gujarat", surat: "Gujarat", ahmedabad: "Gujarat", baroda: "Gujarat", vadodara: "Gujarat",
  rajkot: "Gujarat", junagadh: "Gujarat", anand: "Gujarat", bhavnagar: "Gujarat", jamnagar: "Gujarat",
  gandhinagar: "Gujarat", kutch: "Gujarat", mehsana: "Gujarat", amreli: "Gujarat", bharuch: "Gujarat",
  valsad: "Gujarat", patan: "Gujarat", porbandar: "Gujarat", godhra: "Gujarat",

  mumbai: "Maharashtra", pune: "Maharashtra", nagpur: "Maharashtra", nashik: "Maharashtra",
  jalgaon: "Maharashtra", lasalgaon: "Maharashtra", thane: "Maharashtra", kolhapur: "Maharashtra",
  satara: "Maharashtra", solapur: "Maharashtra", sangli: "Maharashtra", ahmednagar: "Maharashtra",
  latur: "Maharashtra", nanded: "Maharashtra", aurangabad: "Maharashtra", amravati: "Maharashtra",

  indore: "Madhya Pradesh", bhopal: "Madhya Pradesh", gwalior: "Madhya Pradesh", ujjain: "Madhya Pradesh",
  neemuch: "Madhya Pradesh", jabalpur: "Madhya Pradesh", ratiam: "Madhya Pradesh",

  ludhiana: "Punjab", amritsar: "Punjab", jalandhar: "Punjab", patiala: "Punjab", bathinda: "Punjab",
  karnal: "Haryana", gurugram: "Haryana", ambala: "Haryana", hisar: "Haryana",

  delhi: "UP", lucknow: "UP", kanpur: "UP", varanasi: "UP", agra: "UP", muzaffarnagar: "UP", noida: "UP",
  jaipur: "Rajasthan", jodhpur: "Rajasthan", udaipur: "Rajasthan", kota: "Rajasthan", bikaner: "Rajasthan",

  guntur: "Andhra Pradesh", vijayawada: "Andhra Pradesh", vizag: "Andhra Pradesh", visakhapatnam: "Andhra Pradesh",
  nizamabad: "Telangana", hyderabad: "Telangana", warangal: "Telangana",
  wayanad: "Kerala", kochi: "Kerala", trivandrum: "Kerala", kozhikode: "Kerala",
  bengaluru: "Karnataka", bangalore: "Karnataka", mysore: "Karnataka", hubli: "Karnataka",
  chennai: "Tamil Nadu", coimbatore: "Tamil Nadu", madurai: "Tamil Nadu",
  shimla: "Himachal Pradesh", kullu: "Himachal Pradesh", solan: "Himachal Pradesh",
  dehradun: "Uttarakhand", haridwar: "Uttarakhand"
};

// Helper: Resolve search terms from location input string
const resolveLocationTerms = (locStr) => {
  if (!locStr || !locStr.trim()) return [];
  const tokens = locStr
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t !== "india");

  const terms = new Set();
  for (const token of tokens) {
    terms.add(token);
    if (CITY_STATE_MAP[token]) {
      terms.add(CITY_STATE_MAP[token].toLowerCase());
    }
  }
  return Array.from(terms);
};

// @desc  Get crop prices (strictly for farmer's registered location)
// @route GET /api/prices?category=grains&search=wheat&location=Gujarat
const getCropPrices = async (req, res) => {
  try {
    const { category, search, location, state, showAll } = req.query;
    const filter = {};

    if (category && category.trim() && category.toLowerCase() !== "all") {
      filter.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }
    if (search && search.trim()) {
      filter.cropName = { $regex: search.trim(), $options: "i" };
    }

    // Auto-detect farmer's location from profile if not explicitly passed
    let targetLoc = location || state;
    if (!targetLoc && req.user && req.user.location && showAll !== "true") {
      targetLoc = req.user.location;
    }

    const isFarmerLocationMode = targetLoc && targetLoc.trim() && targetLoc.toLowerCase() !== "all" && showAll !== "true";

    if (isFarmerLocationMode) {
      const terms = resolveLocationTerms(targetLoc);
      if (terms.length > 0) {
        filter.$or = terms.flatMap((term) => [
          { state: { $regex: term, $options: "i" } },
          { market: { $regex: term, $options: "i" } },
        ]);
      }
    }

    // Fetch Mandi prices for farmer location strictly
    const prices = await CropPrice.find(filter).sort({ cropName: 1 });

    res.json({
      success: true,
      userLocation: req.user?.location || null,
      appliedLocation: targetLoc || null,
      isFarmerLocationMode,
      count: prices.length,
      data: prices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single crop price
// @route GET /api/prices/:id
const getCropPrice = async (req, res) => {
  try {
    const price = await CropPrice.findById(req.params.id);
    if (!price) return res.status(404).json({ success: false, message: "Price not found" });
    res.json({ success: true, data: price });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const { getIO } = require("../config/socketManager");

// @desc  Add crop price (admin only)
// @route POST /api/prices
const addCropPrice = async (req, res) => {
  try {
    const price = await CropPrice.create(req.body);
    res.status(201).json({ success: true, data: price });

    try {
      getIO().emit("mandi_price_updated", price);
    } catch (e) {
      // ignore if socket is not initialized
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update crop price (admin only)
// @route PUT /api/prices/:id
const updateCropPrice = async (req, res) => {
  try {
    const price = await CropPrice.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after" });
    if (!price) return res.status(404).json({ success: false, message: "Price not found" });
    res.json({ success: true, data: price });

    try {
      getIO().emit("mandi_price_updated", price);
    } catch (e) {
      // ignore if socket is not initialized
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getCropPrices, getCropPrice, addCropPrice, updateCropPrice };
