import api from "./api"

export const fetchMenu = async (params = {}) => {
  const res = await api.get("/menu", { params })
  return res.data
}

export const fetchMenuItem = async (id) => {
  const res = await api.get(`/menu/${id}`)
  return res.data
}

export const createMenuItem = async (data) => {
  const res = await api.post("/menu", data)
  return res.data
}

export const updateMenuItem = async (id, data) => {
  const res = await api.put(`/menu/${id}`, data)
  return res.data
}

export const deleteMenuItem = async (id) => {
  const res = await api.delete(`/menu/${id}`)
  return res.data
}