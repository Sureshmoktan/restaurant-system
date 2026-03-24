import { useEffect } from "react"
import socket from "../socket/socket"

export default function useSocket(eventHandlers = {}, rooms = []) {
  useEffect(() => {
    // Connect if not already connected
    if (!socket.connected) {
      socket.connect()
    }

    // Join rooms
    rooms.forEach((room) => {
      socket.emit(room.event, room.value)
    })

    // Register event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    // On reconnect, rejoin rooms automatically
    const handleReconnect = () => {
      rooms.forEach((room) => {
        socket.emit(room.event, room.value)
      })
    }
    socket.on("connect", handleReconnect)

    return () => {
      // Only remove event handlers — do NOT disconnect
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
      socket.off("connect", handleReconnect)
    }
  }, [])
}