// import { useEffect, useState } from "react"
// import api from "../../service/api"
// import { fetchCashouts } from "../../service/CashoutService"

// // ─── Constants ────────────────────────────────────────────────────────────────

// const STATUS_STYLES = {
//   paid:   { badge: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
//   unpaid: { badge: "bg-amber-50  text-amber-600  border-amber-200",     dot: "bg-amber-500"  },
// }

// const METHOD_ICONS  = { cash: "💵", esewa: "📱", khalti: "📱", card: "💳" }
// const METHOD_COLORS = { cash: "text-green-600", esewa: "text-blue-600", khalti: "text-purple-600", card: "text-orange-600" }

// const CASHOUT_ICONS = {
//   groceries: "🛒", supplies: "🧴", utilities: "💡", repairs: "🔧", other: "📦",
// }
// const CASHOUT_COLORS = {
//   groceries: "bg-orange-50 text-orange-600 border-orange-200",
//   supplies:  "bg-blue-50   text-blue-600   border-blue-200",
//   utilities: "bg-yellow-50 text-yellow-600 border-yellow-200",
//   repairs:   "bg-red-50    text-red-600    border-red-200",
//   other:     "bg-zinc-50   text-zinc-600   border-zinc-200",
// }

// // ─── Bill Detail Modal ────────────────────────────────────────────────────────

// function BillDetailModal({ selected, loadingDetail, onClose }) {
//   if (!selected) return null
//   return (
//     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-100 overflow-hidden max-h-[90vh] flex flex-col">

//         <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">🧾</div>
//             <div>
//               <h3 className="text-sm font-bold text-zinc-800">Bill Details</h3>
//               <div className="text-xs text-zinc-400 font-mono">#{selected._id?.slice(-6).toUpperCase()}</div>
//             </div>
//           </div>
//           <button onClick={onClose} className="w-8 h-8 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-lg transition-all">×</button>
//         </div>

//         <div className="overflow-y-auto flex-1 p-6 space-y-4">
//           {loadingDetail ? (
//             <div className="flex items-center justify-center py-8 gap-3">
//               <div className="w-6 h-6 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
//               <span className="text-sm text-zinc-400">Loading details...</span>
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-2 gap-3">
//                 {[
//                   { label: "Table",   value: selected.tableNumber },
//                   { label: "Payment", value: `${METHOD_ICONS[selected.paymentMethod] || ""} ${selected.paymentMethod}`, cls: `capitalize font-bold ${METHOD_COLORS[selected.paymentMethod]}` },
//                   { label: "Date",    value: new Date(selected.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
//                   { label: "Status",  value: selected.paymentStatus, isBadge: true },
//                 ].map((r) => (
//                   <div key={r.label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
//                     <div className="text-xs text-zinc-400 font-medium mb-1">{r.label}</div>
//                     {r.isBadge ? (
//                       <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLES[selected.paymentStatus]?.badge}`}>
//                         <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.paymentStatus]?.dot}`} />
//                         {selected.paymentStatus}
//                       </span>
//                     ) : (
//                       <div className={`text-sm font-bold text-zinc-800 ${r.cls || ""}`}>{r.value}</div>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               {selected.orders?.length > 0 && (
//                 <div className="border border-zinc-200 rounded-xl overflow-hidden">
//                   <div className="bg-zinc-50 px-4 py-2.5 flex items-center justify-between border-b border-zinc-100">
//                     <span className="text-xs font-bold text-zinc-600">Order Items</span>
//                     <span className="text-xs text-zinc-400">{selected.orders.length} order{selected.orders.length > 1 ? "s" : ""}</span>
//                   </div>
//                   <div className="divide-y divide-zinc-50">
//                     {selected.orders.map((order, oi) => (
//                       <div key={order._id || oi} className="px-4 py-3">
//                         <div className="text-xs font-bold text-zinc-400 mb-2">
//                           Order #{(order._id || "").slice(-4).toUpperCase()}
//                         </div>
//                         {order.items?.map((item, i) => (
//                           <div key={`${order._id}-${i}`} className="flex items-center justify-between py-1.5">
//                             <div>
//                               <span className="text-sm font-semibold text-zinc-800">{item.quantity}× {item.name}</span>
//                               {item.selectedOptions?.map((opt, oi2) => (
//                                 <div key={`${order._id}-opt-${oi2}`} className="text-xs text-blue-500 mt-0.5">
//                                   {opt.groupName}: {opt.selected?.join(", ")}
//                                 </div>
//                               ))}
//                               {item.removedIngredients?.length > 0 && (
//                                 <div className="text-xs text-red-400 mt-0.5">No: {item.removedIngredients.join(", ")}</div>
//                               )}
//                             </div>
//                             <span className="text-sm font-bold text-zinc-700 ml-4">Rs. {(item.price * item.quantity).toLocaleString()}</span>
//                           </div>
//                         ))}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div className="border border-zinc-200 rounded-xl overflow-hidden">
//                 <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-100">
//                   <span className="text-xs font-bold text-zinc-600">Bill Breakdown</span>
//                 </div>
//                 <div className="p-4 space-y-2.5">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-zinc-500">Subtotal</span>
//                     <span className="font-semibold text-zinc-700">Rs. {selected.subtotal?.toLocaleString()}</span>
//                   </div>
//                   {selected.discountAmount > 0 && (
//                     <div className="flex justify-between text-sm">
//                       <span className="text-emerald-600 font-medium">🏷️ Discount</span>
//                       <span className="font-bold text-emerald-600">− Rs. {selected.discountAmount?.toLocaleString()}</span>
//                     </div>
//                   )}
//                   <div className="flex justify-between text-sm">
//                     <span className="text-zinc-500">VAT ({selected.vatPercent}%)</span>
//                     <span className="font-semibold text-zinc-700">Rs. {selected.vatAmount?.toLocaleString()}</span>
//                   </div>
//                   {selected.tipAmount > 0 && (
//                     <div className="flex justify-between text-sm">
//                       <span className="text-amber-600 font-medium">🙏 Tip</span>
//                       <span className="font-bold text-amber-600">Rs. {selected.tipAmount?.toLocaleString()}</span>
//                     </div>
//                   )}
//                   <div className="flex justify-between text-base font-black border-t border-zinc-100 pt-2.5">
//                     <span className="text-zinc-800">Total</span>
//                     <span className="text-emerald-600">Rs. {selected.totalAmount?.toLocaleString()}</span>
//                   </div>
//                 </div>
//               </div>

//               {(selected.generatedBy || selected.paidAt) && (
//                 <div className="text-xs text-zinc-400 text-center space-y-0.5">
//                   {selected.generatedBy && <div>Generated by <span className="font-semibold text-zinc-600">{selected.generatedBy?.name || "Cashier"}</span></div>}
//                   {selected.paidAt && <div>Paid at <span className="font-semibold text-zinc-600">{new Date(selected.paidAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span></div>}
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         <div className="px-6 pb-6 flex-shrink-0">
//           <button onClick={onClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all">
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────

// export default function BillsPage() {
//   const [bills,         setBills]         = useState([])
//   const [cashouts,      setCashouts]      = useState([])
//   const [cashoutTotal,  setCashoutTotal]  = useState(0)
//   const [loading,       setLoading]       = useState(true)
//   const [cashoutLoading,setCashoutLoading]= useState(true)
//   const [filter,        setFilter]        = useState("all")
//   const [search,        setSearch]        = useState("")
//   const [selected,      setSelected]      = useState(null)
//   const [loadingDetail, setLoadingDetail] = useState(false)

//   const loadBills = async () => {
//     try {
//       setLoading(true)
//       const res = await api.get("/bills")
//       setBills(res.data.bills || [])
//     } catch {}
//     finally { setLoading(false) }
//   }

//   const loadCashouts = async () => {
//     try {
//       setCashoutLoading(true)
//       const res = await fetchCashouts()
//       setCashouts(res.cashouts || [])
//       setCashoutTotal(res.total || 0)
//     } catch {}
//     finally { setCashoutLoading(false) }
//   }

//   useEffect(() => { loadBills(); loadCashouts() }, [])

//   const openDetail = async (bill) => {
//     setLoadingDetail(true)
//     setSelected(bill)
//     try {
//       const res = await api.get(`/bills/table/${bill.tableNumber}`)
//       setSelected(res.data.bill || bill)
//     } catch {
//       setSelected(bill)
//     } finally {
//       setLoadingDetail(false)
//     }
//   }

//   const filtered = bills.filter((b) => {
//     const matchFilter = filter === "all" || b.paymentStatus === filter
//     const matchSearch = search === "" ||
//       b._id?.toLowerCase().includes(search.toLowerCase()) ||
//       String(b.tableNumber).toLowerCase().includes(search.toLowerCase()) ||
//       b.paymentMethod?.toLowerCase().includes(search.toLowerCase())
//     return matchFilter && matchSearch
//   })

//   // ── Derived stats ──────────────────────────────────────────────────────────
//   const paidBills    = bills.filter((b) => b.paymentStatus === "paid")
//   const totalRevenue = paidBills.reduce((s, b) => s + (b.totalAmount || 0), 0)
//   const totalTips    = paidBills.reduce((s, b) => s + (b.tipAmount   || 0), 0)
//   const netProfit    = totalRevenue - cashoutTotal

//   return (
//     <div className="space-y-6">

//       {/* ── HEADER ── */}
//       <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-md shadow-green-200">
//               🧾
//             </div>
//             <div>
//               <h1 className="text-xl font-black text-zinc-900 tracking-tight">Bills & Cashouts</h1>
//               <p className="text-sm text-zinc-400 mt-0.5">Today's revenue vs expenses at a glance</p>
//             </div>
//           </div>
//           <button
//             onClick={() => { loadBills(); loadCashouts() }}
//             className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-500 hover:border-zinc-400 transition-all"
//           >
//             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//               <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
//               <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
//             </svg>
//             Refresh
//           </button>
//         </div>

//         {/* ── Summary stats ── */}
//         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//           {[
//             {
//               label: "Total Revenue",
//               value: `Rs. ${totalRevenue.toLocaleString()}`,
//               color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", pct: 100,
//             },
//             {
//               label: "Total Tips",
//               value: `Rs. ${totalTips.toLocaleString()}`,
//               color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500",
//               pct: totalRevenue ? (totalTips / totalRevenue) * 100 : 0,
//             },
//             {
//               label: "Total Cashouts",
//               value: `Rs. ${cashoutTotal.toLocaleString()}`,
//               color: "text-red-500", bg: "bg-red-50", bar: "bg-red-500",
//               pct: totalRevenue ? Math.min((cashoutTotal / totalRevenue) * 100, 100) : 0,
//             },
//             {
//               label: "Net Profit",
//               value: `Rs. ${netProfit.toLocaleString()}`,
//               color: netProfit >= 0 ? "text-blue-600" : "text-red-600",
//               bg:    netProfit >= 0 ? "bg-blue-50"    : "bg-red-50",
//               bar:   netProfit >= 0 ? "bg-blue-500"   : "bg-red-500",
//               pct:   totalRevenue ? Math.max(0, Math.min((netProfit / totalRevenue) * 100, 100)) : 0,
//             },
//           ].map((s) => (
//             <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
//               <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
//               <div className={`text-xs font-bold ${s.color} mt-1 mb-2`}>{s.label}</div>
//               <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
//                 <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(s.pct, 100)}%` }} />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── SIDE BY SIDE: BILLS | CASHOUTS ── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//         {/* ── LEFT: BILLS ── */}
//         <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm flex flex-col">
//           <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
//             <div className="flex items-center gap-2">
//               <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">🧾</div>
//               <span className="text-sm font-bold text-zinc-800">Bills</span>
//               <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-semibold">{bills.length}</span>
//             </div>
//             <div className="flex gap-1.5">
//               {["all", "paid", "unpaid"].map((f) => (
//                 <button
//                   key={`filter-${f}`}
//                   onClick={() => setFilter(f)}
//                   className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
//                     ${filter === f ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
//                 >
//                   {f}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* search */}
//           <div className="px-5 py-3 border-b border-zinc-50">
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search bill ID, table, method..."
//               className="w-full text-sm px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder:text-zinc-300"
//             />
//           </div>

//           <div className="flex-1 overflow-y-auto max-h-[520px]">
//             {loading ? (
//               <div className="flex flex-col items-center justify-center py-16 gap-3">
//                 <div className="w-7 h-7 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
//                 <span className="text-sm text-zinc-400">Loading bills...</span>
//               </div>
//             ) : filtered.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16 gap-3">
//                 <div className="text-4xl opacity-20">🧾</div>
//                 <div className="text-sm font-semibold text-zinc-400">No bills found</div>
//               </div>
//             ) : (
//               <div className="divide-y divide-zinc-50">
//                 {filtered.map((bill) => {
//                   const s = STATUS_STYLES[bill.paymentStatus] || STATUS_STYLES.unpaid
//                   return (
//                     <div
//                       key={bill._id}
//                       className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
//                     >
//                       {/* left */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 mb-1">
//                           <span className="font-mono text-xs font-bold text-zinc-400">
//                             #{bill._id?.slice(-6).toUpperCase()}
//                           </span>
//                           <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border ${s.badge}`}>
//                             <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
//                             {bill.paymentStatus}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2 text-xs text-zinc-500">
//                           <span className="font-bold text-zinc-700">Table {bill.tableNumber}</span>
//                           <span>·</span>
//                           <span className={`flex items-center gap-1 font-semibold ${METHOD_COLORS[bill.paymentMethod]}`}>
//                             {METHOD_ICONS[bill.paymentMethod]} {bill.paymentMethod}
//                           </span>
//                           <span>·</span>
//                           <span>{new Date(bill.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>
//                         </div>
//                       </div>

//                       {/* right */}
//                       <div className="text-right shrink-0">
//                         <div className="text-sm font-black text-zinc-800">Rs. {bill.totalAmount?.toLocaleString()}</div>
//                         {bill.tipAmount > 0 && (
//                           <div className="text-xs text-amber-500 font-semibold">+Rs. {bill.tipAmount} tip</div>
//                         )}
//                       </div>

//                       <button
//                         onClick={() => openDetail(bill)}
//                         className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
//                       >
//                         →
//                       </button>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>

//           {/* bills footer */}
//           {filtered.length > 0 && (
//             <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-400">
//               <span><span className="font-bold text-zinc-600">{filtered.length}</span> of {bills.length} bills</span>
//               <span>Shown: <span className="font-bold text-emerald-600">
//                 Rs. {filtered.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()}
//               </span></span>
//             </div>
//           )}
//         </div>

//         {/* ── RIGHT: CASHOUTS ── */}
//         <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm flex flex-col">
//           <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
//             <div className="flex items-center gap-2">
//               <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-sm">💸</div>
//               <span className="text-sm font-bold text-zinc-800">Cashouts</span>
//               <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-semibold">{cashouts.length}</span>
//             </div>
//             <div className="text-sm font-black text-red-600">
//               − Rs. {cashoutTotal.toLocaleString()}
//             </div>
//           </div>

//           <div className="flex-1 overflow-y-auto max-h-[560px]">
//             {cashoutLoading ? (
//               <div className="flex flex-col items-center justify-center py-16 gap-3">
//                 <div className="w-7 h-7 border-2 border-zinc-200 border-t-red-400 rounded-full animate-spin" />
//                 <span className="text-sm text-zinc-400">Loading cashouts...</span>
//               </div>
//             ) : cashouts.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16 gap-3">
//                 <div className="text-4xl opacity-20">💸</div>
//                 <div className="text-sm font-semibold text-zinc-400">No cashouts today</div>
//               </div>
//             ) : (
//               <div className="divide-y divide-zinc-50">
//                 {cashouts.map((c, idx) => {
//                   const colorClass = CASHOUT_COLORS[c.category] || CASHOUT_COLORS.other
//                   const icon       = CASHOUT_ICONS[c.category]  || "📦"
//                   return (
//                     <div key={c._id ?? `cashout-${idx}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
//                       {/* icon */}
//                       <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-base shrink-0">
//                         {icon}
//                       </div>

//                       {/* info */}
//                       <div className="flex-1 min-w-0">
//                         <div className="text-sm font-semibold text-zinc-800 truncate">{c.description}</div>
//                         <div className="flex items-center gap-2 mt-0.5">
//                           <span className={`text-xs px-2 py-0.5 rounded-full font-bold border capitalize ${colorClass}`}>
//                             {c.category}
//                           </span>
//                           <span className="text-xs text-zinc-400">
//                             {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                           </span>
//                         </div>
//                       </div>

//                       {/* amount */}
//                       <div className="text-sm font-black text-red-600 shrink-0">
//                         − Rs. {c.amount.toLocaleString()}
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>

//           {/* cashouts footer */}
//           {cashouts.length > 0 && (
//             <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-400">
//               <span><span className="font-bold text-zinc-600">{cashouts.length}</span> cashout{cashouts.length > 1 ? "s" : ""} today</span>
//               <span>Total: <span className="font-bold text-red-500">− Rs. {cashoutTotal.toLocaleString()}</span></span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── BILL DETAIL MODAL ── */}
//       <BillDetailModal
//         selected={selected}
//         loadingDetail={loadingDetail}
//         onClose={() => setSelected(null)}
//       />
//     </div>
//   )
// }



import { useEffect, useState, useCallback } from "react"
import api from "../../service/api"
import { fetchCashouts } from "../../service/CashoutService"

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  paid:   { badge: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  unpaid: { badge: "bg-amber-50  text-amber-600  border-amber-200",     dot: "bg-amber-500"  },
}
const METHOD_ICONS  = { cash: "💵", esewa: "📱", khalti: "📱", card: "💳" }
const METHOD_COLORS = { cash: "text-green-600", esewa: "text-blue-600", khalti: "text-purple-600", card: "text-orange-600" }
const CASHOUT_ICONS  = { groceries: "🛒", supplies: "🧴", utilities: "💡", repairs: "🔧", other: "📦" }
const CASHOUT_COLORS = {
  groceries: "bg-orange-50 text-orange-600 border-orange-200",
  supplies:  "bg-blue-50   text-blue-600   border-blue-200",
  utilities: "bg-yellow-50 text-yellow-600 border-yellow-200",
  repairs:   "bg-red-50    text-red-600    border-red-200",
  other:     "bg-zinc-50   text-zinc-600   border-zinc-200",
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const toDateInput = (d) => d.toISOString().slice(0, 10)

const PRESETS = [
  { label: "Today",
    getValue: () => { const d = new Date(); const s = toDateInput(d); return { start: s, end: s } } },
  { label: "Yesterday",
    getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); const s = toDateInput(d); return { start: s, end: s } } },
  { label: "This Week",
    getValue: () => { const d = new Date(); const start = new Date(d); start.setDate(d.getDate() - d.getDay()); return { start: toDateInput(start), end: toDateInput(d) } } },
  { label: "Last Week",
    getValue: () => { const d = new Date(); const end = new Date(d); end.setDate(d.getDate() - d.getDay() - 1); const start = new Date(end); start.setDate(end.getDate() - 6); return { start: toDateInput(start), end: toDateInput(end) } } },
  { label: "This Month",
    getValue: () => { const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth(), 1); return { start: toDateInput(start), end: toDateInput(d) } } },
  { label: "Last Month",
    getValue: () => { const d = new Date(); const start = new Date(d.getFullYear(), d.getMonth() - 1, 1); const end = new Date(d.getFullYear(), d.getMonth(), 0); return { start: toDateInput(start), end: toDateInput(end) } } },
  { label: "All Time",
    getValue: () => ({ start: "", end: "" }) },
]

// ─── Bill Detail Modal ────────────────────────────────────────────────────────

function BillDetailModal({ selected, loadingDetail, onClose }) {
  if (!selected) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">🧾</div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800">Bill Details</h3>
              <div className="text-xs text-zinc-400 font-mono">#{selected._id?.slice(-6).toUpperCase()}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-lg transition-all">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm text-zinc-400">Loading details...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Table",   value: selected.tableNumber },
                  { label: "Payment", value: `${METHOD_ICONS[selected.paymentMethod] || ""} ${selected.paymentMethod}`, cls: `capitalize font-bold ${METHOD_COLORS[selected.paymentMethod]}` },
                  { label: "Date",    value: new Date(selected.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
                  { label: "Status",  value: selected.paymentStatus, isBadge: true },
                ].map((r) => (
                  <div key={r.label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                    <div className="text-xs text-zinc-400 font-medium mb-1">{r.label}</div>
                    {r.isBadge ? (
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-bold border ${STATUS_STYLES[selected.paymentStatus]?.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.paymentStatus]?.dot}`} />
                        {selected.paymentStatus}
                      </span>
                    ) : (
                      <div className={`text-sm font-bold text-zinc-800 ${r.cls || ""}`}>{r.value}</div>
                    )}
                  </div>
                ))}
              </div>

              {selected.orders?.length > 0 && (
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="bg-zinc-50 px-4 py-2.5 flex items-center justify-between border-b border-zinc-100">
                    <span className="text-xs font-bold text-zinc-600">Order Items</span>
                    <span className="text-xs text-zinc-400">{selected.orders.length} order{selected.orders.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-zinc-50">
                    {selected.orders.map((order, oi) => (
                      <div key={order._id || oi} className="px-4 py-3">
                        <div className="text-xs font-bold text-zinc-400 mb-2">Order #{(order._id || "").slice(-4).toUpperCase()}</div>
                        {order.items?.map((item, i) => (
                          <div key={`${order._id}-${i}`} className="flex items-center justify-between py-1.5">
                            <div>
                              <span className="text-sm font-semibold text-zinc-800">{item.quantity}× {item.name}</span>
                              {item.selectedOptions?.map((opt, oi2) => (
                                <div key={`${order._id}-opt-${oi2}`} className="text-xs text-blue-500 mt-0.5">{opt.groupName}: {opt.selected?.join(", ")}</div>
                              ))}
                              {item.removedIngredients?.length > 0 && (
                                <div className="text-xs text-red-400 mt-0.5">No: {item.removedIngredients.join(", ")}</div>
                              )}
                            </div>
                            <span className="text-sm font-bold text-zinc-700 ml-4">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-600">Bill Breakdown</span>
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="font-semibold text-zinc-700">Rs. {selected.subtotal?.toLocaleString()}</span></div>
                  {selected.discountAmount > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-emerald-600 font-medium">🏷️ Offer Discount</span><span className="font-bold text-emerald-600">− Rs. {selected.discountAmount?.toLocaleString()}</span></div>
                  )}
                  {selected.discountGamePlayed && selected.discountGameAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-violet-600 font-medium">
                        🎲 Game Discount ({selected.discountGameResult === 100 ? "FREE!" : `${selected.discountGameResult}%`})
                      </span>
                      <span className="font-bold text-violet-600">− Rs. {selected.discountGameAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  {selected.cashierDiscountAmount > 0 && (() => {
                    const REASON_LABELS = {
                      regular_customer: "Regular Customer", daily_visitor: "Daily Visitor",
                      special_occasion: "Special Occasion", birthday: "Birthday",
                      complaint_resolution: "Complaint Resolution", manager_approval: "Manager Approval",
                      other: "Other",
                    }
                    const rLabel = REASON_LABELS[selected.cashierDiscountReason] || selected.cashierDiscountReason
                    return (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600 font-medium">
                          🎟️ Cashier Discount ({selected.cashierDiscount}%{rLabel ? ` · ${rLabel}` : ""})
                        </span>
                        <span className="font-bold text-blue-600">− Rs. {selected.cashierDiscountAmount?.toLocaleString()}</span>
                      </div>
                    )
                  })()}
                  {(selected.discountAmount > 0 || selected.discountGameAmount > 0 || selected.cashierDiscountAmount > 0) && (
                    <div className="flex justify-between text-sm border-t border-zinc-100 pt-1.5">
                      <span className="text-zinc-500 font-medium">After Discounts</span>
                      <span className="font-semibold text-zinc-700">Rs. {selected.discountedSubtotal?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">VAT ({selected.vatPercent}%)</span><span className="font-semibold text-zinc-700">Rs. {selected.vatAmount?.toLocaleString()}</span></div>
                  {selected.tipAmount > 0 && (
                    <div className="flex justify-between text-sm"><span className="text-amber-600 font-medium">🙏 Tip</span><span className="font-bold text-amber-600">Rs. {selected.tipAmount?.toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between text-base font-black border-t border-zinc-100 pt-2.5">
                    <span className="text-zinc-800">Total</span>
                    <span className="text-emerald-600">Rs. {selected.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Cashier discount attribution */}
              {selected.cashierDiscountAmount > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                  <div className="text-xs font-bold text-blue-700">Cashier Discount Info</div>
                  <div className="text-xs text-blue-600">
                    Given by: <span className="font-semibold">{selected.cashierDiscountBy?.name || "Cashier"}</span>
                  </div>
                  {selected.cashierDiscountNote && (
                    <div className="text-xs text-blue-500">Note: "{selected.cashierDiscountNote}"</div>
                  )}
                </div>
              )}

              {(selected.generatedBy || selected.paidAt) && (
                <div className="text-xs text-zinc-400 text-center space-y-0.5">
                  {selected.generatedBy && <div>Generated by <span className="font-semibold text-zinc-600">{selected.generatedBy?.name || "Cashier"}</span></div>}
                  {selected.paidAt && <div>Paid at <span className="font-semibold text-zinc-600">{new Date(selected.paidAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span></div>}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex-shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all">Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const todayStr = toDateInput(new Date())

  const [startDate,      setStartDate]      = useState(todayStr)
  const [endDate,        setEndDate]        = useState(todayStr)
  const [activePreset,   setActivePreset]   = useState("Today")
  const [allBills,            setAllBills]            = useState([])
  const [cashouts,            setCashouts]            = useState([])
  const [cashoutTotal,        setCashoutTotal]        = useState(0)
  const [loading,             setLoading]             = useState(true)
  const [cashoutLoading,      setCashoutLoading]      = useState(true)
  const [filter,              setFilter]              = useState("all")
  const [showCashierDiscOnly, setShowCashierDiscOnly] = useState(false)
  const [search,              setSearch]              = useState("")
  const [selected,            setSelected]            = useState(null)
  const [loadingDetail,       setLoadingDetail]       = useState(false)

  const loadBills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/bills")
      setAllBills(res.data.bills || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  const loadCashouts = useCallback(async () => {
    setCashoutLoading(true)
    try {
      const params = {}
      if (startDate) params.startDate = new Date(startDate + "T00:00:00").toISOString()
      if (endDate)   params.endDate   = new Date(endDate   + "T23:59:59").toISOString()
      const res = await fetchCashouts(params)
      setCashouts(res.cashouts || [])
      setCashoutTotal(res.total || 0)
    } catch {}
    finally { setCashoutLoading(false) }
  }, [startDate, endDate])

  useEffect(() => { loadBills() }, [loadBills])
  useEffect(() => { loadCashouts() }, [loadCashouts])

  const applyPreset = (preset) => {
    const { start, end } = preset.getValue()
    setStartDate(start)
    setEndDate(end)
    setActivePreset(preset.label)
  }

  // Filter bills by date range on the frontend
  const bills = allBills.filter((b) => {
    const d = new Date(b.createdAt)
    if (startDate && d < new Date(startDate + "T00:00:00")) return false
    if (endDate   && d > new Date(endDate   + "T23:59:59")) return false
    return true
  })

  const filtered = bills.filter((b) => {
    const matchFilter = filter === "all" || b.paymentStatus === filter
    const matchSearch = search === "" ||
      b._id?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.tableNumber).toLowerCase().includes(search.toLowerCase()) ||
      b.paymentMethod?.toLowerCase().includes(search.toLowerCase())
    const matchCashierDisc = !showCashierDiscOnly || (b.cashierDiscountAmount > 0)
    return matchFilter && matchSearch && matchCashierDisc
  })

  const paidBills    = bills.filter((b) => b.paymentStatus === "paid")
  const totalRevenue = paidBills.reduce((s, b) => s + (b.totalAmount || 0), 0)
  const totalTips    = paidBills.reduce((s, b) => s + (b.tipAmount   || 0), 0)
  const netProfit    = totalRevenue - cashoutTotal

  // Cashier discount stats
  const cashierDiscBills = bills.filter((b) => b.cashierDiscountAmount > 0)
  const totalCashierDisc = cashierDiscBills.reduce((s, b) => s + (b.cashierDiscountAmount || 0), 0)
  // Who gives the most cashier discounts
  const cashierDiscMap = {}
  cashierDiscBills.forEach((b) => {
    const name = b.cashierDiscountBy?.name || b.generatedBy?.name || "Unknown"
    cashierDiscMap[name] = (cashierDiscMap[name] || 0) + 1
  })
  const topCashierDisc = Object.entries(cashierDiscMap).sort((a, b) => b[1] - a[1])[0]

  const rangeLabel = activePreset === "All Time" ? "All Time"
    : startDate === endDate && startDate
      ? new Date(startDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
      : startDate && endDate
        ? `${new Date(startDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })} – ${new Date(endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
        : "Custom range"

  const openDetail = async (bill) => {
    setLoadingDetail(true)
    setSelected(bill)
    try {
      const res = await api.get(`/bills/table/${bill.tableNumber}`)
      setSelected(res.data.bill || bill)
    } catch { setSelected(bill) }
    finally { setLoadingDetail(false) }
  }

  return (
    <div className="space-y-6">

      {/* ── HEADER + DATE CONTROLS ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-md shadow-green-200">🧾</div>
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">Bills & Cashouts</h1>
              <p className="text-sm text-zinc-400 mt-0.5">{rangeLabel}</p>
            </div>
          </div>
          <button
            onClick={() => { loadBills(); loadCashouts() }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-500 hover:border-zinc-400 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                activePreset === p.label
                  ? "bg-zinc-800 text-white border-zinc-800"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold text-zinc-400 whitespace-nowrap">From</label>
            <input
              type="date"
              value={startDate}
              max={endDate || todayStr}
              onChange={(e) => { setStartDate(e.target.value); setActivePreset("Custom") }}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-bold text-zinc-400 whitespace-nowrap">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={todayStr}
              onChange={(e) => { setEndDate(e.target.value); setActivePreset("Custom") }}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue",  value: `Rs. ${totalRevenue.toLocaleString()}`,  color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", pct: 100 },
            { label: "Total Tips",     value: `Rs. ${totalTips.toLocaleString()}`,      color: "text-amber-600",  bg: "bg-amber-50",   bar: "bg-amber-500",  pct: totalRevenue ? (totalTips / totalRevenue) * 100 : 0 },
            { label: "Total Cashouts", value: `Rs. ${cashoutTotal.toLocaleString()}`,   color: "text-red-500",    bg: "bg-red-50",     bar: "bg-red-500",    pct: totalRevenue ? Math.min((cashoutTotal / totalRevenue) * 100, 100) : 0 },
            {
              label: "Net Profit",
              value: `Rs. ${netProfit.toLocaleString()}`,
              color: netProfit >= 0 ? "text-blue-600" : "text-red-600",
              bg:    netProfit >= 0 ? "bg-blue-50"    : "bg-red-50",
              bar:   netProfit >= 0 ? "bg-blue-500"   : "bg-red-400",
              pct:   totalRevenue   ? Math.max(0, Math.min((netProfit / totalRevenue) * 100, 100)) : 0,
            },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className={`text-xs font-bold ${s.color} mt-1 mb-2`}>{s.label}</div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(s.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Cashier discount stats */}
        {cashierDiscBills.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🎟️</span>
              <span className="text-xs font-bold text-blue-700">Cashier Discounts ({bills === allBills ? "period" : "filtered"})</span>
            </div>
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div>
                <span className="text-zinc-500 text-xs">Bills with discount:</span>
                <span className="font-bold text-blue-700 ml-1">{cashierDiscBills.length}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs">Total discounted:</span>
                <span className="font-bold text-blue-700 ml-1">Rs. {totalCashierDisc.toLocaleString()}</span>
              </div>
              {topCashierDisc && (
                <div>
                  <span className="text-zinc-500 text-xs">Most discounts by:</span>
                  <span className="font-bold text-blue-700 ml-1">{topCashierDisc[0]} ({topCashierDisc[1]})</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── SIDE BY SIDE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: BILLS */}
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">🧾</div>
              <span className="text-sm font-bold text-zinc-800">Bills</span>
              <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-semibold">{bills.length}</span>
            </div>
            <div className="flex gap-1.5">
              {["all", "paid", "unpaid"].map((f) => (
                <button key={`bf-${f}`} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-b border-zinc-50 space-y-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bill ID, table, method..."
              className="w-full text-sm px-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder:text-zinc-300" />
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <div
                onClick={() => setShowCashierDiscOnly(v => !v)}
                className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${showCashierDiscOnly ? "bg-blue-500" : "bg-zinc-200"}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${showCashierDiscOnly ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="text-xs font-semibold text-zinc-500">Show bills with cashier discount only</span>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[520px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-sm text-zinc-400">Loading bills...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="text-4xl opacity-20">🧾</div>
                <div className="text-sm font-semibold text-zinc-400">No bills for this period</div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {filtered.map((bill) => {
                  const s = STATUS_STYLES[bill.paymentStatus] || STATUS_STYLES.unpaid
                  return (
                    <div key={bill._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-zinc-400">#{bill._id?.slice(-6).toUpperCase()}</span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border ${s.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{bill.paymentStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-bold text-zinc-700">Table {bill.tableNumber}</span>
                          <span>·</span>
                          <span className={`flex items-center gap-1 font-semibold ${METHOD_COLORS[bill.paymentMethod]}`}>
                            {METHOD_ICONS[bill.paymentMethod]} {bill.paymentMethod}
                          </span>
                          <span>·</span>
                          <span>{new Date(bill.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-zinc-800">Rs. {bill.totalAmount?.toLocaleString()}</div>
                        {bill.tipAmount > 0 && <div className="text-xs text-amber-500 font-semibold">+Rs. {bill.tipAmount} tip</div>}
                        {bill.cashierDiscountAmount > 0 && (
                          <div className="text-xs text-blue-500 font-semibold">🎟️ -{bill.cashierDiscount}% disc</div>
                        )}
                      </div>
                      <button onClick={() => openDetail(bill)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                        →
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-400">
              <span><span className="font-bold text-zinc-600">{filtered.length}</span> of {bills.length} bills</span>
              <span>Shown: <span className="font-bold text-emerald-600">Rs. {filtered.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + (b.totalAmount || 0), 0).toLocaleString()}</span></span>
            </div>
          )}
        </div>

        {/* RIGHT: CASHOUTS */}
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-sm">💸</div>
              <span className="text-sm font-bold text-zinc-800">Cashouts</span>
              <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-semibold">{cashouts.length}</span>
            </div>
            <div className="text-sm font-black text-red-600">− Rs. {cashoutTotal.toLocaleString()}</div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[560px]">
            {cashoutLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 border-2 border-zinc-200 border-t-red-400 rounded-full animate-spin" />
                <span className="text-sm text-zinc-400">Loading cashouts...</span>
              </div>
            ) : cashouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="text-4xl opacity-20">💸</div>
                <div className="text-sm font-semibold text-zinc-400">No cashouts for this period</div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {cashouts.map((c, idx) => (
                  <div key={c._id ?? `cashout-${idx}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-base shrink-0">
                      {CASHOUT_ICONS[c.category] || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-800 truncate">{c.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border capitalize ${CASHOUT_COLORS[c.category] || CASHOUT_COLORS.other}`}>
                          {c.category}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {new Date(c.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                          {" · "}
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-black text-red-600 shrink-0">− Rs. {c.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cashouts.length > 0 && (
            <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-400">
              <span><span className="font-bold text-zinc-600">{cashouts.length}</span> cashout{cashouts.length > 1 ? "s" : ""}</span>
              <span>Total: <span className="font-bold text-red-500">− Rs. {cashoutTotal.toLocaleString()}</span></span>
            </div>
          )}
        </div>
      </div>

      <BillDetailModal selected={selected} loadingDetail={loadingDetail} onClose={() => setSelected(null)} />
    </div>
  )
}