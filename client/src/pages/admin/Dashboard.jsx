import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../service/api"
import socket from "../../socket/socket"
import StockAlertToast from "../../components/StockAlertToast"
import { fetchFeedbackStats } from "../../service/feedbackService"

const QUICK_LINKS = [
  { label: "Menu",   desc: "Add & manage food items",    path: "/admin/menu",   emoji: "🍕", from: "from-orange-400", to: "to-orange-600"  },
  { label: "Tables", desc: "Configure restaurant tables", path: "/admin/tables", emoji: "🪑", from: "from-blue-400",   to: "to-blue-600"    },
  { label: "Users",  desc: "Manage staff accounts",       path: "/admin/users",  emoji: "👤", from: "from-violet-400", to: "to-violet-600"  },
  { label: "Bills and Cashout",  desc: "View all payments & revenue", path: "/admin/bills",  emoji: "🧾", from: "from-emerald-400",to: "to-emerald-600" },
  { label: "Offers", desc: "Manage promotions & deals",   path: "/admin/offers", emoji: "🏷️", from: "from-pink-400",   to: "to-pink-600"    },
  { label: "Forecast", desc: "View forecast data",   path: "/admin/forecast", emoji: "📊", from: "from-indigo-400",   to: "to-indigo-600"    },
  { label: "Orders", desc: "View all orders",   path: "/admin/orders", emoji: "📋", from: "from-amber-400",   to: "to-amber-600"    },
  { label: "Ingredients", desc: "Manage ingredients",   path: "/admin/ingredients", emoji: "🥗", from: "from-lime-400",   to: "to-lime-600"    },
  { label: "Purchases", desc: "Manage purchases",   path: "/admin/purchases", emoji: "📦", from: "from-cyan-400",   to: "to-cyan-600"    },
  { label: "Waste",                desc: "Manage waste",              path: "/admin/waste",                emoji: "🗑️", from: "from-red-400",    to: "to-red-600"    },
  { label: "Inventory Analytics", desc: "Stock, waste & spend charts", path: "/admin/inventory-analytics", emoji: "📈", from: "from-teal-400",   to: "to-teal-600"   },
  { label: "Feedback",           desc: "Customer reviews & ratings",   path: "/admin/feedback",            emoji: "⭐", from: "from-yellow-400", to: "to-yellow-600"  },
  { label: "Discount Game",     desc: "Spin-wheel discount game",      path: "/admin/discount-game",       emoji: "🎲", from: "from-violet-400", to: "to-purple-600"  },
  { label: "Audit Log",         desc: "Staff actions & system events", path: "/admin/audit-log",           emoji: "🔍", from: "from-slate-500",  to: "to-slate-700"   },
]


const METHOD_ICONS  = { cash: "💵", esewa: "📱", khalti: "📱", card: "💳" }
const METHOD_COLORS = { cash: "bg-green-100 text-green-700", esewa: "bg-blue-100 text-blue-700", khalti: "bg-purple-100 text-purple-700", card: "bg-orange-100 text-orange-700" }

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading dashboard...</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, note, accent, sub }) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${accent}`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${accent} bg-opacity-10`}>
          {icon}
        </div>
        {sub && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">{sub}</span>}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      {note && <div className="text-xs text-slate-400 mt-1">{note}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats,   setStats]   = useState({ revenue: 0, tips: 0, bills: 0, tables: 0, users: 0, paid: 0, unpaid: 0, activeOrders: 0, discounts: 0 })
  const [bills,   setBills]   = useState([])
  const [menu,    setMenu]    = useState([])
  const [tables,  setTables]  = useState([])
  const [orders,  setOrders]  = useState([])  // eslint-disable-line no-unused-vars
  const [loading, setLoading] = useState(true)
  const [paymentBreakdown, setPaymentBreakdown] = useState([])
  const [topItems,         setTopItems]         = useState([])
  const [activeOffers,     setActiveOffers]     = useState([])
  const [invStats,   setInvStats]   = useState({ total: 0, lowStock: 0, outOfStock: 0, totalValue: 0, lowItems: [] })
  const [fbStats,    setFbStats]    = useState(null)
  const [auditLogs,  setAuditLogs]  = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, tRes, bRes, mRes, oRes, offersRes, ingRes, auditRes] = await Promise.all([
          api.get("/users"),
          api.get("/tables"),
          api.get("/bills"),
          api.get("/menu"),
          api.get("/orders?status=pending,cooking,ready"),
          api.get("/offers/active"),
          api.get("/ingredients?limit=300").catch(() => ({ data: {} })),
          api.get("/audit?limit=8").catch(() => ({ data: { logs: [] } })),
        ])

        const allBills   = bRes.data.bills || []
        const paid       = allBills.filter((b) => b.paymentStatus === "paid")
        const revenue    = paid.reduce((s, b) => s + (b.totalAmount    || 0), 0)
        const totalTips  = paid.reduce((s, b) => s + (b.tipAmount      || 0), 0)
        const totalDiscounts = paid.reduce((s, b) => s + (b.discountAmount || 0), 0)
        const allTables  = tRes.data.tables || []
        const allOrders  = oRes.data.orders || []
        const allMenu    = mRes.data.menu   || []

        setStats({
          revenue,
          tips:         totalTips,
          discounts:    totalDiscounts,
          bills:        allBills.length,
          tables:       allTables.length,
          users:        uRes.data.count || uRes.data.users?.length || 0,
          paid:         paid.length,
          unpaid:       allBills.filter((b) => b.paymentStatus !== "paid").length,
          activeOrders: allOrders.length,
        })

        setBills(allBills.slice(0, 6))
        setTables(allTables)
        setOrders(allOrders.slice(0, 5))
        setActiveOffers(offersRes.data?.data || [])

        // ── Inventory stats ──
        const allIng = ingRes.data?.ingredients || ingRes.data?.data || []
        const lowItems = allIng
          .filter(i => i.currentStock === 0 || (i.minThreshold > 0 && i.currentStock <= i.minThreshold))
          .map(i => ({ ...i, stockStatus: i.currentStock === 0 ? "out" : "low" }))
        setInvStats({
          total:       allIng.length,
          lowStock:    lowItems.filter(i => i.stockStatus === "low").length,
          outOfStock:  lowItems.filter(i => i.stockStatus === "out").length,
          totalValue:  allIng.reduce((s, i) => s + ((i.currentStock || 0) * (i.costPerUnit || i.pricePerUnit || 0)), 0),
          lowItems:    lowItems.slice(0, 15),
        })

        // ── Payment method breakdown ──
        const methodMap = {}
        paid.forEach((b) => {
          const m = b.paymentMethod || "cash"
          if (!methodMap[m]) methodMap[m] = { count: 0, amount: 0 }
          methodMap[m].count  += 1
          methodMap[m].amount += b.totalAmount || 0
        })
        setPaymentBreakdown(
          Object.entries(methodMap)
            .map(([method, data]) => ({ method, ...data }))
            .sort((a, b) => b.amount - a.amount)
        )

        // ── Top selling menu items ──
        const itemMap = {}
        allOrders.forEach((o) => {
          o.items?.forEach((item) => {
            if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, count: 0, revenue: 0 }
            itemMap[item.name].count   += item.quantity || 1
            itemMap[item.name].revenue += (item.price || 0) * (item.quantity || 1)
          })
        })
        const top = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5)
        const enriched = top.map((t) => {
          const found = allMenu.find((m) => m.name === t.name)
          return { ...t, image: found?.image || null, category: found?.category || "" }
        })
        setTopItems(enriched)
        setMenu(allMenu.slice(0, 4))
        setAuditLogs(auditRes.data?.logs || [])

      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Feedback stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFeedbackStats()
      .then(data => setFbStats(data?.stats || null))
      .catch(() => {})
  }, [])

  // ── Real-time stock updates ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect()
    const doJoin = () => socket.emit("join-cashier")
    doJoin()
    socket.on("connect", doJoin)

    const handleAlert = ({ ingredient, type }) => {
      setInvStats(prev => {
        const exists = prev.lowItems.find(i => i._id === ingredient._id)
        const updated = exists
          ? prev.lowItems.map(i => i._id === ingredient._id ? { ...i, ...ingredient, stockStatus: type } : i)
          : [...prev.lowItems, { ...ingredient, stockStatus: type }]
        return {
          ...prev,
          lowStock:   updated.filter(i => i.stockStatus === "low").length,
          outOfStock: updated.filter(i => i.stockStatus === "out").length,
          lowItems:   updated,
        }
      })
    }

    const handleRestored = ({ ingredient }) => {
      setInvStats(prev => {
        const updated = prev.lowItems.filter(i => i._id !== ingredient._id)
        return {
          ...prev,
          lowStock:   updated.filter(i => i.stockStatus === "low").length,
          outOfStock: updated.filter(i => i.stockStatus === "out").length,
          lowItems:   updated,
        }
      })
    }

    socket.on("stock-alert",    handleAlert)
    socket.on("stock-restored", handleRestored)
    return () => {
      socket.off("connect",       doJoin)
      socket.off("stock-alert",   handleAlert)
      socket.off("stock-restored", handleRestored)
    }
  }, [])

  if (loading) return <Spinner />

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const availableTables = tables.filter((t) => t.status === "available").length
  const occupiedTables  = tables.filter((t) => t.status === "occupied").length
  const reservedTables  = tables.filter((t) => t.status === "reserved").length

  return (
    <>
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── HERO ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #10b981 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{greeting} 👋</h2>
          <p className="text-slate-400 text-sm">Here's your restaurant overview.</p>
        </div>
        <div className="hidden sm:flex items-center gap-6 relative">
          {[
            { label: "Active Orders",    value: stats.activeOrders, color: "text-orange-400" },
            { label: "Available Tables", value: availableTables,    color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
          <div className="text-right">
            <div className="text-3xl font-bold text-white tabular-nums">
              {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Current time</div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"    value={`Rs. ${stats.revenue.toLocaleString()}`}   icon="₨"  note={`${stats.paid} paid bills`}                        accent="bg-emerald-500" />
        <StatCard label="Total Tips"       value={`Rs. ${stats.tips.toLocaleString()}`}      icon="🙏" note="From all paid bills"                               accent="bg-amber-500"   />
        <StatCard label="Total Discounts"  value={`Rs. ${stats.discounts.toLocaleString()}`} icon="🏷️" note="From offers applied"                              accent="bg-pink-500"    />
        <StatCard label="Staff Accounts"   value={stats.users}                               icon="👤" note="Total registered staff"                            accent="bg-violet-500"  />
      </div>

      {/* ── INVENTORY OVERVIEW ── */}
      {invStats.total > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Inventory Overview</h3>

          {/* Inventory stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Ingredients" value={invStats.total}        icon="🥗" accent="bg-lime-500"  />
            <StatCard label="Low Stock"          value={invStats.lowStock}     icon="⚠️" note="Below threshold" accent="bg-amber-500" sub={invStats.lowStock  > 0 ? "Warning"  : undefined} />
            <StatCard label="Out of Stock"       value={invStats.outOfStock}   icon="🚫" note="Need restocking" accent="bg-red-500"   sub={invStats.outOfStock > 0 ? "Critical" : undefined} />
            <StatCard label="Inventory Value"    value={`Rs. ${invStats.totalValue.toLocaleString()}`} icon="💰" note="Estimated value" accent="bg-blue-500" />
          </div>

          {/* Low Stock Alerts mini-table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Low Stock Alerts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Items requiring attention</p>
              </div>
              <Link to="/admin/ingredients" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View All
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>

            {invStats.lowItems.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2 opacity-50">✅</div>
                <div className="text-sm text-slate-400 font-medium">All stock levels are healthy</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left">
                      <th className="px-5 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Ingredient</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Stock</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Threshold</th>
                      <th className="px-5 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invStats.lowItems.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-700">{item.name}</td>
                        <td className="px-5 py-3 text-slate-600 tabular-nums">
                          {item.currentStock} <span className="text-slate-400 text-xs">{item.unit}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 tabular-nums">
                          {item.minThreshold > 0
                            ? <>{item.minThreshold} <span className="text-slate-400 text-xs">{item.unit}</span></>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            item.stockStatus === "out"
                              ? "bg-red-100 text-red-600"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {item.stockStatus === "out" ? "OUT OF STOCK" : "LOW STOCK"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUICK NAV ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {QUICK_LINKS.map((item) => (
            <Link key={item.path} to={item.path}
              className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center text-xl mb-3 shadow-md`}>
                {item.emoji}
              </div>
              <div className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COL ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Bills */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Recent Bills</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest payment transactions</p>
              </div>
              <Link to="/admin/bills" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-300">
                <div className="text-4xl mb-3 opacity-30">🧾</div>
                <div className="text-sm font-medium text-slate-400">No bills generated yet</div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-50">
                  {bills.map((bill) => (
                    <div key={bill._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 group-hover:bg-slate-200 transition-colors">
                        {METHOD_ICONS[bill.paymentMethod] || "💰"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">Table {bill.tableNumber}</span>
                          <span className="text-xs text-slate-400 font-mono">#{bill._id?.slice(-4).toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 capitalize">
                          {bill.paymentMethod} · {new Date(bill.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                          {bill.tipAmount > 0 && <span className="ml-1.5 text-amber-500 font-semibold">+Rs.{bill.tipAmount} tip</span>}
                          {bill.discountAmount > 0 && <span className="ml-1.5 text-pink-500 font-semibold">-Rs.{bill.discountAmount} off</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-800">Rs. {bill.totalAmount?.toLocaleString()}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block capitalize
                          ${bill.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                          {bill.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Showing {bills.length} recent bills</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    Total: Rs. {bills.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Live Table Status */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Live Table Status</h3>
                <p className="text-xs text-slate-400 mt-0.5">{availableTables} available · {occupiedTables} occupied · {reservedTables} reserved</p>
              </div>
              <Link to="/admin/tables" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Manage →
              </Link>
            </div>
            {tables.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No tables configured</div>
            ) : (
              <div className="p-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {tables
                  .sort((a, b) => String(a.tableNumber).localeCompare(String(b.tableNumber)))
                  .map((table) => (
                    <div key={table._id}
                      className={`rounded-xl p-2.5 text-center border-2 transition-all
                        ${table.status === "available" ? "bg-emerald-50 border-emerald-200"
                        : table.status === "occupied"  ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"}`}>
                      <div className={`text-sm font-black
                        ${table.status === "available" ? "text-emerald-700"
                        : table.status === "occupied"  ? "text-red-600"
                        : "text-amber-700"}`}>
                        {table.tableNumber}
                      </div>
                      <div className={`text-xs font-medium mt-0.5
                        ${table.status === "available" ? "text-emerald-500"
                        : table.status === "occupied"  ? "text-red-400"
                        : "text-amber-500"}`}>
                        {table.capacity}🪑
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Top Selling Items */}
          {topItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">Top Ordered Items</h3>
                  <p className="text-xs text-slate-400 mt-0.5">From active orders</p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">🍽</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-700 truncate">{item.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{item.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-800">{item.count}x ordered</div>
                      <div className="text-xs text-emerald-600 font-semibold">Rs. {item.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity (Audit Log) */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Recent Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest staff actions across the system</p>
              </div>
              <Link to="/admin/audit-log" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-40">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <div className="text-sm font-medium text-slate-400">No activity recorded yet</div>
                <div className="text-xs text-slate-300 mt-0.5">Actions will appear here as staff use the system</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {auditLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                    {/* role avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
                      ${log.actorRole === "admin"   ? "bg-purple-100 text-purple-700"
                      : log.actorRole === "cashier" ? "bg-blue-100   text-blue-700"
                      : log.actorRole === "kitchen" ? "bg-amber-100  text-amber-700"
                      : log.actorRole === "bar"     ? "bg-teal-100   text-teal-700"
                      :                               "bg-slate-100  text-slate-500"}`}>
                      {(log.actorName || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{log.actorName || "System"}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${log.action?.startsWith("USER")  ? "bg-blue-50   text-blue-600"
                          : log.action?.startsWith("MENU")  ? "bg-teal-50   text-teal-600"
                          : log.action?.startsWith("ORDER") ? "bg-amber-50  text-amber-600"
                          : log.action?.startsWith("BILL")  ? "bg-purple-50 text-purple-600"
                          : log.action?.startsWith("OFFER") ? "bg-pink-50   text-pink-600"
                          :                                   "bg-slate-50  text-slate-500"}`}>
                          {log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {log.targetModel && (
                          <span className="text-xs text-slate-400">{log.targetModel}</span>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span className="text-xs text-slate-400 truncate max-w-[180px]">
                            — {Object.entries(log.details).slice(0,1).map(([k,v]) => `${k}: ${v}`).join("")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0 tabular-nums whitespace-nowrap mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      <div className="text-slate-300 text-right">
                        {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-slate-50 px-5 py-3">
              <Link to="/admin/audit-log" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Open full audit log →
              </Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT COL ── */}
        <div className="space-y-4">

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Paid bills</span>
                  <span className="font-semibold text-emerald-600">{stats.paid}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: stats.bills > 0 ? `${(stats.paid / stats.bills) * 100}%` : "0%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Pending bills</span>
                  <span className="font-semibold text-amber-500">{stats.unpaid}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: stats.bills > 0 ? `${(stats.unpaid / stats.bills) * 100}%` : "0%" }} />
                </div>
              </div>
              {stats.tips > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Total tips</span>
                    <span className="font-semibold text-amber-600">Rs. {stats.tips.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: stats.revenue > 0 ? `${Math.min((stats.tips / stats.revenue) * 100, 100)}%` : "0%" }} />
                  </div>
                </div>
              )}
              {stats.discounts > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Total discounts given</span>
                    <span className="font-semibold text-pink-600">Rs. {stats.discounts.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400 rounded-full transition-all duration-500"
                      style={{ width: stats.revenue > 0 ? `${Math.min((stats.discounts / stats.revenue) * 100, 100)}%` : "0%" }} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total collected</span>
              <span className="text-sm font-bold text-slate-800">Rs. {stats.revenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {paymentBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Payment Methods</h3>
              <div className="space-y-3">
                {paymentBreakdown.map((p) => (
                  <div key={p.method} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${METHOD_COLORS[p.method] || "bg-slate-100 text-slate-600"}`}>
                      {METHOD_ICONS[p.method]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span className="font-semibold capitalize">{p.method}</span>
                        <span className="text-emerald-600 font-bold">Rs. {p.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full"
                          style={{ width: stats.revenue > 0 ? `${(p.amount / stats.revenue) * 100}%` : "0%" }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{p.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Offers Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-700">Active Offers</h3>
              <Link to="/admin/offers" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Manage →</Link>
            </div>
            {activeOffers.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-3xl mb-2">🏷️</div>
                <div className="text-sm text-slate-400">No active offers</div>
                <Link to="/admin/offers" className="text-xs text-emerald-600 font-semibold mt-1 inline-block hover:underline">
                  Create one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeOffers.slice(0, 4).map((offer) => (
                  <div key={offer._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-base shrink-0">
                      🏷️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{offer.title}</div>
                      <div className="text-xs text-slate-400 capitalize">{offer.scope} · {offer.type}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-pink-600">
                        {offer.type === "percentage" ? `${offer.value}% off` : `Rs.${offer.value} off`}
                      </span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        until {new Date(offer.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>
                ))}
                {activeOffers.length > 4 && (
                  <div className="px-5 py-2.5 text-center">
                    <Link to="/admin/offers" className="text-xs text-emerald-600 font-semibold hover:underline">
                      +{activeOffers.length - 4} more offers →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Satisfaction */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Customer Satisfaction</h3>
                <p className="text-xs text-slate-400 mt-0.5">Based on submitted feedback</p>
              </div>
              <Link to="/admin/feedback" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View All Feedback →
              </Link>
            </div>
            <div className="px-5 py-4">
              {!fbStats || fbStats.totalCount === 0 ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="text-xs text-slate-400">No feedback received yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-black tabular-nums ${
                      fbStats.overallAvg >= 4 ? "text-emerald-600" :
                      fbStats.overallAvg >= 3 ? "text-amber-600" : "text-red-500"
                    }`}>
                      {fbStats.overallAvg}
                    </div>
                    <div>
                      <div className="flex gap-0.5 mb-0.5">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} width="13" height="13" viewBox="0 0 24 24">
                            <path
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                              fill={s <= Math.round(fbStats.overallAvg) ? "#f59e0b" : "#e5e7eb"}
                              stroke={s <= Math.round(fbStats.overallAvg) ? "#f59e0b" : "#d1d5db"}
                              strokeWidth="0.5"
                            />
                          </svg>
                        ))}
                      </div>
                      <div className="text-xs text-slate-400">{fbStats.totalCount} review{fbStats.totalCount !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  {fbStats.trendDirection && (
                    <div className={`text-xs font-semibold flex items-center gap-1 ${
                      fbStats.trendDirection === "up"   ? "text-emerald-600" :
                      fbStats.trendDirection === "down" ? "text-red-500" : "text-slate-400"
                    }`}>
                      {fbStats.trendDirection === "up"   && "↑"}
                      {fbStats.trendDirection === "down" && "↓"}
                      {fbStats.trendDirection === "stable" && "→"}
                      {fbStats.trendDirection === "up"   && `${fbStats.trendDiff} from last week`}
                      {fbStats.trendDirection === "down" && `${fbStats.trendDiff} from last week`}
                      {fbStats.trendDirection === "stable" && "Same as last week"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-700">Menu Snapshot</h3>
              <Link to="/admin/menu" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Manage →</Link>
            </div>
            {menu.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No items yet</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {menu.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">🍽</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{item.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{item.category}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-emerald-600">Rs.{item.price}</span>
                      <div className={`text-xs mt-0.5 ${item.isVeg ? "text-emerald-500" : "text-red-400"}`}>
                        {item.isVeg ? "Veg" : "Non"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">System Status</h3>
            <div className="space-y-3">
              {[
                { label: "Backend API",   status: "Online", ok: true },
                { label: "Database",      status: "Online", ok: true },
                { label: "Socket Server", status: "Online", ok: true },
                { label: "Cloudinary",    status: "Active", ok: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <span className={`text-xs font-semibold ${s.ok ? "text-emerald-400" : "text-red-400"}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Stock alert toasts — socket room join handled inside */}
    <StockAlertToast />
    </>
  )
}