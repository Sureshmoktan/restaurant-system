import api from "./api"

export const fetchAllOffers = async () => {
  const res = await api.get("/offers")
  return res.data
}

// Uses the auth api instance (for cashier/admin panels)
export const fetchActiveOffers = async () => {
  const res = await api.get("/offers/active")
  return res.data
}

// Uses native fetch — no auth interceptors (safe for customer tablet)
export const fetchPublicActiveOffers = async () => {
  const res  = await fetch("/api/v1/offers/active")
  const data = await res.json()
  return data.data || []
}

export const createOffer = async (data) => {
  const res = await api.post("/offers", data)
  return res.data
}

export const updateOffer = async (id, data) => {
  const res = await api.put(`/offers/${id}`, data)
  return res.data
}

export const deleteOffer = async (id) => {
  const res = await api.delete(`/offers/${id}`)
  return res.data
}

export const applyOffers = async (items, subtotal) => {
  const res = await api.post("/offers/apply", { items, subtotal })
  return res.data
}
