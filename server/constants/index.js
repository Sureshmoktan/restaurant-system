const ROLES = {
  ADMIN:   "admin",
  CASHIER: "cashier",
  KITCHEN: "kitchen",
}

const ORDER_STATUS = {
  PENDING:   "pending",
  COOKING:   "cooking",
  READY:     "ready",
  SERVED:    "served",
  BILLED:    "billed",
  CANCELLED: "cancelled",
}

const TABLE_STATUS = {
  AVAILABLE: "available",
  OCCUPIED:  "occupied",
  BILLED:    "billed",
}

const FOOD_CATEGORIES = [
  "Breakfast",
  "Lunch", 
  "Dinner",
  "Snacks",
  "Desserts",
  "Specials",
];

const BAR_CATEGORIES = [
  "Beverages",
  "Cocktails",
  "Mocktails",
  "Beer",
  "Wine",
];

const MENU_CATEGORIES = [...FOOD_CATEGORIES, ...BAR_CATEGORIES];

const OPTION_TYPES = {
  SCALE:    "scale",
  SINGLE:   "single",
  MULTIPLE: "multiple",
}

const PAYMENT_METHODS = [
  "cash",
  "esewa",
  "khalti",
  "card",
]

const PAYMENT_STATUS = {
  PAID:   "paid",
  UNPAID: "unpaid",
}

const VAT_PERCENT = 13

const CANCEL_REASONS = [
  "Ingredient not available",
  "Item temporarily out of stock",
  "Kitchen equipment issue",
  "Too many orders — unable to prepare in time",
  "Customer requested cancellation",
]

const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     100,
}

const SOCKET_EVENTS = {
  JOIN_TABLE:      "join-table",
  JOIN_KITCHEN:    "join-kitchen",
  JOIN_CASHIER:    "join-cashier",
  NEW_ORDER:       "new-order",
  ORDER_STATUS:    "order-status-update",
  ORDER_CANCELLED: "order-cancelled",
  ORDER_READY:     "order-ready",
  TABLE_STATUS:    "table-status-update",
  NEW_BILL:        "new-bill",
  JOIN_BAR:        "join-bar",
}

const TOKEN = {
  ACCESS_EXPIRE:  "15m",
  REFRESH_EXPIRE: "7d",
  COOKIE_EXPIRE:   7,
}

const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  INTERNAL_SERVER_ERROR: 500,
}

module.exports = {
  ROLES,
  ORDER_STATUS,
  TABLE_STATUS,
  MENU_CATEGORIES,
  OPTION_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  VAT_PERCENT,
  CANCEL_REASONS,
  PAGINATION,
  SOCKET_EVENTS,
  TOKEN,
  HTTP_STATUS,
  FOOD_CATEGORIES,
  BAR_CATEGORIES,
}