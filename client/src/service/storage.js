const isMultiTab = import.meta.env.VITE_MULTI_TAB === "true"
const store      = isMultiTab ? sessionStorage : localStorage

export const getToken    = ()      => store.getItem("accessToken")
export const setToken    = (token) => store.setItem("accessToken", token)
export const removeToken = ()      => store.removeItem("accessToken")

export const getUser     = ()      => JSON.parse(store.getItem("user") || "null")
export const setUser     = (user)  => store.setItem("user", JSON.stringify(user))
export const removeUser  = ()      => store.removeItem("user")

export const clearAll    = ()      => { removeToken(); removeUser() }
