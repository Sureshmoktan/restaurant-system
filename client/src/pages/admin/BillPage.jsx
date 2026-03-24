import { useEffect, useState } from "react"
import api from "../../service/api"

const STATUS_STYLES = {
  paid:   { badge: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" },
  unpaid: { badge: "bg-amber-50 text-amber-600 border-amber-200",       dot: "bg-amber-500"   },
}

const METHOD_ICONS   = { cash: "💵", esewa: "📱", khalti: "📱", card: "💳" }
const METHOD_COLORS  = { cash: "text-green-600", esewa: "text-blue-600", khalti: "text-purple-600", card: "text-orange-600" }

export default function BillsPage() {
  const [bills,    setBills]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState("all")
  const [search,   setSearch]   = useState("")
  const [selected, setSelected] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get("/bills")
      setBills(res.data.bills || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openDetail = async (bill) => {
    setLoadingDetail(true)
    setSelected(bill)
    try {
      // fetch with populated orders
      const res = await api.get(`/bills/table/${bill.tableNumber}`)
      setSelected(res.data.bill || bill)
    } catch {
      setSelected(bill)
    } finally {
      setLoadingDetail(false)
    }
  }

  const filtered = bills.filter((b) => {
    const matchFilter = filter === "all" || b.paymentStatus === filter
    const matchSearch = search === "" ||
      b._id?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.tableNumber).toLowerCase().includes(search.toLowerCase()) ||
      b.paymentMethod?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const paidBills    = bills.filter((b) => b.paymentStatus === "paid")
  const totalRevenue = paidBills.reduce((s, b) => s + (b.totalAmount || 0), 0)
  const totalTips    = paidBills.reduce((s, b) => s + (b.tipAmount   || 0), 0)
  const totalPaid    = paidBills.length
  const totalUnpaid  = bills.filter((b) => b.paymentStatus === "unpaid").length

  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-md shadow-green-200">
              🧾
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">Bills & Sales</h1>
              <p className="text-sm text-zinc-400 mt-0.5">All generated bills and payment records</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-500 hover:border-zinc-400 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue",  value: `Rs. ${totalRevenue.toLocaleString()}`, color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", pct: 100 },
            { label: "Total Tips",     value: `Rs. ${totalTips.toLocaleString()}`,    color: "text-amber-600",   bg: "bg-amber-50",   bar: "bg-amber-500",   pct: totalRevenue ? (totalTips / totalRevenue) * 100 : 0 },
            { label: "Paid Bills",     value: totalPaid,                               color: "text-blue-600",    bg: "bg-blue-50",    bar: "bg-blue-500",    pct: bills.length ? (totalPaid / bills.length) * 100 : 0 },
            { label: "Pending Bills",  value: totalUnpaid,                             color: "text-red-500",     bg: "bg-red-50",     bar: "bg-red-500",     pct: bills.length ? (totalUnpaid / bills.length) * 100 : 0 },
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
      </div>

      {/* ── FILTERS + TABLE ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">

        {/* toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bill ID, table, method..."
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder:text-zinc-300"
          />
          <div className="flex gap-2 flex-shrink-0">
            {["all", "paid", "unpaid"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all
                  ${filter === f ? "bg-zinc-800 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-zinc-400">Loading bills...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl opacity-20">🧾</div>
            <div className="text-sm font-semibold text-zinc-400">No bills found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {["Bill ID", "Table", "Subtotal", "VAT", "Tip", "Total", "Payment", "Status", "Date", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill, i) => {
                  const s = STATUS_STYLES[bill.paymentStatus] || STATUS_STYLES.unpaid
                  return (
                    <tr key={bill._id} className={`border-t border-zinc-50 hover:bg-zinc-50 transition-colors text-sm ${i % 2 === 0 ? "" : "bg-zinc-50/30"}`}>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-400 font-bold">#{bill._id?.slice(-6).toUpperCase()}</td>
                      <td className="px-5 py-3.5 font-bold text-zinc-800">{bill.tableNumber}</td>
                      <td className="px-5 py-3.5 text-zinc-600">Rs. {bill.subtotal?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-zinc-500">Rs. {bill.vatAmount?.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        {bill.tipAmount > 0
                          ? <span className="text-amber-600 font-bold">Rs. {bill.tipAmount?.toLocaleString()}</span>
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-black text-zinc-800">Rs. {bill.totalAmount?.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1.5 capitalize font-semibold ${METHOD_COLORS[bill.paymentMethod]}`}>
                          <span>{METHOD_ICONS[bill.paymentMethod]}</span>
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(bill.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => openDetail(bill)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all">
                          Details →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 bg-zinc-50/50">
            <span>Showing <span className="font-bold text-zinc-600">{filtered.length}</span> of {bills.length} bills</span>
            <span>Shown revenue: <span className="font-bold text-emerald-600">Rs. {filtered.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}</span></span>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-100 overflow-hidden max-h-[90vh] flex flex-col">

            {/* modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">🧾</div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-800">Bill Details</h3>
                  <div className="text-xs text-zinc-400 font-mono">#{selected._id?.slice(-6).toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-lg transition-all">×</button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">

              {loadingDetail ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <div className="w-6 h-6 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-sm text-zinc-400">Loading details...</span>
                </div>
              ) : (
                <>
                  {/* meta grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Table",   value: selected.tableNumber },
                      { label: "Payment", value: `${METHOD_ICONS[selected.paymentMethod]} ${selected.paymentMethod}`, cls: `capitalize font-bold ${METHOD_COLORS[selected.paymentMethod]}` },
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

                  {/* order items */}
                  {selected.orders?.length > 0 && (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="bg-zinc-50 px-4 py-2.5 flex items-center justify-between border-b border-zinc-100">
                        <span className="text-xs font-bold text-zinc-600">Order Items</span>
                        <span className="text-xs text-zinc-400">{selected.orders.length} order{selected.orders.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="divide-y divide-zinc-50">
                        {selected.orders.map((order, oi) => (
                          <div key={order._id || oi} className="px-4 py-3">
                            <div className="text-xs font-bold text-zinc-400 mb-2">
                              Order #{(order._id || "").slice(-4).toUpperCase()}
                            </div>
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5">
                                <div>
                                  <span className="text-sm font-semibold text-zinc-800">{item.quantity}× {item.name}</span>
                                  {item.selectedOptions?.map((opt) => (
                                    <div key={opt.groupName} className="text-xs text-blue-500 mt-0.5">{opt.groupName}: {opt.selected?.join(", ")}</div>
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

                  {/* bill breakdown */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-100">
                      <span className="text-xs font-bold text-zinc-600">Bill Breakdown</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Subtotal</span>
                        <span className="font-semibold text-zinc-700">Rs. {selected.subtotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">VAT ({selected.vatPercent}%)</span>
                        <span className="font-semibold text-zinc-700">Rs. {selected.vatAmount?.toLocaleString()}</span>
                      </div>
                      {selected.tipAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-600 font-medium">🙏 Tip</span>
                          <span className="font-bold text-amber-600">Rs. {selected.tipAmount?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-black border-t border-zinc-100 pt-2.5 mt-1">
                        <span className="text-zinc-800">Total</span>
                        <span className="text-emerald-600">Rs. {selected.totalAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* footer info */}
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
              <button onClick={() => setSelected(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}