const express = require("express")
const router  = express.Router()

const {
  getForecastOrders,
  getForecastRevenue,
  getForecastItems,
  getForecastHours,
  getForecastHealth,
  getForecastSuggestions,
} = require("../controllers/forecastController")


const protect = require("../middlewares/authMiddleware");
const restrictTo = require("../middlewares/roleMiddleware");


// All forecast routes — admin only
router.use(protect, restrictTo("admin"))

router.get("/orders",      getForecastOrders)
router.get("/revenue",     getForecastRevenue)
router.get("/items",       getForecastItems)
router.get("/hours",       getForecastHours)
router.get("/health",      getForecastHealth)
router.get("/suggestions", getForecastSuggestions)

module.exports = router