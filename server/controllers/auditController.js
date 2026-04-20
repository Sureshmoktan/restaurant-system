const AuditLog    = require("../models/AuditLog")
const asyncHandler = require("../utils/asyncHandler")
const STATUS_CODES = require("../constants/statusCodes")

// @desc   Get audit logs with filters
// @route  GET /api/v1/audit
// @access Admin only
const getAuditLogs = asyncHandler(async (req, res) => {
  const { userId, role, action, targetModel, startDate, endDate, page, limit } = req.query

  const filter = {}

  if (userId)      filter.actor       = userId
  if (role)        filter.actorRole   = role
  if (targetModel) filter.targetModel = targetModel

  if (action) {
    filter.action = { $regex: action, $options: "i" }
  }

  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = end
    }
  }

  const pageNum  = Math.max(parseInt(page)  || 1, 1)
  const limitNum = Math.min(parseInt(limit) || 50, 200)
  const skip     = (pageNum - 1) * limitNum

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("actor", "name email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ])

  res.status(STATUS_CODES.OK).json({
    success: true,
    total,
    page:    pageNum,
    pages:   Math.ceil(total / limitNum),
    limit:   limitNum,
    logs,
  })
})

module.exports = { getAuditLogs }
