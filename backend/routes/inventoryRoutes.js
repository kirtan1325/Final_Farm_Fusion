const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { createExpense, getExpenses, deleteExpense, getExpenseStats } = require("../controllers/inventoryController");

router.use(protect);
router.use(authorize("farmer")); // only farmers track inventory this way

router.route("/")
  .post(createExpense)
  .get(getExpenses);

router.get("/stats", getExpenseStats);

router.route("/:id")
  .delete(deleteExpense);

module.exports = router;
