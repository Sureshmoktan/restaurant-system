import api from "./api"   // your existing axios instance

// Record a new cashout expense
export const createCashout = (data) =>
  api.post("/cashouts", data).then(res => res.data)

// Get cashouts (defaults to today, admin can pass date range)
export const fetchCashouts = (params = {}) =>
  api.get("/cashouts", { params }).then(res => res.data)