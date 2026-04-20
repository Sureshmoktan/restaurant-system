const asyncHandler = require("../utils/asyncHandler")

const PROPHET_URL = "http://localhost:5001"

// ── GET /api/v1/forecast/orders ───────────────────────────────────────────────
const getForecastOrders = asyncHandler(async (req, res) => {
  const response = await fetch(`${PROPHET_URL}/forecast/orders`)
  const data     = await response.json()
  return res.status(200).json(data)
})

// ── GET /api/v1/forecast/revenue ──────────────────────────────────────────────
const getForecastRevenue = asyncHandler(async (req, res) => {
  const response = await fetch(`${PROPHET_URL}/forecast/revenue`)
  const data     = await response.json()
  return res.status(200).json(data)
})

// ── GET /api/v1/forecast/items ────────────────────────────────────────────────
const getForecastItems = asyncHandler(async (req, res) => {
  const response = await fetch(`${PROPHET_URL}/forecast/items`)
  const data     = await response.json()
  return res.status(200).json(data)
})

// ── GET /api/v1/forecast/hours ────────────────────────────────────────────────
const getForecastHours = asyncHandler(async (req, res) => {
  const response = await fetch(`${PROPHET_URL}/forecast/hours`)
  const data     = await response.json()
  return res.status(200).json(data)
})

// ── GET /api/v1/forecast/hours ────────────────────────────────────────────────
const getForecastHealth = asyncHandler(async (req, res) => {
  const response = await fetch(`${PROPHET_URL}/health`)
  const data     = await response.json()
  return res.status(200).json(data)
})

// ── GET /api/v1/forecast/suggestions ─────────────────────────────────────────
const getForecastSuggestions = asyncHandler(async (req, res) => {
  const response = await fetch(`${PROPHET_URL}/forecast/suggestions`)
  const data     = await response.json()
  return res.status(200).json(data)
})

module.exports = {
  getForecastOrders,
  getForecastRevenue,
  getForecastItems,
  getForecastHours,
  getForecastHealth,
  getForecastSuggestions,
}