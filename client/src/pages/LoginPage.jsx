import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { setCredentials } from "../features/authSlice"
import { loginUser } from "../service/authService"

const ACCESS_LEVELS = [
  { icon: "⚙️", label: "Admin",   desc: "Dashboard, users, reports", dot: "bg-purple-500" },
  { icon: "₨",  label: "Cashier", desc: "Billing & payments",        dot: "bg-blue-500"   },
  { icon: "🍳", label: "Kitchen", desc: "Food order display",         dot: "bg-orange-500" },
  { icon: "🍹", label: "Bar",     desc: "Drink order display",        dot: "bg-cyan-500"   },
]

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    if (!email || !password) { setError("Please enter both email and password."); return }
    setLoading(true)
    try {
      const data = await loginUser({ email, password })
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
      const redirectMap = { admin: "/admin", cashier: "/cashier", kitchen: "/kitchen", bar: "/bar" }
      navigate(redirectMap[data.user.role] || "/")
    } catch (err) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-stone-50">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-emerald-950 px-14 py-14 relative overflow-hidden">

        {/* grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />
        {/* glow orbs */}
        <div className="absolute -top-24 -right-36 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(74,222,128,.12) 0%, transparent 65%)" }} />
        <div className="absolute -bottom-10 -left-20 w-[320px] h-[320px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(74,222,128,.07) 0%, transparent 65%)" }} />

        {/* brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl shadow-lg shadow-green-900/40">
            🏔
          </div>
          <span className="text-green-50 text-lg font-bold tracking-tight">Himalaya Kitchen</span>
        </div>

        {/* tagline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-green-50 leading-snug tracking-tight mb-4">
            Every order,<br />
            <span className="italic text-green-300">perfectly served.</span>
          </h2>
          <p className="text-sm text-green-50/40 leading-relaxed max-w-xs">
            A complete restaurant management system built for speed, clarity, and full control.
          </p>

          {/* role chips */}
          <div className="flex flex-wrap gap-2 mt-9">
            {[
              { label: "Admin",   color: "bg-purple-500" },
              { label: "Cashier", color: "bg-blue-500"   },
              { label: "Kitchen", color: "bg-orange-500" },
              { label: "Bar",     color: "bg-cyan-500"   },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/7 border border-white/10 text-xs font-medium text-green-50/75 backdrop-blur-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${r.color}`} />
                {r.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-green-50/20 tracking-wide">
          © 2024 Himalaya Kitchen · Staff Portal
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative">

        {/* vertical separator */}
        <div className="hidden lg:block absolute left-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-zinc-300 to-transparent" />

        <div className="w-full max-w-sm">

          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-lg">🏔</div>
            <span className="text-zinc-800 font-bold tracking-tight">Himalaya Kitchen</span>
          </div>

          {/* card */}
          <div className="bg-white rounded-3xl border border-zinc-100 p-9 shadow-xl shadow-zinc-200/60">

            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-sm text-zinc-400 mb-7">Sign in to your staff account</p>

            {/* error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm mb-5">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">

              {/* email */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@himalayakitchen.com"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                />
              </div>

              {/* password */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors text-sm p-1"
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-1 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white text-sm font-bold tracking-wide shadow-lg shadow-green-500/25 hover:-translate-y-0.5 hover:shadow-green-500/35 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in…
                  </>
                ) : "Sign in →"}
              </button>
            </form>

            {/* divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-zinc-100" />
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Access levels</span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>

            {/* access levels */}
            <div className="space-y-2">
              {ACCESS_LEVELS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-green-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-700">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                    {item.icon} {item.label}
                  </div>
                  <span className="text-xs text-zinc-400">{item.desc}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-zinc-300 mt-6">
              Having trouble? Contact your manager or admin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}