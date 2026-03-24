const mongoose = require("mongoose")
const { PAYMENT_METHODS, PAYMENT_STATUS } = require("../constants")

const BillSchema = new mongoose.Schema({
  tableNumber:   { type: String, required: true },
  orders:        [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  subtotal:      { type: Number, required: true },
  vatPercent:    { type: Number, default: 13 },
  vatAmount:     { type: Number, required: true },
  tipAmount:     { type: Number, default: 0 },       // ← tip
  totalAmount:   { type: Number, required: true },   // subtotal + vat + tip
  paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.UNPAID },
  generatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidAt:        { type: Date, default: null },
  note:          { type: String, default: "" },
}, { timestamps: true })

module.exports = mongoose.model("Bill", BillSchema)