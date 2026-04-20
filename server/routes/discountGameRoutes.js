// server/routes/discountGameRoutes.js

const express    = require("express")
const router     = express.Router()
const {
  getSettings,
  updateSettings,
  toggleGame,
  spin,
  getStats,
  getHistory,
  getPublicSettings,
} = require("../controllers/discountGameController")

const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")
const ROLES      = require("../constants/roles")

// GET  /api/v1/discount-game/settings  — admin, cashier
router.get("/settings", protect, restrictTo(ROLES.ADMIN, ROLES.CASHIER), getSettings)

// PUT  /api/v1/discount-game/settings  — admin only
router.put("/settings", protect, restrictTo(ROLES.ADMIN), updateSettings)

// PUT  /api/v1/discount-game/toggle    — admin, cashier
router.put("/toggle", protect, restrictTo(ROLES.ADMIN, ROLES.CASHIER), toggleGame)

// GET  /api/v1/discount-game/public-settings — public (no auth, customer tablet)
router.get("/public-settings", getPublicSettings)

// POST /api/v1/discount-game/spin      — public (no auth)
router.post("/spin", spin)

// GET  /api/v1/discount-game/stats     — admin only
router.get("/stats", protect, restrictTo(ROLES.ADMIN), getStats)

// GET  /api/v1/discount-game/history   — admin only
router.get("/history", protect, restrictTo(ROLES.ADMIN), getHistory)

module.exports = router
