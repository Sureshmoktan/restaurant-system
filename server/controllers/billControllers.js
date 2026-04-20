const crypto       = require("crypto")
const Bill         = require("../models/Bill")
const Order        = require("../models/Order")
const Offer        = require("../models/Offer")
const MESSAGES     = require("../constants/messages")
const STATUS_CODES = require("../constants/statusCodes")
const asyncHandler = require("../utils/asyncHandler")
const { ORDER_STATUS, PAYMENT_STATUS, SOCKET_EVENTS } = require("../constants")
const { updateTableStatusFromOrders } = require("../utils/tableStatusHelper")
const { logAudit, getIp } = require("../utils/auditHelper")

const ESEWA_SECRET       = process.env.ESEWA_SECRET       || "8gBm/:&EnhH.1/q"
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST"
const ESEWA_PAYMENT_URL  = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"

// ── shared helper: compute discount from active offers ────────
async function computeActiveDiscounts(allItems, subtotal) {
  const now = new Date()
  const activeOffers = await Offer.find({
    isActive:  true,
    startDate: { $lte: now },
    endDate:   { $gte: now },
  }).populate("applicableItems", "_id name category")

  let totalDiscount   = 0
  const appliedOffers = []

  for (const offer of activeOffers) {
    if (offer.scope === "bill") {
      const amt =
        offer.type === "percentage"
          ? (subtotal * offer.value) / 100
          : Math.min(offer.value, subtotal)

      totalDiscount += amt
      appliedOffers.push({
        offerId:        offer._id,
        title:          offer.title,
        scope:          "bill",
        discountAmount: parseFloat(amt.toFixed(2)),
      })

    } else if (offer.scope === "item") {
      const applicableIds = offer.applicableItems.map(i => i._id.toString())

      for (const item of allItems) {
        const itemId = item.menuItemId?.toString()
        if (!itemId || !applicableIds.includes(itemId)) continue

        const itemTotal = item.price * item.quantity
        const amt =
          offer.type === "percentage"
            ? (itemTotal * offer.value) / 100
            : Math.min(offer.value * item.quantity, itemTotal)

        totalDiscount += amt
        appliedOffers.push({
          offerId:        offer._id,
          title:          offer.title,
          scope:          "item",
          itemName:       item.name,
          discountAmount: parseFloat(amt.toFixed(2)),
        })
      }

    } else if (offer.scope === "category") {
      for (const item of allItems) {
        if ((item.category || "").toLowerCase() !== (offer.applicableCategory || "").toLowerCase()) continue

        const itemTotal = item.price * item.quantity
        const amt =
          offer.type === "percentage"
            ? (itemTotal * offer.value) / 100
            : Math.min(offer.value * item.quantity, itemTotal)

        totalDiscount += amt
        appliedOffers.push({
          offerId:        offer._id,
          title:          offer.title,
          scope:          "category",
          category:       offer.applicableCategory,
          discountAmount: parseFloat(amt.toFixed(2)),
        })
      }
    }
  }

  return { totalDiscount: parseFloat(totalDiscount.toFixed(2)), appliedOffers }
}

// @desc   Generate bill for a table
// @route  POST /api/v1/bills
// @access Cashier + Admin
const generateBill = asyncHandler(async (req, res) => {
  const {
    tableNumber, orders, subtotal,
    vatPercent, vatAmount, tipAmount,
    totalAmount, paymentMethod, note,
    discountAmount, appliedOffers
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
    discountAmount:     Number(discountAmount) || 0,
    discountedSubtotal: subtotal - (Number(discountAmount) || 0),
    appliedOffers:      appliedOffers || [],
    vatPercent:         vatPercent || 13,
    vatAmount,
    tipAmount:          tip,
    totalAmount:        Number(totalAmount) + tip,
    paymentMethod,
    paymentStatus:      PAYMENT_STATUS.UNPAID,
    generatedBy:        req.user._id,
    note:               note || "",
  })

  logAudit({
    action:      "BILL_GENERATED",
    actor:       req.user._id,
    actorName:   req.user.name,
    actorRole:   req.user.role,
    targetModel: "Bill",
    targetId:    bill._id,
    details:     { tableNumber, totalAmount: bill.totalAmount, paymentMethod },
    ip:          getIp(req),
  });

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

  if (tipAmount !== undefined) {
    const tip = Number(tipAmount) || 0
    bill.tipAmount   = tip
    bill.totalAmount = (bill.discountedSubtotal || bill.subtotal) + bill.vatAmount + tip
  }

  bill.paymentStatus = PAYMENT_STATUS.PAID
  bill.paymentMethod = paymentMethod || bill.paymentMethod
  bill.paidAt        = new Date()
  await bill.save()

  // Void every OTHER unpaid bill for this table so they never resurface
  await Bill.updateMany(
    { tableNumber: bill.tableNumber, paymentStatus: PAYMENT_STATUS.UNPAID, _id: { $ne: bill._id } },
    { paymentStatus: PAYMENT_STATUS.VOID }
  )

  await Order.updateMany(
    {
      tableNumber: bill.tableNumber,
      status: { $in: [ORDER_STATUS.SERVED, ORDER_STATUS.PENDING, ORDER_STATUS.COOKING, ORDER_STATUS.READY, ORDER_STATUS.BILLED] },
      _id: { $in: bill.orders },
    },
    { status: ORDER_STATUS.BILLED }
  )
  await Order.updateMany(
    { tableNumber: bill.tableNumber, status: ORDER_STATUS.SERVED },
    { status: ORDER_STATUS.BILLED }
  )

  await updateTableStatusFromOrders(bill.tableNumber)

  const io = req.app.get("io")
  io.emit(SOCKET_EVENTS.TABLE_STATUS, {
    tableNumber: bill.tableNumber,
    status:      "available",
    billId:      bill._id.toString(),   // ← include so tablet can show feedback modal
  })
  io.emit(SOCKET_EVENTS.NEW_BILL, { bill })

  logAudit({
    action:      "BILL_PAYMENT",
    actor:       req.user._id,
    actorName:   req.user.name,
    actorRole:   req.user.role,
    targetModel: "Bill",
    targetId:    bill._id,
    details:     { tableNumber: bill.tableNumber, totalAmount: bill.totalAmount, paymentMethod: bill.paymentMethod },
    ip:          getIp(req),
  });

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

  // Never show void (ghost) bills in the admin list unless explicitly requested
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus
  } else {
    filter.paymentStatus = { $ne: PAYMENT_STATUS.VOID }
  }

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    filter.createdAt = { $gte: start, $lte: end }
  }

  const bills = await Bill.find(filter)
    .populate("generatedBy", "name")
    .populate("cashierDiscountBy", "name")
    .sort({ createdAt: -1 })

  const paidBills      = bills.filter((b) => b.paymentStatus === PAYMENT_STATUS.PAID)
  const totalRevenue   = paidBills.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalTips      = paidBills.reduce((sum, b) => sum + (b.tipAmount || 0), 0)
  const totalDiscounts = paidBills.reduce((sum, b) => sum + (b.discountAmount || 0), 0)

  res.status(STATUS_CODES.OK).json({
    success: true,
    count: bills.length,
    totalRevenue,
    totalDiscounts,
    totalTips,
    bills,
  })
})

// @desc   Get CURRENT unpaid bill by table number (for customer)
// @route  GET /api/v1/bills/table/:tableNumber/current
// @access Public
const getCurrentBillByTable = asyncHandler(async (req, res) => {
  const { tableNumber } = req.params

  // findOne + sort: get the most-recently-created unpaid bill
  const bill = await Bill
    .findOne({ tableNumber, paymentStatus: PAYMENT_STATUS.UNPAID })
    .populate("orders")
    .sort({ createdAt: -1 })

  if (!bill) {
    return res.status(STATUS_CODES.OK).json({
      success: true,
      bill:    null,
      message: "No active bill found for this table",
    })
  }

  // Guard: if every order in this bill is already billed, it's a ghost from a previous
  // session — void it and return null so the customer doesn't see a stale bill.
  const activeOrders = (bill.orders || []).filter(
    o => o.status !== ORDER_STATUS.BILLED && o.status !== ORDER_STATUS.CANCELLED
  )
  if (activeOrders.length === 0) {
    await Bill.updateMany(
      { tableNumber, paymentStatus: PAYMENT_STATUS.UNPAID },
      { paymentStatus: PAYMENT_STATUS.VOID }
    )
    return res.status(STATUS_CODES.OK).json({
      success: true,
      bill:    null,
      message: "No active bill found for this table",
    })
  }

  res.status(STATUS_CODES.OK).json({ success: true, bill })
})

// @desc   Request/Create a new bill for customer (self-service)
// @route  POST /api/v1/bills/request
// @access Public (customer)
const requestCustomerBill = asyncHandler(async (req, res) => {
  const { tableNumber } = req.body

  if (!tableNumber) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Table number is required")
  }

  // Look for an existing UNPAID bill — but verify it belongs to the CURRENT session.
  // A bill is "stale" when all of its orders have already been marked as billed
  // (that happens after a previous payment cleared the table but the auto-generated
  // bill was never explicitly paid, leaving a ghost UNPAID record).
  const existingBill = await Bill.findOne({
    tableNumber:   tableNumber,
    paymentStatus: PAYMENT_STATUS.UNPAID,
  })
    .populate("orders")
    .sort({ createdAt: -1 })      // get the newest one first

  if (existingBill) {
    const activeOrders = (existingBill.orders || []).filter(
      o => o.status !== ORDER_STATUS.BILLED && o.status !== ORDER_STATUS.CANCELLED
    )

    if (activeOrders.length > 0) {
      // Bill is still relevant for the current session — return it
      return res.status(STATUS_CODES.OK).json({
        success: true,
        bill:    existingBill,
        message: "Existing bill found",
      })
    }

    // Bill is stale (previous session ghost) — void ALL unpaid bills for this table
    await Bill.updateMany(
      { tableNumber, paymentStatus: PAYMENT_STATUS.UNPAID },
      { paymentStatus: PAYMENT_STATUS.VOID }
    )
  }

  // Find order IDs already attached to any non-void bill for this table
  const existingBills      = await Bill.find({ tableNumber, paymentStatus: { $ne: PAYMENT_STATUS.VOID } })
  const alreadyBilledIds   = existingBills.flatMap(b => b.orders.map(id => id.toString()))

  const orders = await Order.find({
    tableNumber: tableNumber,
    status:      ORDER_STATUS.SERVED,
    _id:         { $nin: alreadyBilledIds },
  })

  if (!orders || orders.length === 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("No completed orders found for this table")
  }

  // Build item list with all fields needed for offer matching
  let subtotal = 0
  const orderIds = []
  const allItems = []

  for (const order of orders) {
    orderIds.push(order._id)

    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const itemPrice = item.price    || 0
        const itemQty   = item.quantity || 1
        subtotal += itemPrice * itemQty

        allItems.push({
          menuItemId:       item.menuItem,   // ObjectId — used for item-scope offer matching
          name:             item.name,
          price:            itemPrice,
          quantity:         itemQty,
          category:         item.category || "",
          selectedVariants: item.selectedVariants || [],
        })
      }
    }
  }

  // ── Apply active offers ──────────────────────────────────────
  const { totalDiscount, appliedOffers } = await computeActiveDiscounts(allItems, subtotal)

  const discountedSubtotal = subtotal - totalDiscount
  const vatAmount          = discountedSubtotal * 0.13
  const totalAmount        = discountedSubtotal + vatAmount

  // Build stored items array (no menuItemId — kept for receipt display only)
  const storedItems = allItems.map(i => ({
    name:             i.name,
    price:            i.price,
    quantity:         i.quantity,
    selectedVariants: i.selectedVariants,
  }))

  const bill = await Bill.create({
    tableNumber,
    orders:             orderIds,
    items:              storedItems,
    subtotal,
    discountAmount:     totalDiscount,
    discountedSubtotal,
    appliedOffers,
    vatPercent:         13,
    vatAmount,
    tipAmount:          0,
    totalAmount,
    paymentMethod:      "cash",
    paymentStatus:      PAYMENT_STATUS.UNPAID,
    note:               "Auto-generated by customer request",
  })

  await bill.populate("orders")

  const io = req.app.get("io")
  if (io) {
    io.emit("bill_requested", {
      tableNumber,
      billId:    bill._id,
      subtotal,
      discountAmount: totalDiscount,
      vatAmount,
      totalAmount,
    })
  }

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Bill generated successfully",
    bill,
  })
})

// @desc   Get bill by ID (for customer)
// @route  GET /api/v1/bills/:id/customer
// @access Public
const getCustomerBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate("orders")

  if (!bill) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.BILL.NOT_FOUND)
  }

  const safeBill = bill.toObject()
  delete safeBill.generatedBy

  res.status(STATUS_CODES.OK).json({ success: true, bill: safeBill })
})

// ─── eSewa: initiate payment ──────────────────────────────────────────────────
// POST /api/v1/bills/:id/esewa/initiate  (public)
const initiateEsewaPayment = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
  if (!bill) { res.status(STATUS_CODES.NOT_FOUND); throw new Error("Bill not found") }
  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    res.status(STATUS_CODES.BAD_REQUEST); throw new Error("Bill already paid")
  }

  const transactionUuid = `${bill._id}_${Date.now()}`
  const discountedSub   = Number(bill.discountedSubtotal || bill.subtotal)
  const taxAmount       = Number(bill.vatAmount)
  const totalAmount     = Number(bill.totalAmount)

  const message   = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`
  const signature = crypto.createHmac("sha256", ESEWA_SECRET).update(message).digest("base64")

  bill.note = `esewa_uuid:${transactionUuid}`
  await bill.save()

  res.json({
    success: true,
    paymentUrl: ESEWA_PAYMENT_URL,
    params: {
      amount:                  String(discountedSub),
      tax_amount:              String(taxAmount),
      total_amount:            String(totalAmount),
      transaction_uuid:        transactionUuid,
      product_code:            ESEWA_PRODUCT_CODE,
      product_service_charge:  "0",
      product_delivery_charge: "0",
      signed_field_names:      "total_amount,transaction_uuid,product_code",
      signature,
    },
  })
})

// ─── eSewa: verify & complete payment ────────────────────────────────────────
// POST /api/v1/bills/esewa/verify  (public)
const verifyEsewaPayment = asyncHandler(async (req, res) => {
  const { data } = req.body
  if (!data) { res.status(STATUS_CODES.BAD_REQUEST); throw new Error("No data provided") }

  let decoded
  try {
    decoded = JSON.parse(Buffer.from(data, "base64").toString("utf8"))
  } catch {
    res.status(STATUS_CODES.BAD_REQUEST); throw new Error("Invalid base64 data")
  }

  const { transaction_uuid, status, signed_field_names, signature: receivedSig } = decoded

  // Extract billId early so we can emit failure events if needed
  const billId = transaction_uuid?.split("_")[0]
  const io     = req.app.get("io")

  const fields   = (signed_field_names || "").split(",").map(f => f.trim())
  const message  = fields.map(f => `${f}=${decoded[f]}`).join(",")
  const expected = crypto.createHmac("sha256", ESEWA_SECRET).update(message).digest("base64")

  if (expected !== receivedSig) {
    if (io && billId) io.emit(SOCKET_EVENTS.BILL_PAYMENT_FAILED, { billId })
    res.status(STATUS_CODES.BAD_REQUEST); throw new Error("Signature mismatch — payment tampered")
  }
  if (status !== "COMPLETE") {
    if (io && billId) io.emit(SOCKET_EVENTS.BILL_PAYMENT_FAILED, { billId })
    res.status(STATUS_CODES.BAD_REQUEST); throw new Error("Payment not completed")
  }

  if (!billId) { res.status(STATUS_CODES.BAD_REQUEST); throw new Error("Invalid transaction UUID") }

  const bill = await Bill.findById(billId)
  if (!bill) { res.status(STATUS_CODES.NOT_FOUND); throw new Error("Bill not found") }

  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    // Already paid — emit billPaid so any waiting client can proceed
    if (io) io.emit(SOCKET_EVENTS.BILL_PAID, { billId: bill._id.toString() })
    return res.json({ success: true, bill, message: "Already paid" })
  }

  bill.paymentStatus = PAYMENT_STATUS.PAID
  bill.paymentMethod = "esewa"
  bill.paidAt        = new Date()
  await bill.save()

  // Void every OTHER unpaid bill for this table so they never resurface
  await Bill.updateMany(
    { tableNumber: bill.tableNumber, paymentStatus: PAYMENT_STATUS.UNPAID, _id: { $ne: bill._id } },
    { paymentStatus: PAYMENT_STATUS.VOID }
  )

  await Order.updateMany({ _id: { $in: bill.orders } }, { status: ORDER_STATUS.BILLED })
  await Order.updateMany({ tableNumber: bill.tableNumber, status: ORDER_STATUS.SERVED }, { status: ORDER_STATUS.BILLED })

  await updateTableStatusFromOrders(bill.tableNumber)

  if (io) {
    io.emit(SOCKET_EVENTS.BILL_PAID,    { billId: bill._id.toString() })
    io.emit(SOCKET_EVENTS.TABLE_STATUS, { tableNumber: bill.tableNumber, status: "available", billId: bill._id.toString() })
    io.emit(SOCKET_EVENTS.NEW_BILL,     { bill })
  }

  res.json({ success: true, bill, message: "Payment verified and completed" })
})

// @desc   Apply or remove cashier manual discount
// @route  PUT /api/v1/bills/:id/cashier-discount
// @access Cashier + Admin
const VALID_REASONS = ["regular_customer", "daily_visitor", "special_occasion", "birthday", "complaint_resolution", "manager_approval", "other"]

const applyCashierDiscount = asyncHandler(async (req, res) => {
  const { discountPercent, reason, note } = req.body
  const pct = Number(discountPercent) || 0

  // Hard limit — reject anything above 15
  if (pct < 0 || pct > 15) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Cashier discount must be between 0 and 15 percent")
  }

  // reason is required when applying a discount
  if (pct > 0 && !reason) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("A reason is required when applying a cashier discount")
  }

  if (pct > 0 && !VALID_REASONS.includes(reason)) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Invalid discount reason")
  }

  const bill = await Bill.findById(req.params.id)
  if (!bill) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.BILL.NOT_FOUND)
  }

  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Cannot modify a paid bill")
  }

  // Discount chain: Subtotal → Offer Discount → Game Discount → Cashier Discount
  // Base for cashier discount = subtotal after offer discounts AND after game discount
  const afterOffers   = Math.round(bill.subtotal - (bill.discountAmount || 0))
  const baseSubtotal  = Math.round(afterOffers - (bill.discountGameAmount || 0))

  if (pct === 0) {
    // Remove cashier discount — restore to after-offers + after-game state
    bill.cashierDiscount       = 0
    bill.cashierDiscountAmount = 0
    bill.cashierDiscountReason = null
    bill.cashierDiscountNote   = ""
    bill.cashierDiscountBy     = null

    bill.discountedSubtotal = baseSubtotal
    bill.vatAmount          = Math.round(baseSubtotal * ((bill.vatPercent || 13) / 100))
    bill.totalAmount        = bill.discountedSubtotal + bill.vatAmount + (bill.tipAmount || 0)
  } else {
    const cashierDiscountAmt  = Math.round(baseSubtotal * (pct / 100))
    const newDiscountedSub    = baseSubtotal - cashierDiscountAmt
    const newVat              = Math.round(newDiscountedSub * ((bill.vatPercent || 13) / 100))

    bill.cashierDiscount       = pct
    bill.cashierDiscountAmount = cashierDiscountAmt
    bill.cashierDiscountReason = reason
    bill.cashierDiscountNote   = (reason === "other" && note) ? note : ""
    bill.cashierDiscountBy     = req.user._id

    bill.discountedSubtotal = newDiscountedSub
    bill.vatAmount          = newVat
    bill.totalAmount        = newDiscountedSub + newVat + (bill.tipAmount || 0)
  }

  await bill.save()
  await bill.populate("cashierDiscountBy", "name")

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: pct === 0 ? "Cashier discount removed" : "Cashier discount applied",
    bill,
  })
})

// @desc   Enable or disable discount game for a table's current unpaid bill
// @route  PUT /api/v1/bills/table/:tableNumber/game-enable
// @access Cashier + Admin
const enableTableGame = asyncHandler(async (req, res) => {
  const { tableNumber } = req.params
  const { enabled } = req.body

  const bill = await Bill.findOne({ tableNumber, paymentStatus: PAYMENT_STATUS.UNPAID }).sort({ createdAt: -1 })

  if (!bill) {
    return res.status(STATUS_CODES.OK).json({ success: true, noActiveBill: true, message: "No active bill for this table" })
  }

  if (bill.discountGamePlayed) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Game has already been played for this bill")
  }

  bill.discountGameEnabled = !!enabled
  await bill.save()

  res.status(STATUS_CODES.OK).json({
    success: true,
    discountGameEnabled: bill.discountGameEnabled,
    billId: bill._id,
  })
})

module.exports = {
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
}
