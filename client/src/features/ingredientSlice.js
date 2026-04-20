import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import * as svc from "../service/ingredientService"

// ─── async thunks ────────────────────────────────────────────────────────────

export const fetchIngredients = createAsyncThunk(
  "ingredients/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await svc.fetchIngredients(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch ingredients")
    }
  }
)

export const fetchIngredientStats = createAsyncThunk(
  "ingredients/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await svc.fetchIngredientStats()
      return res.data.stats
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stats")
    }
  }
)

export const addIngredient = createAsyncThunk(
  "ingredients/add",
  async (data, { rejectWithValue }) => {
    try {
      const res = await svc.createIngredient(data)
      return res.data.ingredient
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create ingredient")
    }
  }
)

export const editIngredient = createAsyncThunk(
  "ingredients/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await svc.updateIngredient(id, data)
      return res.data.ingredient
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update ingredient")
    }
  }
)

export const removeIngredient = createAsyncThunk(
  "ingredients/remove",
  async (id, { rejectWithValue }) => {
    try {
      await svc.deleteIngredient(id)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete ingredient")
    }
  }
)

// ─── slice ────────────────────────────────────────────────────────────────────

const ingredientSlice = createSlice({
  name: "ingredients",
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
      .addCase(fetchIngredients.pending,   (state)          => { state.isLoading = true;  state.error = null })
      .addCase(fetchIngredients.fulfilled, (state, action)  => { state.isLoading = false; state.items = action.payload.ingredients })
      .addCase(fetchIngredients.rejected,  (state, action)  => { state.isLoading = false; state.error = action.payload })

      // fetchStats
      .addCase(fetchIngredientStats.pending,   (state)         => { state.statsLoading = true })
      .addCase(fetchIngredientStats.fulfilled, (state, action) => { state.statsLoading = false; state.stats = action.payload })
      .addCase(fetchIngredientStats.rejected,  (state)         => { state.statsLoading = false })

      // add
      .addCase(addIngredient.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        if (state.stats) state.stats.total += 1
      })

      // edit
      .addCase(editIngredient.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
      })

      // remove
      .addCase(removeIngredient.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload)
        if (state.stats && state.stats.total > 0) state.stats.total -= 1
      })
  },
})

export default ingredientSlice.reducer
