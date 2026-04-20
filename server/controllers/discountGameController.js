// server/controllers/discountGameController.js

const Bill         = require("../models/Bill")
const DiscountGame = require("../models/DiscountGame")
const asyncHandler = require("../utils/asyncHandler")
const STATUS_CODES = require("../constants/statusCodes")
const { PAYMENT_STATUS } = require("../constants")

// ── GET /settings — admin, cashier ──────────────────────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  const settings = await DiscountGame.getSettings()
  res.status(STATUS_CODES.OK).json({ success: true, settings })
})

// ── PUT /settings — admin only ───────────────────────────────────────────────
const updateSettings = asyncHandler(async (req, res) => {
  const { tiers, maxDiscountAmount, maxBillForGame } = req.body

  const settings = await DiscountGame.getSettings()

  if (tiers !== undefined)             settings.tiers             = tiers
  if (maxDiscountAmount !== undefined) settings.maxDiscountAmount = maxDiscountAmount
  if (maxBillForGame    !== undefined) settings.maxBillForGame    = maxBillForGame

  await settings.save()

  res.status(STATUS_CODES.OK).json({
    success:  true,
    message:  "Game settings updated",
    settings,
  })
})

// ── PUT /toggle — cashier, admin ─────────────────────────────────────────────
const toggleGame = asyncHandler(async (req, res) => {
  const settings   = await DiscountGame.getSettings()
  settings.isEnabled = !settings.isEnabled
  await settings.save()

  res.status(STATUS_CODES.OK).json({
    success:   true,
    message:   settings.isEnabled ? "Game is now active" : "Game is now inactive",
    isEnabled: settings.isEnabled,
  })
})

// ── POST /spin — public ───────────────────────────────────────────────────────
const spin = asyncHandler(async (req, res) => {
  const { billId } = req.body

  if (!billId) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("billId is required")
  }

  // 1. Check game is enabled
  const settings = await DiscountGame.getSettings()
  if (!settings.isEnabled) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Game is not active")
  }

  // 2. Find the bill
  const bill = await Bill.findById(billId)
  if (!bill) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("Bill not found")
  }
  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Bill is already paid")
  }

  // 3. Can't spin twice
  if (bill.discountGamePlayed) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("This bill has already played the discount game")
  }

  // 4a. Check per-bill game is enabled (cashier must have toggled it for this table)
  if (!bill.discountGameEnabled) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Discount game is not enabled for this bill")
  }

  // 4. Check bill amount
  if (bill.subtotal > settings.maxBillForGame) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Bill amount too high for game")
  }

  // 5. Get correct tier's slices
  const slices = await DiscountGame.getTierForBill(bill.subtotal)
  if (!slices || slices.length === 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("No game tier available for this bill amount")
  }

  // 6. Weighted random selection
  const totalWeight = slices.reduce((sum, s) => sum + s.weight, 0)
  let random = Math.random() * totalWeight
  let winner
  for (const slice of slices) {
    random -= slice.weight
    if (random <= 0) { winner = slice; break }
  }
  // Fallback to last slice (floating point edge case)
  if (!winner) winner = slices[slices.length - 1]

  // 7. Calculate discount amount — applied on subtotal AFTER offer discounts
  const afterOfferSubtotal = bill.subtotal - (bill.discountAmount || 0)
  let discountAmount = Math.round(afterOfferSubtotal * winner.discount / 100)

  // 8. Apply cap (FREE = 100% is never capped)
  if (winner.discount < 100) {
    discountAmount = Math.min(discountAmount, settings.maxDiscountAmount)
  }

  // 9. Update bill
  // Discount order: Subtotal → Offer Discount → Game Discount → Cashier Discount → VAT → Tip → Total
  bill.discountGameEnabled = false  // auto-disable after one spin
  bill.discountGamePlayed  = true
  bill.discountGameResult  = winner.discount
  bill.discountGameAmount  = discountAmount

  // After game discount (re-apply cashier discount on top if it was already set)
  const afterGameSubtotal = afterOfferSubtotal - discountAmount

  const cashierPct = bill.cashierDiscount || 0
  let finalSubtotal

  if (cashierPct > 0) {
    // Re-calculate cashier discount on new base
    const newCashierDiscAmt  = Math.round(afterGameSubtotal * (cashierPct / 100))
    bill.cashierDiscountAmount = newCashierDiscAmt
    finalSubtotal = afterGameSubtotal - newCashierDiscAmt
  } else {
    finalSubtotal = afterGameSubtotal
  }

  const newVat   = Math.round(finalSubtotal * ((bill.vatPercent || 13) / 100))
  const newTotal = finalSubtotal + newVat + (bill.tipAmount || 0)

  bill.discountedSubtotal = finalSubtotal
  bill.vatAmount          = newVat
  bill.totalAmount        = newTotal

  await bill.save()

  // 10. Update game stats
  settings.totalGamesPlayed  += 1
  settings.totalDiscountGiven += discountAmount
  await settings.save()

  // 11. Return result
  res.status(STATUS_CODES.OK).json({
    success:        true,
    discount:       winner.discount,
    label:          winner.label,
    discountAmount,
    newTotal,
    color:          winner.color,
  })
})

// ── GET /stats — admin only ───────────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
  const settings = await DiscountGame.getSettings()

  // Aggregate discount distribution from bills
  const distribution = await Bill.aggregate([
    { $match: { discountGamePlayed: true } },
    { $group: { _id: "$discountGameResult", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  const discountDistribution = distribution.map((d) => ({
    discount: d._id,
    label:    d._id === 100 ? "FREE!" : `${d._id}%`,
    count:    d.count,
  }))

  // Games this week
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  // Games this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [gamesThisWeek, gamesThisMonth] = await Promise.all([
    Bill.countDocuments({ discountGamePlayed: true, createdAt: { $gte: startOfWeek  } }),
    Bill.countDocuments({ discountGamePlayed: true, createdAt: { $gte: startOfMonth } }),
  ])

  const averageDiscount = settings.totalGamesPlayed > 0
    ? Math.round(settings.totalDiscountGiven / settings.totalGamesPlayed)
    : 0

  res.status(STATUS_CODES.OK).json({
    success: true,
    stats: {
      totalGamesPlayed:   settings.totalGamesPlayed,
      totalDiscountGiven: settings.totalDiscountGiven,
      averageDiscount,
      discountDistribution,
      gamesThisWeek,
      gamesThisMonth,
    },
  })
})

// ── GET /history — admin only ─────────────────────────────────────────────────
// Returns paginated list of bills where discountGamePlayed = true
const getHistory = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1
  const limit = parseInt(req.query.limit) || 20
  const skip  = (page - 1) * limit

  const filter = { discountGamePlayed: true }

  if (req.query.startDate) {
    const start = new Date(req.query.startDate); start.setHours(0,0,0,0)
    filter.createdAt = { ...filter.createdAt, $gte: start }
  }
  if (req.query.endDate) {
    const end = new Date(req.query.endDate); end.setHours(23,59,59,999)
    filter.createdAt = { ...filter.createdAt, $lte: end }
  }

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("tableNumber subtotal discountGameResult discountGameAmount createdAt _id"),
    Bill.countDocuments(filter),
  ])

  res.status(STATUS_CODES.OK).json({
    success: true,
    bills,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
})

// ── GET /public-settings — no auth (customer tablet) ─────────────────────────
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await DiscountGame.getSettings()
  res.status(STATUS_CODES.OK).json({
    success:   true,
    isEnabled: settings.isEnabled,
    tiers:     settings.tiers,
  })
})

module.exports = { getSettings, updateSettings, toggleGame, spin, getStats, getHistory, getPublicSettings }
