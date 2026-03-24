const mongoose = require("mongoose");
const { MENU_CATEGORIES, FOOD_CATEGORIES, BAR_CATEGORIES } = require("../constants");
console.log("BAR_CATEGORIES:", BAR_CATEGORIES);


const IngredientSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  optional: { type: Boolean, default: false }
}, { _id: false })

const OptionItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false })

const OptionGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  type:      { type: String, enum: ["scale", "single", "multiple"], default: "single" },
  required:  { type: Boolean, default: false },
  options:   [OptionItemSchema]
}, { _id: false })

const MenuSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: "" },
  category:      { type: String, required: true, enum: MENU_CATEGORIES },
  price:         { type: Number, required: true, min: 0 },
  image:         { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  isAvailable:   { type: Boolean, default: true },
  isVeg:         { type: Boolean, default: false },
  destination:   { type: String, enum: ["kitchen", "bar"], default: "kitchen" },
  ingredients:   [IngredientSchema],
  optionGroups:  [OptionGroupSchema]
}, { timestamps: true })

// Auto-set destination based on category before saving
MenuSchema.pre("save", function () {
   console.log("category:", this.category)
  console.log("BAR_CATEGORIES:", BAR_CATEGORIES)
  console.log("includes:", BAR_CATEGORIES.includes(this.category))


  if (BAR_CATEGORIES.includes(this.category)) {
    this.destination = "bar";
  } else {
    this.destination = "kitchen";
  }
})

module.exports = mongoose.model("Menu", MenuSchema)