const Menu       = require("../models/Menu")
const Ingredient = require("../models/Ingredient")

// ─── internal helpers ─────────────────────────────────────────────────────────

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const emitStockAlert = (io, ingredient) => {
  const type    = ingredient.currentStock === 0 ? "out" : "low"
  const message = type === "out"
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

  const dest = ingredient.destination
  if (dest === "kitchen" || dest === "both") io.to("kitchen").emit("stock-alert", payload)
  if (dest === "bar"     || dest === "both") io.to("bar").emit("stock-alert", payload)
  io.to("cashier").emit("stock-alert", payload)
}

// When an ingredient hits 0 — disable all menu items whose recipe uses it
const disableMenusByIngredient = async (ingredient, io) => {
  const nameRegex = new RegExp(`^${escapeRegex(ingredient.name)}$`, "i")

  const affected = await Menu.find({
    $or: [
      { "recipe.ingredient": ingredient._id },
      { "ingredients.name":  nameRegex },
    ],
    isAvailable: true,
  }).lean()

  if (affected.length === 0) return

  await Menu.updateMany(
    {
      $or: [
        { "recipe.ingredient": ingredient._id },
        { "ingredients.name":  nameRegex },
      ],
    },
    { $set: { isAvailable: false } }
  )

  io.emit("menu-availability-update", {
    message:      `${ingredient.name} is out of stock — ${affected.length} menu item(s) marked unavailable`,
    disabledItems: affected.map((m) => m._id.toString()),
  })
}

// ─── variant quantity multiplier ──────────────────────────────────────────────

const variantMultiplier = (selectedVariants = []) => {
  const labels = selectedVariants.map((v) => (v.label || "").toLowerCase())
  if (labels.includes("half"))   return 0.5
  if (labels.includes("family")) return 2.0
  return 1
}

// ─── deductIngredients ────────────────────────────────────────────────────────
// @param orderItems  — array of order item sub-documents or plain objects
//                      each must have: menuItem (id), quantity, selectedVariants
// @param io          — socket.io server instance for alert emissions
const deductIngredients = async (orderItems, io) => {
  for (const orderItem of orderItems) {
    const menu = await Menu.findById(orderItem.menuItem).populate("recipe.ingredient")
    if (!menu || !menu.recipe || menu.recipe.length === 0) continue

    const mult = variantMultiplier(orderItem.selectedVariants)

    for (const row of menu.recipe) {
      const ingredient = row.ingredient   // populated
      if (!ingredient) continue

      const deduct    = parseFloat((row.quantity * orderItem.quantity * mult).toFixed(4))
      const prevStock = ingredient.currentStock
      const newStock  = Math.max(0, parseFloat((prevStock - deduct).toFixed(4)))

      ingredient.currentStock = newStock
      await ingredient.save()

      if (newStock <= ingredient.minThreshold) {
        emitStockAlert(io, ingredient)
      }

      if (newStock === 0 && prevStock > 0) {
        await disableMenusByIngredient(ingredient, io)
      }
    }
  }
}

// ─── restoreIngredients ───────────────────────────────────────────────────────
// Reverse of deduct. Called when an order is cancelled.
const restoreIngredients = async (orderItems) => {
  for (const orderItem of orderItems) {
    const menu = await Menu.findById(orderItem.menuItem).populate("recipe.ingredient")
    if (!menu || !menu.recipe || menu.recipe.length === 0) continue

    const mult = variantMultiplier(orderItem.selectedVariants)

    for (const row of menu.recipe) {
      const ingredient = row.ingredient
      if (!ingredient) continue

      const restore = parseFloat((row.quantity * orderItem.quantity * mult).toFixed(4))
      ingredient.currentStock = parseFloat((ingredient.currentStock + restore).toFixed(4))
      await ingredient.save()
    }
  }
}

// ─── checkAvailability ────────────────────────────────────────────────────────
// Returns { available: boolean, insufficientItems: [...] }
// Checks if all recipe ingredients have enough stock for the given orderItem.
const checkAvailability = async (menuItemId, quantity = 1, selectedVariants = []) => {
  const menu = await Menu.findById(menuItemId).populate("recipe.ingredient")
  if (!menu || !menu.recipe || menu.recipe.length === 0) {
    return { available: true, insufficientItems: [] }
  }

  const mult             = variantMultiplier(selectedVariants)
  const insufficientItems = []

  for (const row of menu.recipe) {
    const ingredient = row.ingredient
    if (!ingredient) continue

    const needed = parseFloat((row.quantity * quantity * mult).toFixed(4))
    if (ingredient.currentStock < needed) {
      insufficientItems.push({
        menuItem:       menu.name,
        ingredientName: ingredient.name,
        needed,
        available:      ingredient.currentStock,
        unit:           ingredient.unit,
      })
    }
  }

  return {
    available:        insufficientItems.length === 0,
    insufficientItems,
  }
}

module.exports = { deductIngredients, restoreIngredients, checkAvailability }
