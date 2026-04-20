import api from "./api"

export const fetchWasteLogs  = (params = {}) => api.get("/waste", { params })
export const fetchWasteStats = ()             => api.get("/waste/stats")
export const createWasteLog  = (data)         => api.post("/waste", data)
