const express    = require("express")
const router     = express.Router()
const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")

const {
  getAllPurchases,
  getPurchaseStats,
  createPurchase,
} = require("../controllers/purchaseController")

// stats must come before / to avoid ambiguity
router.get("/stats", protect, restrictTo("admin"), getPurchaseStats)
router.get("/",      protect, restrictTo("admin"), getAllPurchases)
router.post("/",     protect, restrictTo("admin"), createPurchase)

module.exports = router
