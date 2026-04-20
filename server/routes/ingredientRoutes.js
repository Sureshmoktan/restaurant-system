const express    = require("express")
const router     = express.Router()
const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")

const {
  getAllIngredients,
  getIngredientStats,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require("../controllers/ingredientController")

const { getInventoryAnalytics } = require("../controllers/ingredientAnalyticsController")

// named sub-routes must come before /:id to avoid param capture
router.get("/analytics",       protect, restrictTo("admin"), getInventoryAnalytics)
router.get("/stats/overview",  protect, restrictTo("admin"), getIngredientStats)
router.get("/",               protect, restrictTo("admin", "cashier", "kitchen", "bar"), getAllIngredients)
router.get("/:id",            protect, restrictTo("admin"),                              getIngredient)
router.post("/",              protect, restrictTo("admin"),                              createIngredient)
router.put("/:id",            protect, restrictTo("admin"),                              updateIngredient)
router.delete("/:id",         protect, restrictTo("admin"),                              deleteIngredient)

module.exports = router
