import { useEffect, useState, useRef } from "react"
import { fetchOrders, cancelOrder, updateItemStatus } from "../service/orderService"
import useSocket from "../hooks/useSocket"
import useAuth from "../hooks/useAuth"
import { CANCEL_REASONS } from "../constants"
import { fetchIngredients } from "../service/ingredientService"
import { createWasteLog } from "../service/wasteService"
import StockAlertToast from "../components/StockAlertToast"
import SoundToggle, { useSoundEnabled } from "../components/SoundToggle"
import { newOrderSound, cancelOrderSound, stockAlertSound } from "../utils/soundAlert"

const WASTE_REASONS = ["expired", "spoiled", "damaged", "spilled", "overcooked", "other"]
const WASTE_FORM_EMPTY = { ingredient: "", quantity: "", reason: "", notes: "" }

const AUTO_CLEAR_SECS = 60
const DEFAULT_ESTIMATE_SECS = 5 * 60

const formatTime = (totalSecs) => {
  const s = Math.floor(Math.abs(totalSecs))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
}

export default function KitchenDisplay() {
  const { handleLogout, user } = useAuth()
  useSoundEnabled()
  const [orders,        setOrders]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [cancelModal,   setCancelModal]   = useState(null)
  const [reason,        setReason]        = useState("")
  const [customReason,  setCustomReason]  = useState("")
  const [submitting,    setSubmitting]    = useState(false)
  const [now,           setNow]           = useState(Date.now())
  const [cookingItems,  setCookingItems]  = useState(new Set())
  const [markingItems,  setMarkingItems]  = useState(new Set())

  // Per-item timers: "orderId-itemId" → { startedAt: ms, estimatedSecs: number }
  const [itemTimers,     setItemTimers]     = useState({})
  // Estimate prompt modal: holds the card being prompted
  const [estimatePrompt, setEstimatePrompt] = useState(null)
  const [estimateCustom, setEstimateCustom] = useState("")
  // Brief "X min late" message shown in ready column after overdue item marked ready
  const [lateMessages,   setLateMessages]   = useState({}) // cardKey → string

  const [pulsingCards, setPulsingCards] = useState(new Set())
  const [stockAlerts,  setStockAlerts]  = useState([])

  // waste modal
  const [wasteOpen,        setWasteOpen]        = useState(false)
  const [wasteForm,        setWasteForm]        = useState(WASTE_FORM_EMPTY)
  const [wasteIngredients, setWasteIngredients] = useState([])
  const [wasteSubmitting,  setWasteSubmitting]  = useState(false)
  const [wasteError,       setWasteError]       = useState("")
  const [wasteSuccess,     setWasteSuccess]     = useState("")

  // readyAtRef: "orderId-itemId" → timestamp when item first became ready
  const readyAtRef = useRef({})

  // 1-second tick drives all timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── helpers ────────────────────────────────────────────────────────────────

  const filterKitchenOrders = (list) =>
    list
      .map(o => ({ ...o, items: o.items.filter(i => i.destination === "kitchen" || !i.destination) }))
      .filter(o =>
        o.items.length > 0 &&
        !["served", "cancelled", "billed"].includes(o.status) &&
        o.items.some(i => i.status !== "served")
      )

  const getItemCards = (orderList) =>
    orderList.flatMap(order =>
      order.items
        .filter(i => i.status !== "served")
        .map(i => ({ ...i, order }))
    )

  // ── track ready timestamps ─────────────────────────────────────────────────
  useEffect(() => {
    const cards = getItemCards(orders)
    cards.forEach(card => {
      const key = `${card.order._id}-${card._id}`
      if (card.status === "ready" && !readyAtRef.current[key]) {
        readyAtRef.current[key] = Date.now()
      }
    })
    Object.keys(readyAtRef.current).forEach(key => {
      if (!cards.find(c => `${c.order._id}-${c._id}` === key)) {
        delete readyAtRef.current[key]
      }
    })
  }, [orders])

  // ── auto-dismiss ready items after 60 s ────────────────────────────────────
  useEffect(() => {
    const toRemove = Object.entries(readyAtRef.current)
      .filter(([, ts]) => now - ts >= AUTO_CLEAR_SECS * 1000)
      .map(([key]) => key)

    if (toRemove.length > 0) {
      toRemove.forEach(key => delete readyAtRef.current[key])
      setOrders(prev =>
        filterKitchenOrders(
          prev.map(o => ({
            ...o,
            items: o.items.map(i =>
              toRemove.includes(`${o._id}-${i._id}`) ? { ...i, status: "served" } : i
            ),
          }))
        )
      )
    }
  }, [now])

  const getCountdown = (orderId, itemId) => {
    const ts = readyAtRef.current[`${orderId}-${itemId}`]
    if (!ts) return null
    return Math.max(0, AUTO_CLEAR_SECS - Math.floor((now - ts) / 1000))
  }

  // ── data loading ───────────────────────────────────────────────────────────

  const loadOrders = async () => {
    try {
      const res  = await fetchOrders({ status: "pending,cooking,ready" })
      const list = filterKitchenOrders(res.orders || [])
      setOrders(list)
      // Seed timers for items already in cooking state (default estimate on page load)
      setItemTimers(prev => {
        const next = { ...prev }
        list.forEach(o => {
          o.items.forEach(i => {
            if (i.status === "cooking") {
              const key = `${o._id}-${i._id}`
              if (!next[key]) {
                next[key] = { startedAt: Date.now(), estimatedSecs: DEFAULT_ESTIMATE_SECS }
              }
            }
          })
        })
        return next
      })
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadOrders() }, [])

  // Load initial low/out kitchen ingredients for the banner
  useEffect(() => {
    const load = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetchIngredients({ destination: "kitchen", limit: 200 }),
          fetchIngredients({ destination: "both",    limit: 200 }),
        ])
        const all    = [...(r1.data?.ingredients || []), ...(r2.data?.ingredients || [])]
        const unique = all.filter((v, i, a) => a.findIndex(x => x._id === v._id) === i)
        const alerts = unique
          .filter(i => i.currentStock === 0 || (i.minThreshold > 0 && i.currentStock <= i.minThreshold))
          .map(i => ({ ...i, stockStatus: i.currentStock === 0 ? "out" : "low" }))
        setStockAlerts(alerts)
      } catch {}
    }
    load()
  }, [])

  useSocket(
    {
      "new-order": () => {
        newOrderSound()
        loadOrders().then(() => {
          setTimeout(() => {
            setOrders(current => {
              const cards = getItemCards(filterKitchenOrders(current))
              const newKeys = cards
                .filter(c => c.status === "pending")
                .map(c => `${c.order._id}-${c._id}`)
              if (newKeys.length > 0) {
                setPulsingCards(new Set(newKeys))
                setTimeout(() => setPulsingCards(new Set()), 2000)
              }
              return current
            })
          }, 50)
        })
      },
      "connect": () => loadOrders(),
      "item-status-update": ({ orderId, itemId, status, orderStatus }) => {
        const key = `${orderId}-${itemId}`
        // Clean up the timer when this item is no longer cooking
        if (status === "ready" || status === "served") {
          setItemTimers(prev => { const n = { ...prev }; delete n[key]; return n })
        }
        setOrders(prev =>
          filterKitchenOrders(
            prev.map(o => {
              if (o._id !== orderId) return o
              return {
                ...o,
                status: orderStatus || o.status,
                items:  o.items.map(i =>
                  (i._id === itemId || i.id === itemId) ? { ...i, status } : i
                ),
              }
            })
          )
        )
      },
      "order-cancelled": ({ orderId }) => {
        cancelOrderSound()
        setOrders(prev => prev.filter(o => o._id !== orderId))
        // Clean up all timers for this order
        setItemTimers(prev => {
          const n = { ...prev }
          Object.keys(n).forEach(k => { if (k.startsWith(`${orderId}-`)) delete n[k] })
          return n
        })
      },
      "stock-alert": ({ ingredient, type }) => {
        stockAlertSound()
        setStockAlerts(prev => {
          const exists = prev.find(i => i._id === ingredient._id)
          if (exists) return prev.map(i => i._id === ingredient._id ? { ...i, ...ingredient, stockStatus: type } : i)
          return [...prev, { ...ingredient, stockStatus: type }]
        })
      },
      "stock-restored": ({ ingredient }) => {
        setStockAlerts(prev => prev.filter(i => i._id !== ingredient._id))
      },
    },
    [{ event: "join-kitchen", value: null }]
  )

  // ── actions ────────────────────────────────────────────────────────────────

  const handleStartCooking = async (card, estimatedSecs) => {
    const key = `${card.order._id}-${card._id}`
    setCookingItems(prev => new Set(prev).add(key))
    setEstimatePrompt(null)
    setEstimateCustom("")
    try {
      await updateItemStatus(card.order._id, card._id, "cooking", estimatedSecs)
      setItemTimers(prev => ({ ...prev, [key]: { startedAt: Date.now(), estimatedSecs } }))
      setOrders(prev =>
        filterKitchenOrders(
          prev.map(o =>
            o._id !== card.order._id ? o : {
              ...o,
              items: o.items.map(i => i._id === card._id ? { ...i, status: "cooking" } : i),
            }
          )
        )
      )
    } catch (err) {
      console.error("Failed to start cooking:", err)
    } finally {
      setCookingItems(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  const handleMarkReady = async (card) => {
    const key = `${card.order._id}-${card._id}`
    setMarkingItems(prev => new Set(prev).add(key))
    try {
      await updateItemStatus(card.order._id, card._id, "ready")
      // If item was overdue when marked ready, briefly show a late message
      const timer = itemTimers[key]
      if (timer) {
        const elapsedSecs = Math.floor((Date.now() - timer.startedAt) / 1000)
        if (elapsedSecs > timer.estimatedSecs) {
          const lateByMins = Math.ceil((elapsedSecs - timer.estimatedSecs) / 60)
          setLateMessages(prev => ({ ...prev, [key]: `${lateByMins} min late` }))
          setTimeout(() => setLateMessages(prev => { const n = { ...prev }; delete n[key]; return n }), 3000)
        }
      }
      setItemTimers(prev => { const n = { ...prev }; delete n[key]; return n })
      setOrders(prev =>
        filterKitchenOrders(
          prev.map(o =>
            o._id !== card.order._id ? o : {
              ...o,
              items: o.items.map(i => i._id === card._id ? { ...i, status: "ready" } : i),
            }
          )
        )
      )
    } catch (err) {
      console.error("Failed to mark ready:", err)
    } finally {
      setMarkingItems(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  const handleCancel = async () => {
    const finalReason = customReason.trim() || reason
    if (!finalReason) return
    setSubmitting(true)
    try {
      await cancelOrder(cancelModal.order._id, finalReason)
      setOrders(prev => prev.filter(o => o._id !== cancelModal.order._id))
      setCancelModal(null); setReason(""); setCustomReason("")
    } catch {}
    finally { setSubmitting(false) }
  }

  // ── waste handlers ────────────────────────────────────────────────────────

  const handleOpenWaste = async () => {
    setWasteForm(WASTE_FORM_EMPTY)
    setWasteError("")
    setWasteSuccess("")
    setWasteOpen(true)
    try {
      const res  = await fetchIngredients({ destination: "kitchen" })
      const res2 = await fetchIngredients({ destination: "both" })
      const all  = [...(res.data.ingredients || []), ...(res2.data.ingredients || [])]
      const unique = all.filter((v, i, a) => a.findIndex(x => x._id === v._id) === i)
      setWasteIngredients(unique)
    } catch { setWasteIngredients([]) }
  }

  const handleWasteSubmit = async (e) => {
    e.preventDefault()
    setWasteError("")
    if (!wasteForm.ingredient) { setWasteError("Select an ingredient"); return }
    if (!wasteForm.quantity || Number(wasteForm.quantity) <= 0) { setWasteError("Enter a valid quantity"); return }
    if (!wasteForm.reason)    { setWasteError("Select a reason"); return }
    setWasteSubmitting(true)
    try {
      await createWasteLog({
        ingredient: wasteForm.ingredient,
        quantity:   Number(wasteForm.quantity),
        reason:     wasteForm.reason,
        notes:      wasteForm.notes,
      })
      setWasteSuccess("Waste logged!")
      setWasteForm(WASTE_FORM_EMPTY)
      setTimeout(() => { setWasteOpen(false); setWasteSuccess("") }, 1200)
    } catch (err) {
      setWasteError(err.response?.data?.message || "Failed to log waste")
    } finally {
      setWasteSubmitting(false)
    }
  }

  const getElapsed = (createdAt) => {
    const mins = Math.floor((now - new Date(createdAt)) / 60000)
    if (mins < 1)  return "just now"
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const isUrgent = (createdAt) =>
    Math.floor((now - new Date(createdAt)) / 60000) >= 10

  // ── column layout ──────────────────────────────────────────────────────────

  const allCards = getItemCards(orders)
  const pending  = allCards.filter(c => c.status === "pending")
  const cooking  = allCards.filter(c => c.status === "cooking")
  const ready    = allCards.filter(c => c.status === "ready")

  const columns = [
    {
      key: "pending", label: "New Orders",     count: pending.length, cards: pending,
      accent: "#ef4444", accentMid: "#fee2e2",
      headerBg: "bg-red-50 border-red-200",         headerText: "text-red-700",     headerDot: "bg-red-500",
      countBg: "bg-red-500 text-white",             chipBg: "bg-red-100 text-red-700",     emptyIcon: "📋",
    },
    {
      key: "cooking", label: "Cooking",         count: cooking.length, cards: cooking,
      accent: "#f97316", accentMid: "#ffedd5",
      headerBg: "bg-orange-50 border-orange-200",   headerText: "text-orange-700", headerDot: "bg-orange-500",
      countBg: "bg-orange-500 text-white",          chipBg: "bg-orange-100 text-orange-700", emptyIcon: "🍳",
    },
    {
      key: "ready",   label: "Ready to Serve",  count: ready.length,   cards: ready,
      accent: "#22c55e", accentMid: "#dcfce7",
      headerBg: "bg-emerald-50 border-emerald-200", headerText: "text-emerald-700", headerDot: "bg-emerald-500",
      countBg: "bg-emerald-500 text-white",         chipBg: "bg-emerald-100 text-emerald-700", emptyIcon: "✓",
    },
  ]

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">

      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xl shadow-md shadow-orange-200">
            🍳
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-800 leading-tight">Kitchen Display</div>
            <div className="text-xs text-zinc-400">Himalaya Kitchen</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: "New",     count: pending.length, cls: "bg-red-50 border-red-200 text-red-600",             dot: "bg-red-500"     },
            { label: "Cooking", count: cooking.length, cls: "bg-orange-50 border-orange-200 text-orange-600",    dot: "bg-orange-500"  },
            { label: "Ready",   count: ready.length,   cls: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${s.cls}`}>
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.count} {s.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <SoundToggle />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-zinc-600">{user?.name}</span>
          </div>
          <button onClick={handleOpenWaste}
            className="text-xs font-semibold px-3 py-1.5 border border-orange-200 rounded-lg text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
            Log Waste
          </button>
          <button onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
            Sign out
          </button>
        </div>
      </div>

      {/* STOCK ALERT BANNER */}
      {stockAlerts.length > 0 && (
        <div className={`px-6 py-2 flex items-center gap-3 text-sm font-medium border-b
          ${stockAlerts.some(i => i.stockStatus === "out")
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-amber-50 border-amber-200 text-amber-800"}`}>
          <span className="text-base flex-shrink-0">⚠</span>
          <span className="font-bold flex-shrink-0">Low stock:</span>
          <span className="flex-1 truncate">
            {stockAlerts.map(i => `${i.name} (${i.currentStock} ${i.unit})`).join(", ")}
          </span>
          <button onClick={() => setStockAlerts([])}
            className="flex-shrink-0 text-xs opacity-50 hover:opacity-100 transition-opacity ml-2">✕</button>
        </div>
      )}

      {/* BOARD */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-9 h-9 border-[3px] border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400 font-medium">Loading orders...</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-5 p-5 overflow-y-auto items-start">
          {columns.map(col => (
            <div key={col.key} className="flex flex-col gap-3">

              {/* Column header */}
              <div className={`flex items-center justify-between px-4 py-3 bg-white rounded-2xl border shadow-sm ${col.headerBg}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.headerDot}`} />
                  <span className={`text-sm font-bold ${col.headerText}`}>{col.label}</span>
                </div>
                <div className={`min-w-[28px] h-7 px-2 rounded-lg flex items-center justify-center text-xs font-bold ${col.countBg}`}>
                  {col.count}
                </div>
              </div>

              {/* Empty state */}
              {col.cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border-2 border-dashed border-zinc-200 gap-3">
                  <span className="text-4xl opacity-20">{col.emptyIcon}</span>
                  <span className="text-xs font-medium text-zinc-300">No {col.label.toLowerCase()}</span>
                </div>
              ) : (
                col.cards
                  .sort((a, b) => new Date(a.order.createdAt) - new Date(b.order.createdAt))
                  .map(card => {
                    const cardKey   = `${card.order._id}-${card._id}`
                    const urgent    = isUrgent(card.order.createdAt)
                    const countdown = col.key === "ready" ? getCountdown(card.order._id, card._id) : null
                    const isCooking = cookingItems.has(cardKey)
                    const isMarking = markingItems.has(cardKey)
                    const pct       = countdown !== null ? (countdown / AUTO_CLEAR_SECS) * 100 : 100
                    const nearEnd   = countdown !== null && countdown <= 15

                    // Compute per-item timer display data (cooking column only)
                    const timer = col.key === "cooking" ? itemTimers[cardKey] : null
                    let timerUI = null
                    if (timer) {
                      const elapsedSecs = Math.floor((now - timer.startedAt) / 1000)
                      const estSecs     = timer.estimatedSecs
                      const ratio       = elapsedSecs / estSecs
                      const isOverdue   = ratio >= 1.0
                      const progressPct = Math.min(ratio * 100, 100)
                      let timerCls, barCls, bgCls, borderCls
                      if (isOverdue) {
                        timerCls = "text-red-600"; barCls = "bg-red-500"; bgCls = "bg-red-50"; borderCls = "border-red-200"
                      } else if (ratio >= 0.8) {
                        timerCls = "text-orange-600"; barCls = "bg-orange-400"; bgCls = "bg-orange-50"; borderCls = "border-orange-200"
                      } else if (ratio >= 0.5) {
                        timerCls = "text-amber-600"; barCls = "bg-amber-400"; bgCls = "bg-amber-50"; borderCls = "border-amber-200"
                      } else {
                        timerCls = "text-emerald-600"; barCls = "bg-emerald-400"; bgCls = "bg-emerald-50"; borderCls = "border-emerald-200"
                      }
                      timerUI = { elapsedSecs, estSecs, isOverdue, progressPct, timerCls, barCls, bgCls, borderCls }
                    }

                    return (
                      <div key={cardKey}
                        className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300
                          ${col.key === "ready"
                            ? nearEnd ? "border-red-300 shadow-red-100 shadow-md" : "border-emerald-300 shadow-emerald-100 shadow-md"
                            : urgent  ? "border-red-300 shadow-red-100 shadow-md" : "border-zinc-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg"}
                          ${pulsingCards.has(cardKey) ? "new-order-pulse" : ""}`}>

                        {/* Accent bar */}
                        <div className="h-1.5 w-full"
                          style={{ background: `linear-gradient(90deg, ${col.accent}, ${col.accent}88)` }} />

                        {/* Countdown bar — ready only */}
                        {col.key === "ready" && countdown !== null && (
                          <div className="h-1 bg-zinc-100">
                            <div
                              className={`h-full transition-all duration-1000 ${nearEnd ? "bg-red-400" : "bg-emerald-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}

                        {/* Card header */}
                        <div className="px-4 pt-3 pb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 rounded-xl px-3 py-2 flex flex-col items-center justify-center"
                              style={{ background: col.accentMid }}>
                              <span className="text-3xl font-black leading-none" style={{ color: col.accent }}>
                                {card.order.tableNumber}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${col.accent}bb` }}>
                                TABLE
                              </span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg
                                ${urgent ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgent ? "bg-red-500 animate-pulse" : "bg-zinc-400"}`} />
                                {getElapsed(card.order.createdAt)}
                                {urgent && <span className="font-bold text-red-600">· LATE</span>}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-medium pl-1">
                                #{card.order._id?.slice(-4).toUpperCase()}
                              </div>
                            </div>
                          </div>

                          {col.key === "ready" && countdown !== null ? (
                            <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl flex-shrink-0
                              ${nearEnd ? "bg-red-100 text-red-600 animate-pulse" : "bg-emerald-100 text-emerald-700"}`}>
                              <span className="text-xl font-black leading-none">{countdown}s</span>
                              <span className="text-[9px] font-bold uppercase tracking-wide">auto-clear</span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide flex-shrink-0 ${col.chipBg}`}>
                              {col.key === "pending" ? "NEW" : col.key === "cooking" ? "Cooking 🔥" : "Ready ✓"}
                            </span>
                          )}
                        </div>

                        <div className="h-px bg-zinc-100 mx-4" />

                        {/* Item details */}
                        <div className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl text-white text-sm font-black flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ background: col.accent }}>
                              ×{card.quantity}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-zinc-800 leading-tight">{card.name}</div>
                              {card.selectedOptions?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {card.selectedOptions.map(opt => (
                                    <span key={opt.groupName} className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                      {opt.groupName}: {opt.selected?.join(", ")}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {card.removedIngredients?.length > 0 && (
                                <div className="mt-1.5 text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded inline-block">
                                  ✕ No: {card.removedIngredients.join(", ")}
                                </div>
                              )}
                              {card.selectedVariants?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {card.selectedVariants.map(v => (
                                    <span key={v.groupName} className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                      {v.groupName}: {v.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Per-item cooking timer (cooking column only) */}
                        {timerUI && (
                          <>
                            <div className="h-px bg-zinc-100 mx-4" />
                            <div className={`mx-4 my-3 rounded-xl p-2.5 border ${timerUI.bgCls} ${timerUI.borderCls}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-black tabular-nums ${timerUI.timerCls} ${timerUI.isOverdue ? "animate-pulse" : ""}`}>
                                  ⏱ {formatTime(timerUI.elapsedSecs)} / {formatTime(timerUI.estSecs)}
                                </span>
                                {timerUI.isOverdue && (
                                  <span className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${timerUI.barCls} ${timerUI.isOverdue ? "animate-pulse" : ""}`}
                                  style={{ width: `${timerUI.progressPct}%` }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Brief late message in ready column */}
                        {col.key === "ready" && lateMessages[cardKey] && (
                          <div className="mx-4 mb-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-700 text-center">
                            Completed {lateMessages[cardKey]} late
                          </div>
                        )}

                        <div className="h-px bg-zinc-100 mx-4" />

                        {/* Footer */}
                        <div className="px-4 py-3 flex gap-2">

                          {col.key === "pending" && (
                            <button
                              onClick={() => { setEstimatePrompt(card); setEstimateCustom("") }}
                              disabled={isCooking}
                              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-black tracking-wide shadow-md shadow-orange-200 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                              {isCooking
                                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Starting...</>
                                : <>🔥 Start Cooking</>}
                            </button>
                          )}

                          {col.key === "cooking" && (
                            <button
                              onClick={() => handleMarkReady(card)}
                              disabled={isMarking}
                              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-black tracking-wide shadow-md shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                              {isMarking
                                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Marking...</>
                                : <>✅ Mark Ready</>}
                            </button>
                          )}

                          {col.key === "ready" && countdown !== null && (
                            <div className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2
                              ${nearEnd
                                ? "bg-red-50 border border-red-200 text-red-600"
                                : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
                              {nearEnd ? "⚠️" : "✓"} Ready — clearing in {countdown}s
                            </div>
                          )}

                          {col.key !== "ready" && (
                            <button
                              onClick={() => { setCancelModal(card); setReason(""); setCustomReason("") }}
                              className="w-9 h-9 flex-shrink-0 rounded-xl border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-all flex items-center justify-center text-sm font-bold">
                              ✕
                            </button>
                          )}
                        </div>

                      </div>
                    )
                  })
              )}
            </div>
          ))}
        </div>
      )}

      {/* ESTIMATE PROMPT MODAL — shown when cook clicks "Start Cooking" */}
      {estimatePrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-800">How long to cook?</h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{estimatePrompt.name} × {estimatePrompt.quantity}</p>
            </div>
            <div className="p-4 space-y-2.5">
              {/* Range quick-pick buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "1 – 4 min",  secs: 4  * 60 },
                  { label: "4 – 8 min",  secs: 8  * 60 },
                  { label: "8 – 12 min", secs: 12 * 60 },
                  { label: "~ 20 min",   secs: 20 * 60 },
                ].map(opt => (
                  <button key={opt.label}
                    onClick={() => handleStartCooking(estimatePrompt, opt.secs)}
                    className="py-3.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 active:scale-[0.96] transition-all shadow-md shadow-orange-100">
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Custom input */}
              <div className="flex gap-2">
                <input
                  type="number" min="1" max="120"
                  value={estimateCustom}
                  onChange={e => setEstimateCustom(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const v = parseInt(estimateCustom)
                      if (v > 0) handleStartCooking(estimatePrompt, v * 60)
                    }
                  }}
                  placeholder="Custom (min)"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-center focus:outline-none focus:border-orange-400"
                  autoFocus
                />
                <button
                  disabled={!estimateCustom}
                  onClick={() => { const v = parseInt(estimateCustom); if (v > 0) handleStartCooking(estimatePrompt, v * 60) }}
                  className="px-4 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-40 hover:bg-orange-600 transition-all">
                  Set
                </button>
              </div>
              <button
                onClick={() => handleStartCooking(estimatePrompt, DEFAULT_ESTIMATE_SECS)}
                className="w-full py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-all">
                Skip — default 5 min
              </button>
              <button
                onClick={() => { setEstimatePrompt(null); setEstimateCustom("") }}
                className="w-full py-1.5 rounded-xl text-xs text-zinc-300 hover:text-zinc-500 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-800">Cancel order — Table {cancelModal.order.tableNumber}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">This will cancel the entire order for this table</p>
              </div>
              <button onClick={() => setCancelModal(null)}
                className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-600 flex items-center justify-center text-base transition-all">×</button>
            </div>
            <div className="p-5 flex flex-col gap-2 max-h-72 overflow-y-auto">
              {CANCEL_REASONS.map(r => (
                <button key={r} onClick={() => { setReason(r); setCustomReason("") }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${reason === r ? "bg-red-50 border-red-300 text-red-600" : "border-zinc-200 text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500"}`}>
                  {r}
                </button>
              ))}
              <div className="mt-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Or write custom reason</label>
                <textarea value={customReason} onChange={e => { setCustomReason(e.target.value); setReason("") }}
                  placeholder="e.g. Out of stock, we apologise..." rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 focus:outline-none focus:border-zinc-300 focus:bg-white resize-none transition-all placeholder:text-zinc-300" />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 transition-all">Go back</button>
              <button onClick={handleCancel} disabled={(!reason && !customReason.trim()) || submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:from-red-600 hover:to-red-700 shadow-md shadow-red-200">
                {submitting ? "Cancelling..." : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK ALERT TOASTS */}
      <StockAlertToast />

      {/* WASTE MODAL */}
      {wasteOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-800">Log Waste</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Record ingredient waste from the kitchen</p>
              </div>
              <button onClick={() => setWasteOpen(false)}
                className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-600 flex items-center justify-center text-base transition-all">×</button>
            </div>
            <form onSubmit={handleWasteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Ingredient</label>
                <select
                  value={wasteForm.ingredient}
                  onChange={e => setWasteForm(p => ({ ...p, ingredient: e.target.value }))}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  <option value="">Select ingredient…</option>
                  {wasteIngredients.map(ing => (
                    <option key={ing._id} value={ing._id}>{ing.name} ({ing.currentStock} {ing.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Quantity</label>
                <input type="number" min="0.01" step="0.01"
                  value={wasteForm.quantity}
                  onChange={e => setWasteForm(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Reason</label>
                <select
                  value={wasteForm.reason}
                  onChange={e => setWasteForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white capitalize">
                  <option value="">Select reason…</option>
                  {WASTE_REASONS.map(r => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Notes <span className="font-normal text-zinc-400">(optional)</span></label>
                <input type="text"
                  value={wasteForm.notes}
                  onChange={e => setWasteForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Additional details…"
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {wasteError   && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{wasteError}</div>}
              {wasteSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2">{wasteSuccess}</div>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setWasteOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 transition-all">Cancel</button>
                <button type="submit" disabled={wasteSubmitting}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors">
                  {wasteSubmitting ? "Logging…" : "Log Waste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
