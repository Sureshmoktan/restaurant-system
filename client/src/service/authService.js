import api from "./api"

export const loginUser = async ({ email, password }) => {
  try {
    const res = await api.post("/auth/login", { email, password })
    return res.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed")
  }
}

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout")
  } catch (error) {
    throw new Error(error.response?.data?.message || "Logout failed")
  }
}

export const refreshToken = async () => {
  try {
    const res = await api.post("/auth/refresh")
    return res.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Token refresh failed")
  }
}

export const getMe = async () => {
  try {
    const res = await api.get("/auth/me")
    return res.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch user")
  }
}