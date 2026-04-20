// server/models/DiscountGame.js
// Singleton model — only ONE document exists (the current game configuration)

const mongoose = require("mongoose")

const SliceSchema = new mongoose.Schema({
  label:    { type: String, required: true },
  discount: { type: Number, required: true },   // percentage, e.g. 20 means 20%
  weight:   { type: Number, required: true },   // relative probability weight
  color:    { type: String, required: true },   // hex color for the wheel
}, { _id: false })

const TierSchema = new mongoose.Schema({
  tierName: { type: String, required: true },   // "small" | "medium" | "large"
  minBill:  { type: Number, required: true },
  maxBill:  { type: Number, required: true },
  slices:   [SliceSchema],
}, { _id: false })

const DiscountGameSchema = new mongoose.Schema({
  isEnabled:         { type: Boolean, default: false },
  tiers: {
    type: [TierSchema],
    default: [
      {
        tierName: "small",
        minBill:  0,
        maxBill:  1000,
        slices: [
          { label: "5%",   discount: 5,   weight: 20, color: "#10b981" },
          { label: "10%",  discount: 10,  weight: 25, color: "#3b82f6" },
          { label: "15%",  discount: 15,  weight: 20, color: "#8b5cf6" },
          { label: "20%",  discount: 20,  weight: 15, color: "#f59e0b" },
          { label: "25%",  discount: 25,  weight: 10, color: "#ef4444" },
          { label: "30%",  discount: 30,  weight: 5,  color: "#ec4899" },
          { label: "50%",  discount: 50,  weight: 3,  color: "#14b8a6" },
          { label: "FREE!", discount: 100, weight: 2,  color: "#fbbf24" },
        ],
      },
      {
        tierName: "medium",
        minBill:  1000,
        maxBill:  5000,
        slices: [
          { label: "5%",   discount: 5,   weight: 35,  color: "#10b981" },
          { label: "10%",  discount: 10,  weight: 30,  color: "#3b82f6" },
          { label: "15%",  discount: 15,  weight: 15,  color: "#8b5cf6" },
          { label: "20%",  discount: 20,  weight: 10,  color: "#f59e0b" },
          { label: "25%",  discount: 25,  weight: 5,   color: "#ef4444" },
          { label: "30%",  discount: 30,  weight: 3,   color: "#ec4899" },
          { label: "50%",  discount: 50,  weight: 1.5, color: "#14b8a6" },
          { label: "FREE!", discount: 100, weight: 0.5, color: "#fbbf24" },
        ],
      },
      {
        tierName: "large",
        minBill:  5000,
        maxBill:  10000,
        slices: [
          { label: "5%",  discount: 5,  weight: 45, color: "#10b981" },
          { label: "10%", discount: 10, weight: 30, color: "#3b82f6" },
          { label: "15%", discount: 15, weight: 15, color: "#8b5cf6" },
          { label: "20%", discount: 20, weight: 7,  color: "#f59e0b" },
          { label: "25%", discount: 25, weight: 3,  color: "#ef4444" },
        ],
      },
    ],
  },
  maxDiscountAmount: { type: Number, default: 500   },  // Rs cap on discount
  maxBillForGame:    { type: Number, default: 10000 },  // bills above this can't play
  totalGamesPlayed:  { type: Number, default: 0     },
  totalDiscountGiven:{ type: Number, default: 0     },  // running Rs total
}, { timestamps: true })

// ── Static: return singleton, creating with defaults if none exists ─────────────
DiscountGameSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) settings = await this.create({})
  return settings
}

// ── Static: return the correct tier's slices for a given bill amount ─────────────
DiscountGameSchema.statics.getTierForBill = async function (billAmount) {
  const settings = await this.getSettings()
  if (billAmount > settings.maxBillForGame) return null

  const tier = settings.tiers.find(
    (t) => billAmount >= t.minBill && billAmount <= t.maxBill
  )
  return tier ? tier.slices : null
}

module.exports = mongoose.model("DiscountGame", DiscountGameSchema)
