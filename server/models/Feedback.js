const mongoose = require("mongoose")

const FeedbackSchema = new mongoose.Schema(
  {
    billId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Bill",
      required: true,
      unique:   true, // one feedback per bill
    },
    tableNumber: { type: String, required: true },
    billAmount:  { type: Number, default: 0 },

    // required
    rating: { type: Number, enum: [1, 2, 3, 4, 5], required: true },

    // optional
    emoji:      { type: String, enum: ["loved", "good", "okay", "poor", "bad", ""], default: "" },
    categories: {
      type:    [String],
      enum:    ["food_quality", "service", "cleanliness", "ambience", "value_for_money", "speed"],
      default: [],
    },
    comment: { type: String, maxlength: 500, default: "" },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Feedback", FeedbackSchema)
