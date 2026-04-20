import api from "./api"

export const fetchPurchases     = (params = {}) => api.get("/purchases", { params })
export const fetchPurchaseStats = ()             => api.get("/purchases/stats")
export const createPurchase     = (data)         => api.post("/purchases", data)
