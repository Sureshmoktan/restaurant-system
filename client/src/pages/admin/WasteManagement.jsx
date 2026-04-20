import { useEffect, useState, useMemo } from "react"
import { fetchWasteLogs, fetchWasteStats, createWasteLog } from "../../service/wasteService"
import { fetchIngredients } from "../../service/ingredientService"

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtRs = (n) =>
  `Rs. ${Number(n ?? 0).toLocaleString("en-NP", { maximumFractionDigits: 2 })}`

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })

const REASONS = ["expired", "spoiled", "damaged", "spilled", "overcooked", "other"]

const REASON_COLORS = {
  expired:    "bg-red-100 text-red-700",
  spoiled:    "bg-orange-100 text-orange-700",
  damaged:    "bg-amber-100 text-amber-700",
  spilled:    "bg-blue-100 text-blue-700",
  overcooked: "bg-purple-100 text-purple-700",
  other:      "bg-slate-100 text-slate-600",
}

const EMPTY_FORM = {
  ingredient: "",
  quantity:   "",
  reason:     "",
  notes:      "",
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent, loading, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {loading
          ? <div className="h-6 w-28 bg-slate-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-slate-800 leading-tight truncate">{value}</p>
        }
        {sub && !loading && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function ReasonBadge({ reason }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${REASON_COLORS[reason] ?? "bg-slate-100 text-slate-600"}`}>
      {reason}
    </span>
  )
}

function StockPill({ ing }) {
  if (!ing) return null
  const s   = ing.currentStock === 0 ? "out" : ing.currentStock <= ing.minThreshold ? "low" : "ok"
  const cls = s === "out" ? "bg-red-100 text-red-600" : s === "low" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
  const label = s === "out" ? "Out" : s === "low" ? `Low · ${ing.currentStock}` : `${ing.currentStock}`
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label} {ing.unit}
    </span>
  )
}

// ─── daily trend mini chart ────────────────────────────────────────────────────

function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-slate-400">
        No waste data in the last 30 days
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => {
        const date  = new Date(d._id.year, d._id.month - 1, d._id.day)
        const label = date.toLocaleDateString("en-NP", { month: "short", day: "numeric" })
        const pct   = Math.max(4, Math.round((d.count / max) * 100))
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1" title={`${label}: ${d.count} entries`}>
            <div
              className="w-full rounded-t bg-red-400 hover:bg-red-500 transition-colors cursor-default"
              style={{ height: `${pct}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function WasteManagement() {
  const [logs,         setLogs]         = useState([])
  const [stats,        setStats]        = useState(null)
  const [ingredients,  setIngredients]  = useState([])
  const [logsLoading,  setLogsLoading]  = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState("")
  const [success,      setSuccess]      = useState("")

  const [form,         setForm]         = useState(EMPTY_FORM)

  // filters
  const [filterReason,     setFilterReason]     = useState("")
  const [filterIngredient, setFilterIngredient] = useState("")
  const [filterStartDate,  setFilterStartDate]  = useState("")
  const [filterEndDate,    setFilterEndDate]     = useState("")

  // ── loaders ─────────────────────────────────────────────────────────────────

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetchWasteStats()
      setStats(res.data.stats)
    } catch {}
    finally { setStatsLoading(false) }
  }

  const loadLogs = async (params = {}) => {
    setLogsLoading(true)
    try {
      const res = await fetchWasteLogs(params)
      setLogs(res.data.logs || [])
    } catch {}
    finally { setLogsLoading(false) }
  }

  const loadIngredients = async () => {
    try {
      const res = await fetchIngredients()
      setIngredients(res.data.ingredients || [])
    } catch {}
  }

  useEffect(() => {
    loadStats()
    loadLogs()
    loadIngredients()
  }, [])

  // ── filter submission ────────────────────────────────────────────────────────

  const handleFilter = (e) => {
    e.preventDefault()
    const params = {}
    if (filterReason)     params.reason     = filterReason
    if (filterIngredient) params.ingredient = filterIngredient
    if (filterStartDate)  params.startDate  = filterStartDate
    if (filterEndDate)    params.endDate    = filterEndDate
    loadLogs(params)
  }

  const handleClearFilters = () => {
    setFilterReason("")
    setFilterIngredient("")
    setFilterStartDate("")
    setFilterEndDate("")
    loadLogs()
  }

  // ── form ────────────────────────────────────────────────────────────────────

  const selectedIng = useMemo(
    () => ingredients.find(i => i._id === form.ingredient) || null,
    [ingredients, form.ingredient]
  )

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.ingredient) { setError("Please select an ingredient"); return }
    if (!form.quantity || Number(form.quantity) <= 0) { setError("Enter a valid quantity"); return }
    if (!form.reason)     { setError("Please select a reason"); return }

    if (selectedIng && Number(form.quantity) > selectedIng.currentStock) {
      setError(`Cannot exceed current stock (${selectedIng.currentStock} ${selectedIng.unit})`)
      return
    }

    setSubmitting(true)
    try {
      await createWasteLog({
        ingredient: form.ingredient,
        quantity:   Number(form.quantity),
        reason:     form.reason,
        notes:      form.notes,
      })
      setSuccess("Waste logged successfully")
      setForm(EMPTY_FORM)
      loadLogs()
      loadStats()
      loadIngredients()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log waste")
    } finally {
      setSubmitting(false)
    }
  }

  // ── stat values ─────────────────────────────────────────────────────────────

  const monthCount     = stats?.monthCount     ?? 0
  const topIngredient  = stats?.topIngredient  ?? null
  const totalWasteCost = stats?.totalWasteCost ?? 0

  return (
    <div className="space-y-6">

      {/* ── stats cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Waste This Month"
          value={monthCount}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
          accent="bg-red-100 text-red-500"
          loading={statsLoading}
          sub="waste log entries"
        />
        <StatCard
          label="Most Wasted Ingredient"
          value={topIngredient ? topIngredient.name : "—"}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2h18v4H3z"/><path d="M3 6l2 16h14l2-16"/><line x1="9" y1="11" x2="15" y2="11"/></svg>}
          accent="bg-amber-100 text-amber-500"
          loading={statsLoading}
          sub={topIngredient ? `${topIngredient.totalQty} ${topIngredient.unit} total` : undefined}
        />
        <StatCard
          label="Waste Cost This Month"
          value={fmtRs(totalWasteCost)}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          accent="bg-orange-100 text-orange-500"
          loading={statsLoading}
          sub="estimated loss"
        />
      </div>

      {/* ── daily trend + reason breakdown ──────────────────────────────────── */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* daily trend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Daily Trend — Last 30 Days</h3>
            <TrendChart data={stats.dailyTrend} />
            <p className="text-xs text-slate-400 mt-2 text-center">Each bar = number of waste entries for that day</p>
          </div>

          {/* by reason */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Waste by Reason (This Month)</h3>
            {stats.byReason.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No waste logged this month</p>
            ) : (
              <div className="space-y-2">
                {stats.byReason.map(r => (
                  <div key={r._id} className="flex items-center gap-3">
                    <ReasonBadge reason={r._id} />
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((r.count / monthCount) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-8 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── log waste form + history ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              Log Waste
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ingredient */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Ingredient <span className="text-red-500">*</span>
                </label>
                <select
                  name="ingredient"
                  value={form.ingredient}
                  onChange={handleFormChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
                >
                  <option value="">Select ingredient…</option>
                  {ingredients.map(ing => (
                    <option key={ing._id} value={ing._id}>
                      {ing.name} ({ing.currentStock} {ing.unit})
                    </option>
                  ))}
                </select>
                {selectedIng && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">Stock:</span>
                    <StockPill ing={selectedIng} />
                  </div>
                )}
              </div>

              {/* quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Quantity <span className="text-red-500">*</span>
                  {selectedIng && (
                    <span className="text-slate-400 font-normal ml-1">
                      (max {selectedIng.currentStock} {selectedIng.unit})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleFormChange}
                    min="0.01"
                    step="0.01"
                    max={selectedIng?.currentStock || undefined}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent pr-16"
                  />
                  {selectedIng && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      {selectedIng.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white capitalize"
                >
                  <option value="">Select reason…</option>
                  {REASONS.map(r => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>

              {/* notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={2}
                  placeholder="Additional details…"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2.5">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                {submitting ? "Logging…" : "Log Waste"}
              </button>
            </form>
          </div>
        </div>

        {/* history */}
        <div className="lg:col-span-2 space-y-4">

          {/* filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Reason</label>
                <select
                  value={filterReason}
                  onChange={e => setFilterReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 bg-white capitalize"
                >
                  <option value="">All reasons</option>
                  {REASONS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ingredient</label>
                <select
                  value={filterIngredient}
                  onChange={e => setFilterIngredient(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                >
                  <option value="">All ingredients</option>
                  {ingredients.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Filter
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Waste History</h3>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                {logs.length} entries
              </span>
            </div>

            {logsLoading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-[3px] border-slate-200 border-t-red-500 rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Loading logs…</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                </svg>
                <span className="text-sm font-medium">No waste logs found</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Ingredient</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Quantity</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Reason</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Est. Cost</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Logged By</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map(log => {
                      const cost = (log.ingredient?.costPerUnit || 0) * log.quantity
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                            {fmtDateTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800 text-xs">
                              {log.ingredient?.name ?? "—"}
                            </div>
                            <div className="text-xs text-slate-400 capitalize">
                              {log.ingredient?.category}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {log.quantity} {log.unit}
                          </td>
                          <td className="px-4 py-3.5">
                            <ReasonBadge reason={log.reason} />
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-red-600 whitespace-nowrap">
                            {cost > 0 ? fmtRs(cost) : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {log.loggedBy?.name ?? "—"}
                            <div className="text-slate-400 capitalize">{log.loggedBy?.role}</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-400 max-w-[160px] truncate">
                            {log.notes || "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
