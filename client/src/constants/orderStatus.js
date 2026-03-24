export const ORDER_STATUS = {
  PENDING:   "pending",
  COOKING:   "cooking",
  READY:     "ready",
  SERVED:    "served",
  BILLED:    "billed",
  CANCELLED: "cancelled",
}

export const ORDER_STATUS_LABELS = {
  pending:   "Pending",
  cooking:   "Cooking",
  ready:     "Ready",
  served:    "Served",
  billed:    "Billed",
  cancelled: "Cancelled",
}

export const ORDER_STATUS_COLORS = {
  pending:   { bg: "bg-yellow-50",  text: "text-yellow-700", border: "border-yellow-200" },
  cooking:   { bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200" },
  ready:     { bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200"  },
  served:    { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
  billed:    { bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  cancelled: { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200"    },
}