const mongoose = require("mongoose")

const wasteLogSchema = new mongoose.Schema(
  {
    ingredient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Ingredient",
      required: [true, "Ingredient is required"],
    },
    quantity: {
      type:     Number,
      required: [true, "Quantity is required"],
      min:      [0.01, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
    },
    reason: {
      type:     String,
      enum:     ["expired", "spoiled", "damaged", "spilled", "overcooked", "other"],
      required: [true, "Reason is required"],
    },
    notes: {
      type: String,
      trim: true,
    },
    loggedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Logged by is required"],
    },
  },
  { timestamps: true }
)

wasteLogSchema.pre("save", async function () {
  if (!this.isNew) return

  const Ingredient = mongoose.model("Ingredient")
  const Menu       = mongoose.model("Menu")

  const ingredient = await Ingredient.findById(this.ingredient)
  if (!ingredient) throw new Error("Ingredient not found")

  // 1. Inherit unit from ingredient if not provided
  if (!this.unit) this.unit = ingredient.unit

  // 2. Subtract from stock — floor at 0
  const prevStock         = ingredient.currentStock
  ingredient.currentStock = Math.max(0, parseFloat((prevStock - this.quantity).toFixed(4)))
  const newStock          = ingredient.currentStock
  await ingredient.save()

  // 3. Flag for stock-alert if at or below threshold now
  if (newStock <= ingredient.minThreshold) {
    this._alertIngredient = ingredient
  }

  // 4. If stock hit 0 — disable all menu items that use this ingredient
  if (newStock === 0 && prevStock > 0) {
    const nameRegex  = new RegExp(`^${ingredient.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
    const affected   = await Menu.find({ "ingredients.name": nameRegex, isAvailable: true }).lean()

    if (affected.length > 0) {
      await Menu.updateMany(
        { "ingredients.name": nameRegex },
        { $set: { isAvailable: false } }
      )
      this._unavailableMenuItems = affected
    }
  }
})

module.exports = mongoose.model("WasteLog", wasteLogSchema)
