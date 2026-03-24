import { createSlice } from "@reduxjs/toolkit"
import { getToken, getUser, setToken, setUser, clearAll } from "../service/storage"

const initialState = {
  user:        getUser(),
  accessToken: getToken(),
  isLoading:   false,
  error:       null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user        = action.payload.user
      state.accessToken = action.payload.accessToken
      setToken(action.payload.accessToken)
      setUser(action.payload.user)
    },
    logout: (state) => {
      state.user        = null
      state.accessToken = null
      clearAll()
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer