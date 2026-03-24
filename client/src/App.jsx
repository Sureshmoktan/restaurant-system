import { BrowserRouter } from "react-router-dom"
import { Provider }      from "react-redux"
import store             from "./store/store.js"
import AppRoutes         from "./routes/AppRoutes.jsx"

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  )
}