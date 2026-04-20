const express    = require("express")
const router     = express.Router()
const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")

const { getWasteLogs, createWasteLog, getWasteStats } = require("../controllers/wasteController")

// stats must come before / to avoid ambiguity
router.get("/stats", protect, restrictTo("admin"),                              getWasteStats)
router.get("/",      protect, restrictTo("admin", "kitchen", "bar"),            getWasteLogs)
router.post("/",     protect, restrictTo("admin", "kitchen", "bar", "cashier"), createWasteLog)

module.exports = router
