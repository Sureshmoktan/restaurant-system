const express = require("express");
const router = express.Router();
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  toggleOccupied,
  updateTableStatus,
  fixAllTableStatuses,
} = require("../controllers/tableController");

const protect = require("../middlewares/authMiddleware");
const restrictTo = require("../middlewares/roleMiddleware");
const ROLES = require("../constants/roles");

// ==============================================
// PUBLIC ROUTES (No authentication needed for customers)
// ==============================================
router.get("/", getAllTables);
router.get("/:id", getTableById);

// ==============================================
// ADMIN & CASHIER ROUTES
// ==============================================

// Create table (Admin only)
router.post("/", protect, restrictTo(ROLES.ADMIN), createTable);

// Update table (Admin only)
router.put("/:id", protect, restrictTo(ROLES.ADMIN), updateTable);

// Delete table (Admin only)
router.delete("/:id", protect, restrictTo(ROLES.ADMIN), deleteTable);

// Toggle occupied status (deprecated but kept for compatibility)
router.patch("/:id/toggle", protect, restrictTo(ROLES.ADMIN, ROLES.CASHIER), toggleOccupied);

// ✅ NEW: Update table status manually
router.patch("/:id/status", protect, restrictTo(ROLES.ADMIN, ROLES.CASHIER), updateTableStatus);

// ✅ NEW: Fix all table statuses based on actual orders
router.post("/fix-all-status", protect, restrictTo(ROLES.ADMIN), fixAllTableStatuses);

module.exports = router;