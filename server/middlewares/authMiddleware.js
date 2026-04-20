const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/statusCodes");

// Protect routes - verify access token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(STATUS_CODES.UNAUTHORIZED);
    throw new Error(MESSAGES.AUTH.NOT_AUTHORIZED);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);

  if (!req.user || !req.user.isActive) {
    res.status(STATUS_CODES.UNAUTHORIZED);
    throw new Error(MESSAGES.AUTH.ACCOUNT_INACTIVE);
  }

  next();
});

// // Restrict to specific roles
// const restrictTo = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       res.status(STATUS_CODES.FORBIDDEN);
//       throw new Error(MESSAGES.GENERAL.FORBIDDEN);
//     }
//     next();
//   };
// };

module.exports = protect;
