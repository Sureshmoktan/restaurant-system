
// const express = require("express")
// const router  = express.Router()

// const {
//   placeOrder,
//   getAllOrders,
//   getOrdersByTable,
//   getOrder,
//   updateItemStatus,
//   updateOrderStatus,
//   cancelOrder,
// } = require("../controllers/orderController")

// const protect    = require("../middlewares/authMiddleware")
// const restrictTo = require("../middlewares/roleMiddleware")
// const ROLES      = require("../constants/roles")

// // Public — customer places order (no auth needed)
// router.post("/", placeOrder)

// // Public — customer tracks their own table orders
// router.get("/customer/:tableNumber", getOrdersByTable)

// // Get orders by table — cashier + admin
// router.get("/table/:tableNumber", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), getOrdersByTable)

// // Get all / single orders — kitchen + bar + cashier + admin
// router.get("/",    protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.CASHIER, ROLES.ADMIN), getAllOrders)
// router.get("/:id", protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.CASHIER, ROLES.ADMIN), getOrder)

// // ── NEW: per-item status update — kitchen + bar + admin ──
// // Must be defined BEFORE /:id/status to avoid route conflict
// router.patch(
//   "/:id/items/:itemId/status",
//   protect,
//   restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN),
//   updateItemStatus
// )

// // Whole-order status update (legacy / admin override) — kitchen + bar + admin
// router.patch("/:id/status", protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN), updateOrderStatus)
// router.patch("/:id/cancel", protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN), cancelOrder)

// module.exports = router

// routes/orderRoutes.js

const express = require("express")
const router  = express.Router()

const {
  placeOrder,
  getAllOrders,
  getOrdersByTable,
  getOrder,
  updateItemStatus,
  updateOrderStatus,
  cancelOrder,
  setEstimatedTime,
  // NEW ADMIN FUNCTIONS
  adminGetAllOrders,
  adminGetOrderById,
  adminDeleteOrder,
  adminBulkDeleteOrders,
  adminGetOrderStats,
  adminDeleteOrdersByDateRange
} = require("../controllers/orderController")

const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")
const ROLES      = require("../constants/roles")

// ==============================================
// PUBLIC ROUTES (No authentication)
// ==============================================

// Customer places order
router.post("/", placeOrder)

// Customer tracks their own table orders
router.get("/customer/:tableNumber", getOrdersByTable)

// ==============================================
// AUTHENTICATED ROUTES (Kitchen, Bar, Cashier, Admin)
// ==============================================

// Get orders by table — cashier + admin
router.get("/table/:tableNumber", 
  protect, 
  restrictTo(ROLES.CASHIER, ROLES.ADMIN), 
  getOrdersByTable
)

// Get all orders — kitchen + bar + cashier + admin
router.get("/", 
  protect, 
  restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.CASHIER, ROLES.ADMIN), 
  getAllOrders
)

// Get single order — kitchen + bar + cashier + admin
router.get("/:id", 
  protect, 
  restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.CASHIER, ROLES.ADMIN), 
  getOrder
)

// Per-item status update — kitchen + bar + admin
// NOTE: Must be defined BEFORE /:id/status to avoid route conflict
router.patch(
  "/:id/items/:itemId/status",
  protect,
  restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN),
  updateItemStatus
)

// Whole-order status update (legacy / admin override) — kitchen + bar + admin
router.patch("/:id/status", 
  protect, 
  restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN), 
  updateOrderStatus
)

// Cancel order — kitchen + bar + admin
router.patch("/:id/cancel",
  protect,
  restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN),
  cancelOrder
)

// Set estimated preparation time — kitchen + bar only
router.patch("/:id/estimate",
  protect,
  restrictTo(ROLES.KITCHEN, ROLES.BAR),
  setEstimatedTime
)

// ==============================================
// ADMIN ONLY ROUTES - READ & DELETE ORDERS
// ==============================================

// Get ALL orders with full admin view (filters, pagination, stats)
router.get("/admin/all", 
  protect, 
  restrictTo(ROLES.ADMIN), 
  adminGetAllOrders
)

// Get order statistics (today/week/month)
router.get("/admin/stats", 
  protect, 
  restrictTo(ROLES.ADMIN), 
  adminGetOrderStats
)

// Get single order by ID (admin full view with details)
router.get("/admin/:id", 
  protect, 
  restrictTo(ROLES.ADMIN), 
  adminGetOrderById
)

// Delete single order (Hard delete)
router.delete("/admin/:id", 
  protect, 
  restrictTo(ROLES.ADMIN), 
  adminDeleteOrder
)

// Bulk delete multiple orders
router.delete("/admin/bulk", 
  protect, 
  restrictTo(ROLES.ADMIN), 
  adminBulkDeleteOrders
)

// Delete orders by date range
router.delete("/admin/delete-by-date", 
  protect, 
  restrictTo(ROLES.ADMIN), 
  adminDeleteOrdersByDateRange
)

module.exports = router