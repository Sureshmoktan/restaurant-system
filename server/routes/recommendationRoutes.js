const express = require("express")
const router  = express.Router()

const { getRecommendations, getPopularItems, getMLHealth } = require("../controllers/recommendationController")

// GET /api/v1/recommendations?items=Momo,Sekuwa
router.get("/",        getRecommendations)

// GET /api/v1/recommendations/popular?exclude=Momo,Sekuwa
router.get("/popular", getPopularItems)

// GET /api/v1/recommendations/health
router.get("/health",  getMLHealth)

module.exports = router