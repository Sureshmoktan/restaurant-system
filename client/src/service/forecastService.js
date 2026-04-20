import api from "./api"

export const fetchForecastOrders      = async () => (await api.get("/forecast/orders")).data
export const fetchForecastRevenue     = async () => (await api.get("/forecast/revenue")).data
export const fetchForecastItems       = async () => (await api.get("/forecast/items")).data
export const fetchForecastHours       = async () => (await api.get("/forecast/hours")).data
export const fetchForecastSuggestions = async () => (await api.get("/forecast/suggestions")).data