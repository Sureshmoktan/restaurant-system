const Menu = require("../models/Menu");
const asyncHandler = require("../utils/asyncHandler");
const MESSAGES = require("../constants/messages");
const STATUS_CODES = require("../constants/statusCodes");
const { BAR_CATEGORIES } = require("../constants");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");

const getDestination = (category) => BAR_CATEGORIES.includes(category) ? "bar" : "kitchen";

// @desc   Get all menu items
// @route  GET /api/v1/menu
// @access Public
const getAllMenu = asyncHandler(async (req, res) => {
  const { category, isAvailable } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";

  const menu = await Menu.find(filter).sort({ category: 1, createdAt: -1 });

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.MENU.FETCHED,
    count: menu.length,
    menu,
  });
});

// @desc   Get single menu item
// @route  GET /api/v1/menu/:id
// @access Public
const getMenuItem = asyncHandler(async (req, res) => {
  const item = await Menu.findById(req.params.id);

  if (!item) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.MENU.NOT_FOUND);
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.MENU.FETCHED_ONE,
    item,
  });
});

// @desc   Create menu item
// @route  POST /api/v1/menu
// @access Admin only
const createMenuItem = asyncHandler(async (req, res) => {
  const {
    name, description, category,
    price, isVeg, isAvailable,
    ingredients, optionGroups,
  } = req.body;

  let imageUrl = "";
  let imagePublicId = "";

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer);
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const parsedIngredients = ingredients
    ? typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients
    : [];

  const parsedOptionGroups = optionGroups
    ? typeof optionGroups === "string" ? JSON.parse(optionGroups) : optionGroups
    : [];

  const item = await Menu.create({
    name,
    description,
    category,
    price:        Number(price),
    isVeg:        isVeg === "true" || isVeg === true,
    isAvailable:  isAvailable !== "false",
    image:        imageUrl,
    imagePublicId,
    ingredients:  parsedIngredients,
    optionGroups: parsedOptionGroups,
    destination:  getDestination(category),
  });

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.MENU.CREATED,
    item,
  });
});

// @desc   Update menu item
// @route  PUT /api/v1/menu/:id
// @access Admin only
const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await Menu.findById(req.params.id);

  if (!item) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.MENU.NOT_FOUND);
  }

  const {
    name, description, category,
    price, isVeg, isAvailable,
    ingredients, optionGroups,
  } = req.body;

  let imageUrl = item.image;
  let imagePublicId = item.imagePublicId;

  if (req.file) {
    if (item.imagePublicId) await deleteFromCloudinary(item.imagePublicId);
    const result = await uploadToCloudinary(req.file.buffer);
    imageUrl = result.secure_url;
    imagePublicId = result.public_id;
  }

  const parsedIngredients = ingredients
    ? typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients
    : item.ingredients;

  const parsedOptionGroups = optionGroups
    ? typeof optionGroups === "string" ? JSON.parse(optionGroups) : optionGroups
    : item.optionGroups;

  const updated = await Menu.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      category,
      price:        Number(price),
      isVeg:        isVeg === "true" || isVeg === true,
      isAvailable:  isAvailable !== "false",
      image:        imageUrl,
      imagePublicId,
      ingredients:  parsedIngredients,
      optionGroups: parsedOptionGroups,
      destination:  getDestination(category),
    },
    { new: true, runValidators: true }
  );

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.MENU.UPDATED,
    item: updated,
  });
});

// @desc   Delete menu item
// @route  DELETE /api/v1/menu/:id
// @access Admin only
const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await Menu.findById(req.params.id);

  if (!item) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.MENU.NOT_FOUND);
  }

  if (item.imagePublicId) await deleteFromCloudinary(item.imagePublicId);
  await Menu.findByIdAndDelete(req.params.id);

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: MESSAGES.MENU.DELETED,
  });
});

// @desc   Toggle availability
// @route  PATCH /api/v1/menu/:id/availability
// @access Admin only
const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await Menu.findById(req.params.id);

  if (!item) {
    res.status(STATUS_CODES.NOT_FOUND);
    throw new Error(MESSAGES.MENU.NOT_FOUND);
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.status(STATUS_CODES.OK).json({
    success: true,
    message: `Item marked as ${item.isAvailable ? "available" : "unavailable"}`,
    isAvailable: item.isAvailable,
  });
});

module.exports = {
  getAllMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
};