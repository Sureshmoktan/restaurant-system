const express = require("express")
const router  = express.Router()

const {
  placeOrder,
  getAllOrders,
  getOrdersByTable,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController")

const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")
const ROLES      = require("../constants/roles")

// public — customer places order (no auth needed)
router.post("/", placeOrder)

// get orders by table — cashier + admin
router.get("/table/:tableNumber", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), getOrdersByTable)

// get all orders — kitchen + bar + cashier + admin
router.get("/",    protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.CASHIER, ROLES.ADMIN), getAllOrders)
router.get("/:id", protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.CASHIER, ROLES.ADMIN), getOrder)

// update status — kitchen + bar + admin
router.patch("/:id/status", protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN), updateOrderStatus)
router.patch("/:id/cancel", protect, restrictTo(ROLES.KITCHEN, ROLES.BAR, ROLES.ADMIN), cancelOrder)

module.exports = router