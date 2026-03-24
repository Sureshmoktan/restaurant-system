import { createSlice } from "@reduxjs/toolkit"
const menuSlice = createSlice({ name: "menu", initialState: { items: [], isLoading: false, error: null }, reducers: {} })
export default menuSlice.reducer