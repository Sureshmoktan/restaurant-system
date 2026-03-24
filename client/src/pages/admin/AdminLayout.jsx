// import { useState } from "react"
// import { Outlet, NavLink, useNavigate } from "react-router-dom"
// import { useSelector, useDispatch } from "react-redux"
// import { logout } from "../../features/auth/authSlice"

// const NAV_ITEMS = [
//   { path: "/admin",        label: "Dashboard",  icon: "📊", end: true  },
//   { path: "/admin/menu",   label: "Menu",        icon: "🍕", end: false },
//   { path: "/admin/tables", label: "Tables",      icon: "🪑", end: false },
//   { path: "/admin/users",  label: "Users",       icon: "👥", end: false },
// ]

// export default function AdminLayout() {
//   const [collapsed, setCollapsed] = useState(false)
//   const dispatch  = useDispatch()
//   const navigate  = useNavigate()
//   const { user }  = useSelector((s) => s.auth)

//   const handleLogout = () => {
//     dispatch(logout())
//     navigate("/login")
//   }

//   return (
//     <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

//       {/* sidebar */}
//       <aside className={`${collapsed ? "w-16" : "w-56"} bg-white border-r border-gray-100 flex flex-col transition-all duration-200 shrink-0`}>

//         {/* logo */}
//         <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
//           <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white text-sm shrink-0">🏔</div>
//           {!collapsed && <span className="font-semibold text-gray-800 text-sm truncate">Himalaya Kitchen</span>}
//         </div>

//         {/* nav */}
//         <nav className="flex-1 px-2 py-4 space-y-1">
//           {NAV_ITEMS.map((item) => (
//             <NavLink
//               key={item.path}
//               to={item.path}
//               end={item.end}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
//                 ${isActive
//                   ? "bg-green-50 text-green-700 font-medium"
//                   : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
//                 }`
//               }
//             >
//               <span className="text-base shrink-0">{item.icon}</span>
//               {!collapsed && <span className="truncate">{item.label}</span>}
//             </NavLink>
//           ))}
//         </nav>

//         {/* user + logout */}
//         <div className="p-3 border-t border-gray-100 space-y-1">
//           {!collapsed && (
//             <div className="px-3 py-2 rounded-xl bg-gray-50 mb-2">
//               <div className="text-xs font-medium text-gray-700 truncate">{user?.name}</div>
//               <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
//             </div>
//           )}
//           <button
//             onClick={() => setCollapsed(!collapsed)}
//             className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
//           >
//             <span className="shrink-0">{collapsed ? "→" : "←"}</span>
//             {!collapsed && <span>Collapse</span>}
//           </button>
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
//           >
//             <span className="shrink-0">🚪</span>
//             {!collapsed && <span>Logout</span>}
//           </button>
//         </div>
//       </aside>

//       {/* main */}
//       <div className="flex-1 flex flex-col overflow-hidden">

//         {/* header */}
//         <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
//           <div>
//             <h1 className="text-base font-semibold text-gray-800">Admin Panel</h1>
//             <p className="text-xs text-gray-400">Himalaya Kitchen Management</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold">
//               {user?.name?.charAt(0).toUpperCase()}
//             </div>
//           </div>
//         </header>

//         {/* page content */}
//         <main className="flex-1 overflow-y-auto p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }


import { useState } from "react"
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "../../features/auth/authSlice"

const NAV = [
  { path: "/admin",        label: "Dashboard", icon: "⬛", end: true  },
  { path: "/admin/menu",   label: "Menu",       icon: "⬛", end: false },
  { path: "/admin/tables", label: "Tables",     icon: "⬛", end: false },
  { path: "/admin/users",  label: "Users",      icon: "⬛", end: false },
  { path: "/admin/bills",  label: "Bills",      icon: "⬛", end: false },
]

const NAV_ICONS = {
  "/admin":        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  "/admin/menu":   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>,
  "/admin/tables": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  "/admin/users":  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  "/admin/bills":  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
}

const PAGE_TITLES = {
  "/admin":        { title: "Dashboard",        sub: "Overview & analytics"           },
  "/admin/menu":   { title: "Menu Management",  sub: "Add, edit and manage food items" },
  "/admin/tables": { title: "Table Management", sub: "Configure restaurant tables"    },
  "/admin/users":  { title: "User Management",  sub: "Manage staff accounts"          },
  "/admin/bills":  { title: "Bills & Sales",    sub: "Payment records and revenue"    },
}

export default function AdminLayout() {
  const [collapsed,    setCollapsed]    = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useSelector((s) => s.auth)

  const handleLogout = () => { dispatch(logout()); navigate("/login") }

  const currentPage = PAGE_TITLES[location.pathname] || PAGE_TITLES["/admin"]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
          HK
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">Himalaya Kitchen</div>
            <div className="text-slate-400 text-xs">Management System</div>
          </div>
        )}
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Navigation</div>}
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group
              ${isActive
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                  {NAV_ICONS[item.path]}
                </span>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* user section */}
      <div className="p-3 border-t border-slate-700/50 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>
              : <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>
            }
          </svg>
          {!collapsed && <span>{collapsed ? "Expand" : "Collapse"}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* sidebar — desktop */}
      <aside className={`hidden lg:flex flex-col ${collapsed ? "w-[68px]" : "w-64"} bg-slate-900 transition-all duration-300 shrink-0 z-30`}>
        <SidebarContent />
      </aside>

      {/* sidebar — mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* topbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">

            {/* mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div>
              <h1 className="text-sm font-bold text-slate-800">{currentPage.title}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">{currentPage.sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-slate-700 leading-tight">{user?.name}</div>
                <div className="text-xs text-slate-400 capitalize leading-tight">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* breadcrumb */}
        <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-2 flex items-center gap-2 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">{currentPage.title}</span>
        </div>

        {/* page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}