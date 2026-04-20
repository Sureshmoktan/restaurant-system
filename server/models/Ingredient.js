const mongoose = require("mongoose")

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      unique:   true,
      trim:     true,
    },
    category: {
      type: String,
      enum: ["meat", "vegetables", "dairy", "grains", "spices", "oil", "beverages", "alcohol", "other"],
      default: "other",
    },
    currentStock: {
      type:     Number,
      required: [true, "Current stock is required"],
      min:      [0, "Stock cannot be negative"],
      default:  0,
    },
    unit: {
      type:     String,
      enum:     ["kg", "g", "L", "ml", "pieces", "packets", "bottles", "dozens"],
      required: [true, "Unit is required"],
    },
    minThreshold: {
      type:     Number,
      required: [true, "Minimum threshold is required"],
      min:      [0, "Threshold cannot be negative"],
    },
    costPerUnit: {
      type:    Number,
      min:     [0, "Cost cannot be negative"],
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    destination: {
      type:    String,
      enum:    ["kitchen", "bar", "both"],
      default: "kitchen",
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

ingredientSchema.virtual("status").get(function () {
  if (this.currentStock === 0)                              return "out"
  if (this.currentStock > 0 && this.currentStock <= this.minThreshold) return "low"
  return "ok"
})

ingredientSchema.set("toJSON",   { virtuals: true })
ingredientSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Ingredient", ingredientSchema)
