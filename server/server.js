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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})