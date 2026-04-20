import api from "./api"
import axios from "axios"

// public — no auth token needed
const publicApi = axios.create({ baseURL: "/api/v1", withCredentials: true })

export const submitFeedback = async (data) => {
  const res = await publicApi.post("/feedback", data)
  return res.data
}

export const checkFeedbackExists = async (billId) => {
  const res = await publicApi.get(`/feedback/${billId}/exists`)
  return res.data  // { exists: bool, feedback: ... }
}

// admin — needs auth token (uses the intercepted api instance)
export const fetchAllFeedback = async (params = {}) => {
  const res = await api.get("/feedback", { params })
  return res.data
}

export const fetchFeedbackStats = async () => {
  const res = await api.get("/feedback/stats")
  return res.data
}

export const fetchSmartSummary = async () => {
  const res = await api.get("/feedback/smart-summary")
  return res.data
}
