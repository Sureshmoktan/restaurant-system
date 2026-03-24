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
  const { tableNumber, capacity } = req.body;

  const existing = await Table.findOne({ tableNumber });
  if (existing) {
    res.status(STATUS_CODES.CONFLICT);
    throw new Error(`Table ${tableNumber} already exists`);
  }

  const table = await Table.create({ tableNumber, capacity });

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

// @desc    Toggle table occupied status
// @route   PATCH /api/tables/:id/toggle
// @access  Private
const toggleOccupied = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);

  if (!table) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.TABLE.NOT_FOUND);
  }

  if (!table.isOccupied && table.currentOrder) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error(MESSAGES.TABLE.ALREADY_OCCUPIED);
  }

  table.isOccupied = !table.isOccupied;
  table.customerCount = table.isOccupied ? (req.body.customerCount || 1) : 0;
  if (!table.isOccupied) table.currentOrder = null;
  await table.save();

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Table ${table.tableNumber} is now ${table.isOccupied ? "occupied" : "available"}`,
    table,
  });
});

module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  toggleOccupied,
};