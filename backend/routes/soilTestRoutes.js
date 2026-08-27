const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { createSoilTest, getMySoilTests } = require("../controllers/soilTestController");

router.use(protect);
router.use(authorize("farmer"));

router.route("/")
  .post(createSoilTest)
  .get(getMySoilTests);

module.exports = router;
