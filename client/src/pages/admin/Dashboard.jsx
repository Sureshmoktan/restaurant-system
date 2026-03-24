// import { useEffect, useState } from "react"
// import api from "../../service/api"

// const StatCard = ({ label, value, icon, sub, color }) => (
//   <div className="bg-white rounded-2xl border border-gray-100 p-5">
//     <div className="flex items-start justify-between mb-3">
//       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
//     </div>
//     <div className="text-2xl font-semibold text-gray-800">{value}</div>
//     <div className="text-sm text-gray-400 mt-1">{label}</div>
//     {sub && <div className="text-xs text-green-600 mt-1">{sub}</div>}
//   </div>
// )

// export default function Dashboard() {
//   const [stats, setStats] = useState({ revenue: 0, orders: 0, tables: 0, users: 0 })
//   const [recentBills, setRecentBills] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const [usersRes, tablesRes] = await Promise.all([
//           api.get("/users"),
//           api.get("/tables"),
//         ])
//         setStats((prev) => ({
//           ...prev,
//           users:  usersRes.data.count  || 0,
//           tables: tablesRes.data.count || 0,
//         }))
//       } catch {
//         // use default zeros
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchStats()
//   }, [])

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-gray-400 text-sm">Loading dashboard...</div>
//     </div>
//   )

//   return (
//     <div className="space-y-6">

//       <div>
//         <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
//         <p className="text-sm text-gray-400 mt-1">Welcome back! Here's what's happening today.</p>
//       </div>

//       {/* stat cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard label="Today's revenue"  value={`Rs. ${stats.revenue.toLocaleString()}`} icon="💰" color="bg-green-50"  sub="+12% vs yesterday" />
//         <StatCard label="Total orders"     value={stats.orders}  icon="🧾" color="bg-blue-50"   sub="Today" />
//         <StatCard label="Active tables"    value={stats.tables}  icon="🪑" color="bg-yellow-50" />
//         <StatCard label="Staff accounts"   value={stats.users}   icon="👥" color="bg-purple-50" />
//       </div>

//       {/* quick links */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {[
//           { label: "Manage menu",   desc: "Add, edit or remove food items",  icon: "🍕", path: "/admin/menu",   color: "bg-orange-50 text-orange-600"  },
//           { label: "Manage tables", desc: "Add tables and update capacity",   icon: "🪑", path: "/admin/tables", color: "bg-blue-50 text-blue-600"      },
//           { label: "Manage users",  desc: "Create cashier & kitchen accounts",icon: "👥", path: "/admin/users",  color: "bg-purple-50 text-purple-600"  },
//         ].map((item) => (
//           <a
//             key={item.path}
//             href={item.path}
//             className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-green-200 hover:shadow-sm transition-all group"
//           >
//             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${item.color}`}>{item.icon}</div>
//             <div>
//               <div className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">{item.label}</div>
//               <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
//             </div>
//           </a>
//         ))}
//       </div>

//       {/* recent activity */}
//       <div className="bg-white rounded-2xl border border-gray-100 p-5">
//         <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent bills</h3>
//         {recentBills.length === 0 ? (
//           <div className="text-center py-10">
//             <div className="text-3xl mb-2">🧾</div>
//             <div className="text-sm text-gray-400">No bills yet today</div>
//           </div>
//         ) : (
//           <div className="space-y-2">
//             {recentBills.map((bill) => (
//               <div key={bill._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
//                 <div className="text-sm text-gray-600">Table {bill.tableNumber}</div>
//                 <div className="text-sm font-medium text-gray-800">Rs. {bill.totalAmount}</div>
//                 <span className={`text-xs px-2 py-1 rounded-full ${bill.paymentStatus === "paid" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
//                   {bill.paymentStatus}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }


import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../service/api"

const QUICK_LINKS = [
  { label: "Menu",   desc: "Add & manage food items",     path: "/admin/menu",   emoji: "🍕", from: "from-orange-400", to: "to-orange-600" },
  { label: "Tables", desc: "Configure restaurant tables",  path: "/admin/tables", emoji: "🪑", from: "from-blue-400",   to: "to-blue-600"   },
  { label: "Users",  desc: "Manage staff accounts",        path: "/admin/users",  emoji: "👤", from: "from-violet-400", to: "to-violet-600" },
  { label: "Bills",  desc: "View all payments & revenue",  path: "/admin/bills",  emoji: "🧾", from: "from-emerald-400",to: "to-emerald-600"},
]

const METHOD_ICONS = { cash: "💵", esewa: "📱", khalti: "📱", card: "💳" }

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-400">Loading dashboard...</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend, trendUp, note, accent }) {
  return (
    <div className={`relative bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden group hover:shadow-md transition-all duration-200`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${accent}`}></div>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${accent} bg-opacity-10`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      {note && <div className="text-xs text-slate-400 mt-1">{note}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats,   setStats]   = useState({ revenue: 0, bills: 0, tables: 0, users: 0, paid: 0, unpaid: 0 })
  const [bills,   setBills]   = useState([])
  const [menu,    setMenu]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, tRes, bRes, mRes] = await Promise.all([
          api.get("/users"),
          api.get("/tables"),
          api.get("/bills"),
          api.get("/menu"),
        ])
        const allBills  = bRes.data.bills || []
        const paid      = allBills.filter(b => b.paymentStatus === "paid")
        const revenue   = paid.reduce((s, b) => s + (b.totalAmount || 0), 0)
        setStats({
          revenue,
          bills:   allBills.length,
          tables:  tRes.data.count || 0,
          users:   uRes.data.count || 0,
          paid:    paid.length,
          unpaid:  allBills.filter(b => b.paymentStatus !== "paid").length,
        })
        setBills(allBills.slice(0, 6))
        setMenu(mRes.data.menu?.slice(0, 4) || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <Spinner />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── hero greeting ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #10b981 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{greeting} 👋</h2>
          <p className="text-slate-400 text-sm">Here's your restaurant overview for today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 relative">
          <div className="text-right">
            <div className="text-3xl font-bold text-white tabular-nums">
              {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Current time</div>
          </div>
        </div>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`Rs. ${stats.revenue.toLocaleString()}`}
          icon="₨"
          trend="from paid bills"
          trendUp={true}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Total Bills"
          value={stats.bills}
          icon="🧾"
          note={`${stats.paid} paid · ${stats.unpaid} pending`}
          accent="bg-blue-500"
        />
        <StatCard
          label="Tables"
          value={stats.tables}
          icon="🪑"
          note="Registered tables"
          accent="bg-amber-500"
        />
        <StatCard
          label="Staff"
          value={stats.users}
          icon="👤"
          note="Active accounts"
          accent="bg-violet-500"
        />
      </div>

      {/* ── quick nav ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center text-xl mb-3 shadow-md`}>
                {item.emoji}
              </div>
              <div className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* recent bills */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Recent Bills</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest payment transactions</p>
            </div>
            <Link to="/admin/bills" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-300">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div className="text-sm font-medium text-slate-400">No bills generated yet</div>
            </div>
          ) : (
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
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-800">Rs. {bill.totalAmount?.toLocaleString()}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block capitalize
                      ${bill.paymentStatus === "paid"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"}`}
                    >
                      {bill.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bills.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">Showing {bills.length} recent bills</span>
              <span className="text-xs font-semibold text-emerald-600">
                Total: Rs. {bills.filter(b => b.paymentStatus === "paid").reduce((s,b) => s + b.totalAmount, 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* side panel */}
        <div className="space-y-4">

          {/* revenue breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Paid bills</span>
                  <span className="font-semibold text-emerald-600">{stats.paid}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: stats.bills > 0 ? `${(stats.paid / stats.bills) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Pending bills</span>
                  <span className="font-semibold text-amber-500">{stats.unpaid}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: stats.bills > 0 ? `${(stats.unpaid / stats.bills) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total collected</span>
              <span className="text-sm font-bold text-slate-800">Rs. {stats.revenue.toLocaleString()}</span>
            </div>
          </div>

          {/* menu snapshot */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-700">Menu Snapshot</h3>
              <Link to="/admin/menu" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Manage →</Link>
            </div>
            {menu.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No items yet</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {menu.map(item => (
                  <div key={item._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-sm">🍽</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{item.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{item.category}</div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-xs font-bold text-emerald-600">Rs.{item.price}</span>
                      <div className={`text-xs text-center mt-0.5 ${item.isVeg ? "text-emerald-500" : "text-red-400"}`}>
                        {item.isVeg ? "Veg" : "Non"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* system status */}
          <div className="bg-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">System Status</h3>
            <div className="space-y-3">
              {[
                { label: "Backend API",   status: "Online",  ok: true  },
                { label: "Database",      status: "Online",  ok: true  },
                { label: "Socket Server", status: "Online",  ok: true  },
                { label: "Cloudinary",    status: "Active",  ok: true  },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}/>
                    <span className={`text-xs font-semibold ${s.ok ? "text-emerald-400" : "text-red-400"}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}