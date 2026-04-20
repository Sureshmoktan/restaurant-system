const express = require("express");
const router = express.Router();
const {
  getAllOffers,
  getActiveOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  applyOffers,
} = require("../controllers/offerController");

const protect = require("../middlewares/authMiddleware");
const restrictTo = require("../middlewares/roleMiddleware");

// ── PUBLIC (no auth required) ─────────────────────────────────
// Customer tablets fetch this without being logged in
router.get("/active", getActiveOffers);

// ── CASHIER + ADMIN ───────────────────────────────────────────
router.post("/apply", protect, applyOffers);

// ── ADMIN ONLY ────────────────────────────────────────────────
router.get("/", protect, restrictTo("admin"), getAllOffers);
router.post("/", protect, restrictTo("admin"), createOffer);
router.put("/:id", protect, restrictTo("admin"), updateOffer);
router.delete("/:id", protect, restrictTo("admin"), deleteOffer);

module.exports = router;
