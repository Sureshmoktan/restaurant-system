// client/src/pages/admin/DiscountGameSettings.jsx

import { useEffect, useState, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import * as svc from "../../service/discountGameService"

// ── helpers ──────────────────────────────────────────────────────────────────

const toDateInput = (d) => d.toISOString().slice(0, 10)

function totalWeight(slices) {
  return slices.reduce((s, sl) => s + Number(sl.weight || 0), 0)
}

function prob(slice, slices) {
  const tw = totalWeight(slices)
  if (!tw) return "0"
  return ((Number(slice.weight) / tw) * 100).toFixed(1)
}

const PRESET_COLORS = [
  "#10b981","#3b82f6","#8b5cf6","#f59e0b",
  "#ef4444","#ec4899","#14b8a6","#fbbf24",
  "#6366f1","#84cc16","#f97316","#06b6d4",
]

const TIER_LABELS = {
  small:  "Small Bills (under Rs 1K)",
  medium: "Medium Bills (Rs 1K – 5K)",
  large:  "Large Bills (Rs 5K – 10K)",
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
        ${checked ? "bg-emerald-500" : "bg-slate-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  )
}

// ── Slice Row ─────────────────────────────────────────────────────────────────

function SliceRow({ slice, slices, onUpdate, onRemove }) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
      {/* color swatch */}
      <td className="px-3 py-2 w-12">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((p) => !p)}
            className="w-7 h-7 rounded-lg border-2 border-white shadow-sm ring-1 ring-slate-200 hover:scale-110 transition-transform"
            style={{ backgroundColor: slice.color }}
          />
          {showPicker && (
            <div className="absolute left-0 top-9 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-3">
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { onUpdate("color", c); setShowPicker(false) }}
                    className="w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c, borderColor: slice.color === c ? "#1e293b" : "transparent" }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={slice.color}
                onChange={(e) => onUpdate("color", e.target.value)}
                className="w-full h-7 cursor-pointer rounded border border-slate-200"
              />
            </div>
          )}
        </div>
      </td>
      {/* label */}
      <td className="px-3 py-2">
        <input
          value={slice.label}
          onChange={(e) => onUpdate("label", e.target.value)}
          className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </td>
      {/* discount % */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="1"
          max="100"
          value={slice.discount}
          onChange={(e) => onUpdate("discount", Number(e.target.value))}
          className="w-16 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </td>
      {/* weight */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0.1"
          step="0.5"
          value={slice.weight}
          onChange={(e) => onUpdate("weight", Number(e.target.value))}
          className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </td>
      {/* probability */}
      <td className="px-3 py-2">
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {prob(slice, slices)}% chance
        </span>
      </td>
      {/* remove */}
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={onRemove}
          className="w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-sm font-bold transition-colors"
        >
          ×
        </button>
      </td>
    </tr>
  )
}

// ── Tier Card ─────────────────────────────────────────────────────────────────

function TierCard({ tier, tierIndex, onChange }) {
  const [open, setOpen] = useState(true)

  const updateSlice = (si, field, val) => {
    const updated = tier.slices.map((s, i) =>
      i === si ? { ...s, [field]: val } : s
    )
    onChange({ ...tier, slices: updated })
  }

  const removeSlice = (si) => {
    onChange({ ...tier, slices: tier.slices.filter((_, i) => i !== si) })
  }

  const addSlice = () => {
    onChange({
      ...tier,
      slices: [...tier.slices, { label: "5%", discount: 5, weight: 10, color: PRESET_COLORS[tier.slices.length % PRESET_COLORS.length] }],
    })
  }

  const tw = totalWeight(tier.slices)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            tierIndex === 0 ? "bg-emerald-400" : tierIndex === 1 ? "bg-blue-400" : "bg-purple-400"
          }`} />
          <span className="text-sm font-bold text-slate-800">{TIER_LABELS[tier.tierName] || tier.tierName}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {tier.slices.length} slices
          </span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {/* tier bill range */}
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Bill range:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rs</span>
              <input
                type="number"
                value={tier.minBill}
                onChange={(e) => onChange({ ...tier, minBill: Number(e.target.value) })}
                className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-xs text-slate-400">to Rs</span>
              <input
                type="number"
                value={tier.maxBill}
                onChange={(e) => onChange({ ...tier, maxBill: Number(e.target.value) })}
                className="w-24 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <span className="ml-auto text-xs text-slate-400">
              Total weight: <span className="font-bold text-slate-600">{tw.toFixed(1)}</span>
            </span>
          </div>

          {/* slices table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Color</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Label</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Discount %</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Weight</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Probability</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {tier.slices.map((slice, si) => (
                  <SliceRow
                    key={si}
                    slice={slice}
                    slices={tier.slices}
                    onUpdate={(field, val) => updateSlice(si, field, val)}
                    onRemove={() => removeSlice(si)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* add slice */}
          <div className="px-5 py-3 border-t border-slate-100">
            <button
              type="button"
              onClick={addSlice}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Slice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── History Table ─────────────────────────────────────────────────────────────

function HistoryTable() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const [pages,     setPages]     = useState(1)
  const [total,     setTotal]     = useState(0)
  const [startDate, setStartDate] = useState("")
  const [endDate,   setEndDate]   = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate
      const data = await svc.fetchGameHistory(params)
      setRows(data.bills || [])
      setPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, startDate, endDate])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-sm">🎰</div>
          <span className="text-sm font-bold text-slate-800">Game History</span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            onClick={() => { setStartDate(""); setEndDate(""); setPage(1) }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 gap-3">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading history…</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2 opacity-30">🎰</div>
          <div className="text-sm text-slate-400">No games played yet</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Bill #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Table</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Bill Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Discount Won</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Discount (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      #{b._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      {b.tableNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 text-right">
                      Rs. {b.subtotal?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full
                        ${b.discountGameResult === 100
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-violet-50 text-violet-600 border border-violet-200"}`}>
                        {b.discountGameResult === 100 ? "FREE!" : `${b.discountGameResult}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">
                      − Rs. {b.discountGameAmount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DiscountGameSettings() {
  const [settings,    setSettings]    = useState(null)
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [toggling,    setToggling]    = useState(false)
  const [error,       setError]       = useState("")
  const [success,     setSuccess]     = useState("")

  // local draft of settings for editing
  const [draft, setDraft] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [sData, stData] = await Promise.all([
        svc.fetchGameSettings(),
        svc.fetchGameStats(),
      ])
      setSettings(sData.settings)
      setDraft(JSON.parse(JSON.stringify(sData.settings))) // deep clone
      setStats(stData.stats)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load game settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async () => {
    setToggling(true)
    setError("")
    try {
      const data = await svc.toggleGame()
      setSettings((s) => ({ ...s, isEnabled: data.isEnabled }))
      setDraft((d) => ({ ...d, isEnabled: data.isEnabled }))
      setSuccess(data.isEnabled ? "Game is now Active" : "Game is now Inactive")
      setTimeout(() => setSuccess(""), 3000)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle game")
    } finally {
      setToggling(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const data = await svc.updateGameSettings({
        tiers:             draft.tiers,
        maxDiscountAmount: draft.maxDiscountAmount,
        maxBillForGame:    draft.maxBillForGame,
      })
      setSettings(data.settings)
      setDraft(JSON.parse(JSON.stringify(data.settings)))
      setSuccess("Settings saved successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!settings) return
    setDraft(JSON.parse(JSON.stringify(settings)))
    setError("")
    setSuccess("")
  }

  const updateTier = (ti, updatedTier) => {
    setDraft((d) => ({
      ...d,
      tiers: d.tiers.map((t, i) => (i === ti ? updatedTier : t)),
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-sm text-slate-400">Loading game settings…</span>
    </div>
  )

  const statCards = [
    {
      label: "Total Games Played",
      value: stats?.totalGamesPlayed?.toLocaleString() ?? "—",
      icon: "🎰",
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Total Discounts Given",
      value: stats ? `Rs. ${stats.totalDiscountGiven?.toLocaleString()}` : "—",
      icon: "💰",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Avg Discount / Game",
      value: stats ? `Rs. ${stats.averageDiscount?.toLocaleString()}` : "—",
      icon: "📊",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Games This Month",
      value: stats?.gamesThisMonth?.toLocaleString() ?? "—",
      icon: "📅",
      color: "bg-emerald-50 text-emerald-600",
    },
  ]

  const chartData = (stats?.discountDistribution || []).map((d) => ({
    name:  d.label,
    count: d.count,
    color: d.discount === 100
      ? "#fbbf24"
      : d.discount >= 50  ? "#14b8a6"
      : d.discount >= 30  ? "#ec4899"
      : d.discount >= 25  ? "#ef4444"
      : d.discount >= 20  ? "#f59e0b"
      : d.discount >= 15  ? "#8b5cf6"
      : d.discount >= 10  ? "#3b82f6"
      : "#10b981",
  }))

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl shadow-md shadow-violet-200">
            🎲
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Discount Game Settings</h1>
            <p className="text-sm text-slate-400 mt-0.5">Spin-wheel discount game configuration &amp; analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border
            ${settings?.isEnabled
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-slate-100 text-slate-400 border-slate-200"}`}>
            {settings?.isEnabled ? "Active" : "Inactive"}
          </span>
          <Toggle
            checked={!!settings?.isEnabled}
            onChange={handleToggle}
            disabled={toggling}
          />
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {success}
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-white/60`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-black">{s.value}</div>
            <div className="text-xs font-semibold mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Discount Distribution Chart ── */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-sm">📊</div>
            <span className="text-sm font-bold text-slate-800">Discount Distribution</span>
            <span className="text-xs text-slate-400">— how often each slice was won</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v) => [v, "Times won"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tier Configuration ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">⚙️</div>
          <h2 className="text-sm font-bold text-slate-800">Tier Configuration</h2>
          <span className="text-xs text-slate-400">— edit slices, weights &amp; bill ranges</span>
        </div>

        {draft?.tiers?.map((tier, ti) => (
          <TierCard
            key={tier.tierName}
            tier={tier}
            tierIndex={ti}
            onChange={(updated) => updateTier(ti, updated)}
          />
        ))}
      </div>

      {/* ── Safety Limits ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-sm">🛡️</div>
          <h2 className="text-sm font-bold text-slate-800">Safety Limits</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Max Discount Cap (Rs)
            </label>
            <input
              type="number"
              min="0"
              value={draft?.maxDiscountAmount ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, maxDiscountAmount: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Maximum Rs discount per game regardless of % won (FREE! is never capped)
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Max Bill for Game (Rs)
            </label>
            <input
              type="number"
              min="0"
              value={draft?.maxBillForGame ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, maxBillForGame: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="10000"
            />
            <p className="text-xs text-slate-400 mt-1">
              Bills above this amount cannot play the game
            </p>
          </div>
        </div>
      </div>

      {/* ── Save / Reset Actions ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          Changes are not saved until you click <span className="font-semibold text-slate-600">Save Settings</span>.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : "Save Settings"}
          </button>
        </div>
      </div>

      {/* ── Game History ── */}
      <HistoryTable />

    </div>
  )
}
