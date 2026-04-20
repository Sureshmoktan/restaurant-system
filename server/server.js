const express      = require("express")
const http         = require("http")
const { Server }   = require("socket.io")
const cors         = require("cors")
const cookieParser = require("cookie-parser")
const helmet       = require("helmet")
const morgan       = require("morgan")
require("dotenv").config()

const connectDB         = require("./config/db.config")
const errorHandler      = require("./middlewares/errorMiddleware")
const { SOCKET_EVENTS } = require("./constants")

const authRoutes  = require("./routes/authRoutes")
const userRoutes  = require("./routes/userRoutes")
const menuRoutes  = require("./routes/menuRoutes")
const tableRoutes = require("./routes/tableRoutes")
const orderRoutes = require("./routes/orderRoutes")
const billRoutes  = require("./routes/billRoutes")
const adminRoutes = require("./routes/adminRoutes")
const offerRoutes = require("./routes/offerRoutes")
const cashoutRoutes = require("./routes/cashoutRoutes.js")
const recommendationRoutes = require("./routes/recommendationRoutes")
const forecastRoutes       = require("./routes/forecastRoutes")
const ingredientRoutes     = require("./routes/ingredientRoutes")
const purchaseRoutes       = require("./routes/purchaseRoutes")
const wasteRoutes          = require("./routes/wasteRoutes")
const feedbackRoutes       = require("./routes/feedbackRoutes")
const discountGameRoutes   = require("./routes/discountGameRoutes")
const auditRoutes          = require("./routes/auditRoutes")


const app    = express()
const server = http.createServer(app)

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean)

const io = new Server(server, {
  cors: {
    origin:      ALLOWED_ORIGINS,
    methods:     ["GET", "POST"],
    credentials: true
  }
})

connectDB()

app.use(helmet())
app.use(cors({
  origin:      ALLOWED_ORIGINS,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan("dev"))

app.set("io", io)

app.use("/api/v1/auth",   authRoutes)
app.use("/api/v1/users",  userRoutes)
app.use("/api/v1/menu",   menuRoutes)
app.use("/api/v1/tables", tableRoutes)
app.use("/api/v1/orders", orderRoutes)
app.use("/api/v1/bills",  billRoutes)
app.use("/api/v1/admin",  adminRoutes)
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/cashouts", cashoutRoutes)
app.use("/api/v1/recommendations", recommendationRoutes)
app.use("/api/v1/forecast",     forecastRoutes)
app.use("/api/v1/ingredients", ingredientRoutes)
app.use("/api/v1/purchases",  purchaseRoutes)
app.use("/api/v1/waste",      wasteRoutes)
app.use("/api/v1/feedback",      feedbackRoutes)
app.use("/api/v1/discount-game", discountGameRoutes)
app.use("/api/v1/audit",        auditRoutes)

app.get("/api/v1/test", (req, res) => {
  res.json({ success: true, message: "test works" })
})

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on(SOCKET_EVENTS.JOIN_TABLE, (tableNumber) => {
    socket.join(`table_${tableNumber}`)
    console.log(`Socket ${socket.id} joined table_${tableNumber}`)
  })

  socket.on(SOCKET_EVENTS.JOIN_KITCHEN, () => {
    socket.join("kitchen")
    console.log(`Kitchen joined: ${socket.id}`)
  })

  socket.on(SOCKET_EVENTS.JOIN_CASHIER, () => {
    socket.join("cashier")
    console.log(`Cashier joined: ${socket.id}`)
  })

  socket.on(SOCKET_EVENTS.JOIN_BAR, () => {
    socket.join("bar")
    console.log(`Bar joined: ${socket.id}`)
  })

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

app.use(errorHandler)

const PORT = process.env.PORT || 8000
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})