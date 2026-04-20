const Ingredient  = require("../models/Ingredient")
const asyncHandler = require("../utils/asyncHandler")
const STATUS_CODES = require("../constants/statusCodes")

// ─── helpers ────────────────────────────────────────────────────────────────

const emitStockAlert = (io, ingredient) => {
  const type = ingredient.currentStock === 0 ? "out" : "low"
  const message =
    type === "out"
      ? `${ingredient.name} is out of stock!`
      : `${ingredient.name} is running low (${ingredient.currentStock} ${ingredient.unit} remaining)`

  const payload = {
    type,
    ingredient: {
      _id:          ingredient._id,
      name:         ingredient.name,
      currentStock: ingredient.currentStock,
      unit:         ingredient.unit,
      minThreshold: ingredient.minThreshold,
    },
    message,
  }

  const { destination } = ingredient
  if (destination === "kitchen" || destination === "both") io.to("kitchen").emit("stock-alert", payload)
  if (destination === "bar"     || destination === "both") io.to("bar").emit("stock-alert", payload)
  // always notify cashier
  io.to("cashier").emit("stock-alert", payload)
}

// ─── GET /api/v1/ingredients ────────────────────────────────────────────────
// @access admin, cashier, kitchen, bar
const getAllIngredients = asyncHandler(async (req, res) => {
  const { category, status, destination, search } = req.query
  const filter = { isActive: true }

  if (category)    filter.category    = category
  if (destination) filter.destination = destination
  if (search)      filter.name        = { $regex: search.trim(), $options: "i" }

  let ingredients = await Ingredient.find(filter).sort({ name: 1 })

  // virtual "status" filter — must be applied in JS
  if (status) ingredients = ingredients.filter((i) => i.status === status)

  res.status(STATUS_CODES.OK).json({
    success:     true,
    message:     "Ingredients fetched successfully",
    count:       ingredients.length,
    ingredients,
  })
})

// ─── GET /api/v1/ingredients/stats/overview ─────────────────────────────────
// @access admin
const getIngredientStats = asyncHandler(async (req, res) => {
  const allActive = await Ingredient.find({ isActive: true })

  let lowStock = 0, outOfStock = 0, totalValue = 0

  allActive.forEach((ing) => {
    const s = ing.status
    if (s === "out") outOfStock++
    else if (s === "low") lowStock++
    totalValue += ing.currentStock * ing.costPerUnit
  })

  res.status(STATUS_CODES.OK).json({
    success: true,
    stats: {
      total:      allActive.length,
      lowStock,
      outOfStock,
      totalValue: Math.round(totalValue * 100) / 100,
    },
  })
})

// ─── GET /api/v1/ingredients/:id ────────────────────────────────────────────
// @access admin
const getIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findOne({ _id: req.params.id, isActive: true })

  if (!ingredient) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("Ingredient not found")
  }

  res.status(STATUS_CODES.OK).json({ success: true, ingredient })
})

// ─── POST /api/v1/ingredients ───────────────────────────────────────────────
// @access admin
const createIngredient = asyncHandler(async (req, res) => {
  const { name } = req.body

  if (!name || !name.trim()) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Name is required")
  }

  const duplicate = await Ingredient.findOne({
    name:     { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    isActive: true,
  })
  if (duplicate) {
    res.status(STATUS_CODES.CONFLICT)
    throw new Error("An ingredient with this name already exists")
  }

  const ingredient = await Ingredient.create(req.body)

  res.status(STATUS_CODES.CREATED).json({
    success:    true,
    message:    "Ingredient created successfully",
    ingredient,
  })
})

// ─── PUT /api/v1/ingredients/:id ────────────────────────────────────────────
// @access admin
const updateIngredient = asyncHandler(async (req, res) => {
  const existing = await Ingredient.findOne({ _id: req.params.id, isActive: true })

  if (!existing) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("Ingredient not found")
  }

  const stockChanged =
    req.body.currentStock !== undefined &&
    Number(req.body.currentStock) !== existing.currentStock

  const updated = await Ingredient.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )

  if (stockChanged) {
    const io = req.app.get("io")
    if (updated.status === "low" || updated.status === "out") {
      emitStockAlert(io, updated)
    }
  }

  res.status(STATUS_CODES.OK).json({
    success:    true,
    message:    "Ingredient updated successfully",
    ingredient: updated,
  })
})

// ─── DELETE /api/v1/ingredients/:id  (soft delete) ──────────────────────────
// @access admin
const deleteIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findOne({ _id: req.params.id, isActive: true })

  if (!ingredient) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("Ingredient not found")
  }

  ingredient.isActive = false
  await ingredient.save()

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: "Ingredient deleted successfully",
  })
})

module.exports = {
  getAllIngredients,
  getIngredientStats,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
}
