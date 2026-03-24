const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/statusCodes");
const authMiddleware = require("../middlewares/authMiddleware");

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(STATUS_CODES.BAD_REQUEST);
    throw new Error(MESSAGES.AUTH.EMAIL_PASSWORD_REQUIRED);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !user.isActive) {
    res.status(STATUS_CODES.UNAUTHORIZED);
    throw new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(STATUS_CODES.UNAUTHORIZED);
    throw new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",

    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.AUTH.LOGIN_SUCCESS,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refreshToken cookie)
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(STATUS_CODES.UNAUTHORIZED);
    throw new Error(MESSAGES.AUTH.NO_REFRESH_TOKEN);
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    res.status(STATUS_CODES.UNAUTHORIZED);
    throw new Error(MESSAGES.AUTH.INVALID_TOKEN);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(STATUS_CODES.OK).json({
    success: true,
    accessToken,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken");
  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.AUTH.LOGOUT_SUCCESS,
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(STATUS_CODES.OK).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = { login, refresh, logout, getMe };