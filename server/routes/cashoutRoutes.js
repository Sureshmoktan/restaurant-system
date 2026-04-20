const express = require("express")
const Cashout = require("../models/Cashout.js")

const protect         = require("../middlewares/authMiddleware")

 
const router = express.Router()
 
// POST /api/cashouts — create a cashout (cashier)
router.post("/", protect, async (req, res) => {
  try {
    const { description, amount, category, recordedBy } = req.body
    const cashout = await Cashout.create({ description, amount, category, recordedBy })
    res.status(201).json({ cashout })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})
 
// GET /api/cashouts — list cashouts (admin: all; cashier: today only)
// Query params: startDate, endDate (ISO strings) for admin date range filter
router.get("/", protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
 
    let dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate)   dateFilter.createdAt.$lte = new Date(endDate)
    } else {
      // default: today
      const start = new Date(); start.setHours(0, 0, 0, 0)
      const end   = new Date(); end.setHours(23, 59, 59, 999)
      dateFilter.createdAt = { $gte: start, $lte: end }
    }
 
    const cashouts = await Cashout.find(dateFilter)
      .populate("recordedBy", "name")
      .sort({ createdAt: -1 })
 
    const total = cashouts.reduce((s, c) => s + c.amount, 0)
    res.json({ cashouts, total })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
 
module.exports = router
