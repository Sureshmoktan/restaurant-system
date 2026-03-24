export const API_URL    = "/api/v1"
export const SOCKET_URL = "http://localhost:8000"
export const VAT_PERCENT = 13

export const ROLES = {
  ADMIN:   "admin",
  CASHIER: "cashier",
  KITCHEN: "kitchen",
}

export const ROLE_REDIRECTS = {
  admin:   "/admin",
  cashier: "/cashier",
  kitchen: "/kitchen",
}

export const ORDER_STATUS = {
  PENDING:   "pending",
  COOKING:   "cooking",
  READY:     "ready",
  SERVED:    "served",
  BILLED:    "billed",
  CANCELLED: "cancelled",
}

export const ORDER_STATUS_COLORS = {
  pending:   { bg: "bg-yellow-50",  text: "text-yellow-700" },
  cooking:   { bg: "bg-orange-50",  text: "text-orange-700" },
  ready:     { bg: "bg-green-50",   text: "text-green-700"  },
  served:    { bg: "bg-blue-50",    text: "text-blue-700"   },
  billed:    { bg: "bg-purple-50",  text: "text-purple-700" },
  cancelled: { bg: "bg-red-50",     text: "text-red-700"    },
}

export const TABLE_STATUS = {
  AVAILABLE: "available",
  OCCUPIED:  "occupied",
  BILLED:    "billed",
}

export const MENU_CATEGORIES = ["starter", "main", "pizza", "drinks", "dessert"]

export const MENU_CATEGORY_LABELS = {
  starter: "Starters",
  main:    "Main Course",
  pizza:   "Pizza",
  drinks:  "Drinks",
  dessert: "Desserts",
}

export const MENU_CATEGORY_ICONS = {
  starter: "🥗",
  main:    "🍛",
  pizza:   "🍕",
  drinks:  "🥤",
  dessert: "🍰",
}

export const CANCEL_REASONS = [
  "Ingredient not available",
  "Item temporarily out of stock",
  "Kitchen equipment issue",
  "Too many orders — unable to prepare in time",
  "Customer requested cancellation",
]

export const SOCKET_EVENTS = {
  JOIN_TABLE:      "join-table",
  JOIN_KITCHEN:    "join-kitchen",
  JOIN_CASHIER:    "join-cashier",
  NEW_ORDER:       "new-order",
  ORDER_STATUS:    "order-status-update",
  ORDER_CANCELLED: "order-cancelled",
  ORDER_READY:     "order-ready",
  TABLE_STATUS:    "table-status-update",
  NEW_BILL:        "new-bill",
}