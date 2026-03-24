import api from "./api"

export const placeOrder = async (orderData) => {
  const res = await api.post("/orders", orderData)
  return res.data
}

export const fetchOrders = async (params = {}) => {
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