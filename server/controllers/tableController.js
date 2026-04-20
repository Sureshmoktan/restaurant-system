const Table = require("../models/Table");
const asyncHandler = require("../utils/asyncHandler");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/statusCodes");

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
const getAllTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ tableNumber: 1 });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.TABLE.FETCHED,
    count: tables.length,
    tables,
  });
});

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private
const getTableById = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id).populate("currentOrder");

  if (!table) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.TABLE.NOT_FOUND);
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    table,
  });
});

// @desc    Create table
// @route   POST /api/tables
// @access  Admin only
const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity, category } = req.body;   // ← add category

  const existing = await Table.findOne({ tableNumber });
  if (existing) {
    res.status(STATUS_CODES.CONFLICT);
    throw new Error(`Table ${tableNumber} already exists`);
  }

  const table = await Table.create({ tableNumber, capacity, category });  // ← add category

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.TABLE.CREATED,
    table,
  });
});

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Admin only
const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);

  if (!table) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.TABLE.NOT_FOUND);
  }

  const updated = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.TABLE.UPDATED,
    table: updated,
  });
});


// @desc    Update table status manually (for admin/cashier)
// @route   PATCH /api/tables/:id/status
// @access  Admin/Cashier
const updateTableStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const table = await Table.findById(req.params.id);

  if (!table) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.TABLE.NOT_FOUND);
  }

  const validStatuses = ["available", "occupied", "billed", "reserved"];
  if (!validStatuses.includes(status)) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  table.status = status;
  if (status === "available") {
    table.currentOrder = null;
    table.customerCount = 0;
  }
  await table.save();

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Table ${table.tableNumber} status updated to ${status}`,
    table,
  });
});

// @desc    Force fix all table statuses based on actual orders
// @route   POST /api/tables/fix-all-status
// @access  Admin
const fixAllTableStatuses = asyncHandler(async (req, res) => {
  const tables = await Table.find();
  const Order = require("../models/Order");
  const updates = [];

  for (const table of tables) {
    // Find active orders (not billed or cancelled)
    const activeOrders = await Order.find({
      tableNumber: table.tableNumber,
      status: { $nin: ["billed", "cancelled"] }
    });

    let correctStatus = "available";
    
    if (activeOrders.length > 0) {
      // Check if any order is served (ready for billing)
      const hasServedOrders = activeOrders.some(o => o.status === "served");
      if (hasServedOrders) {
        correctStatus = "billed";
      } else {
        correctStatus = "occupied";
      }
    }

    if (table.status !== correctStatus) {
      const oldStatus = table.status;
      table.status = correctStatus;
      if (correctStatus === "available") {
        table.currentOrder = null;
        table.customerCount = 0;
      }
      await table.save();
      updates.push({
        tableNumber: table.tableNumber,
        oldStatus,
        newStatus: correctStatus,
        activeOrdersCount: activeOrders.length
      });
    }
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Fixed ${updates.length} tables`,
    updates
  });
});

// Keep the old toggleOccupied for backward compatibility but mark as deprecated
const toggleOccupied = asyncHandler(async (req, res) => {
  // This function is deprecated - use updateTableStatus instead
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.TABLE.NOT_FOUND);
  }

  // Map status toggles
  if (table.status === "available") {
    table.status = "occupied";
    table.customerCount = req.body.customerCount || 1;
  } else if (table.status === "occupied") {
    table.status = "available";
    table.currentOrder = null;
    table.customerCount = 0;
  } else if (table.status === "billed") {
    table.status = "available";
    table.currentOrder = null;
    table.customerCount = 0;
  }
  
  await table.save();

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Table ${table.tableNumber} is now ${table.status}`,
    table,
  });
});

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Admin only
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);

  if (!table) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.TABLE.NOT_FOUND);
  }

  if (table.isOccupied) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error("Cannot delete an occupied table");
  }

  await Table.findByIdAndDelete(req.params.id);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.TABLE.DELETED,
  });
});



module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  toggleOccupied,
  updateTableStatus,
  fixAllTableStatuses,
};