const mongoose = require("mongoose")

// Ingredient categories that map to "groceries" vs "supplies" in Cashout
const GROCERY_CATS = ["meat", "vegetables", "dairy", "grains", "spices", "oil", "beverages"]

const purchaseSchema = new mongoose.Schema(
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
    costPerUnit: {
      type:     Number,
      required: [true, "Cost per unit is required"],
      min:      [0, "Cost cannot be negative"],
    },
    totalCost: {
      type: Number,
    },
    supplier: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    purchasedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Purchased by is required"],
    },
    purchaseDate: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// ─── pre-save hook ─────────────────────────────────────────────────────────────

purchaseSchema.pre("save", async function () {
  if (!this.isNew) return

  const Ingredient = mongoose.model("Ingredient")
  const ingredient = await Ingredient.findById(this.ingredient)

  if (!ingredient) throw new Error("Ingredient not found")

  // 1. Inherit unit from ingredient if not provided
  if (!this.unit) this.unit = ingredient.unit

  // 2. Calculate totalCost
  this.totalCost = parseFloat((this.quantity * this.costPerUnit).toFixed(2))

  // 3. Capture pre-update status
  const prevStatus = ingredient.status

  // 4. Update ingredient stock and cost price
  ingredient.currentStock = parseFloat((ingredient.currentStock + this.quantity).toFixed(4))
  ingredient.costPerUnit  = this.costPerUnit
  await ingredient.save()

  // 5. Flag for socket-restored event (checked in controller)
  const newStatus = ingredient.status
  if (prevStatus !== "ok" && newStatus === "ok") {
    this._stockRestored      = true
    this._restoredIngredient = ingredient
  }

  // 6. Auto-create Cashout record
  const Cashout = mongoose.model("Cashout")
  const cashoutCategory = GROCERY_CATS.includes(ingredient.category) ? "groceries" : "supplies"

  await Cashout.create({
    description: `Purchase: ${ingredient.name} - ${this.quantity} ${this.unit} @ Rs ${this.costPerUnit}`,
    amount:      this.totalCost,
    category:    cashoutCategory,
    recordedBy:  this.purchasedBy,
  })
})

module.exports = mongoose.model("Purchase", purchaseSchema)
