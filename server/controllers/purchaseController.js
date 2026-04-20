const Purchase    = require("../models/Purchase")
const asyncHandler = require("../utils/asyncHandler")
const STATUS_CODES = require("../constants/statusCodes")

// ─── helper: emit stock-restored ─────────────────────────────────────────────

const emitStockRestored = (io, ingredient) => {
  const payload = {
    type:       "restored",
    ingredient: {
      _id:          ingredient._id,
      name:         ingredient.name,
      currentStock: ingredient.currentStock,
      unit:         ingredient.unit,
      minThreshold: ingredient.minThreshold,
    },
    message: `${ingredient.name} restocked — ${ingredient.currentStock} ${ingredient.unit} now available`,
  }

  const dest = ingredient.destination
  if (dest === "kitchen" || dest === "both") io.to("kitchen").emit("stock-restored", payload)
  if (dest === "bar"     || dest === "both") io.to("bar").emit("stock-restored", payload)
  io.to("cashier").emit("stock-restored", payload)
}

// ─── GET /api/v1/purchases ────────────────────────────────────────────────────
// @access admin
const getAllPurchases = asyncHandler(async (req, res) => {
  const { ingredient, startDate, endDate } = req.query
  const filter = {}

  if (ingredient) filter.ingredient = ingredient

  if (startDate || endDate) {
    filter.purchaseDate = {}
    if (startDate) filter.purchaseDate.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.purchaseDate.$lte = end
    }
  }

  const purchases = await Purchase.find(filter)
    .populate("ingredient", "name unit category")
    .populate("purchasedBy", "name")
    .sort({ purchaseDate: -1 })

  res.status(STATUS_CODES.OK).json({
    success:   true,
    count:     purchases.length,
    purchases,
  })
})

// ─── GET /api/v1/purchases/stats ─────────────────────────────────────────────
// @access admin
const getPurchaseStats = asyncHandler(async (req, res) => {
  const now   = new Date()

  const todayStart = new Date(now); todayStart.setHours(0,  0,  0,   0)
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [todayPurchases, monthPurchases, topResult] = await Promise.all([
    Purchase.find({ purchaseDate: { $gte: todayStart, $lte: todayEnd } }),
    Purchase.find({ purchaseDate: { $gte: monthStart, $lte: monthEnd } }),
    Purchase.aggregate([
      { $group: { _id: "$ingredient", count: { $sum: 1 }, totalQty: { $sum: "$quantity" } } },
      { $sort:  { count: -1 } },
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
          count:    1,
          totalQty: 1,
          name:     "$ingredient.name",
          unit:     "$ingredient.unit",
        },
      },
    ]),
  ])

  const todaySpent = todayPurchases.reduce((s, p) => s + (p.totalCost || 0), 0)
  const monthSpent = monthPurchases.reduce((s, p) => s + (p.totalCost || 0), 0)

  res.status(STATUS_CODES.OK).json({
    success: true,
    stats: {
      todaySpent:     Math.round(todaySpent * 100) / 100,
      monthSpent:     Math.round(monthSpent * 100) / 100,
      totalCount:     monthPurchases.length,
      topIngredient:  topResult[0] || null,
    },
  })
})

// ─── POST /api/v1/purchases ───────────────────────────────────────────────────
// @access admin
const createPurchase = asyncHandler(async (req, res) => {
  const { ingredient, quantity, costPerUnit, unit, supplier, invoiceNumber, notes, purchaseDate } = req.body

  if (!ingredient || !quantity || costPerUnit === undefined) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("ingredient, quantity and costPerUnit are required")
  }

  const purchase = new Purchase({
    ingredient,
    quantity:      Number(quantity),
    costPerUnit:   Number(costPerUnit),
    unit,
    supplier,
    invoiceNumber,
    notes,
    purchasedBy:   req.user._id,
    purchaseDate:  purchaseDate ? new Date(purchaseDate) : Date.now(),
  })

  await purchase.save()

  // Emit socket event if stock was restored from low/out → ok
  if (purchase._stockRestored && purchase._restoredIngredient) {
    const io = req.app.get("io")
    emitStockRestored(io, purchase._restoredIngredient)
  }

  // Populate for response
  await purchase.populate("ingredient", "name unit category currentStock")
  await purchase.populate("purchasedBy", "name")

  res.status(STATUS_CODES.CREATED).json({
    success:  true,
    message:  "Purchase recorded successfully",
    purchase,
  })
})

module.exports = { getAllPurchases, getPurchaseStats, createPurchase }
