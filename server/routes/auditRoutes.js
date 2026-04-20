const express    = require("express")
const router     = express.Router()
const { getAuditLogs } = require("../controllers/auditController")
const protect    = require("../middlewares/authMiddleware")
const restrictTo = require("../middlewares/roleMiddleware")

// GET /api/v1/audit  — admin only
router.get("/", protect, restrictTo("admin"), getAuditLogs)

module.exports = router
