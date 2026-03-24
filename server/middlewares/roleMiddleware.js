const MESSAGES     = require("../constants/messages")
const STATUS_CODES = require("../constants/statusCodes")

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: MESSAGES.GENERAL.FORBIDDEN,
      })
    }
    next()
  }
}

module.exports = restrictTo