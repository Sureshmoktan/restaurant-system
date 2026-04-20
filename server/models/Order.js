const mongoose = require("mongoose")
const { ORDER_STATUS } = require("../constants")

const SelectedOptionSchema = new mongoose.Schema({
  groupName: { type: String },
  selected:  [String],
}, { _id: false })

const SelectedVariantSchema = new mongoose.Schema({
  groupName: { type: String },
  label:     { type: String },
  price:     { type: Number },
}, { _id: false })

const OrderItemSchema = new mongoose.Schema({
  menuItem:            { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
  name:                { type: String, required: true },
  price:               { type: Number, required: true },
  category:            { type: String, default: "main" },
  destination:         { type: String, enum: ["kitchen", "bar"], default: "kitchen" },
  quantity:            { type: Number, default: 1 },
  selectedIngredients: [String],
  removedIngredients:  [String],
  selectedOptions:     [SelectedOptionSchema],
  selectedVariants:    [SelectedVariantSchema],
  status: {
    type:    String,
    enum:    ["pending", "cooking", "ready", "served"],
    default: "pending",
  },
  cookingStartedAt: { type: Date,   default: null }, // when cook started this item
  estimatedSecs:    { type: Number, default: null }, // cook's estimated prep time in seconds
}, { _id: true })

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
  estimatedTime: { type: Number, default: null },  // minutes
  estimatedAt:   { type: Date,   default: null },  // when kitchen set the estimate
  statusHistory: [{
    status:    String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
}, { timestamps: true })

// Syncs order-level status from all item statuses
OrderSchema.methods.syncStatus = function () {
  const statuses = this.items.map(i => i.status)
  if (statuses.every(s => s === "served")) {
    this.status = ORDER_STATUS.SERVED
  } else if (statuses.some(s => s === "cooking" || s === "ready")) {
    this.status = ORDER_STATUS.COOKING
  } else {
    this.status = ORDER_STATUS.PENDING
  }
}

// Returns true when every item is served — controller uses this
// to flip the table status to "billing"
OrderSchema.methods.isFullyServed = function () {
  return this.items.length > 0 && this.items.every(i => i.status === "served")
}

module.exports = mongoose.model("Order", OrderSchema)