import { useEffect, useState, useCallback } from "react"
import api from "../../service/api"

// ─── colour maps ──────────────────────────────────────────────────────────────
const ACTION_COLORS = {
  USER_LOGIN:         "bg-emerald-100 text-emerald-700",
  USER_LOGOUT:        "bg-slate-100   text-slate-600",
  USER_CREATE:        "bg-blue-100    text-blue-700",
  USER_UPDATE:        "bg-amber-100   text-amber-700",
  USER_DEACTIVATE:    "bg-red-100     text-red-700",
  MENU_CREATE:        "bg-teal-100    text-teal-700",
  MENU_UPDATE:        "bg-amber-100   text-amber-700",
  MENU_DELETE:        "bg-red-100     text-red-700",
  ORDER_PLACED:       "bg-blue-100    text-blue-700",
  ORDER_STATUS_CHANGE:"bg-amber-100   text-amber-700",
  ORDER_CANCELLED:    "bg-red-100     text-red-700",
  BILL_GENERATED:     "bg-purple-100  text-purple-700",
  BILL_PAYMENT:       "bg-emerald-100 text-emerald-700",
  OFFER_CREATE:       "bg-teal-100    text-teal-700",
  OFFER_ACTIVATE:     "bg-emerald-100 text-emerald-700",
  OFFER_DEACTIVATE:   "bg-slate-100   text-slate-600",
  OFFER_UPDATE:       "bg-amber-100   text-amber-700",
  OFFER_DELETE:       "bg-red-100     text-red-700",
}

const ROLE_COLORS = {
  admin:   "bg-purple-100 text-purple-700",
  cashier: "bg-blue-100   text-blue-700",
  kitchen: "bg-amber-100  text-amber-700",
  bar:     "bg-teal-100   text-teal-700",
  customer:"bg-slate-100  text-slate-600",
}

const ALL_ACTIONS = [
  "USER_LOGIN", "USER_LOGOUT", "USER_CREATE", "USER_UPDATE", "USER_DEACTIVATE",
  "MENU_CREATE", "MENU_UPDATE", "MENU_DELETE",
  "ORDER_PLACED", "ORDER_STATUS_CHANGE", "ORDER_CANCELLED",
  "BILL_GENERATED", "BILL_PAYMENT",
  "OFFER_CREATE", "OFFER_ACTIVATE", "OFFER_DEACTIVATE", "OFFER_UPDATE", "OFFER_DELETE",
]

const ROLES = ["admin", "cashier", "kitchen", "bar", "customer"]

const TARGET_MODELS = ["", "User", "Menu", "Order", "Bill", "Offer"]

function fmt(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function ActionBadge({ action }) {
  const cls = ACTION_COLORS[action] || "bg-slate-100 text-slate-600"
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {action}
    </span>
  )
}

function RoleBadge({ role }) {
  const cls = ROLE_COLORS[role] || "bg-slate-100 text-slate-600"
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {role || "—"}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading audit logs...</span>
      </div>
    </div>
  )
}

function DetailModal({ log, onClose }) {
  if (!log) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Audit Entry Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Timestamp"   value={fmt(log.createdAt)} />
          <Row label="Action"      value={<ActionBadge action={log.action} />} />
          <Row label="Actor"       value={log.actorName || "System"} />
          <Row label="Role"        value={<RoleBadge role={log.actorRole} />} />
          <Row label="Target"      value={log.targetModel ? `${log.targetModel} / ${log.targetId || "—"}` : "—"} />
          <Row label="IP"          value={log.ip || "—"} />

          {log.details && Object.keys(log.details).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Details</p>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-24 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}

export default function AuditLogPage() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)

  // filters
  const [search,      setSearch]      = useState("")
  const [roleFilter,  setRoleFilter]  = useState("")
  const [actionFilter,setActionFilter]= useState("")
  const [modelFilter, setModelFilter] = useState("")
  const [startDate,   setStartDate]   = useState("")
  const [endDate,     setEndDate]     = useState("")
  const [page,        setPage]        = useState(1)
  const LIMIT = 50

  const [selected, setSelected] = useState(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (roleFilter)   params.set("role",        roleFilter)
      if (actionFilter) params.set("action",       actionFilter)
      if (modelFilter)  params.set("targetModel",  modelFilter)
      if (startDate)    params.set("startDate",    startDate)
      if (endDate)      params.set("endDate",      endDate)
      // name search is client-side filtered after fetch
      const res = await api.get(`/audit?${params.toString()}`)
      setLogs(res.data.logs || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch (err) {
      console.error("Failed to load audit logs", err)
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, actionFilter, modelFilter, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // reset to page 1 whenever any filter changes
  useEffect(() => { setPage(1) }, [roleFilter, actionFilter, modelFilter, startDate, endDate, search])

  const displayed = search.trim()
    ? logs.filter(l =>
        (l.actorName || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.action    || "").toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const handleClearFilters = () => {
    setSearch("")
    setRoleFilter("")
    setActionFilter("")
    setModelFilter("")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const hasFilters = search || roleFilter || actionFilter || modelFilter || startDate || endDate

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Audit Log</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {total.toLocaleString()} total entries
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* filters card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* name / action search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name or action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
            />
          </div>

          {/* role */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 text-slate-700"
          >
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>

          {/* action */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 text-slate-700"
          >
            <option value="">All actions</option>
            {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* target model */}
          <select
            value={modelFilter}
            onChange={e => setModelFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 text-slate-700"
          >
            <option value="">All models</option>
            {TARGET_MODELS.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* start date */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
            />
          </div>

          {/* end date */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
            />
          </div>

          {/* clear */}
          {hasFilters && (
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <Spinner />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p className="text-sm font-medium">No audit entries found</p>
            {hasFilters && <p className="text-xs mt-1">Try adjusting or clearing your filters</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Details</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {fmt(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{log.actorName || "System"}</div>
                      {log.actor?.email && (
                        <div className="text-xs text-slate-400 truncate max-w-[140px]">{log.actor.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={log.actorRole} />
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {log.targetModel ? (
                        <span>
                          <span className="font-medium">{log.targetModel}</span>
                          {log.targetId && (
                            <span className="text-slate-400 ml-1 font-mono truncate block max-w-[100px]">
                              {log.targetId.slice(-8)}
                            </span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden xl:table-cell max-w-[200px]">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <span className="truncate block">
                          {Object.entries(log.details)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(log)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* pagination */}
        {!loading && pages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page {page} of {pages} &mdash; {total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              {/* page number pills */}
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const p = page <= 4 ? i + 1
                  : page >= pages - 3 ? pages - 6 + i
                  : page - 3 + i
                if (p < 1 || p > pages) return null
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                      p === page
                        ? "bg-emerald-500 text-white border-emerald-500 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* detail modal */}
      <DetailModal log={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
