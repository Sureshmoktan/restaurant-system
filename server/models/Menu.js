const mongoose = require("mongoose");
const { MENU_CATEGORIES, BAR_CATEGORIES } = require("../constants");

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

// variant option — each has its own fixed price
const VariantOptionSchema = new mongoose.Schema({
  label: { type: String, required: true }, // "Half", "Can", "Mango"
  price: { type: Number, required: true, min: 0 },
}, { _id: false })

// variant group — e.g. "Portion", "Type", "Flavor"
const VariantGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  required:  { type: Boolean, default: true },
  options:   [VariantOptionSchema],
}, { _id: false })

const RecipeRowSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
  quantity:   { type: Number, required: true, min: 0.001 },
}, { _id: false })

const MenuSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: "" },
  category:      { type: String, required: true, enum: MENU_CATEGORIES },
  price:         { type: Number, default: 0, min: 0 }, // used only if variantGroups is empty
  variantGroups: [VariantGroupSchema],                  // replaces portions
  image:         { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  isAvailable:   { type: Boolean, default: true },
  isVeg:         { type: Boolean, default: false },
  destination:   { type: String, enum: ["kitchen", "bar"], default: "kitchen" },
  ingredients:   [IngredientSchema],  // customer customisation (name strings)
  optionGroups:  [OptionGroupSchema],
  recipe:        [RecipeRowSchema],   // inventory deduction (ObjectId refs)
}, { timestamps: true })

MenuSchema.pre("save", function () {
  if (BAR_CATEGORIES.includes(this.category)) {
    this.destination = "bar";
  } else {
    this.destination = "kitchen";
  }
})

module.exports = mongoose.model("Menu", MenuSchema)