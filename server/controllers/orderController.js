const Order        = require("../models/Order")
const Table        = require("../models/Table")
const Menu         = require("../models/Menu")
const MESSAGES     = require("../constants/messages")
const STATUS_CODES = require("../constants/statusCodes")
const asyncHandler = require("../utils/asyncHandler")
const { ORDER_STATUS, TABLE_STATUS, SOCKET_EVENTS, BAR_CATEGORIES } = require("../constants")

const getDestination = (category) => BAR_CATEGORIES.includes(category) ? "bar" : "kitchen"

// @desc   Place a new order
// @route  POST /api/v1/orders
// @access Public
const placeOrder = asyncHandler(async (req, res) => {
  const { tableNumber, items, totalAmount } = req.body

  if (!tableNumber || !items || items.length === 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Table number and items are required")
  }

  // Enrich each item with destination from Menu
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const menuItem = await Menu.findById(item.menuItem)
      return {
        ...item,
        destination: menuItem?.destination || getDestination(menuItem?.category || item.category),
      }
    })
  )


  const order = await Order.create({
    tableNumber,
    items:         enrichedItems,
    totalAmount,
    status:        ORDER_STATUS.PENDING,
    statusHistory: [{ status: ORDER_STATUS.PENDING, changedAt: new Date() }],
  })

  await Table.findOneAndUpdate(
    { tableNumber },
    { status: TABLE_STATUS.OCCUPIED, currentOrder: order._id }
  )

  const io = req.app.get("io")

  const foodItems  = order.items.filter((i) => i.destination === "kitchen")
  const drinkItems = order.items.filter((i) => i.destination === "bar")

  if (foodItems.length > 0) {
    io.to("kitchen").emit(SOCKET_EVENTS.NEW_ORDER, {
      order: { ...order.toObject(), items: foodItems },
    })
  }

  if (drinkItems.length > 0) {
    io.to("bar").emit(SOCKET_EVENTS.NEW_ORDER, {
      order: { ...order.toObject(), items: drinkItems },
    })
  }

  io.emit(SOCKET_EVENTS.TABLE_STATUS, { tableNumber, status: TABLE_STATUS.OCCUPIED })

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.ORDER.PLACED,
    order,
  })
})

// @desc   Get all orders
// @route  GET /api/v1/orders
// @access Kitchen + Admin + Cashier
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, tableNumber } = req.query
  const filter = {}

  if (status) {
    const statuses = status.split(",")
    filter.status  = { $in: statuses }
  }
  if (tableNumber) filter.tableNumber = (tableNumber)

  const orders = await Order.find(filter).sort({ createdAt: -1 })
  res.status(STATUS_CODES.OK).json({ success: true, count: orders.length, orders })
})

// @desc   Get orders by table
// @route  GET /api/v1/orders/table/:tableNumber
// @access Cashier + Admin
const getOrdersByTable = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    tableNumber: (req.params.tableNumber),
    status:      { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.BILLED] },
  }).sort({ createdAt: 1 })

  res.status(STATUS_CODES.OK).json({ success: true, count: orders.length, orders })
})

// @desc   Get single order
// @route  GET /api/v1/orders/:id
// @access Kitchen + Admin + Cashier
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }
  res.status(STATUS_CODES.OK).json({ success: true, order })
})

// @desc   Update order status
// @route  PATCH /api/v1/orders/:id/status
// @access Kitchen + Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.BILLED) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(MESSAGES.ORDER.CANNOT_CANCEL)
  }

  order.status = status
  order.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: req.user?._id,
  })
  await order.save()

  const io = req.app.get("io")

  io.to(`table_${order.tableNumber}`).emit(SOCKET_EVENTS.ORDER_STATUS, {
    orderId: order._id,
    status:  order.status,
  })

  if (status === ORDER_STATUS.READY) {
    io.to("cashier").emit(SOCKET_EVENTS.ORDER_READY, {
      orderId:     order._id,
      tableNumber: order.tableNumber,
    })

    // auto served after 1 minute
    setTimeout(async () => {
  try {
    const freshOrder = await Order.findById(order._id)
    if (freshOrder && freshOrder.status === ORDER_STATUS.READY) {
      freshOrder.status = ORDER_STATUS.SERVED
      freshOrder.statusHistory.push({
        status:    ORDER_STATUS.SERVED,
        changedAt: new Date(),
      })
      await freshOrder.save()

      // ❌ change this line
      io.to(`table_${freshOrder.tableNumber}`).emit(SOCKET_EVENTS.ORDER_STATUS, {
        orderId: freshOrder._id,
        status:  ORDER_STATUS.SERVED,
      })
    }
  } catch (err) {
    console.error("Auto-serve error:", err.message)
  }
}, 60 * 1000)
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.ORDER.STATUS_UPDATED,
    order,
  })
})

// @desc   Cancel order with reason
// @route  PATCH /api/v1/orders/:id/cancel
// @access Kitchen + Admin
const cancelOrder = asyncHandler(async (req, res) => {
  const { cancelReason } = req.body

  if (!cancelReason) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(MESSAGES.ORDER.REASON_REQUIRED)
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  if ([ORDER_STATUS.BILLED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(MESSAGES.ORDER.CANNOT_CANCEL)
  }

  order.status       = ORDER_STATUS.CANCELLED
  order.cancelReason = cancelReason
  order.cancelledAt  = new Date()
  order.cancelledBy  = req.user?._id
  order.statusHistory.push({
    status:    ORDER_STATUS.CANCELLED,
    changedAt: new Date(),
    changedBy: req.user?._id,
  })
  await order.save()

  const io = req.app.get("io")
  io.to(`table_${order.tableNumber}`).emit(SOCKET_EVENTS.ORDER_CANCELLED, {
    orderId: order._id,
    reason:  cancelReason,
  })

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.ORDER.CANCELLED,
    order,
  })
})

module.exports = {
  placeOrder,
  getAllOrders,
  getOrdersByTable,
  getOrder,
  updateOrderStatus,
  cancelOrder,
}