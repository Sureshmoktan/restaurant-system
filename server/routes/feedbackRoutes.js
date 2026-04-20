const express = require("express")
const router  = express.Router()

const {
  submitFeedback,
  checkFeedbackByBill,
  getAllFeedback,
  getFeedbackStats,
  getSmartSummary,
} = require("../controllers/feedbackController")

const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")
const ROLES      = require("../constants/roles")

// ── PUBLIC (no auth — customer tablet) ───────────────────────────────────────
router.post("/",               submitFeedback)
router.get("/:billId/exists",  checkFeedbackByBill)

// ── ADMIN ONLY ────────────────────────────────────────────────────────────────
router.get("/",              protect, restrictTo(ROLES.ADMIN), getAllFeedback)
router.get("/stats",         protect, restrictTo(ROLES.ADMIN), getFeedbackStats)
router.get("/smart-summary", protect, restrictTo(ROLES.ADMIN), getSmartSummary)

module.exports = router
