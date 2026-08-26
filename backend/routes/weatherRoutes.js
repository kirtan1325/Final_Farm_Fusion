// backend/routes/weatherRoutes.js
const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getWeather, getForecast } = require("../controllers/weatherController");

router.get("/",         protect, getWeather);
router.get("/forecast", protect, getForecast);

module.exports = router;
