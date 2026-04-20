const asyncHandler = require("../utils/asyncHandler")
const Order        = require("../models/Order")

const FLASK_URL = "http://localhost:5000"

// ── GET /api/v1/recommendations?items=Momo,Sekuwa ─────────────────────────────
const getRecommendations = asyncHandler(async (req, res) => {
  const { items } = req.query

  if (!items) {
    return res.status(400).json({
      success: false,
      message: "Please provide items query parameter",
      recommendations: [],
    })
  }

  const response = await fetch(`${FLASK_URL}/recommend?items=${encodeURIComponent(items)}`)

  if (!response.ok) {
    return res.status(500).json({
      success: false,
      message: "ML server error",
      recommendations: [],
    })
  }

  const data = await response.json()

  return res.status(200).json({
    success:         true,
    ordered_items:   data.ordered_items,
    recommendations: data.recommendations,
    count:           data.count,
  })
})

// ── GET /api/v1/recommendations/popular ───────────────────────────────────────
// Returns top 6 most ordered items — fallback when Apriori has no rules
const getPopularItems = asyncHandler(async (req, res) => {
  const exclude = req.query.exclude
    ? req.query.exclude.split(",").map((s) => s.trim())
    : []

  const result = await Order.aggregate([
    { $match: { status: "billed" } },
    { $unwind: "$items" },
    { $group: {
      _id:   "$items.name",
      count: { $sum: "$items.quantity" },
    }},
    { $sort: { count: -1 } },
    { $limit: 20 },
  ])

  const popular = result
    .map((r) => r._id)
    .filter((name) => !exclude.includes(name))
    .slice(0, 6)

  return res.status(200).json({
    success: true,
    popular,
    count:   popular.length,
  })
})

// ── GET /api/v1/recommendations/health ────────────────────────────────────────
const getMLHealth = asyncHandler(async (req, res) => {
  const response = await fetch(`${FLASK_URL}/health`)
  const data     = await response.json()

  return res.status(200).json({
    success: true,
    ml:      data,
  })
})

module.exports = { getRecommendations, getPopularItems, getMLHealth }