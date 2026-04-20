// server/models/Bill.js

const mongoose = require("mongoose")
const { PAYMENT_METHODS, PAYMENT_STATUS } = require("../constants")

const BillSchema = new mongoose.Schema({
  tableNumber:   { type: String, required: true },
  orders:        [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  
  // ✅ ADD THIS ITEMS ARRAY (if not already present)
  items:         [{  
    name: String,
    price: Number,
    quantity: Number,
    selectedVariants: Array
  }],
  
  subtotal:      { type: Number, required: true },
  vatPercent:    { type: Number, default: 13 },
  vatAmount:     { type: Number, required: true },
  tipAmount:     { type: Number, default: 0 },  
  discountAmount: { type: Number, default: 0 },
  appliedOffers:  { type: Array,  default: [] },
  discountedSubtotal: { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  // ── Cashier Manual Discount ─────────────────────────────────────────────────
  cashierDiscount:       { type: Number, default: 0, min: 0, max: 15 },      // percentage (0–15)
  cashierDiscountAmount: { type: Number, default: 0 },                        // actual Rs amount
  cashierDiscountReason: {
    type: String,
    enum: ["regular_customer", "daily_visitor", "special_occasion", "birthday", "complaint_resolution", "manager_approval", "other", null],
    default: null,
  },
  cashierDiscountNote: { type: String, default: "" },                         // free-text note (used when reason = "other")
  cashierDiscountBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // ── Discount Spin Game ──────────────────────────────────────────────────────
  discountGameEnabled: { type: Boolean, default: false },  // cashier enabled per-table
  discountGamePlayed:  { type: Boolean, default: false },
  discountGameResult:  { type: Number,  default: null  }, // % won, e.g. 20
  discountGameAmount:  { type: Number,  default: 0     }, // actual Rs discount applied

  paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.UNPAID },
  generatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidAt:        { type: Date, default: null },
  note:          { type: String, default: "" },
}, { timestamps: true })

module.exports = mongoose.model("Bill", BillSchema)