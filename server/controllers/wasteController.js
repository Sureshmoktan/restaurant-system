const WasteLog   = require("../models/WasteLog")
const Ingredient = require("../models/Ingredient")
const asyncHandler = require("../utils/asyncHandler")
const STATUS_CODES = require("../constants/statusCodes")

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── GET /api/v1/waste ───────────────────────────────────────────────────────
// @access admin, kitchen, bar
const getWasteLogs = asyncHandler(async (req, res) => {
  const { reason, ingredient, startDate, endDate } = req.query
  const filter = {}

  if (reason)     filter.reason     = reason
  if (ingredient) filter.ingredient = ingredient

  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }

  const logs = await WasteLog.find(filter)
    .populate("ingredient", "name unit category costPerUnit destination")
    .populate("loggedBy",   "name role")
    .sort({ createdAt: -1 })

  res.status(STATUS_CODES.OK).json({
    success: true,
    count:   logs.length,
    logs,
  })
})

// ─── POST /api/v1/waste ──────────────────────────────────────────────────────
// @access admin, kitchen, bar, cashier
const createWasteLog = asyncHandler(async (req, res) => {
  const { ingredient: ingredientId, quantity, reason, notes } = req.body

  if (!ingredientId || !quantity || !reason) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("ingredient, quantity and reason are required")
  }

  const ingredient = await Ingredient.findOne({ _id: ingredientId, isActive: true })
  if (!ingredient) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("Ingredient not found")
  }

  if (Number(quantity) > ingredient.currentStock) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(
      `Cannot waste more than current stock (${ingredient.currentStock} ${ingredient.unit})`
    )
  }

  const log = new WasteLog({
    ingredient: ingredientId,
    quantity:   Number(quantity),
    reason,
    notes,
    loggedBy:   req.user._id,
  })

  await log.save()

  const io = req.app.get("io")

  if (log._alertIngredient) {
    emitStockAlert(io, log._alertIngredient)
  }

  if (log._unavailableMenuItems?.length > 0) {
    io.emit("menu-availability-update", {
      message:      `${log._alertIngredient?.name} is out — ${log._unavailableMenuItems.length} menu item(s) marked unavailable`,
      disabledItems: log._unavailableMenuItems.map(m => m._id),
    })
  }

  await log.populate("ingredient", "name unit category costPerUnit destination")
  await log.populate("loggedBy",   "name role")

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Waste logged successfully",
    log,
  })
})

// ─── GET /api/v1/waste/stats ─────────────────────────────────────────────────
// @access admin
const getWasteStats = asyncHandler(async (req, res) => {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [byReason, topIngredient, dailyTrend, monthLogs] = await Promise.all([
    // Waste grouped by reason this month
    WasteLog.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: "$reason", count: { $sum: 1 }, totalQty: { $sum: "$quantity" } } },
      { $sort:  { count: -1 } },
    ]),

    // Most wasted ingredient all-time
    WasteLog.aggregate([
      { $group: { _id: "$ingredient", totalQty: { $sum: "$quantity" }, count: { $sum: 1 } } },
      { $sort:  { totalQty: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from:         "ingredients",
          localField:   "_id",
          foreignField: "_id",
          as:           "ingredient",
        },
      },
      { $unwind: { path: "$ingredient", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          totalQty: 1,
          count:    1,
          name:     "$ingredient.name",
          unit:     "$ingredient.unit",
        },
      },
    ]),

    // Daily trend last 30 days
    WasteLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:        "$createdAt" },
            month: { $month:       "$createdAt" },
            day:   { $dayOfMonth:  "$createdAt" },
          },
          count:    { $sum: 1 },
          totalQty: { $sum: "$quantity" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),

    // Month logs with ingredient for cost calc
    WasteLog.find({ createdAt: { $gte: monthStart, $lte: monthEnd } })
      .populate("ingredient", "costPerUnit"),
  ])

  const totalWasteCost = monthLogs.reduce(
    (sum, log) => sum + (log.ingredient?.costPerUnit || 0) * log.quantity,
    0
  )

  res.status(STATUS_CODES.OK).json({
    success: true,
    stats: {
      monthCount:     monthLogs.length,
      totalWasteCost: Math.round(totalWasteCost * 100) / 100,
      topIngredient:  topIngredient[0] || null,
      byReason,
      dailyTrend,
    },
  })
})

module.exports = { getWasteLogs, createWasteLog, getWasteStats }
