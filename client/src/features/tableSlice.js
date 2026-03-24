import { createSlice } from "@reduxjs/toolkit"
const tableSlice = createSlice({ name: "tables", initialState: { tables: [], isLoading: false, error: null }, reducers: {} })
export default tableSlice.reducer