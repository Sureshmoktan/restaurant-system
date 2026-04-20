const Ingredient  = require("../models/Ingredient")
const WasteLog    = require("../models/WasteLog")
const Purchase    = require("../models/Purchase")
const asyncHandler = require("../utils/asyncHandler")
const STATUS_CODES = require("../constants/statusCodes")

// ─── GET /api/v1/ingredients/analytics ──────────────────────────────────────
// Returns all data needed for the Inventory Analytics dashboard
// @access admin
const getInventoryAnalytics = asyncHandler(async (req, res) => {
  const now   = new Date()
  const ms30d = 30 * 24 * 60 * 60 * 1000
  const ms6m  = 6 * 30 * 24 * 60 * 60 * 1000

  const since30d = new Date(now - ms30d)
  const since6m  = new Date(now - ms6m)

  // ── 1. Run all queries in parallel ─────────────────────────────────────────
  const [ingredients, wasteLogs30d, purchases6m] = await Promise.all([
    Ingredient.find({ isActive: true }).lean(),
    WasteLog.find({ createdAt: { $gte: since30d } })
             .populate("ingredient", "name unit costPerUnit")
             .lean(),
    Purchase.find({ purchaseDate: { $gte: since6m } })
            .populate("ingredient", "name category")
            .lean(),
  ])

  // ── 2. Stock Levels ─────────────────────────────────────────────────────────
  const stockLevels = ingredients
    .map((ing) => ({
      name:         ing.name,
      currentStock: ing.currentStock,
      minThreshold: ing.minThreshold,
      unit:         ing.unit,
      status:       ing.currentStock === 0
                      ? "out"
                      : ing.currentStock <= ing.minThreshold
                        ? "low"
                        : "ok",
    }))
    .sort((a, b) => {
      // sort: out first, then low, then ok — within group sort by stock ascending
      const rank = { out: 0, low: 1, ok: 2 }
      return rank[a.status] - rank[b.status] || a.currentStock - b.currentStock
    })

  // ── 3. Consumption / Waste Trends (last 30 days) ────────────────────────────
  // Build a map: ingredientName → { [dateStr]: quantity }
  const ingWasteMap = {}  // name → total waste (for finding top 5)
  const dailyMap    = {}  // dateStr → { ingredientName: qty }

  wasteLogs30d.forEach((log) => {
    if (!log.ingredient) return
    const ingName = log.ingredient.name
    const dateStr = log.createdAt.toISOString().slice(0, 10) // YYYY-MM-DD

    // accumulate totals per ingredient
    ingWasteMap[ingName] = (ingWasteMap[ingName] || 0) + log.quantity

    // accumulate daily per ingredient
    if (!dailyMap[dateStr]) dailyMap[dateStr] = {}
    dailyMap[dateStr][ingName] = (dailyMap[dateStr][ingName] || 0) + log.quantity
  })

  // pick top 5 by total waste
  const top5 = Object.entries(ingWasteMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

  // build ordered array of the last 30 days
  const dailyLabels = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dailyLabels.push(d.toISOString().slice(0, 10))
  }

  const consumptionTrends = {
    top5Ingredients: top5,
    dailyData: dailyLabels.map((date) => {
      const entry = { date }
      top5.forEach((name) => {
        entry[name] = dailyMap[date]?.[name] ?? 0
      })
      return entry
    }),
  }

  // ── 4. Waste Analysis ───────────────────────────────────────────────────────
  const reasonMap     = {}  // reason → { quantity, cost }
  const ingWasteCost  = {}  // name   → { quantity, cost, unit }
  let totalWasteCost  = 0

  wasteLogs30d.forEach((log) => {
    if (!log.ingredient) return
    const cost    = log.quantity * (log.ingredient.costPerUnit || 0)
    const reason  = log.reason
    const ingName = log.ingredient.name
    const unit    = log.ingredient.unit || ""

    // by reason
    if (!reasonMap[reason]) reasonMap[reason] = { reason, quantity: 0, cost: 0 }
    reasonMap[reason].quantity += log.quantity
    reasonMap[reason].cost     += cost

    // by ingredient
    if (!ingWasteCost[ingName]) ingWasteCost[ingName] = { name: ingName, quantity: 0, cost: 0, unit }
    ingWasteCost[ingName].quantity += log.quantity
    ingWasteCost[ingName].cost     += cost

    totalWasteCost += cost
  })

  const wasteAnalysis = {
    byReason: Object.values(reasonMap).map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity.toFixed(3)),
      cost:     parseFloat(r.cost.toFixed(2)),
    })),
    byIngredient: Object.values(ingWasteCost)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map((r) => ({
        ...r,
        quantity: parseFloat(r.quantity.toFixed(3)),
        cost:     parseFloat(r.cost.toFixed(2)),
      })),
    totalCost: parseFloat(totalWasteCost.toFixed(2)),
  }

  // ── 5. Purchase History (last 6 months) ─────────────────────────────────────
  const monthSpend    = {}  // "Jan 2024" → total
  const supplierSpend = {}  // supplier   → total
  const ingSpend      = {}  // name       → total

  purchases6m.forEach((p) => {
    const d      = new Date(p.purchaseDate)
    const month  = d.toLocaleString("en-US", { month: "short", year: "numeric" })
    const sup    = p.supplier?.trim() || "Unknown"
    const name   = p.ingredient?.name || "Unknown"
    const total  = p.totalCost || 0

    monthSpend[month]    = (monthSpend[month]    || 0) + total
    supplierSpend[sup]   = (supplierSpend[sup]   || 0) + total
    ingSpend[name]       = (ingSpend[name]       || 0) + total
  })

  // build ordered monthly array (oldest → newest, last 6 months)
  const monthlyLabels = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    monthlyLabels.push(d.toLocaleString("en-US", { month: "short", year: "numeric" }))
  }

  const purchaseHistory = {
    monthlySpending: monthlyLabels.map((month) => ({
      month,
      total: parseFloat((monthSpend[month] || 0).toFixed(2)),
    })),
    topSuppliers: Object.entries(supplierSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([supplier, total]) => ({ supplier, total: parseFloat(total.toFixed(2)) })),
    expensiveIngredients: Object.entries(ingSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, total]) => ({ name, total: parseFloat(total.toFixed(2)) })),
  }

  // ── 6. Smart Insights ───────────────────────────────────────────────────────
  // avg daily waste per ingredient (over last 30 days, only items with any waste)
  const dailyWasteByIng = {}  // name → { totalQty, unit, costPerUnit }

  wasteLogs30d.forEach((log) => {
    if (!log.ingredient) return
    const name = log.ingredient.name
    const unit = log.ingredient.unit || ""
    const cpu  = log.ingredient.costPerUnit || 0
    if (!dailyWasteByIng[name]) dailyWasteByIng[name] = { name, totalQty: 0, unit, costPerUnit: cpu }
    dailyWasteByIng[name].totalQty += log.quantity
  })

  // build a lookup from ingredients for currentStock + minThreshold
  const ingMap = {}
  ingredients.forEach((i) => { ingMap[i.name] = i })

  const DAYS = 30

  // items likely to run out this week (daysLeft ≤ 7)
  const likelyRunOut = Object.values(dailyWasteByIng)
    .map((item) => {
      const avgDailyUsage = item.totalQty / DAYS
      const ing           = ingMap[item.name]
      const currentStock  = ing?.currentStock ?? 0
      const daysLeft      = avgDailyUsage > 0 ? currentStock / avgDailyUsage : Infinity
      return { name: item.name, currentStock, unit: item.unit, avgDailyUsage: parseFloat(avgDailyUsage.toFixed(3)), daysLeft: parseFloat(daysLeft.toFixed(1)) }
    })
    .filter((item) => item.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // frequently wasted (top 5 by total waste this month)
  const frequentlyWasted = Object.values(dailyWasteByIng)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5)
    .map((item) => ({
      name:         item.name,
      totalWasted:  parseFloat(item.totalQty.toFixed(3)),
      unit:         item.unit,
      avgPerDay:    parseFloat((item.totalQty / DAYS).toFixed(3)),
    }))

  const smartInsights = { likelyRunOut, frequentlyWasted }

  // ── 7. Send ─────────────────────────────────────────────────────────────────
  res.status(STATUS_CODES.OK).json({
    success: true,
    data: {
      stockLevels,
      consumptionTrends,
      wasteAnalysis,
      purchaseHistory,
      smartInsights,
    },
  })
})

module.exports = { getInventoryAnalytics }
