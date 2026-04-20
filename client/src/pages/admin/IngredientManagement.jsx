import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchIngredients,
  fetchIngredientStats,
  addIngredient,
  editIngredient,
  removeIngredient,
} from "../../features/ingredientSlice"

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES   = ["meat", "vegetables", "dairy", "grains", "spices", "oil", "beverages", "alcohol", "other"]
const UNITS        = ["kg", "g", "L", "ml", "pieces", "packets", "bottles", "dozens"]
const DESTINATIONS = ["kitchen", "bar", "both"]

const EMPTY_FORM = {
  name:         "",
  category:     "other",
  currentStock: "",
  unit:         "kg",
  minThreshold: "",
  costPerUnit:  "",
  supplier:     "",
  destination:  "kitchen",
}

// ─── small helpers ────────────────────────────────────────────────────────────

const statusOf = (ing) => {
  if (ing.currentStock === 0) return "out"
  if (ing.currentStock <= ing.minThreshold) return "low"
  return "ok"
}

const fmt = (n) =>
  new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(n)

// ─── badge components ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    ok:  "bg-emerald-100 text-emerald-700",
    low: "bg-amber-100  text-amber-700",
    out: "bg-red-100    text-red-700",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] ?? ""}`}>
      {status === "ok" ? "In Stock" : status === "low" ? "Low Stock" : "Out of Stock"}
    </span>
  )
}

function CategoryBadge({ category }) {
  const colors = {
    meat:       "bg-red-100    text-red-700",
    vegetables: "bg-green-100  text-green-700",
    dairy:      "bg-blue-100   text-blue-700",
    grains:     "bg-yellow-100 text-yellow-700",
    spices:     "bg-orange-100 text-orange-700",
    oil:        "bg-amber-100  text-amber-700",
    beverages:  "bg-cyan-100   text-cyan-700",
    alcohol:    "bg-purple-100 text-purple-700",
    other:      "bg-slate-100  text-slate-600",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[category] ?? colors.other}`}>
      {category}
    </span>
  )
}

function DestinationBadge({ destination }) {
  const map = {
    kitchen: "bg-orange-100 text-orange-700",
    bar:     "bg-violet-100 text-violet-700",
    both:    "bg-teal-100   text-teal-700",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[destination] ?? ""}`}>
      {destination}
    </span>
  )
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent, loading }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {loading
          ? <div className="h-6 w-16 bg-slate-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        }
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function IngredientManagement() {
  const dispatch = useDispatch()
  const { items, stats, isLoading, statsLoading } = useSelector((s) => s.ingredients)

  // modal state
  const [showModal,    setShowModal]    = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [formError,    setFormError]    = useState("")
  const [submitting,   setSubmitting]   = useState(false)

  // delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // filters
  const [search,       setSearch]       = useState("")
  const [filterCat,    setFilterCat]    = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterDest,   setFilterDest]   = useState("")

  // ── load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchIngredients({}))
    dispatch(fetchIngredientStats())
  }, [dispatch])

  // ── client-side filter ─────────────────────────────────────────────────────

  const filtered = items.filter((ing) => {
    if (filterCat    && ing.category    !== filterCat)    return false
    if (filterDest   && ing.destination !== filterDest)   return false
    if (filterStatus && statusOf(ing)   !== filterStatus) return false
    if (search && !ing.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── modal helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setShowModal(true)
  }

  const openEdit = (ing) => {
    setEditing(ing)
    setForm({
      name:         ing.name,
      category:     ing.category,
      currentStock: ing.currentStock,
      unit:         ing.unit,
      minThreshold: ing.minThreshold,
      costPerUnit:  ing.costPerUnit,
      supplier:     ing.supplier || "",
      destination:  ing.destination,
    })
    setFormError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setFormError("")
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")

    if (!form.name.trim()) return setFormError("Name is required")
    if (form.currentStock === "" || isNaN(Number(form.currentStock))) return setFormError("Current stock must be a number")
    if (form.minThreshold === "" || isNaN(Number(form.minThreshold))) return setFormError("Min threshold must be a number")

    const payload = {
      ...form,
      currentStock: Number(form.currentStock),
      minThreshold: Number(form.minThreshold),
      costPerUnit:  form.costPerUnit !== "" ? Number(form.costPerUnit) : 0,
    }

    setSubmitting(true)
    try {
      if (editing) {
        const result = await dispatch(editIngredient({ id: editing._id, data: payload }))
        if (editIngredient.rejected.match(result)) throw new Error(result.payload)
      } else {
        const result = await dispatch(addIngredient(payload))
        if (addIngredient.rejected.match(result)) throw new Error(result.payload)
      }
      dispatch(fetchIngredientStats())
      closeModal()
    } catch (err) {
      setFormError(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await dispatch(removeIngredient(deleteTarget._id))
      dispatch(fetchIngredientStats())
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Ingredients"
          value={stats?.total ?? 0}
          icon="🧂"
          accent="bg-slate-100"
          loading={statsLoading}
        />
        <StatCard
          label="Low Stock"
          value={stats?.lowStock ?? 0}
          icon="⚠️"
          accent="bg-amber-50"
          loading={statsLoading}
        />
        <StatCard
          label="Out of Stock"
          value={stats?.outOfStock ?? 0}
          icon="❌"
          accent="bg-red-50"
          loading={statsLoading}
        />
        <StatCard
          label="Inventory Value"
          value={stats ? fmt(stats.totalValue) : "Rs. 0"}
          icon="💰"
          accent="bg-emerald-50"
          loading={statsLoading}
        />
      </div>

      {/* ── header + add button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">All Ingredients</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} of {items.length} items</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Ingredient
        </button>
      </div>

      {/* ── filters ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3">
        {/* search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>

        {/* category */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>

        {/* status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700"
        >
          <option value="">All Status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>

        {/* destination */}
        <select
          value={filterDest}
          onChange={(e) => setFilterDest(e.target.value)}
          className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-700"
        >
          <option value="">All Destinations</option>
          {DESTINATIONS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>

        {(search || filterCat || filterStatus || filterDest) && (
          <button
            onClick={() => { setSearch(""); setFilterCat(""); setFilterStatus(""); setFilterDest("") }}
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
              <span className="text-sm text-slate-400">Loading ingredients...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <p className="text-sm font-medium">No ingredients found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new ingredient</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Threshold</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost/Unit</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ing) => {
                  const st = statusOf(ing)
                  const stockColor =
                    st === "out" ? "text-red-600 font-bold" :
                    st === "low" ? "text-amber-600 font-semibold" :
                    "text-slate-800"
                  return (
                    <tr key={ing._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{ing.name}</div>
                        {ing.supplier && <div className="text-xs text-slate-400 mt-0.5">Supplier: {ing.supplier}</div>}
                      </td>
                      <td className="px-5 py-3.5"><CategoryBadge category={ing.category} /></td>
                      <td className="px-5 py-3.5">
                        <span className={stockColor}>{ing.currentStock}</span>
                        <span className="text-slate-400 text-xs ml-1">{ing.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ing.minThreshold} <span className="text-slate-400 text-xs">{ing.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ing.costPerUnit > 0 ? `Rs. ${ing.costPerUnit}` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><DestinationBadge destination={ing.destination} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={st} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(ing)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(ing)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editing ? "Edit Ingredient" : "Add Ingredient"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editing ? "Update ingredient details" : "Add a new ingredient to inventory"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Chicken Breast"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-50"
                />
              </div>

              {/* category + unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 capitalize"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit <span className="text-red-400">*</span></label>
                  <select
                    value={form.unit}
                    onChange={(e) => set("unit", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* currentStock + minThreshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Stock <span className="text-red-400">*</span></label>
                  <input
                    type="number" min="0" step="any"
                    value={form.currentStock}
                    onChange={(e) => set("currentStock", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Threshold <span className="text-red-400">*</span></label>
                  <input
                    type="number" min="0" step="any"
                    value={form.minThreshold}
                    onChange={(e) => set("minThreshold", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
              </div>

              {/* costPerUnit + supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cost per Unit (Rs.)</label>
                  <input
                    type="number" min="0" step="any"
                    value={form.costPerUnit}
                    onChange={(e) => set("costPerUnit", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Supplier</label>
                  <input
                    value={form.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                </div>
              </div>

              {/* destination */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Destination</label>
                <div className="flex gap-2">
                  {DESTINATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("destination", d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        form.destination === d
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

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
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editing ? "Save Changes" : "Add Ingredient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center">Delete Ingredient?</h3>
            <p className="text-sm text-slate-500 text-center mt-2">
              <span className="font-semibold text-slate-700">{deleteTarget.name}</span> will be removed from
              inventory. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
