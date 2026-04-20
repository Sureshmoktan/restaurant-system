// client/src/features/discountGameSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import * as svc from "../service/discountGameService"

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchGameSettings = createAsyncThunk(
  "discountGame/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await svc.fetchGameSettings()
      return data.settings
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load settings")
    }
  }
)

export const updateGameSettings = createAsyncThunk(
  "discountGame/updateSettings",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await svc.updateGameSettings(payload)
      return data.settings
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to update settings")
    }
  }
)

export const toggleGame = createAsyncThunk(
  "discountGame/toggle",
  async (_, { rejectWithValue }) => {
    try {
      const data = await svc.toggleGame()
      return data.isEnabled
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to toggle game")
    }
  }
)

export const spinWheel = createAsyncThunk(
  "discountGame/spin",
  async (billId, { rejectWithValue }) => {
    try {
      return await svc.spinWheel(billId)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Spin failed")
    }
  }
)

export const fetchGameStats = createAsyncThunk(
  "discountGame/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await svc.fetchGameStats()
      return data.stats
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load stats")
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const discountGameSlice = createSlice({
  name: "discountGame",
  initialState: {
    settings:     null,
    stats:        null,
    loading:      false,
    saving:       false,
    error:        null,
    lastSpinResult: null,
  },
  reducers: {
    clearSpinResult: (state) => { state.lastSpinResult = null },
    clearError:      (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    // fetchGameSettings
    builder
      .addCase(fetchGameSettings.pending,   (s) => { s.loading = true;  s.error = null })
      .addCase(fetchGameSettings.fulfilled, (s, a) => { s.loading = false; s.settings = a.payload })
      .addCase(fetchGameSettings.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    // updateGameSettings
    builder
      .addCase(updateGameSettings.pending,   (s) => { s.saving = true;  s.error = null })
      .addCase(updateGameSettings.fulfilled, (s, a) => { s.saving = false; s.settings = a.payload })
      .addCase(updateGameSettings.rejected,  (s, a) => { s.saving = false; s.error = a.payload })

    // toggleGame
    builder
      .addCase(toggleGame.pending,   (s) => { s.saving = true })
      .addCase(toggleGame.fulfilled, (s, a) => {
        s.saving = false
        if (s.settings) s.settings.isEnabled = a.payload
      })
      .addCase(toggleGame.rejected,  (s, a) => { s.saving = false; s.error = a.payload })

    // spinWheel
    builder
      .addCase(spinWheel.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(spinWheel.fulfilled, (s, a) => { s.loading = false; s.lastSpinResult = a.payload })
      .addCase(spinWheel.rejected,  (s, a) => { s.loading = false; s.error = a.payload })

    // fetchGameStats
    builder
      .addCase(fetchGameStats.pending,   (s) => { s.loading = true;  s.error = null })
      .addCase(fetchGameStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload })
      .addCase(fetchGameStats.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
  },
})

export const { clearSpinResult, clearError } = discountGameSlice.actions
export default discountGameSlice.reducer
