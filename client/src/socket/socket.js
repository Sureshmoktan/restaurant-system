import { io } from "socket.io-client"

// Fall back to the same host the page was loaded from (port 8000)
// This works whether accessed via localhost or a LAN IP (e.g. mobile on WiFi)
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`

const socket = io(SOCKET_URL, {
  autoConnect:    false,
  withCredentials: true,
})

export default socket