const mongoose = require("mongoose")
 
const cashoutSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount:      { type: Number, required: true, min: 0 },
    category:    {
      type: String,
      enum: ["groceries", "supplies", "utilities", "repairs", "other"],
      default: "other",
    },
    recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)
 
module.exports = mongoose.model("Cashout", cashoutSchema)
 