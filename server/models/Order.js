const mongoose = require("mongoose")
const { ORDER_STATUS } = require("../constants")

const SelectedOptionSchema = new mongoose.Schema({
  groupName: { type: String },
  selected:  [String],
}, { _id: false })

const OrderItemSchema = new mongoose.Schema({
  menuItem:            { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
  name:                { type: String, required: true },
  price:               { type: Number, required: true },
  category:            { type: String, default: "main" },  
  destination:         { type: String, enum: ["kitchen", "bar"], default: "kitchen" }, // ← add this
  quantity:            { type: Number, default: 1 },
  selectedIngredients: [String],
  removedIngredients:  [String],
  selectedOptions:     [SelectedOptionSchema],
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  tableNumber:   { type: String, required: true },
  items:         [OrderItemSchema],
  status: {
    type:    String,
    enum:    Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  totalAmount:   { type: Number, required: true },
  cancelReason:  { type: String, default: null },
  cancelledAt:   { type: Date,   default: null },
  cancelledBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  statusHistory: [{
    status:    String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
}, { timestamps: true })

module.exports = mongoose.model("Order", OrderSchema)