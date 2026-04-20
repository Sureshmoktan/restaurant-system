const AuditLog = require("../models/AuditLog")

/**
 * Write an audit log entry.
 * Never throws — failures are swallowed so they never break the main request.
 *
 * @param {object} opts
 * @param {string}  opts.action       - e.g. "USER_LOGIN", "MENU_CREATE"
 * @param {*}       opts.actor        - ObjectId of the acting user (may be null for public actions)
 * @param {string}  opts.actorName    - Display name of the actor
 * @param {string}  opts.actorRole    - Role of the actor
 * @param {string}  opts.targetModel  - Mongoose model name the action targeted
 * @param {*}       opts.targetId     - ID of the targeted document
 * @param {object}  opts.details      - Arbitrary extra context
 * @param {string}  opts.ip           - Client IP address
 */
const logAudit = async ({
  action,
  actor      = null,
  actorName  = "System",
  actorRole  = "",
  targetModel = "",
  targetId   = "",
  details    = {},
  ip         = "",
} = {}) => {
  try {
    await AuditLog.create({
      action,
      actor:       actor   || null,
      actorName:   actorName,
      actorRole:   actorRole,
      targetModel: targetModel,
      targetId:    targetId ? String(targetId) : "",
      details:     details,
      ip:          ip,
    })
  } catch (err) {
    console.error("[AuditLog] Failed to write log:", err.message)
  }
}

/**
 * Convenience: extract the best available client IP from a request object.
 */
const getIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.ip ||
  ""

module.exports = { logAudit, getIp }
