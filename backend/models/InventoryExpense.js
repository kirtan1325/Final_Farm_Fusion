const mongoose = require("mongoose");

const inventoryExpenseSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    enum: ["Seed", "Fertilizer", "Pesticide", "Labor", "Equipment", "Other"],
    required: true,
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    default: "kg"
  },
  cost: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  cropRef: {
    type: String,
    trim: true,
    description: "Optional name of the crop this expense is for to calculate P/L"
  }
}, { timestamps: true });

module.exports = mongoose.model("InventoryExpense", inventoryExpenseSchema);
