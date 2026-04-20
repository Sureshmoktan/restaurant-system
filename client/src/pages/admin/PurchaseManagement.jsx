import { useEffect, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchPurchases, fetchPurchaseStats, addPurchase } from "../../features/purchaseSlice"
import { fetchIngredients } from "../../features/ingredientSlice"

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtRs  = (n) => `Rs. ${Number(n ?? 0).toLocaleString("en-NP", { maximumFractionDigits: 2 })}`
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

const statusOf = (ing) => {
  if (!ing) return "ok"
  if (ing.currentStock === 0) return "out"
  if (ing.currentStock <= ing.minThreshold) return "low"
  return "ok"
}

const EMPTY_FORM = {
  ingredient:    "",
  quantity:      "",
  costPerUnit:   "",
  supplier:      "",
  invoiceNumber: "",
  notes:         "",
  purchaseDate:  new Date().toISOString().slice(0, 10),
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent, loading, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {loading
          ? <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        }
        {sub && !loading && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function StockPill({ ing }) {
  if (!ing) return null
  const s = statusOf(ing)
  const cls =
    s === "out" ? "bg-red-100 text-red-600" :
    s === "low" ? "bg-amber-100 text-amber-600" :
    "bg-emerald-100 text-emerald-600"
  return (
    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>
      {ing.currentStock} {ing.unit}
    </span>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PurchaseManagement() {
  const dispatch  = useDispatch()
  const { items:  purchases, stats, isLoading, statsLoading } = useSelector((s) => s.purchases)
  const { items:  ingredients }                               = useSelector((s) => s.ingredients)

  // modal
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formError,  setFormError]  = useState("")
  const [submitting, setSubmitting] = useState(false)

  // filters
  const [filterIng,   setFilterIng]   = useState("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd,   setFilterEnd]   = useState("")

  // ── data load ────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchIngredients({}))
    dispatch(fetchPurchaseStats())
    dispatch(fetchPurchases({}))
  }, [dispatch])

  // ── reload purchases when filters change ─────────────────────────────────

  useEffect(() => {
    const params = {}
    if (filterIng)   params.ingredient = filterIng
    if (filterStart) params.startDate  = filterStart
    if (filterEnd)   params.endDate    = filterEnd
    dispatch(fetchPurchases(params))
  }, [filterIng, filterStart, filterEnd, dispatch])

  // ── derived: selected ingredient object ──────────────────────────────────

  const selectedIng = useMemo(
    () => ingredients.find((i) => i._id === form.ingredient) || null,
    [ingredients, form.ingredient]
  )

  const computedTotal = useMemo(() => {
    const q = parseFloat(form.quantity)
    const c = parseFloat(form.costPerUnit)
    if (!isNaN(q) && !isNaN(c) && q > 0 && c >= 0) return (q * c).toFixed(2)
    return ""
  }, [form.quantity, form.costPerUnit])

  // ── form helpers ──────────────────────────────────────────────────────────

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleIngredientChange = (id) => {
    const ing = ingredients.find((i) => i._id === id)
    setForm((f) => ({
      ...f,
      ingredient:  id,
      costPerUnit: ing ? String(ing.costPerUnit || "") : "",
    }))
  }

  const openModal = () => {
    setForm(EMPTY_FORM)
    setFormError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormError("")
  }

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")

    if (!form.ingredient)              return setFormError("Please select an ingredient")
    if (!form.quantity || Number(form.quantity) <= 0)
                                        return setFormError("Quantity must be greater than 0")
    if (form.costPerUnit === "" || Number(form.costPerUnit) < 0)
                                        return setFormError("Cost per unit is required")

    const payload = {
      ingredient:    form.ingredient,
      quantity:      Number(form.quantity),
      costPerUnit:   Number(form.costPerUnit),
      supplier:      form.supplier      || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      notes:         form.notes         || undefined,
      purchaseDate:  form.purchaseDate  || undefined,
    }

    setSubmitting(true)
    try {
      const result = await dispatch(addPurchase(payload))
      if (addPurchase.rejected.match(result)) throw new Error(result.payload)
      dispatch(fetchPurchaseStats())
      dispatch(fetchIngredients({}))   // refresh stock levels in dropdown
      closeModal()
    } catch (err) {
      setFormError(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  // ── clear filters ─────────────────────────────────────────────────────────

  const clearFilters = () => { setFilterIng(""); setFilterStart(""); setFilterEnd("") }
  const hasFilters   = filterIng || filterStart || filterEnd

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Today's Spending"
          value={fmtRs(stats?.todaySpent)}
          icon="🛒"
          accent="bg-blue-50"
          loading={statsLoading}
        />
        <StatCard
          label="This Month's Total"
          value={fmtRs(stats?.monthSpent)}
          icon="📅"
          accent="bg-emerald-50"
          loading={statsLoading}
          sub={stats?.totalCount != null ? `${stats.totalCount} purchase${stats.totalCount !== 1 ? "s" : ""} this month` : null}
        />
        <StatCard
          label="Top Ingredient"
          value={stats?.topIngredient?.name ?? "—"}
          icon="🏆"
          accent="bg-amber-50"
          loading={statsLoading}
          sub={stats?.topIngredient ? `${stats.topIngredient.count} order${stats.topIngredient.count !== 1 ? "s" : ""}` : null}
        />
      </div>

      {/* ── header + button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Purchase History</h2>
          <p className="text-xs text-slate-400 mt-0.5">{purchases.length} record{purchases.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Purchase
        </button>
      </div>

      {/* ── filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        {/* ingredient filter */}
        <select
          value={filterIng}
          onChange={(e) => setFilterIng(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700 min-w-[180px]"
        >
          <option value="">All Ingredients</option>
          {ingredients.map((i) => (
            <option key={i._id} value={i._id}>{i.name}</option>
          ))}
        </select>

        {/* date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="py-2 px-3 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 bg-slate-50 rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Loading purchases...</span>
            </div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <p className="text-sm font-medium">No purchases recorded</p>
            <p className="text-xs mt-1">Click "New Purchase" to record your first restock</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingredient</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost / Unit</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap text-xs">
                      {fmtDateTime(p.purchaseDate || p.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800">
                        {p.ingredient?.name ?? "—"}
                      </span>
                      {p.ingredient?.category && (
                        <span className="ml-1.5 text-xs text-slate-400 capitalize">
                          ({p.ingredient.category})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {p.quantity} <span className="text-slate-400 text-xs font-normal">{p.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtRs(p.costPerUnit)}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{fmtRs(p.totalCost)}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {p.supplier || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {p.invoiceNumber || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {p.purchasedBy?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── New Purchase Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

            {/* header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">New Purchase</h3>
                <p className="text-xs text-slate-400 mt-0.5">Record a restock — stock is updated immediately</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* ingredient */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Ingredient <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.ingredient}
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                >
                  <option value="">— select ingredient —</option>
                  {ingredients.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name}  ({i.currentStock} {i.unit} in stock)
                    </option>
                  ))}
                </select>

                {/* current stock indicator */}
                {selectedIng && (
                  <div className={`mt-2 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                    statusOf(selectedIng) === "out" ? "bg-red-50 text-red-700" :
                    statusOf(selectedIng) === "low" ? "bg-amber-50 text-amber-700" :
                    "bg-emerald-50 text-emerald-700"
                  }`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Current stock: <strong>{selectedIng.currentStock} {selectedIng.unit}</strong>
                    &nbsp;· Min threshold: {selectedIng.minThreshold} {selectedIng.unit}
                  </div>
                )}
              </div>

              {/* quantity + unit (readonly) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number" min="0.01" step="any"
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit</label>
                  <input
                    readOnly
                    value={selectedIng?.unit ?? "—"}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* costPerUnit + computed total */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Cost per Unit (Rs.) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number" min="0" step="any"
                    value={form.costPerUnit}
                    onChange={(e) => set("costPerUnit", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Cost</label>
                  <div className={`w-full px-3 py-2 text-sm border rounded-xl font-semibold ${
                    computedTotal ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    {computedTotal ? `Rs. ${computedTotal}` : "—"}
                  </div>
                </div>
              </div>

              {/* supplier + invoice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Supplier</label>
                  <input
                    value={form.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Invoice #</label>
                  <input
                    value={form.invoiceNumber}
                    onChange={(e) => set("invoiceNumber", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
              </div>

              {/* purchase date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase Date</label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                />
              </div>

              {/* notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 resize-none"
                />
              </div>

              {/* summary box */}
              {selectedIng && computedTotal && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-2">Purchase Summary</p>
                  <div className="flex justify-between">
                    <span>Ingredient</span>
                    <span className="font-medium">{selectedIng.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock after purchase</span>
                    <span className="font-medium text-emerald-600">
                      {(selectedIng.currentStock + parseFloat(form.quantity || 0)).toFixed(2)} {selectedIng.unit}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                    <span className="font-semibold">Total Cost</span>
                    <span className="font-bold text-slate-800">Rs. {computedTotal}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pt-1">
                    A cashout entry will be auto-created for this purchase.
                  </p>
                </div>
              )}

              {/* actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
