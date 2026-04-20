// routes/billRoutes.js (UPDATED)

const express = require("express")
const router  = express.Router()

const {
  generateBill,
  processPayment,
  getBillByTable,
  getAllBills,
  getCurrentBillByTable,
  requestCustomerBill,
  getCustomerBillById,
  initiateEsewaPayment,
  verifyEsewaPayment,
  applyCashierDiscount,
  enableTableGame,
} = require("../controllers/billControllers")

const protect         = require("../middlewares/authMiddleware")
const restrictTo      = require("../middlewares/roleMiddleware")
const ROLES           = require("../constants/roles")

// ==============================================
// CUSTOMER / PUBLIC ROUTES (No auth required)
// ==============================================

// Customer requests/generates a bill
router.post("/request", requestCustomerBill)

// Customer gets current unpaid bill for their table
router.get("/table/:tableNumber/current", getCurrentBillByTable)

// Customer gets bill by ID
router.get("/:id/customer", getCustomerBillById)

// eSewa payment (public — customer initiates and verifies from tablet)
router.post("/esewa/verify",      verifyEsewaPayment)
router.post("/:id/esewa/initiate", initiateEsewaPayment)

// ==============================================
// CASHIER / ADMIN ROUTES
// ==============================================

router.get("/", protect, restrictTo(ROLES.ADMIN), getAllBills)
router.get("/table/:tableNumber", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), getBillByTable)
router.post("/", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), generateBill)
router.patch("/:id/pay", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), processPayment)
router.put("/:id/cashier-discount", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), applyCashierDiscount)
router.put("/table/:tableNumber/game-enable", protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN), enableTableGame)

module.exports = router