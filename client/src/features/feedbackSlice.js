import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  submitFeedback     as submitFeedbackApi,
  checkFeedbackExists as checkFeedbackExistsApi,
  fetchAllFeedback   as fetchAllFeedbackApi,
  fetchFeedbackStats as fetchFeedbackStatsApi,
  fetchSmartSummary  as fetchSmartSummaryApi,
} from "../service/feedbackService"

// ── Async thunks ──────────────────────────────────────────────────────────────

export const submitFeedback = createAsyncThunk(
  "feedback/submit",
  async (data, { rejectWithValue }) => {
    try {
      return await submitFeedbackApi(data)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to submit feedback")
    }
  }
)

export const checkFeedbackExists = createAsyncThunk(
  "feedback/checkExists",
  async (billId, { rejectWithValue }) => {
    try {
      return await checkFeedbackExistsApi(billId)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to check feedback")
    }
  }
)

export const fetchFeedbacks = createAsyncThunk(
  "feedback/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchAllFeedbackApi(params)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch feedbacks")
    }
  }
)

export const fetchFeedbackStats = createAsyncThunk(
  "feedback/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchFeedbackStatsApi()
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch stats")
    }
  }
)

export const fetchSmartSummary = createAsyncThunk(
  "feedback/fetchSmartSummary",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSmartSummaryApi()
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch smart summary")
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const feedbackSlice = createSlice({
  name: "feedback",
  initialState: {
    list:         [],
    total:        0,
    page:         1,
    pages:        1,
    stats:        null,
    smartSummary: null,
    isLoading:    false,
    statsLoading: false,
    summaryLoading: false,
    error:        null,
  },
  reducers: {
    clearError: (state) => { state.error = null },
    clearSmartSummary: (state) => { state.smartSummary = null },
  },
  extraReducers: (builder) => {
    // fetchFeedbacks
    builder
      .addCase(fetchFeedbacks.pending,   (s) => { s.isLoading = true;  s.error = null })
      .addCase(fetchFeedbacks.fulfilled, (s, a) => {
        s.isLoading = false
        s.list      = a.payload.feedbacks || []
        s.total     = a.payload.total     || 0
        s.page      = a.payload.page      || 1
        s.pages     = a.payload.pages     || 1
      })
      .addCase(fetchFeedbacks.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    // fetchFeedbackStats
    builder
      .addCase(fetchFeedbackStats.pending,   (s) => { s.statsLoading = true })
      .addCase(fetchFeedbackStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload })
      .addCase(fetchFeedbackStats.rejected,  (s, a) => { s.statsLoading = false; s.error = a.payload })

    // fetchSmartSummary
    builder
      .addCase(fetchSmartSummary.pending,   (s) => { s.summaryLoading = true })
      .addCase(fetchSmartSummary.fulfilled, (s, a) => { s.summaryLoading = false; s.smartSummary = a.payload })
      .addCase(fetchSmartSummary.rejected,  (s, a) => { s.summaryLoading = false; s.error = a.payload })
  },
})

export const { clearError, clearSmartSummary } = feedbackSlice.actions
export default feedbackSlice.reducer
