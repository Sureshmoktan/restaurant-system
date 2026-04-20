// import { useEffect, useState } from "react"
// import api from "../../service/api"

// const EMPTY_FORM = { tableNumber: "", capacity: "", status: "available" }

// const STATUS = {
//   available: { label: "Available", dot: "bg-emerald-500", card: "bg-white border-zinc-200",       top: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", chair: false },
//   occupied:  { label: "Occupied",  dot: "bg-red-500",     card: "bg-red-50 border-red-200",       top: "bg-red-500",     badge: "bg-red-50 text-red-600 border-red-200",             chair: true  },
//   reserved:  { label: "Reserved",  dot: "bg-amber-500",   card: "bg-amber-50 border-amber-200",   top: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200",       chair: true  },
// }

// function Chair({ filled, reserved }) {
//   const color = reserved ? "#f59e0b" : filled ? "#ef4444" : "#10b981"
//   return (
//     <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color }}>
//       <svg width="11" height="11" viewBox="0 0 12 14" fill="none">
//         <rect x="1" y="0" width="10" height="6" rx="1.5" fill="white" opacity=".9"/>
//         <rect x="2" y="6" width="8" height="2" rx="1" fill="white" opacity=".7"/>
//         <rect x="2" y="8" width="2" height="5" rx="1" fill="white" opacity=".6"/>
//         <rect x="8" y="8" width="2" height="5" rx="1" fill="white" opacity=".6"/>
//       </svg>
//     </div>
//   )
// }

// export default function TableManagement() {
//   const [tables,       setTables]       = useState([])
//   const [loading,      setLoading]      = useState(true)
//   const [showModal,    setShowModal]    = useState(false)
//   const [deleteTarget, setDeleteTarget] = useState(null)
//   const [deleting,     setDeleting]     = useState(false)
//   const [editing,      setEditing]      = useState(null)
//   const [form,         setForm]         = useState(EMPTY_FORM)
//   const [submitting,   setSubmitting]   = useState(false)
//   const [error,        setError]        = useState("")
//   const [filter,       setFilter]       = useState("all")

//   const fetchTables = async () => {
//     try {
//       setLoading(true)
//       const res = await api.get("/tables")
//       setTables(res.data.tables || [])
//     } catch { setTables([]) }
//     finally  { setLoading(false) }
//   }

//   useEffect(() => { fetchTables() }, [])

//   const openAdd = () => {
//     setEditing(null)
//     setForm(EMPTY_FORM)
//     setError("")
//     setShowModal(true)
//   }

//   const openEdit = (table) => {
//     setEditing(table)
//     setForm({ tableNumber: table.tableNumber, capacity: table.capacity, status: table.status })
//     setError("")
//     setShowModal(true)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError("")
//     if (!form.tableNumber || !form.capacity) {
//       setError("Table name and capacity are required")
//       return
//     }
//     setSubmitting(true)
//     try {
//       if (editing) {
//         await api.put(`/tables/${editing._id}`, form)
//       } else {
//         await api.post("/tables", form)
//       }
//       setShowModal(false)
//       fetchTables()
//     } catch (err) {
//       setError(err.response?.data?.message || "Something went wrong")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleDeleteConfirm = async () => {
//     if (!deleteTarget) return
//     setDeleting(true)
//     try {
//       await api.delete(`/tables/${deleteTarget._id}`)
//       setDeleteTarget(null)
//       fetchTables()
//     } catch {}
//     finally { setDeleting(false) }
//   }

//   const availableCount = tables.filter((t) => t.status === "available").length
//   const occupiedCount  = tables.filter((t) => t.status === "occupied").length
//   const reservedCount  = tables.filter((t) => t.status === "reserved").length

//   const filtered = filter === "all" ? tables : tables.filter((t) => t.status === filter)

//   return (
//     <div className="space-y-6">

//       {/* ── PAGE HEADER ── */}
//       <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl shadow-md shadow-green-200">
//               🪑
//             </div>
//             <div>
//               <h1 className="text-xl font-black text-zinc-900 tracking-tight">Table Management</h1>
//               <p className="text-sm text-zinc-400 mt-0.5">{tables.length} tables · {availableCount} available now</p>
//             </div>
//           </div>
//           <button onClick={openAdd}
//             className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-green-200 hover:-translate-y-0.5">
//             <span className="text-lg leading-none">+</span> Add Table
//           </button>
//         </div>

//         {/* stats */}
//         <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-100">
//           {[
//             { label: "Available", count: availableCount, color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", pct: tables.length ? (availableCount / tables.length) * 100 : 0 },
//             { label: "Occupied",  count: occupiedCount,  color: "text-red-600",     bg: "bg-red-50",     bar: "bg-red-500",     pct: tables.length ? (occupiedCount  / tables.length) * 100 : 0 },
//             { label: "Reserved",  count: reservedCount,  color: "text-amber-600",   bg: "bg-amber-50",   bar: "bg-amber-500",   pct: tables.length ? (reservedCount  / tables.length) * 100 : 0 },
//           ].map((s) => (
//             <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
//               <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
//               <div className={`text-xs font-bold ${s.color} mb-2`}>{s.label}</div>
//               <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
//                 <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── FILTER TABS ── */}
//       <div className="flex items-center gap-2 flex-wrap">
//         {[
//           { key: "all",       label: `All (${tables.length})` },
//           { key: "available", label: `Available (${availableCount})` },
//           { key: "occupied",  label: `Occupied (${occupiedCount})` },
//           { key: "reserved",  label: `Reserved (${reservedCount})` },
//         ].map((f) => (
//           <button key={f.key} onClick={() => setFilter(f.key)}
//             className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
//               ${filter === f.key ? "bg-zinc-800 text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
//             {f.label}
//           </button>
//         ))}
//         <div className="flex-1" />
//         <button onClick={fetchTables} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-500 hover:border-zinc-400 transition-all">
//           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
//           Refresh
//         </button>
//       </div>

//       {/* ── TABLES GRID ── */}
//       {loading ? (
//         <div className="flex flex-col items-center justify-center h-56 gap-3 bg-white rounded-2xl border border-zinc-100">
//           <div className="w-9 h-9 border-2 border-zinc-200 border-t-green-500 rounded-full animate-spin" />
//           <span className="text-sm text-zinc-400 font-medium">Loading tables...</span>
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="bg-white rounded-2xl border border-zinc-100 p-16 text-center shadow-sm">
//           <div className="text-5xl mb-3 opacity-30">🪑</div>
//           <div className="text-sm font-semibold text-zinc-400 mb-4">
//             {filter === "all" ? "No tables yet" : `No ${filter} tables`}
//           </div>
//           {filter === "all" && (
//             <button onClick={openAdd} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold">Add first table</button>
//           )}
//         </div>
//       ) : (
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
//           {filtered
//             .sort((a, b) => String(a.tableNumber).localeCompare(String(b.tableNumber)))
//             .map((table) => {
//               const s = STATUS[table.status] || STATUS.available
//               return (
//                 <div key={table._id}
//                   className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${s.card}`}>
//                   <div className={`h-1.5 w-full ${s.top}`} />

//                   <div className="p-4">
//                     {/* name + badge */}
//                     <div className="flex items-start justify-between mb-3">
//                       <div>
//                         <div className="text-2xl font-black text-zinc-800 leading-none">{table.tableNumber}</div>
//                         <div className="text-xs text-zinc-400 font-medium mt-0.5">Table</div>
//                       </div>
//                       <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-bold ${s.badge}`}>
//                         <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${table.status !== "available" ? "animate-pulse" : ""}`} />
//                         {s.label}
//                       </div>
//                     </div>

//                     {/* chairs */}
//                     <div className="bg-white/60 rounded-xl p-2.5 mb-2 border border-white/80">
//                       <div className="flex flex-wrap gap-1 justify-center min-h-6">
//                         {Array.from({ length: Math.min(Number(table.capacity), 8) }).map((_, i) => (
//                           <Chair
//                             key={i}
//                             filled={table.status === "occupied"}
//                             reserved={table.status === "reserved"}
//                           />
//                         ))}
//                         {Number(table.capacity) > 8 && (
//                           <div className="w-5 h-5 rounded-md bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">
//                             +{Number(table.capacity) - 8}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* seat count */}
//                     <div className="text-center text-xs font-bold text-zinc-500 mb-3">
//                       {table.capacity} seat{table.capacity !== 1 ? "s" : ""}
//                       {table.customerCount > 0 && <span className="ml-1 text-red-500">· {table.customerCount} guests</span>}
//                     </div>

//                     {/* edit / delete */}
//                     <div className="flex gap-1.5">
//                       <button onClick={() => openEdit(table)}
//                         className="flex-1 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl hover:border-green-400 hover:text-green-600 text-zinc-500 transition-all">
//                         Edit
//                       </button>
//                       <button onClick={() => setDeleteTarget(table)}
//                         className="w-9 py-1.5 bg-white border border-zinc-200 rounded-xl hover:border-red-300 hover:bg-red-50 hover:text-red-500 text-zinc-400 transition-all flex items-center justify-center">
//                         🗑
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//         </div>
//       )}

//       {/* ── ADD/EDIT MODAL ── */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-100 overflow-hidden">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
//               <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg">🪑</div>
//                 <div>
//                   <h3 className="text-sm font-bold text-zinc-800">{editing ? "Edit Table" : "Add New Table"}</h3>
//                   <p className="text-xs text-zinc-400">{editing ? `Editing ${editing.tableNumber}` : "Fill in the details below"}</p>
//                 </div>
//               </div>
//               <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-lg transition-all">×</button>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//               {error && (
//                 <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
//                   <span>⚠</span> {error}
//                 </div>
//               )}

//               <div>
//                 <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Table Name *</label>
//                 <input type="text" value={form.tableNumber}
//                   onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
//                   placeholder="e.g. T1, G5, VIP1"
//                   className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-zinc-300 placeholder:font-normal"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Seat Capacity *</label>
//                 <input type="number" min="1" max="20" value={form.capacity}
//                   onChange={(e) => setForm({ ...form, capacity: e.target.value })}
//                   placeholder="e.g. 4"
//                   className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-zinc-300 placeholder:font-normal"
//                 />
//                 {Number(form.capacity) > 0 && (
//                   <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
//                     <p className="text-xs text-zinc-400 font-medium mb-2">Preview — {form.capacity} seats</p>
//                     <div className="flex flex-wrap gap-1.5 justify-center">
//                       {Array.from({ length: Math.min(Number(form.capacity), 8) }).map((_, i) => (
//                         <Chair key={i} filled={false} reserved={false} />
//                       ))}
//                       {Number(form.capacity) > 8 && (
//                         <div className="w-5 h-5 rounded-md bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">+{Number(form.capacity) - 8}</div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* ✅ Status selector — only shown when editing */}
//               {editing && (
//                 <div>
//                   <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
//                   <div className="grid grid-cols-3 gap-2">
//                     {Object.entries(STATUS).map(([key, s]) => (
//                       <button
//                         key={key}
//                         type="button"
//                         onClick={() => setForm({ ...form, status: key })}
//                         className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1
//                           ${form.status === key ? `${s.badge} border-current` : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300"}`}
//                       >
//                         <div className={`w-2 h-2 rounded-full ${s.dot}`} />
//                         {s.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div className="flex gap-3 pt-1">
//                 <button type="button" onClick={() => setShowModal(false)}
//                   className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
//                   Cancel
//                 </button>
//                 <button type="submit" disabled={submitting}
//                   className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 shadow-md shadow-green-200">
//                   {submitting ? "Saving..." : editing ? "Update Table" : "Add Table"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* ── DELETE MODAL ── */}
//       {deleteTarget && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-100 overflow-hidden">
//             <div className="p-6 text-center">
//               <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl mx-auto mb-4">🗑</div>
//               <h3 className="text-base font-black text-zinc-800 mb-1">Delete table <span className="text-red-500">{deleteTarget.tableNumber}</span>?</h3>
//               <p className="text-sm text-zinc-400 mb-4">{deleteTarget.capacity} seats · This cannot be undone.</p>
//               <div className="bg-red-50 rounded-xl p-3 border border-red-100 mb-4">
//                 <div className="flex flex-wrap gap-1 justify-center">
//                   {Array.from({ length: Math.min(Number(deleteTarget.capacity), 8) }).map((_, i) => (
//                     <Chair key={i} filled={true} reserved={false} />
//                   ))}
//                 </div>
//               </div>
//               {deleteTarget.status !== "available" && (
//                 <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-bold mb-4">
//                   ⚠️ This table is currently {deleteTarget.status}!
//                 </div>
//               )}
//             </div>
//             <div className="flex gap-3 px-6 pb-6">
//               <button onClick={() => setDeleteTarget(null)} disabled={deleting}
//                 className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
//                 Cancel
//               </button>
//               <button onClick={handleDeleteConfirm} disabled={deleting}
//                 className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-red-200">
//                 {deleting
//                   ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>
//                   : "Yes, delete it"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


import { useEffect, useState } from "react"
import api from "../../service/api"

const EMPTY_FORM = { tableNumber: "", capacity: "", status: "available", category: "" }

const STATUS = {
  available: { label: "Available", dot: "bg-emerald-500", card: "bg-white border-zinc-200",       top: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", chair: false },
  occupied:  { label: "Occupied",  dot: "bg-red-500",     card: "bg-red-50 border-red-200",       top: "bg-red-500",     badge: "bg-red-50 text-red-600 border-red-200",             chair: true  },
  reserved:  { label: "Reserved",  dot: "bg-amber-500",   card: "bg-amber-50 border-amber-200",   top: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200",       chair: true  },
  billed:    { label: "Billed",    dot: "bg-blue-500",    card: "bg-blue-50 border-blue-200",     top: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",          chair: true  },
}

const CATEGORY_COLORS = [
  { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-400", header: "bg-violet-500" },
  { bg: "bg-sky-50",     border: "border-sky-200",    text: "text-sky-700",    dot: "bg-sky-400",    header: "bg-sky-500"    },
  { bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700",   dot: "bg-rose-400",   header: "bg-rose-500"   },
  { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400",  header: "bg-amber-500"  },
  { bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-700",   dot: "bg-teal-400",   header: "bg-teal-500"   },
  { bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-400", header: "bg-orange-500" },
]

function Chair({ filled, reserved, billed }) {
  const color = billed ? "#3b82f6" : reserved ? "#f59e0b" : filled ? "#ef4444" : "#10b981"
  return (
    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color }}>
      <svg width="11" height="11" viewBox="0 0 12 14" fill="none">
        <rect x="1" y="0" width="10" height="6" rx="1.5" fill="white" opacity=".9"/>
        <rect x="2" y="6" width="8" height="2" rx="1" fill="white" opacity=".7"/>
        <rect x="2" y="8" width="2" height="5" rx="1" fill="white" opacity=".6"/>
        <rect x="8" y="8" width="2" height="5" rx="1" fill="white" opacity=".6"/>
      </svg>
    </div>
  )
}

export default function TableManagement() {
  const [tables,       setTables]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState("")
  const [filter,       setFilter]       = useState("all")
  const [catFilter,    setCatFilter]    = useState("all")

  const fetchTables = async () => {
    try {
      setLoading(true)
      const res = await api.get("/tables")
      setTables(res.data.tables || [])
    } catch { setTables([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchTables() }, [])

  // Derive sorted unique categories
  const allCategories = [...new Set(tables.map(t => t.category || "Uncategorized"))].sort()

  // Category color map (stable assignment by index)
  const catColorMap = {}
  allCategories.forEach((cat, i) => {
    catColorMap[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  })

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError("")
    setShowModal(true)
  }

  const openEdit = (table) => {
    setEditing(table)
    setForm({ tableNumber: table.tableNumber, capacity: table.capacity, status: table.status, category: table.category || "" })
    setError("")
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!form.tableNumber || !form.capacity) {
      setError("Table name and capacity are required")
      return
    }
    setSubmitting(true)
    try {
      const payload = { ...form, category: form.category.trim() || "Main Floor" }
      if (editing) {
        await api.put(`/tables/${editing._id}`, payload)
      } else {
        await api.post("/tables", payload)
      }
      setShowModal(false)
      fetchTables()
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/tables/${deleteTarget._id}`)
      setDeleteTarget(null)
      fetchTables()
    } catch {}
    finally { setDeleting(false) }
  }

  const availableCount = tables.filter((t) => t.status === "available").length
  const occupiedCount  = tables.filter((t) => t.status === "occupied").length
  const reservedCount  = tables.filter((t) => t.status === "reserved").length
  const billedCount    = tables.filter((t) => t.status === "billed").length

  // Apply status + category filters
  const statusFiltered = filter === "all" ? tables : tables.filter((t) => t.status === filter)
  const filtered = catFilter === "all" ? statusFiltered : statusFiltered.filter((t) => (t.category || "Uncategorized") === catFilter)

  // Group filtered tables by category
  const grouped = {}
  filtered.forEach(t => {
    const cat = t.category || "Uncategorized"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(t)
  })
  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl shadow-md shadow-green-200">
              🪑
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">Table Management</h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                {tables.length} tables · {availableCount} available · {allCategories.length} {allCategories.length === 1 ? "section" : "sections"}
              </p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-green-200 hover:-translate-y-0.5">
            <span className="text-lg leading-none">+</span> Add Table
          </button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-100">
          {[
            { label: "Available", count: availableCount, color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", pct: tables.length ? (availableCount / tables.length) * 100 : 0 },
            { label: "Occupied",  count: occupiedCount,  color: "text-red-600",     bg: "bg-red-50",     bar: "bg-red-500",     pct: tables.length ? (occupiedCount  / tables.length) * 100 : 0 },
            { label: "Reserved",  count: reservedCount,  color: "text-amber-600",   bg: "bg-amber-50",   bar: "bg-amber-500",   pct: tables.length ? (reservedCount  / tables.length) * 100 : 0 },
            { label: "Billed",    count: billedCount,    color: "text-blue-600",    bg: "bg-blue-50",    bar: "bg-blue-500",    pct: tables.length ? (billedCount    / tables.length) * 100 : 0 },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <div className={`text-3xl font-black ${s.color}`}>{s.count}</div>
              <div className={`text-xs font-bold ${s.color} mb-2`}>{s.label}</div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER ROW ── */}
      <div className="space-y-2">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "all",       label: `All (${tables.length})` },
            { key: "available", label: `Available (${availableCount})` },
            { key: "occupied",  label: `Occupied (${occupiedCount})` },
            { key: "reserved",  label: `Reserved (${reservedCount})` },
            { key: "billed",    label: `Billed (${billedCount})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${filter === f.key ? "bg-zinc-800 text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
              {f.label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={fetchTables} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-500 hover:border-zinc-400 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
        </div>

        {/* Category filter pills */}
        {allCategories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Section:</span>
            <button onClick={() => setCatFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${catFilter === "all" ? "bg-zinc-700 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
              All sections
            </button>
            {allCategories.map(cat => {
              const c = catColorMap[cat]
              const isActive = catFilter === cat
              return (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                    ${isActive ? `${c.bg} ${c.border} ${c.text}` : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                  <div className={`w-2 h-2 rounded-full ${isActive ? c.dot : "bg-zinc-300"}`} />
                  {cat}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── TABLES GROUPED BY CATEGORY ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-56 gap-3 bg-white rounded-2xl border border-zinc-100">
          <div className="w-9 h-9 border-2 border-zinc-200 border-t-green-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400 font-medium">Loading tables...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-16 text-center shadow-sm">
          <div className="text-5xl mb-3 opacity-30">🪑</div>
          <div className="text-sm font-semibold text-zinc-400 mb-4">
            {filter === "all" && catFilter === "all" ? "No tables yet" : "No tables match this filter"}
          </div>
          {filter === "all" && catFilter === "all" && (
            <button onClick={openAdd} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold">Add first table</button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEntries.map(([cat, catTables]) => {
            const c = catColorMap[cat] || CATEGORY_COLORS[0]
            const catAvail = catTables.filter(t => t.status === "available").length
            return (
              <div key={cat}>
                {/* Category header */}
                <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${c.border}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${c.dot} flex-shrink-0`} />
                  <h2 className={`text-sm font-black uppercase tracking-widest ${c.text}`}>{cat}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
                    {catTables.length} tables · {catAvail} free
                  </span>
                </div>

                {/* Tables in this category */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {catTables
                    .sort((a, b) => String(a.tableNumber).localeCompare(String(b.tableNumber)))
                    .map((table) => {
                      const s = STATUS[table.status] || STATUS.available
                      return (
                        <div key={table._id}
                          className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${s.card}`}>
                          <div className={`h-1.5 w-full ${s.top}`} />

                          <div className="p-4">
                            {/* name + badge */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="text-2xl font-black text-zinc-800 leading-none">{table.tableNumber}</div>
                                <div className="text-xs text-zinc-400 font-medium mt-0.5">Table</div>
                              </div>
                              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-bold ${s.badge}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${table.status !== "available" ? "animate-pulse" : ""}`} />
                                {s.label}
                              </div>
                            </div>

                            {/* chairs */}
                            <div className="bg-white/60 rounded-xl p-2.5 mb-2 border border-white/80">
                              <div className="flex flex-wrap gap-1 justify-center min-h-6">
                                {Array.from({ length: Math.min(Number(table.capacity), 8) }).map((_, i) => (
                                  <Chair
                                    key={i}
                                    filled={table.status === "occupied"}
                                    reserved={table.status === "reserved"}
                                    billed={table.status === "billed"}
                                  />
                                ))}
                                {Number(table.capacity) > 8 && (
                                  <div className="w-5 h-5 rounded-md bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">
                                    +{Number(table.capacity) - 8}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* seat count */}
                            <div className="text-center text-xs font-bold text-zinc-500 mb-3">
                              {table.capacity} seat{table.capacity !== 1 ? "s" : ""}
                              {table.customerCount > 0 && <span className="ml-1 text-red-500">· {table.customerCount} guests</span>}
                            </div>

                            {/* edit / delete */}
                            <div className="flex gap-1.5">
                              <button onClick={() => openEdit(table)}
                                className="flex-1 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl hover:border-green-400 hover:text-green-600 text-zinc-500 transition-all">
                                Edit
                              </button>
                              <button onClick={() => setDeleteTarget(table)}
                                className="w-9 py-1.5 bg-white border border-zinc-200 rounded-xl hover:border-red-300 hover:bg-red-50 hover:text-red-500 text-zinc-400 transition-all flex items-center justify-center">
                                🗑
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg">🪑</div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-800">{editing ? "Edit Table" : "Add New Table"}</h3>
                  <p className="text-xs text-zinc-400">{editing ? `Editing ${editing.tableNumber}` : "Fill in the details below"}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-lg transition-all">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                  <span>⚠</span> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Table Name *</label>
                <input type="text" value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  placeholder="e.g. T1, G5, VIP1"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-zinc-300 placeholder:font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Seat Capacity *</label>
                <input type="number" min="1" max="20" value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-zinc-300 placeholder:font-normal"
                />
                {Number(form.capacity) > 0 && (
                  <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-xs text-zinc-400 font-medium mb-2">Preview — {form.capacity} seats</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {Array.from({ length: Math.min(Number(form.capacity), 8) }).map((_, i) => (
                        <Chair key={i} filled={false} reserved={false} billed={false} />
                      ))}
                      {Number(form.capacity) > 8 && (
                        <div className="w-5 h-5 rounded-md bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">+{Number(form.capacity) - 8}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── CATEGORY INPUT ── */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Section / Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. First Floor, Rooftop, VIP Lounge"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-zinc-300 placeholder:font-normal"
                  list="category-suggestions"
                />
                {/* Suggest existing categories for quick pick */}
                <datalist id="category-suggestions">
                  {allCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                {allCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all
                          ${form.category === cat
                            ? `${catColorMap[cat]?.bg} ${catColorMap[cat]?.border} ${catColorMap[cat]?.text}`
                            : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-400 mt-1.5">Defaults to "Main Floor" if left blank.</p>
              </div>

              {/* Status selector — only when editing */}
              {editing && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(STATUS).map(([key, s]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, status: key })}
                        className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1
                          ${form.status === key ? `${s.badge} border-current` : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300"}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 shadow-md shadow-green-200">
                  {submitting ? "Saving..." : editing ? "Update Table" : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-100 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl mx-auto mb-4">🗑</div>
              <h3 className="text-base font-black text-zinc-800 mb-1">Delete table <span className="text-red-500">{deleteTarget.tableNumber}</span>?</h3>
              <p className="text-sm text-zinc-400 mb-1">{deleteTarget.capacity} seats · This cannot be undone.</p>
              {deleteTarget.category && (
                <p className="text-xs text-zinc-400 mb-3">Section: <span className="font-bold text-zinc-600">{deleteTarget.category}</span></p>
              )}
              <div className="bg-red-50 rounded-xl p-3 border border-red-100 mb-4">
                <div className="flex flex-wrap gap-1 justify-center">
                  {Array.from({ length: Math.min(Number(deleteTarget.capacity), 8) }).map((_, i) => (
                    <Chair key={i} filled={true} reserved={false} billed={false} />
                  ))}
                </div>
              </div>
              {deleteTarget.status !== "available" && (
                <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-bold mb-4">
                  ⚠️ This table is currently {deleteTarget.status}!
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-red-200">
                {deleting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>
                  : "Yes, delete it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}