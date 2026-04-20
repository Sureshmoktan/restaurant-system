
// import api from "./api"

// export const placeOrder = async (orderData) => {
//   const res = await api.post("/orders", orderData)
//   return res.data
// }

// export const fetchAllTables = async () => {
//   const res = await api.get("/tables")
//   return res.data
// }

// export const fetchOrders = async (params = {}) => {
//   if (params.tableNumber) {
//     const res = await api.get(`/orders/customer/${params.tableNumber}`)
//     return res.data
//   }
//   const res = await api.get("/orders", { params })
//   return res.data
// }

// export const fetchOrdersByTable = async (tableNumber) => {
//   const res = await api.get(`/orders/table/${tableNumber}`)
//   return res.data
// }

// export const updateOrderStatus = async (id, status, cancelReason = "") => {
//   const res = await api.patch(`/orders/${id}/status`, { status, cancelReason })
//   return res.data
// }

// export const cancelOrder = async (id, cancelReason) => {
//   const res = await api.patch(`/orders/${id}/cancel`, { cancelReason })
//   return res.data
// }

// export const requestBill = async (tableNumber) => {
//   const res = await api.post("/orders/request-bill", { tableNumber })
//   return res.data
// }


// export const updateItemStatus = async (orderId, itemId, status) => {
//   const res = await fetch(`/api/v1/orders/${orderId}/items/${itemId}/status`, {
//     method:  "PATCH",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     body: JSON.stringify({ status }),
//   })
//   if (!res.ok) throw new Error("Failed to update item status")
//   return res.json()
// }

// src/service/orderService.js

import api from "./api"

// ==============================================
// EXISTING FUNCTIONS (keep these)
// ==============================================

export const placeOrder = async (orderData) => {
  const res = await api.post("/orders", orderData)
  return res.data
}

export const fetchAllTables = async () => {
  const res = await api.get("/tables")
  return res.data
}

export const fetchOrders = async (params = {}) => {
  if (params.tableNumber) {
    const res = await api.get(`/orders/customer/${params.tableNumber}`)
    return res.data
  }
  const res = await api.get("/orders", { params })
  return res.data
}

export const fetchOrdersByTable = async (tableNumber) => {
  const res = await api.get(`/orders/table/${tableNumber}`)
  return res.data
}

export const updateOrderStatus = async (id, status, cancelReason = "") => {
  const res = await api.patch(`/orders/${id}/status`, { status, cancelReason })
  return res.data
}

export const cancelOrder = async (id, cancelReason) => {
  const res = await api.patch(`/orders/${id}/cancel`, { cancelReason })
  return res.data
}

export const requestBill = async (tableNumber) => {
  const res = await api.post("/orders/request-bill", { tableNumber })
  return res.data
}

export const updateItemStatus = async (orderId, itemId, status, estimatedSecs = null) => {
  const body = estimatedSecs ? { status, estimatedSecs } : { status }
  const res  = await api.patch(`/orders/${orderId}/items/${itemId}/status`, body)
  return res.data
}

export const setOrderEstimate = async (orderId, estimatedTime) => {
  const res = await api.patch(`/orders/${orderId}/estimate`, { estimatedTime })
  return res.data
}

// ==============================================
// NEW ADMIN FUNCTIONS - READ & DELETE ORDERS
// ==============================================

/**
 * Get ALL orders with full admin view
 * @param {Object} params - Filter parameters
 * @param {string} params.status - Comma separated statuses (pending,cooking,ready)
 * @param {string} params.tableNumber - Filter by table number
 * @param {string} params.startDate - Start date for filtering (YYYY-MM-DD)
 * @param {string} params.endDate - End date for filtering (YYYY-MM-DD)
 * @param {number} params.limit - Number of orders to return (default: 100)
 * @param {number} params.page - Page number for pagination
 */
export const adminFetchAllOrders = async (params = {}) => {
  const res = await api.get("/orders/admin/all", { params })
  return res.data
}

/**
 * Get order statistics for admin dashboard
 * @param {string} period - Period: 'today', 'week', 'month', 'all'
 */
export const adminGetOrderStats = async (period = "today") => {
  const res = await api.get("/orders/admin/stats", { params: { period } })
  return res.data
}

/**
 * Get single order by ID (admin full view)
 * @param {string} id - Order ID
 */
export const adminFetchOrderById = async (id) => {
  const res = await api.get(`/orders/admin/${id}`)
  return res.data
}

/**
 * Delete single order (Hard delete - Admin only)
 * @param {string} id - Order ID
 */
export const adminDeleteOrder = async (id) => {
  const res = await api.delete(`/orders/admin/${id}`)
  return res.data
}

/**
 * Bulk delete multiple orders (Admin only)
 * @param {string[]} orderIds - Array of order IDs
 */
export const adminBulkDeleteOrders = async (orderIds) => {
  const res = await api.delete("/orders/admin/bulk", { data: { orderIds } })
  return res.data
}

/**
 * Delete orders by date range (Admin only)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} status - Optional status filter
 */
export const adminDeleteOrdersByDateRange = async (startDate, endDate, status = null) => {
  const data = { startDate, endDate }
  if (status) data.status = status
  const res = await api.delete("/orders/admin/delete-by-date", { data })
  return res.data
}