const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    customerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);