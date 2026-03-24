import { createSlice } from "@reduxjs/toolkit"
const billSlice = createSlice({ name: "bills", initialState: { bills: [], isLoading: false, error: null }, reducers: {} })
export default billSlice.reducer