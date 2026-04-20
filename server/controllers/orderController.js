const Order        = require("../models/Order")
const Table        = require("../models/Table")
const Menu         = require("../models/Menu")
const MESSAGES     = require("../constants/messages")
const STATUS_CODES = require("../constants/statusCodes")
const asyncHandler = require("../utils/asyncHandler")
const { ORDER_STATUS, TABLE_STATUS, SOCKET_EVENTS, BAR_CATEGORIES } = require("../constants")
const { updateTableStatusFromOrders } = require("../utils/tableStatusHelper")
const { deductIngredients, restoreIngredients, checkAvailability } = require("../utils/inventoryHelper")
const { logAudit, getIp } = require("../utils/auditHelper")

const getDestination = (category) => BAR_CATEGORIES.includes(category) ? "bar" : "kitchen"

// When all active orders for a table are served → flip table to "billing"
const checkAndMarkTableBilling = async (tableNumber, io) => {
  const activeOrders = await Order.find({
    tableNumber,
    status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.BILLED] },
  })

  const allServed = activeOrders.length > 0 && activeOrders.every(o => o.status === ORDER_STATUS.SERVED)

  if (allServed) {
    await Table.findOneAndUpdate({ tableNumber }, { status: TABLE_STATUS.BILLING })
    io.emit(SOCKET_EVENTS.TABLE_STATUS, { tableNumber, status: TABLE_STATUS.BILLING })
    console.log(`🧾 Table ${tableNumber} → BILLING`)
  }
}

// @desc   Place a new order
// @route  POST /api/v1/orders
// @access Public
const placeOrder = asyncHandler(async (req, res) => {
  const { tableNumber, items, totalAmount } = req.body

  if (!tableNumber || !items || items.length === 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Table number and items are required")
  }

  // ── PRE-SAVE: check ingredient availability for every item ──────────────────
  const unavailableReasons = []

  for (const item of items) {
    const { available, insufficientItems } = await checkAvailability(
      item.menuItem,
      item.quantity,
      item.selectedVariants || []
    )
    if (!available) {
      unavailableReasons.push(...insufficientItems)
    }
  }

  if (unavailableReasons.length > 0) {
    const details = unavailableReasons
      .map(r => `${r.menuItem}: needs ${r.needed} ${r.unit} of ${r.ingredientName} (only ${r.available} available)`)
      .join("; ")
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(`Some items cannot be prepared due to insufficient stock. ${details}`)
  }

  // ── Enrich items with destination ──────────────────────────────────────────
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const menuItem = await Menu.findById(item.menuItem)
      return {
        ...item,
        destination: menuItem?.destination || getDestination(menuItem?.category || item.category),
        status: "pending",
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

  // Table → occupied as soon as order is placed
  await Table.findOneAndUpdate(
    { tableNumber },
    { status: TABLE_STATUS.OCCUPIED, currentOrder: order._id }
  )

  const io = req.app.get("io")

  // ── POST-SAVE: deduct ingredients ──────────────────────────────────────────
  try {
    await deductIngredients(enrichedItems, io)
  } catch (err) {
    // Non-fatal — order is placed, but log the deduction error
    console.error("Inventory deduction error:", err.message)
  }

  const foodItems  = order.items.filter(i => i.destination === "kitchen")
  const drinkItems = order.items.filter(i => i.destination === "bar")

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

  io.to(`table_${tableNumber}`).emit(SOCKET_EVENTS.NEW_ORDER, { order })
  io.emit(SOCKET_EVENTS.TABLE_STATUS, { tableNumber, status: TABLE_STATUS.OCCUPIED })

  logAudit({
    action:      "ORDER_PLACED",
    actor:       req.user?._id || null,
    actorName:   req.user?.name || "Customer",
    actorRole:   req.user?.role || "customer",
    targetModel: "Order",
    targetId:    order._id,
    details:     { tableNumber, itemCount: order.items.length, totalAmount },
    ip:          getIp(req),
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.ORDER.PLACED,
    order,
  })
})

// @desc   Get all orders (with filters)
// @route  GET /api/v1/orders
// @access Kitchen + Bar + Cashier + Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, tableNumber, limit, page } = req.query
  const filter = {}

  if (status)      filter.status      = { $in: status.split(",") }
  if (tableNumber) filter.tableNumber = tableNumber

  const pageNum  = parseInt(page)  || 1
  const limitNum = parseInt(limit) || 1000
  const skip     = (pageNum - 1) * limitNum

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean()

  const total = await Order.countDocuments(filter)

  res.status(STATUS_CODES.OK).json({
    success: true,
    count:   orders.length,
    total,
    page:    pageNum,
    pages:   Math.ceil(total / limitNum),
    orders,
  })
})

// @desc   Get ALL orders for admin
// @route  GET /api/v1/orders/admin/all
// @access Admin only
const adminGetAllOrders = asyncHandler(async (req, res) => {
  const { status, tableNumber, startDate, endDate } = req.query
  const filter = {}

  if (status)      filter.status      = { $in: status.split(",") }
  if (tableNumber) filter.tableNumber = tableNumber

  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate)   filter.createdAt.$lte = new Date(endDate)
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("cancelledBy", "name email")
    .lean()

  const stats = {
    total:            orders.length,
    byStatus:         {},
    totalRevenue:     0,
    pendingOrders:    0,
    completedOrders:  0,
    cancelledOrders:  0,
  }

  orders.forEach(order => {
    stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1
    if (order.status === "served") {
      stats.totalRevenue += order.totalAmount || 0
      stats.completedOrders++
    }
    if (order.status === "pending" || order.status === "cooking") stats.pendingOrders++
    if (order.status === "cancelled") stats.cancelledOrders++
  })

  res.status(STATUS_CODES.OK).json({ success: true, count: orders.length, stats, orders })
})

// @desc   Get single order by ID (Admin)
// @route  GET /api/v1/orders/admin/:id
// @access Admin only
const adminGetOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("cancelledBy", "name email")
    .lean()

  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  res.status(STATUS_CODES.OK).json({ success: true, order })
})

// @desc   Delete single order (Admin)
// @route  DELETE /api/v1/orders/admin/:id
// @access Admin only
const adminDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  await order.deleteOne()
  await updateTableStatusFromOrders(order.tableNumber)

  const io = req.app.get("io")
  io.emit("order_deleted", { orderId: req.params.id })

  res.status(STATUS_CODES.OK).json({ success: true, message: "Order deleted successfully" })
})

// @desc   Bulk delete orders (Admin)
// @route  DELETE /api/v1/orders/admin/bulk
// @access Admin only
const adminBulkDeleteOrders = asyncHandler(async (req, res) => {
  const { orderIds } = req.body

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Please provide an array of order IDs")
  }

  const ordersToDelete = await Order.find({ _id: { $in: orderIds } })
  const tableNumbers   = [...new Set(ordersToDelete.map(o => o.tableNumber))]

  if (ordersToDelete.length === 0) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("No valid orders found to delete")
  }

  const result = await Order.deleteMany({ _id: { $in: orderIds } })

  for (const tableNumber of tableNumbers) {
    await updateTableStatusFromOrders(tableNumber)
  }

  const io = req.app.get("io")
  io.emit("orders_bulk_deleted", { count: result.deletedCount, orderIds })

  res.status(STATUS_CODES.OK).json({
    success:        true,
    message:        `${result.deletedCount} orders deleted successfully`,
    deletedCount:   result.deletedCount,
    deletedOrderIds: orderIds,
  })
})

// @desc   Get order stats (Admin)
// @route  GET /api/v1/orders/admin/stats
// @access Admin only
const adminGetOrderStats = asyncHandler(async (req, res) => {
  const { period = "today" } = req.query
  const now = new Date()
  let dateFilter = {}

  if (period === "today") {
    dateFilter = {
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }
  } else if (period === "week") {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    dateFilter = { createdAt: { $gte: weekAgo } }
  } else if (period === "month") {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    dateFilter = { createdAt: { $gte: monthAgo } }
  }

  const stats       = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id:           "$status",
        count:         { $sum: 1 },
        totalRevenue:  { $sum: "$totalAmount" },
        avgOrderValue: { $avg: "$totalAmount" },
      },
    },
  ])

  const totalOrders  = await Order.countDocuments(dateFilter)
  const totalRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0)
  const last24h      = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentOrders = await Order.countDocuments({ createdAt: { $gte: last24h } })

  res.status(STATUS_CODES.OK).json({
    success: true,
    period,
    stats: {
      totalOrders,
      totalRevenue,
      recentOrders,
      breakdown:         stats,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
  })
})

// @desc   Delete orders by date range (Admin)
// @route  DELETE /api/v1/orders/admin/delete-by-date
// @access Admin only
const adminDeleteOrdersByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.body

  if (!startDate || !endDate) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Start date and end date are required")
  }

  const filter = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  }
  if (status) filter.status = status

  const ordersToDelete = await Order.find(filter)
  const tableNumbers   = [...new Set(ordersToDelete.map(o => o.tableNumber))]

  const result = await Order.deleteMany(filter)

  for (const tableNumber of tableNumbers) {
    await updateTableStatusFromOrders(tableNumber)
  }

  res.status(STATUS_CODES.OK).json({
    success:      true,
    message:      `${result.deletedCount} orders deleted successfully`,
    deletedCount: result.deletedCount,
  })
})

// @desc   Get orders by table
// @route  GET /api/v1/orders/table/:tableNumber
// @access Cashier + Admin
const getOrdersByTable = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    tableNumber: req.params.tableNumber,
    status:      { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.BILLED] },
  }).sort({ createdAt: 1 })

  res.status(STATUS_CODES.OK).json({ success: true, count: orders.length, orders })
})

// @desc   Get single order
// @route  GET /api/v1/orders/:id
// @access Kitchen + Bar + Cashier + Admin
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }
  res.status(STATUS_CODES.OK).json({ success: true, order })
})

// @desc   Update item status
// @route  PATCH /api/v1/orders/:id/items/:itemId/status
// @access Kitchen + Bar + Admin
const updateItemStatus = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params
  const { status, estimatedSecs } = req.body

  const VALID = ["pending", "cooking", "ready", "served"]
  if (!VALID.includes(status)) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(`Invalid item status. Must be one of: ${VALID.join(", ")}`)
  }

  const order = await Order.findById(id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  const item = order.items.id(itemId)
  if (!item) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error("Order item not found")
  }

  item.status = status

  // When starting to cook, record start time and cook's estimate
  if (status === "cooking") {
    item.cookingStartedAt = new Date()
    if (estimatedSecs && estimatedSecs > 0) item.estimatedSecs = estimatedSecs
  }
  // Clear timer data when item is done
  if (status === "ready" || status === "served") {
    item.cookingStartedAt = null
    item.estimatedSecs    = null
  }

  order.syncStatus()
  order.statusHistory.push({
    status:    `item:${item.name}→${status}`,
    changedAt: new Date(),
    changedBy: req.user?._id,
  })
  await order.save()

  // Check if all items served → table to billing
  await updateTableStatusFromOrders(order.tableNumber)

  const io = req.app.get("io")

  io.to(`table_${order.tableNumber}`).emit("item-status-update", {
    orderId:          order._id,
    itemId:           item._id,
    itemName:         item.name,
    destination:      item.destination,
    status,
    orderStatus:      order.status,
    cookingStartedAt: item.cookingStartedAt,
    estimatedSecs:    item.estimatedSecs,
  })

  io.to(item.destination).emit("item-status-update", {
    orderId: order._id,
    itemId:  item._id,
    status,
  })

  if (status === "ready") {
    io.to("cashier").emit(SOCKET_EVENTS.ORDER_READY, {
      orderId:     order._id,
      tableNumber: order.tableNumber,
      itemName:    item.name,
    })
  }

  // Auto-serve after 1 minute
  if (status === "ready") {
    setTimeout(async () => {
      try {
        const fresh     = await Order.findById(order._id)
        if (!fresh) return
        const freshItem = fresh.items.id(itemId)
        if (freshItem && freshItem.status === "ready") {
          freshItem.status = "served"
          fresh.syncStatus()
          fresh.statusHistory.push({ status: `item:${freshItem.name}→served`, changedAt: new Date() })
          await fresh.save()

          await updateTableStatusFromOrders(fresh.tableNumber)
          const currentStatus = await updateTableStatusFromOrders(fresh.tableNumber)

          io.to(`table_${fresh.tableNumber}`).emit("item-status-update", {
            orderId:     fresh._id,
            itemId:      freshItem._id,
            itemName:    freshItem.name,
            destination: freshItem.destination,
            status:      "served",
            orderStatus: fresh.status,
          })

          if (currentStatus === TABLE_STATUS.BILLING) {
            io.to("cashier").emit(SOCKET_EVENTS.TABLE_STATUS, {
              tableNumber: fresh.tableNumber,
              status:      TABLE_STATUS.BILLING,
            })
          }
        }
      } catch (err) {
        console.error("Auto-serve error:", err.message)
      }
    }, 60 * 1000)
  }

  if (order.isFullyServed()) {
    await checkAndMarkTableBilling(order.tableNumber, io)
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Item status updated to ${status}`,
    order,
  })
})

// @desc   Update whole order status
// @route  PATCH /api/v1/orders/:id/status
// @access Kitchen + Bar + Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.BILLED].includes(order.status)) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error(MESSAGES.ORDER.CANNOT_CANCEL)
  }

  order.status = status
  order.statusHistory.push({ status, changedAt: new Date(), changedBy: req.user?._id })
  await order.save()

  await updateTableStatusFromOrders(order.tableNumber)

  const io = req.app.get("io")
  io.to(`table_${order.tableNumber}`).emit(SOCKET_EVENTS.ORDER_STATUS, {
    orderId: order._id,
    status:  order.status,
  })

  if (status === ORDER_STATUS.SERVED) {
    await checkAndMarkTableBilling(order.tableNumber, io)
  }

  if (status === ORDER_STATUS.READY) {
    io.to("cashier").emit(SOCKET_EVENTS.ORDER_READY, {
      orderId:     order._id,
      tableNumber: order.tableNumber,
    })

    setTimeout(async () => {
      try {
        const freshOrder = await Order.findById(order._id)
        if (freshOrder && freshOrder.status === ORDER_STATUS.READY) {
          freshOrder.status = ORDER_STATUS.SERVED
          freshOrder.statusHistory.push({ status: ORDER_STATUS.SERVED, changedAt: new Date() })
          await freshOrder.save()

          await updateTableStatusFromOrders(freshOrder.tableNumber)

          io.to(`table_${freshOrder.tableNumber}`).emit(SOCKET_EVENTS.ORDER_STATUS, {
            orderId: freshOrder._id,
            status:  ORDER_STATUS.SERVED,
          })

          await checkAndMarkTableBilling(freshOrder.tableNumber, io)
        }
      } catch (err) {
        console.error("Auto-serve error:", err.message)
      }
    }, 60 * 1000)
  }

  logAudit({
    action:      "ORDER_STATUS_CHANGE",
    actor:       req.user?._id,
    actorName:   req.user?.name,
    actorRole:   req.user?.role,
    targetModel: "Order",
    targetId:    order._id,
    details:     { tableNumber: order.tableNumber, newStatus: status },
    ip:          getIp(req),
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.ORDER.STATUS_UPDATED,
    order,
  })
})

// @desc   Cancel order
// @route  PATCH /api/v1/orders/:id/cancel
// @access Kitchen + Bar + Admin
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

  // ── Restore ingredients for cancelled order ────────────────────────────────
  try {
    await restoreIngredients(order.items)
  } catch (err) {
    console.error("Inventory restore error:", err.message)
  }

  await updateTableStatusFromOrders(order.tableNumber)

  const io = req.app.get("io")
  io.to(`table_${order.tableNumber}`).emit(SOCKET_EVENTS.ORDER_CANCELLED, {
    orderId: order._id,
    reason:  cancelReason,
  })

  await checkAndMarkTableBilling(order.tableNumber, io)

  logAudit({
    action:      "ORDER_CANCELLED",
    actor:       req.user?._id,
    actorName:   req.user?.name,
    actorRole:   req.user?.role,
    targetModel: "Order",
    targetId:    order._id,
    details:     { tableNumber: order.tableNumber, cancelReason },
    ip:          getIp(req),
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.ORDER.CANCELLED,
    order,
  })
})

// @desc   Set estimated preparation time
// @route  PATCH /api/v1/orders/:id/estimate
// @access Kitchen + Bar only
const setEstimatedTime = asyncHandler(async (req, res) => {
  const { estimatedTime } = req.body

  const mins = Number(estimatedTime)
  if (!mins || mins <= 0) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("estimatedTime must be a positive number (minutes)")
  }

  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.ORDER.NOT_FOUND)
  }

  order.estimatedTime = mins
  order.estimatedAt   = new Date()
  await order.save()

  const io = req.app.get("io")
  io.to(`table_${order.tableNumber}`).emit(SOCKET_EVENTS.ORDER_ESTIMATED, {
    orderId:       order._id,
    estimatedTime: order.estimatedTime,
    estimatedAt:   order.estimatedAt,
  })

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: "Estimated time set",
    order,
  })
})

module.exports = {
  placeOrder,
  getAllOrders,
  getOrdersByTable,
  getOrder,
  updateItemStatus,
  updateOrderStatus,
  cancelOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminDeleteOrder,
  adminBulkDeleteOrders,
  adminGetOrderStats,
  adminDeleteOrdersByDateRange,
  setEstimatedTime,
}
