const mongoose = require("mongoose")

const AuditLogSchema = new mongoose.Schema(
  {
    action:      { type: String, required: true, trim: true },
    actor:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName:   { type: String, default: "System" },
    actorRole:   { type: String, default: "" },
    targetModel: { type: String, default: "" },
    targetId:    { type: String, default: "" },
    details:     { type: mongoose.Schema.Types.Mixed, default: {} },
    ip:          { type: String, default: "" },
  },
  { timestamps: true }
)

AuditLogSchema.index({ createdAt: -1 })
AuditLogSchema.index({ actor: 1 })

module.exports = mongoose.model("AuditLog", AuditLogSchema)
