import { useEffect, useRef } from "react"
import socket from "../socket/socket"

export default function useSocket(eventHandlers = {}, rooms = []) {
  // Keep a ref to always-current handlers — avoids stale closures
  const handlersRef = useRef(eventHandlers)
  useEffect(() => {
    handlersRef.current = eventHandlers
  })

  // Stable rooms ref so the reconnect handler never goes stale
  const roomsRef = useRef(rooms)
  useEffect(() => {
    roomsRef.current = rooms
  })

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    // Join rooms on mount
    roomsRef.current.forEach((room) => {
      socket.emit(room.event, room.value)
    })

    // Create one stable wrapper per event that delegates to the latest handler
    const stableWrappers = {}
    Object.keys(eventHandlers).forEach((event) => {
      stableWrappers[event] = (...args) => {
        handlersRef.current[event]?.(...args)
      }
      socket.on(event, stableWrappers[event])
    })

    // On reconnect, rejoin rooms using the latest rooms ref
    const handleReconnect = () => {
      roomsRef.current.forEach((room) => {
        socket.emit(room.event, room.value)
      })
    }
    socket.on("connect", handleReconnect)

    return () => {
      Object.entries(stableWrappers).forEach(([event, wrapper]) => {
        socket.off(event, wrapper)
      })
      socket.off("connect", handleReconnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — wrappers delegate to refs
}