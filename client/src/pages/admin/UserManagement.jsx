import { useEffect, useState } from "react"
import userService from "../../service/userService"

const ROLE_STYLES = {
  admin:   { pill: "bg-violet-100 text-violet-700 ring-1 ring-violet-200", dot: "bg-violet-500" },
  cashier: { pill: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",         dot: "bg-sky-500" },
  kitchen: { pill: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",   dot: "bg-amber-500" },
  bar:     { pill: "bg-teal-100 text-teal-700 ring-1 ring-teal-200",      dot: "bg-teal-500" },
}

const ROLE_ICONS = { admin: "⚡", cashier: "🧾", kitchen: "🍳", bar: "🍹" }

const EMPTY_FORM = { name: "", email: "", password: "", role: "cashier" }

function Modal({ show, onClose, children }) {
  if (!show) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {children}
      </div>
    </div>
  )
}

export default function UserManagement() {
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [showReset,    setShowReset]    = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [newPass,      setNewPass]      = useState("")
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState("")
  const [showPass,     setShowPass]     = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await userService.getAll()
      setUsers(res.data.users || [])
    } catch { setUsers([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(""); setShowPass(false); setShowModal(true)
  }
  const openEdit = (user) => {
    setEditing(user); setForm({ name: user.name, email: user.email, password: "", role: user.role })
    setError(""); setShowPass(false); setShowModal(true)
  }
  const openReset = (user) => {
    setEditing(user); setNewPass(""); setError(""); setShowReset(true)
  }
  const openDelete = (user) => {
    setDeleteTarget(user); setShowDelete(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("")
    if (!form.name || !form.email || (!editing && !form.password)) {
      setError("Name, email and password are required"); return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await userService.update(editing._id, {
          name: form.name, email: form.email, role: form.role,
          ...(form.password && { password: form.password }),
        })
      } else {
        await userService.create({
          name: form.name, email: form.email, password: form.password, role: form.role,
        })
      }
      setShowModal(false); fetchUsers()
    } catch (err) { setError(err.response?.data?.message || "Something went wrong") }
    finally { setSubmitting(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault(); setError("")
    if (!newPass || newPass.length < 6) { setError("Password must be at least 6 characters"); return }
    setSubmitting(true)
    try {
      await userService.resetPassword(editing._id, newPass)
      setShowReset(false)
    } catch (err) { setError(err.response?.data?.message || "Something went wrong") }
    finally { setSubmitting(false) }
  }

  const handleToggle = async (id) => {
    try { await userService.toggle(id); fetchUsers() } catch {}
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await userService.deletePermanent(deleteTarget._id)
      setShowDelete(false); setDeleteTarget(null); fetchUsers()
    } catch {}
  }

  const admins   = users.filter((u) => u.role === "admin").length
  const cashiers = users.filter((u) => u.role === "cashier").length
  const kitchen  = users.filter((u) => u.role === "kitchen").length
  const bar      = users.filter((u) => u.role === "bar").length

  const avatarColor = (name) => {
    const colors = ["#16a34a","#0284c7","#d97706","#0d9488","#7c3aed","#db2777"]
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <div className="space-y-6 font-sans">

      {/* ── header ── */}
      <div className="px-8 pt-8 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            👥
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Staff Accounts
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {users.length} members &nbsp;·&nbsp; Himalaya Kitchen
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
          Add Staff Member
        </button>
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { count: admins,   label: "Admins",   icon: "⚡", bg: "from-violet-50 to-violet-100/50", text: "text-violet-700", sub: "text-violet-400" },
          { count: cashiers, label: "Cashiers", icon: "🧾", bg: "from-sky-50 to-sky-100/50",       text: "text-sky-700",    sub: "text-sky-400"    },
          { count: kitchen,  label: "Kitchen",  icon: "🍳", bg: "from-amber-50 to-amber-100/50",   text: "text-amber-700",  sub: "text-amber-400"  },
          { count: bar,      label: "Bar",      icon: "🍹", bg: "from-teal-50 to-teal-100/50",     text: "text-teal-700",   sub: "text-teal-400"   },
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

      {/* ── users list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-green-200 border-t-green-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading staff…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">👥</div>
          <div className="text-base font-semibold text-gray-700">No staff accounts yet</div>
          <div className="text-sm text-gray-400 mt-1 mb-5">Add your first team member to get started</div>
          <button onClick={openAdd} className="px-5 py-2.5 bg-green-600 text-white rounded-2xl text-sm font-semibold shadow">
            Add first user
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span className="col-span-4">Staff Member</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-4">Actions</span>
          </div>

          {users.map((user, i) => (
            <div
              key={user._id}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 items-center transition-colors hover:bg-gray-50/60 ${i !== users.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <div className="sm:col-span-4 flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                  style={{ background: avatarColor(user.name) }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_STYLES[user.role]?.pill || "bg-gray-100 text-gray-600"}`}>
                  <span>{ROLE_ICONS[user.role]}</span>
                  <span className="capitalize">{user.role}</span>
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${user.isActive ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "bg-gray-100 text-gray-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="sm:col-span-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => openEdit(user)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => openReset(user)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50 transition-all font-medium"
                >
                  Reset pwd
                </button>

                {user.role !== "admin" && (
                  <>
                    <button
                      onClick={() => handleToggle(user._id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                        user.isActive
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => openDelete(user)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all font-medium"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ ADD / EDIT MODAL ══════════════ */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#16a34a,#0284c7,#7c3aed)" }} />

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">{editing ? "Edit Staff Member" : "Add New Staff"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{editing ? `Updating ${editing.name}` : "Create a new team account"}</p>
          </div>
          <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-lg transition-all">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
              <span className="mt-0.5">⚠️</span> {error}
            </div>
          )}

          {[
            { label: "Full Name",     key: "name",  type: "text",  placeholder: "e.g. Ram Sharma" },
            { label: "Email Address", key: "email", type: "email", placeholder: "ram@himalayakitchen.com" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {label} <span className="text-red-400">*</span>
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {editing ? "New Password (leave blank to keep)" : <>Password <span className="text-red-400">*</span></>}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 pr-12 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm transition-all">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Role <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["cashier", "kitchen", "bar"].map((r) => (
                <button
                  key={r} type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 rounded-2xl text-xs font-semibold border transition-all capitalize flex items-center justify-center gap-1.5 ${
                    form.role === r
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {ROLE_ICONS[r]} {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-60 active:scale-95"
              style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
              {submitting ? "Saving…" : editing ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════ RESET PASSWORD MODAL ══════════════ */}
      <Modal show={showReset} onClose={() => setShowReset(false)}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#0284c7,#0ea5e9)" }} />

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Reset Password</h3>
            <p className="text-xs text-gray-400 mt-0.5">For <span className="font-semibold text-gray-600">{editing?.name}</span></p>
          </div>
          <button onClick={() => setShowReset(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-lg transition-all">
            ×
          </button>
        </div>

        <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
              <span>⚠️</span> {error}
            </div>
          )}
          <div className="px-4 py-3.5 bg-sky-50 border border-sky-100 rounded-2xl text-sm text-sky-700 flex items-start gap-2.5">
            <span>🔑</span>
            <span>A new password will be set immediately for this account.</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              New Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowReset(false)}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 font-semibold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-60 active:scale-95"
              style={{ background: "linear-gradient(135deg,#0284c7,#0369a1)", boxShadow: "0 4px 12px rgba(2,132,199,0.3)" }}>
              {submitting ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════ DELETE CONFIRM MODAL ══════════════ */}
      <Modal show={showDelete} onClose={() => setShowDelete(false)}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#ef4444,#dc2626)" }} />

        <div className="px-6 pt-7 pb-6 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl shadow-sm">
            🗑️
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Staff Account?</h3>
          <p className="text-sm text-gray-500 mb-1">You are about to permanently delete</p>
          <p className="text-sm font-semibold text-gray-800 mb-1">{deleteTarget?.name}</p>
          <p className="text-xs text-gray-400 mb-5">{deleteTarget?.email}</p>

          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 text-left flex items-start gap-2 mb-6">
            <span className="mt-0.5">⚠️</span>
            <span>This action is <strong>permanent</strong> and cannot be undone. All data associated with this account will be removed.</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowDelete(false); setDeleteTarget(null) }}
              className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.35)" }}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}