import api from "./api"

export const fetchTables = async (params = {}) => {
  const res = await api.get("/tables", { params })
  return res.data
}

export const fetchTableByNumber = async (tableNumber) => {
  const res = await api.get(`/tables/number/${tableNumber}`)
  return res.data
}

export const updateTableStatus = async (id, status) => {
  const res = await api.patch(`/tables/${id}/status`, { status })
  return res.data
}