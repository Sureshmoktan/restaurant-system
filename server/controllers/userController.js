const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/statusCodes");
const ROLES = require("../constants/roles");

// @desc    Create new user (cashier or kitchen)
// @route   POST /api/users
// @access  Admin only
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error("Name, email, password and role are required");
  }

  // Only allow creating cashier or kitchen (not another admin)
  if (!Object.values(ROLES).includes(role) || role === ROLES.ADMIN) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error("Role must be cashier, kitchen or bar");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(STATUS_CODES.CONFLICT);
    throw new Error(MESSAGES.USER.ALREADY_EXISTS);
  }

  const user = await User.create({ name, email, password, role });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.USER.CREATED,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.USER.FETCHED,
    count: users.length,
    users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin only
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.USER.NOT_FOUND);
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.USER.FETCHED_ONE,
    user,
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin only
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.USER.NOT_FOUND);
  }

  const { name, email, role, isActive } = req.body;

  // Prevent changing role to admin
  if (role && role === ROLES.ADMIN) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error("Cannot assign admin role");
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, isActive },
    { new: true, runValidators: true }
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.USER.UPDATED,
    user: updated,
  });
});

// @desc    Deactivate user (soft delete)
// @route   DELETE /api/users/:id
// @access  Admin only
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.USER.NOT_FOUND);
  }

  await User.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.USER.DELETED,
  });
});

// @desc    Permanently delete user
// @route   DELETE /api/users/:id/permanent
// @access  Admin only
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.USER.NOT_FOUND);
  }

  // Prevent deleting an admin account
  if (user.role === ROLES.ADMIN) {
    res.status(STATUS_CODES.FORBIDDEN);
    throw new Error("Cannot permanently delete an admin account");
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.USER.PERMANENTLY_DELETED,
  });
});

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
};