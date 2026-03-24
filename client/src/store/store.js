import { configureStore } from "@reduxjs/toolkit"
import authReducer  from "../features/authSlice"
import menuReducer  from "../features/menuSlice"
import orderReducer from "../features/orderSlice"
import tableReducer from "../features/tableSlice"
import billReducer  from "../features/billSlice"

const store = configureStore({
  reducer: {
    auth:   authReducer,
    menu:   menuReducer,
    orders: orderReducer,
    tables: tableReducer,
    bills:  billReducer,
  },
})

export default store