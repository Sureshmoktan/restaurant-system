const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/statusCodes");

const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.message) // add this line
  console.error(err.stack)              // add this line
  // ... rest of your code
  let statusCode = res.statusCode === STATUS_CODES.OK ? STATUS_CODES.INTERNAL_SERVER_ERROR : res.statusCode;
  let message = err.message || MESSAGES.GENERAL.SERVER_ERROR;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = STATUS_CODES.NOT_FOUND;
    message = MESSAGES.GENERAL.NOT_FOUND;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = STATUS_CODES.BAD_REQUEST;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    message = MESSAGES.AUTH.INVALID_TOKEN;
  }

  if (err.name === "TokenExpiredError") {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    message = MESSAGES.AUTH.TOKEN_EXPIRED;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;