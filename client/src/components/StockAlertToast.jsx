import { useEffect, useState, useRef, useCallback } from "react"
import socket from "../socket/socket"

// ── Web Audio beep ────────────────────────────────────────────────────────────

function playAlertSound(type) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()

    const beep = (freq, startAt, dur) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.22, startAt)
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur)
      osc.start(startAt)
      osc.stop(startAt + dur)
    }

    if (type === "out") {
      // Two descending urgent beeps
      beep(880, ctx.currentTime,        0.18)
      beep(440, ctx.currentTime + 0.25, 0.30)
    } else {
      // Single warning beep
      beep(660, ctx.currentTime, 0.25)
    }
  } catch {}
}

// ── Single toast item ─────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
  const { id, type, ingredient, message, isRestored } = toast

  let cfg
  if (isRestored || type === "restored") {
    cfg = {
      wrap: "bg-emerald-50 border-emerald-200",
      bar:  "bg-emerald-500",
      icon: { bg: "bg-emerald-500", symbol: "✓" },
      title: "text-emerald-800",
      body:  "text-emerald-600",
    }
  } else if (type === "out") {
    cfg = {
      wrap: "bg-red-50 border-red-200",
      bar:  "bg-red-500",
      icon: { bg: "bg-red-500", symbol: "!" },
      title: "text-red-800",
      body:  "text-red-500",
    }
  } else {
    cfg = {
      wrap: "bg-amber-50 border-amber-200",
      bar:  "bg-amber-400",
      icon: { bg: "bg-amber-500", symbol: "⚠" },
      title: "text-amber-800",
      body:  "text-amber-600",
    }
  }

  return (
    <div
      className={`pointer-events-auto w-80 rounded-2xl border shadow-xl overflow-hidden ${cfg.wrap}`}
      style={{ animation: "stockToastIn 0.32s cubic-bezier(.21,1.02,.73,1) forwards" }}
    >
      <div className={`h-1 ${cfg.bar}`} />
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5 ${cfg.icon.bg}`}>
          {cfg.icon.symbol}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold leading-tight ${cfg.title}`}>
            {ingredient?.name}
          </div>
          <div className={`text-xs mt-0.5 ${cfg.body}`}>
            {ingredient?.currentStock} {ingredient?.unit} remaining
            {ingredient?.minThreshold
              ? ` · min: ${ingredient.minThreshold} ${ingredient.unit}`
              : ""}
          </div>
          {message && (
            <div className={`text-xs mt-1 font-medium ${cfg.body}`}>{message}</div>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="w-5 h-5 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-600 transition-colors text-xs flex-shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
//
// Props
//   joinRoom?: { event: string; value?: any }
//     When provided the component emits a socket join event on mount
//     (and on reconnect). Useful for pages that don't already join a room.
//
// Usage examples:
//   <StockAlertToast />                                 — no room join, just listens
//   <StockAlertToast joinRoom={{ event:"join-cashier" }} />

export default function StockAlertToast({ joinRoom }) {
  const [toasts, setToasts] = useState([])
  const timers  = useRef({})
  const counter = useRef(0)
  const alive   = useRef(true)
  // Keep joinRoom stable across renders via ref
  const joinRef = useRef(joinRoom)

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((data, restored = false) => {
    if (!alive.current) return
    const id = ++counter.current
    setToasts(prev => [...prev.slice(-4), { id, ...data, isRestored: restored }])
    if (!restored && (data.type === "low" || data.type === "out")) {
      playAlertSound(data.type)
    }
    timers.current[id] = setTimeout(() => {
      if (!alive.current) return
      setToasts(prev => prev.filter(t => t.id !== id))
      delete timers.current[id]
    }, 5000)
  }, [])

  useEffect(() => {
    alive.current = true

    if (!socket.connected) socket.connect()

    const doJoin = () => {
      if (joinRef.current?.event) {
        socket.emit(joinRef.current.event, joinRef.current.value ?? undefined)
      }
    }
    doJoin()

    const handleAlert    = (data) => push(data, false)
    const handleRestored = (data) => push({ ...data, type: "restored" }, true)
    const handleConnect  = () => doJoin()

    socket.on("connect",       handleConnect)
    socket.on("stock-alert",   handleAlert)
    socket.on("stock-restored", handleRestored)

    return () => {
      alive.current = false
      socket.off("connect",       handleConnect)
      socket.off("stock-alert",   handleAlert)
      socket.off("stock-restored", handleRestored)
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [push])

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes stockToastIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  )
}
