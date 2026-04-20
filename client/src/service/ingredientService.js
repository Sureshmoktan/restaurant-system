import api from "./api"

export const fetchIngredients         = (params = {}) => api.get("/ingredients", { params })
export const fetchIngredientStats     = ()             => api.get("/ingredients/stats/overview")
export const fetchIngredientById      = (id)           => api.get(`/ingredients/${id}`)
export const createIngredient         = (data)         => api.post("/ingredients", data)
export const updateIngredient         = (id, data)     => api.put(`/ingredients/${id}`, data)
export const deleteIngredient         = (id)           => api.delete(`/ingredients/${id}`)
export const fetchInventoryAnalytics  = ()             => api.get("/ingredients/analytics")
