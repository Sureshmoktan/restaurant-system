import { useEffect, useState } from "react"
import { fetchOrders, updateOrderStatus, cancelOrder } from "../service/orderService"
import useSocket from "../hooks/useSocket"
import useAuth from "../hooks/useAuth"
import { CANCEL_REASONS } from "../constants"

const STATUS_FLOW = { pending: "cooking", cooking: "ready" }

export default function KitchenDisplay() {
  const { handleLogout, user } = useAuth()
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [cancelModal,  setCancelModal]  = useState(null)
  const [reason,       setReason]       = useState("")
  const [customReason, setCustomReason] = useState("")
  const [submitting,   setSubmitting]   = useState(false)
  const [now,          setNow]          = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const filterKitchenItems = (orders) =>
  orders
    .map((o) => ({
      ...o,
      items: o.items.filter((i) => i.destination === "kitchen" || !i.destination),
    }))
    .filter((o) => o.items.length > 0)
  const loadOrders = async () => {
    try {
      const res = await fetchOrders({ status: "pending,cooking,ready" })
      setOrders(filterKitchenItems(res.orders || []))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadOrders() }, [])

  useSocket(
    {
      "new-order": () => loadOrders(),
      "order-status-update": (data) => {
              console.log("SOCKET STATUS UPDATE:", data)  // ← add this

  setOrders((prev) =>
    filterKitchenItems(  // or filterBarItems for bar
      prev
        .map((o) => o._id === data.orderId ? { ...o, status: data.status } : o)
        .filter((o) => o.status !== "served" && o.status !== "cancelled") // ← add this
    )
  )
},  
    },
    [{ event: "join-kitchen", value: null }]
  )

  const handleStatusUpdate = async (order) => {
    const next = STATUS_FLOW[order.status]
    if (!next) return
    try {
      await updateOrderStatus(order._id, next)
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: next } : o))
    } catch {}
  }

  const handleCancel = async () => {
    const finalReason = customReason.trim() || reason
    if (!finalReason) return
    setSubmitting(true)
    try {
      await cancelOrder(cancelModal._id, finalReason)
      setOrders((prev) => prev.filter((o) => o._id !== cancelModal._id))
      setCancelModal(null)
      setReason("")
      setCustomReason("")
    } catch {}
    finally { setSubmitting(false) }
  }

  const getElapsed = (createdAt) => {
    const mins = Math.floor((now - new Date(createdAt)) / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const isUrgent = (createdAt, status) =>
    status === "pending" && Math.floor((now - new Date(createdAt)) / 60000) >= 10

  const pending = orders.filter((o) => o.status === "pending")
  const cooking = orders.filter((o) => o.status === "cooking")
  const ready   = orders.filter((o) => o.status === "ready")

  const columns = [
    { key: "pending", label: "New Orders", count: pending.length, orders: pending,
      bar: "bg-red-400", icon: "🕐", iconBg: "bg-red-50", iconText: "text-red-500",
      badge: "bg-red-50 text-red-500", countBg: "bg-red-50 text-red-600",
      chip: "bg-red-50 text-red-600", btn: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200",
      btnLabel: "▶ Start Cooking",
    },
    { key: "cooking", label: "Cooking", count: cooking.length, orders: cooking,
      bar: "bg-orange-400", icon: "🍳", iconBg: "bg-orange-50", iconText: "text-orange-500",
      badge: "bg-orange-50 text-orange-500", countBg: "bg-orange-50 text-orange-600",
      chip: "bg-orange-50 text-orange-600", btn: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-200",
      btnLabel: "✓ Mark Ready",
    },
    { key: "ready", label: "Ready", count: ready.length, orders: ready,
      bar: "bg-green-400", icon: "✓", iconBg: "bg-green-50", iconText: "text-green-600",
      badge: "bg-green-50 text-green-600", countBg: "bg-green-50 text-green-700",
      chip: "bg-green-50 text-green-700", btn: "",
      btnLabel: "",
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">

      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 px-6 py-0 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">

        {/* brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xl shadow-md shadow-orange-200">
            🍳
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-800 leading-tight">Kitchen Display</div>
            <div className="text-xs text-zinc-400">Himalaya Kitchen</div>
          </div>
        </div>

        {/* stats */}
        <div className="flex items-center gap-2">
          {[
            { label: "New",     count: pending.length, cls: "bg-red-50 border-red-200 text-red-600",    dot: "bg-red-500"    },
            { label: "Cooking", count: cooking.length, cls: "bg-orange-50 border-orange-200 text-orange-600", dot: "bg-orange-500" },
            { label: "Ready",   count: ready.length,   cls: "bg-green-50 border-green-200 text-green-700",  dot: "bg-green-500"  },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${s.cls}`}>
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.count} {s.label}
            </div>
          ))}
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-zinc-600">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* BOARD */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-9 h-9 border-3 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400 font-medium">Loading orders...</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-5 p-5 overflow-y-auto items-start">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">

              {/* column header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-zinc-200 shadow-sm sticky top-20 z-10">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${col.iconBg}`}>
                    {col.icon}
                  </div>
                  <span className="text-sm font-bold text-zinc-700">{col.label}</span>
                </div>
                <div className={`min-w-7 h-7 px-2 rounded-lg flex items-center justify-center text-sm font-bold ${col.countBg}`}>
                  {col.count}
                </div>
              </div>

              {/* empty state */}
              {col.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-dashed border-zinc-200 gap-2">
                  <span className="text-3xl opacity-20">{col.icon}</span>
                  <span className="text-xs font-medium text-zinc-400">No {col.label.toLowerCase()}</span>
                </div>
              ) : (
                col.orders
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((order) => {
                    const urgent = isUrgent(order.createdAt, order.status)
                    return (
                      <div
                        key={order._id}
                        className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                          ${urgent ? "border-red-300 shadow-red-100 shadow-md" : "border-zinc-200"}`}
                      >
                        {/* top color bar */}
                        <div className={`h-1 w-full ${col.bar}`} />

                        {/* card header */}
                        <div className="flex items-start justify-between px-4 pt-3 pb-2">
                          <div>
                            <div className="text-2xl font-black text-zinc-800 leading-none tracking-tight">{order.tableNumber}</div>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Table</div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${col.chip}`}>
                              {order.status === "pending" ? "NEW" : order.status}
                            </span>
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md
                              ${urgent ? "bg-red-50 text-red-500" : "bg-zinc-100 text-zinc-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${urgent ? "bg-red-500" : "bg-zinc-400"}`} />
                              {getElapsed(order.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="h-px bg-zinc-100 mx-4" />

                        {/* items */}
                        <div className="px-4 py-3 flex flex-col gap-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-zinc-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {item.quantity}
                                </div>
                                <span className="text-sm font-semibold text-zinc-800">{item.name}</span>
                              </div>
                              {(item.selectedOptions?.length > 0 || item.removedIngredients?.length > 0) && (
                                <div className="pl-8 mt-1.5 flex flex-col gap-1">
                                  {item.selectedOptions?.map((opt) => (
                                    <div key={opt.groupName} className="text-xs text-blue-500 font-medium">
                                      ↳ {opt.groupName}: {opt.selected?.join(", ")}
                                    </div>
                                  ))}
                                  {item.removedIngredients?.length > 0 && (
                                    <div className="text-xs text-red-500 font-medium">
                                      ✕ No: {item.removedIngredients.join(", ")}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="h-px bg-zinc-100 mx-4" />

                        {/* footer */}
                        <div className="px-4 py-3 flex gap-2">
                          {order.status === "ready" ? (
                            <div className="flex-1 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold flex items-center justify-center gap-1.5">
                              ✓ Ready to serve
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(order)}
                              className={`flex-1 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md ${col.btn}`}
                            >
                              {col.btnLabel}
                            </button>
                          )}
                          <button
                            onClick={() => { setCancelModal(order); setReason(""); setCustomReason("") }}
                            className="w-9 h-9 flex-shrink-0 rounded-xl border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-all flex items-center justify-center text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          ))}
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 overflow-hidden">

            <div className="flex items-start justify-between p-5 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-800">Cancel order — Table {cancelModal.tableNumber}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Customer will see this reason on their screen</p>
              </div>
              <button
                onClick={() => setCancelModal(null)}
                className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-600 flex items-center justify-center text-base transition-all"
              >
                ×
              </button>
            </div>

            <div className="p-5 flex flex-col gap-2 max-h-72 overflow-y-auto">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setCustomReason("") }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${reason === r
                      ? "bg-red-50 border-red-300 text-red-600"
                      : "border-zinc-200 text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500"}`}
                >
                  {r}
                </button>
              ))}
              <div className="mt-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Or write custom reason</label>
                <textarea
                  value={customReason}
                  onChange={(e) => { setCustomReason(e.target.value); setReason("") }}
                  placeholder="e.g. Gas ran out, we apologise..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 focus:outline-none focus:border-zinc-300 focus:bg-white resize-none transition-all placeholder:text-zinc-300"
                />
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-500 hover:bg-zinc-50 transition-all"
              >
                Go back
              </button>
              <button
                onClick={handleCancel}
                disabled={(!reason && !customReason.trim()) || submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:from-red-600 hover:to-red-700 shadow-md shadow-red-200"
              >
                {submitting ? "Cancelling..." : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}