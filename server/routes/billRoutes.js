const express = require("express")
const router  = express.Router()

const {
  generateBill,
  processPayment,
  getBillByTable,
  getAllBills,
} = require("../controllers/billControllers")

const protect         = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")
const ROLES      = require("../constants/roles")

router.get("/",                        protect, restrictTo(ROLES.ADMIN),                    getAllBills)
router.get("/table/:tableNumber",      protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN),         getBillByTable)
router.post("/",                       protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN),         generateBill)
router.patch("/:id/pay",              protect, restrictTo(ROLES.CASHIER, ROLES.ADMIN),         processPayment)


module.exports = router