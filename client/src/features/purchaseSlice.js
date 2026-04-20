import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import * as svc from "../service/purchaseService"

// ─── async thunks ─────────────────────────────────────────────────────────────

export const fetchPurchases = createAsyncThunk(
  "purchases/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await svc.fetchPurchases(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch purchases")
    }
  }
)

export const fetchPurchaseStats = createAsyncThunk(
  "purchases/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await svc.fetchPurchaseStats()
      return res.data.stats
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats")
    }
  }
)

export const addPurchase = createAsyncThunk(
  "purchases/add",
  async (data, { rejectWithValue }) => {
    try {
      const res = await svc.createPurchase(data)
      return res.data.purchase
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to record purchase")
    }
  }
)

// ─── slice ────────────────────────────────────────────────────────────────────

const purchaseSlice = createSlice({
  name: "purchases",
  initialState: {
    items:        [],
    stats:        null,
    isLoading:    false,
    statsLoading: false,
    error:        null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchPurchases.pending,   (state)         => { state.isLoading = true;  state.error = null })
      .addCase(fetchPurchases.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload.purchases })
      .addCase(fetchPurchases.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload })

      // fetchStats
      .addCase(fetchPurchaseStats.pending,   (state)         => { state.statsLoading = true })
      .addCase(fetchPurchaseStats.fulfilled, (state, action) => { state.statsLoading = false; state.stats = action.payload })
      .addCase(fetchPurchaseStats.rejected,  (state)         => { state.statsLoading = false })

      // add — prepend to list and refresh stats
      .addCase(addPurchase.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
  },
})

export default purchaseSlice.reducer
