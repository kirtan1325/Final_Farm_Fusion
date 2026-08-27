// backend/controllers/inventoryController.js
const InventoryExpense = require("../models/InventoryExpense");

// @desc  Create an expense/inventory item
// @route POST /api/inventory
const createExpense = async (req, res) => {
  try {
    const expense = await InventoryExpense.create({
      ...req.body,
      farmer: req.user._id,
    });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Get farmer's inventory/expenses
// @route GET /api/inventory
const getExpenses = async (req, res) => {
  try {
    const expenses = await InventoryExpense.find({ farmer: req.user._id }).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete an expense
// @route DELETE /api/inventory/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await InventoryExpense.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, message: "Expense removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get expense stats for graphs
// @route GET /api/inventory/stats
const getExpenseStats = async (req, res) => {
  try {
    const expenses = await InventoryExpense.find({ farmer: req.user._id });
    
    // Group by category
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.cost;
      return acc;
    }, {});
    
    // Total cost
    const totalCost = expenses.reduce((sum, exp) => sum + exp.cost, 0);

    // Prepare arrays for recharts
    const categoryData = Object.keys(byCategory).map(key => ({
      name: key,
      value: byCategory[key]
    }));

    res.json({
      success: true,
      data: {
        totalCost,
        categoryData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createExpense, getExpenses, deleteExpense, getExpenseStats };
