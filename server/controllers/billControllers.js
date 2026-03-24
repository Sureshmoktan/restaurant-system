const Bill         = require("../models/Bill")
const Order        = require("../models/Order")
const Table        = require("../models/Table")
const MESSAGES     = require("../constants/messages")
const STATUS_CODES = require("../constants/statusCodes")
const asyncHandler = require("../utils/asyncHandler")
const { ORDER_STATUS, PAYMENT_STATUS, SOCKET_EVENTS } = require("../constants")

// @desc   Generate bill for a table
// @route  POST /api/v1/bills
// @access Cashier + Admin
const generateBill = asyncHandler(async (req, res) => {
  const {
    tableNumber, orders, subtotal,
    vatPercent, vatAmount, tipAmount,
    totalAmount, paymentMethod, note,
  } = req.body

  if (!tableNumber || !orders || orders.length === 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Table number and orders are required")
  }

  const tip = Number(tipAmount) || 0

  const bill = await Bill.create({
    tableNumber,
    orders,
    subtotal,
    vatPercent:    vatPercent || 13,
    vatAmount,
    tipAmount:     tip,
    totalAmount:   Number(totalAmount) + tip, // ✅ include tip in total
    paymentMethod,
    paymentStatus: PAYMENT_STATUS.UNPAID,
    generatedBy:   req.user._id,
    note:          note || "",
  })

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.BILL.GENERATED,
    bill,
  })
})

// @desc   Process payment — mark bill as paid
// @route  PATCH /api/v1/bills/:id/pay
// @access Cashier + Admin
const processPayment = asyncHandler(async (req, res) => {
  const { paymentMethod, tipAmount } = req.body

  const bill = await Bill.findById(req.params.id)
  if (!bill) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.BILL.NOT_FOUND)
  }

  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(MESSAGES.BILL.ALREADY_PAID)
  }

  // ✅ Update tip if provided at payment time
  if (tipAmount !== undefined) {
    const tip = Number(tipAmount) || 0
    bill.tipAmount   = tip
    bill.totalAmount = bill.subtotal + bill.vatAmount + tip
  }

  bill.paymentStatus = PAYMENT_STATUS.PAID
  bill.paymentMethod = paymentMethod || bill.paymentMethod
  bill.paidAt        = new Date()
  await bill.save()

  // mark all orders as billed
  await Order.updateMany(
    { _id: { $in: bill.orders } },
    { status: ORDER_STATUS.BILLED }
  )

  // free up the table
  await Table.findOneAndUpdate(
    { tableNumber: bill.tableNumber },
    { status: "available", currentOrder: null, customerCount: 0 }
  )

  const io = req.app.get("io")
  io.emit(SOCKET_EVENTS.TABLE_STATUS, {
    tableNumber: bill.tableNumber,
    status:      "available",
  })
  io.emit(SOCKET_EVENTS.NEW_BILL, { bill })

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.BILL.PAYMENT_SUCCESS,
    bill,
  })
})

// @desc   Get bill by table number
// @route  GET /api/v1/bills/table/:tableNumber
// @access Cashier + Admin
const getBillByTable = asyncHandler(async (req, res) => {
  const bill = await Bill
    .findOne({ tableNumber: req.params.tableNumber })
    .populate("orders")
    .sort({ createdAt: -1 })

  if (!bill) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.BILL.NOT_FOUND)
  }

  res.status(STATUS_CODES.OK).json({ success: true, bill })
})

// @desc   Get all bills
// @route  GET /api/v1/bills
// @access Admin
const getAllBills = asyncHandler(async (req, res) => {
  const { paymentStatus, date } = req.query
  const filter = {}

  if (paymentStatus) filter.paymentStatus = paymentStatus

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    filter.createdAt = { $gte: start, $lte: end }
  }

  const bills = await Bill.find(filter)
    .populate("generatedBy", "name")
    .sort({ createdAt: -1 })

  const paidBills    = bills.filter((b) => b.paymentStatus === PAYMENT_STATUS.PAID)
  const totalRevenue = paidBills.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalTips    = paidBills.reduce((sum, b) => sum + (b.tipAmount || 0), 0) // ✅ total tips

  res.status(STATUS_CODES.OK).json({
    success: true,
    count: bills.length,
    totalRevenue,
    totalTips,
    bills,
  })
})

module.exports = {
  generateBill,
  processPayment,
  getBillByTable,
  getAllBills,
}