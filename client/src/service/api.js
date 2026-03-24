import axios from "axios"
import { getToken, setToken, clearAll } from "./storage"

const api = axios.create({
  baseURL:         "/api/v1",
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res      = await axios.post("/api/v1/auth/refresh", {}, { withCredentials: true })
        const newToken = res.data.accessToken
        setToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        clearAll()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api