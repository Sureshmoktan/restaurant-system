import { configureStore } from "@reduxjs/toolkit"
import authReducer         from "../features/authSlice"
import menuReducer         from "../features/menuSlice"
import orderReducer        from "../features/orderSlice"
import tableReducer        from "../features/tableSlice"
import billReducer         from "../features/billSlice"
import ingredientReducer   from "../features/ingredientSlice"
import purchaseReducer     from "../features/purchaseSlice"
import feedbackReducer     from "../features/feedbackSlice"
import discountGameReducer from "../features/discountGameSlice"

const store = configureStore({
  reducer: {
    auth:         authReducer,
    menu:         menuReducer,
    orders:       orderReducer,
    tables:       tableReducer,
    bills:        billReducer,
    ingredients:  ingredientReducer,
    purchases:    purchaseReducer,
    feedback:     feedbackReducer,
    discountGame: discountGameReducer,
  },
})

export default store