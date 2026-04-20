import { useEffect, useState } from "react"
import {
  fetchAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../../service/offerService"
import { fetchMenu } from "../../service/menuService"

const SCOPE_STYLES = {
  bill:     { pill: "bg-violet-100 text-violet-700 ring-1 ring-violet-200", icon: "🧾" },
  item:     { pill: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",         icon: "🍽️" },
  category: { pill: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",   icon: "📂" },
}

const TYPE_ICONS = { percentage: "%", flat: "Rs" }

const CATEGORIES = [
  "momo", "rice", "noodles", "drinks", "desserts",
  "snacks", "soup", "bread", "bar", "specials",
]

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "percentage",
  value: "",
  scope: "bill",
  applicableItems: [],
  applicableCategory: "",
  startDate: "",
  endDate: "",
  isActive: true,
}

function Modal({ show, onClose, children }) {
  if (!show) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ offer }) {
  const now = new Date()
  const start = new Date(offer.startDate)
  const end = new Date(offer.endDate)

  if (!offer.isActive)
    return <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Inactive</span>
  if (now < start)
    return <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Upcoming</span>
  if (now > end)
    return <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-500 ring-1 ring-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Expired</span>
  return <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" })
}

function toInputDate(d) {
  if (!d) return ""
  return new Date(d).toISOString().slice(0, 10)
}

export default function OffersPage() {
  const [offers,      setOffers]      = useState([])
  const [menuItems,   setMenuItems]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleteTarget,setDeleteTarget]= useState(null)
  const [editing,     setEditing]     = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState("")

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const res = await fetchAllOffers()
      setOffers(res.data || [])
    } catch { setOffers([]) }
    finally { setLoading(false) }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await fetchMenu()
      // fetchMenu returns { success, menu: [...] }  — NOT res.data
      setMenuItems(res.menu || [])
    } catch { setMenuItems([]) }
  }

  useEffect(() => { fetchOffers(); fetchMenuItems() }, [])

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(""); setShowModal(true)
  }

  const openEdit = (offer) => {
    setEditing(offer)
    setForm({
      title:               offer.title,
      description:         offer.description || "",
      type:                offer.type,
      value:               offer.value,
      scope:               offer.scope,
      applicableItems:     offer.applicableItems?.map((i) => i._id || i) || [],
      applicableCategory:  offer.applicableCategory || "",
      startDate:           toInputDate(offer.startDate),
      endDate:             toInputDate(offer.endDate),
      isActive:            offer.isActive,
    })
    setError("")
    setShowModal(true)
  }

  const openDelete = (offer) => { setDeleteTarget(offer); setShowDelete(true) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("")
    if (!form.title || !form.value || !form.startDate || !form.endDate) {
      setError("Title, value and dates are required"); return
    }
    if (form.scope === "item" && form.applicableItems.length === 0) {
      setError("Select at least one menu item"); return
    }
    if (form.scope === "category" && !form.applicableCategory) {
      setError("Select a category"); return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        applicableItems:    form.scope === "item"     ? form.applicableItems : [],
        applicableCategory: form.scope === "category" ? form.applicableCategory : null,
      }
      if (editing) {
        await updateOffer(editing._id, payload)
      } else {
        await createOffer(payload)
      }
      setShowModal(false); fetchOffers()
    } catch (err) { setError(err.response?.data?.message || "Something went wrong") }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteOffer(deleteTarget._id)
      setShowDelete(false); setDeleteTarget(null); fetchOffers()
    } catch {}
  }

  const toggleItem = (id) => {
    setForm((f) => ({
      ...f,
      applicableItems: f.applicableItems.includes(id)
        ? f.applicableItems.filter((i) => i !== id)
        : [...f.applicableItems, id],
    }))
  }

  const now = new Date()
  const activeCount   = offers.filter((o) => o.isActive && new Date(o.startDate) <= now && new Date(o.endDate) >= now).length
  const upcomingCount = offers.filter((o) => o.isActive && new Date(o.startDate) > now).length
  const expiredCount  = offers.filter((o) => new Date(o.endDate) < now).length

  return (
    <div className="space-y-6 font-sans">

      {/* ── header ── */}
      <div className="px-8 pt-8 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            🏷️
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Offers & Discounts
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {offers.length} total &nbsp;·&nbsp; Himalaya Kitchen
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 hover:shadow-xl shrink-0"
          style={{
            background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
            boxShadow: "0 6px 20px rgba(22,163,74,0.4)",
          }}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-base font-black leading-none group-hover:rotate-90 transition-transform duration-300">
            +
          </span>
          Create Offer
        </button>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { count: offers.length, label: "Total",    icon: "🏷️", bg: "from-gray-50 to-gray-100/50",     text: "text-gray-700",    sub: "text-gray-400"    },
          { count: activeCount,   label: "Active",   icon: "✅",  bg: "from-emerald-50 to-emerald-100/50",text: "text-emerald-700", sub: "text-emerald-400" },
          { count: upcomingCount, label: "Upcoming", icon: "⏳",  bg: "from-sky-50 to-sky-100/50",       text: "text-sky-700",     sub: "text-sky-400"     },
          { count: expiredCount,  label: "Expired",  icon: "🔴",  bg: "from-red-50 to-red-100/50",       text: "text-red-700",     sub: "text-red-400"     },
        ].map(({ count, label, icon, bg, text, sub }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className="text-2xl">{icon}</div>
            <div>
              <div className={`text-2xl font-bold leading-none ${text}`}>{count}</div>
              <div className={`text-xs mt-0.5 font-medium ${sub}`}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── offers list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-green-200 border-t-green-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading offers…</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">🏷️</div>
          <div className="text-base font-semibold text-gray-700">No offers yet</div>
          <div className="text-sm text-gray-400 mt-1 mb-5">Create your first offer — Dashain, Christmas, Happy Hour…</div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-green-600 text-white rounded-2xl text-sm font-semibold shadow">
            Create first offer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span className="col-span-3">Offer</span>
            <span className="col-span-2">Discount</span>
            <span className="col-span-2">Scope</span>
            <span className="col-span-2">Duration</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2">Actions</span>
          </div>

          {offers.map((offer, i) => (
            <div
              key={offer._id}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 items-center transition-colors hover:bg-gray-50/60 ${i !== offers.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              {/* title + description */}
              <div className="sm:col-span-3">
                <div className="text-sm font-semibold text-gray-800">{offer.title}</div>
                {offer.description && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{offer.description}</div>
                )}
                {offer.source === "ml" && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 ring-1 ring-purple-200 font-medium">🤖 ML</span>
                )}
                {offer.source === "ai_suggested" && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-200 font-medium">🤖 AI</span>
                )}
              </div>

              {/* discount value */}
              <div className="sm:col-span-2">
                <span className="inline-flex items-center gap-1 text-sm font-black text-gray-800">
                  {offer.type === "percentage"
                    ? <>{offer.value}<span className="text-xs font-semibold text-gray-500">% off</span></>
                    : <>Rs. {offer.value}<span className="text-xs font-semibold text-gray-500"> off</span></>
                  }
                </span>
              </div>

              {/* scope */}
              <div className="sm:col-span-2">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${SCOPE_STYLES[offer.scope]?.pill}`}>
                  {SCOPE_STYLES[offer.scope]?.icon}
                  <span className="capitalize">{offer.scope}</span>
                </span>
              </div>

              {/* dates */}
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">{formatDate(offer.startDate)}</div>
                <div className="text-xs text-gray-400">→ {formatDate(offer.endDate)}</div>
              </div>

              {/* status */}
              <div className="sm:col-span-1">
                <StatusBadge offer={offer} />
              </div>

              {/* actions */}
              <div className="sm:col-span-2 flex items-center gap-2">
                <button
                  onClick={() => openEdit(offer)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDelete(offer)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ CREATE / EDIT MODAL ══════════════ */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#16a34a,#0284c7,#7c3aed)" }} />

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">{editing ? "Edit Offer" : "Create New Offer"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{editing ? `Updating "${editing.title}"` : "Dashain, Christmas, Happy Hour…"}</p>
          </div>
          <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-lg transition-all">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
              <span className="mt-0.5">⚠️</span> {error}
            </div>
          )}

          {/* title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Dashain Special, Happy Hour"
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
            />
          </div>

          {/* description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description <span className="text-gray-300">(optional)</span></label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description shown to cashier"
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
            />
          </div>

          {/* type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Discount Type <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {["percentage", "flat"].map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                      form.type === t
                        ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {t === "percentage" ? "% Off" : "Rs. Off"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Value <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  {form.type === "percentage" ? "%" : "Rs"}
                </span>
                <input
                  type="number"
                  min="0"
                  max={form.type === "percentage" ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="20"
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Apply To <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "bill",     label: "Whole Bill", icon: "🧾" },
                { key: "item",     label: "Item(s)",    icon: "🍽️" },
                { key: "category", label: "Category",   icon: "📂" },
              ].map(({ key, label, icon }) => (
                <button key={key} type="button"
                  onClick={() => setForm({ ...form, scope: key, applicableItems: [], applicableCategory: "" })}
                  className={`py-2.5 rounded-2xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                    form.scope === key
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base">{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* item picker */}
          {form.scope === "item" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Select Items <span className="text-red-400">*</span></label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {menuItems.map((item) => (
                  <label key={item._id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                    form.applicableItems.includes(item._id)
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={form.applicableItems.includes(item._id)}
                      onChange={() => toggleItem(item._id)}
                      className="accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-700 flex-1">{item.name}</span>
                    <span className="text-xs text-gray-400">Rs. {item.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* category picker */}
          {form.scope === "category" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Select Category <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button"
                    onClick={() => setForm({ ...form, applicableCategory: cat })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      form.applicableCategory === cat
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* dates */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Start Date", key: "startDate" },
              { label: "End Date",   key: "endDate"   },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label} <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
            ))}
          </div>

          {/* active toggle */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <div className="text-sm font-semibold text-gray-700">Active</div>
              <div className="text-xs text-gray-400">Inactive offers won't apply at cashier</div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`w-11 h-6 rounded-full transition-all relative ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isActive ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-60 active:scale-95"
              style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
              {submitting ? "Saving…" : editing ? "Update Offer" : "Create Offer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════ DELETE MODAL ══════════════ */}
      <Modal show={showDelete} onClose={() => setShowDelete(false)}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#ef4444,#dc2626)" }} />
        <div className="px-6 pt-7 pb-6 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl shadow-sm">🗑️</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Offer?</h3>
          <p className="text-sm text-gray-500 mb-1">You are about to delete</p>
          <p className="text-sm font-semibold text-gray-800 mb-5">"{deleteTarget?.title}"</p>
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 text-left flex items-start gap-2 mb-6">
            <span className="mt-0.5">⚠️</span>
            <span>This offer will be permanently removed and won't apply at cashier anymore.</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowDelete(false); setDeleteTarget(null) }}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-semibold transition-all">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.35)" }}>
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}