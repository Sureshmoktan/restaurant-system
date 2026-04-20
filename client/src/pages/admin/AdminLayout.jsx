// import { useState } from "react"
// import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
// import { useSelector, useDispatch } from "react-redux"
// import { logout } from "../../features/auth/authSlice"

// const NAV = [
//   { path: "/admin",        label: "Dashboard", icon: "⬛", end: true  },
//   { path: "/admin/menu",   label: "Menu",       icon: "⬛", end: false },
//   { path: "/admin/tables", label: "Tables",     icon: "⬛", end: false },
//   { path: "/admin/users",  label: "Users",      icon: "⬛", end: false },
//   { path: "/admin/bills",  label: "Bills",      icon: "⬛", end: false },
//   { path: "/admin/offers",  label: "Offers",     icon: "⬛", end: false }, // ← ADD

// ]

// const NAV_ICONS = {
//   "/admin":        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
//   "/admin/menu":   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>,
//   "/admin/tables": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
//   "/admin/users":  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
//   "/admin/bills":  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
//   "/admin/offers": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
// }

// const PAGE_TITLES = {
//   "/admin":        { title: "Dashboard",        sub: "Overview & analytics"           },
//   "/admin/menu":   { title: "Menu Management",  sub: "Add, edit and manage food items" },
//   "/admin/tables": { title: "Table Management", sub: "Configure restaurant tables"    },
//   "/admin/users":  { title: "User Management",  sub: "Manage staff accounts"          },
//   "/admin/bills":  { title: "Bills & Sales",    sub: "Payment records and revenue"    },
//   "/admin/offers": { title: "Offers",           sub: "Manage discounts and promotions" },
// }

// export default function AdminLayout() {
//   const [collapsed,    setCollapsed]    = useState(false)
//   const [mobileOpen,   setMobileOpen]   = useState(false)
//   const dispatch  = useDispatch()
//   const navigate  = useNavigate()
//   const location  = useLocation()
//   const { user }  = useSelector((s) => s.auth)

//   const handleLogout = () => { dispatch(logout()); navigate("/login") }

//   const currentPage = PAGE_TITLES[location.pathname] || PAGE_TITLES["/admin"]

//   const SidebarContent = () => (
//     <div className="flex flex-col h-full">

//       {/* brand */}
//       <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? "justify-center" : ""}`}>
//         <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
//           HK
//         </div>
//         {!collapsed && (
//           <div>
//             <div className="text-white font-bold text-sm leading-tight">Himalaya Kitchen</div>
//             <div className="text-slate-400 text-xs">Management System</div>
//           </div>
//         )}
//       </div>

//       {/* nav */}
//       <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//         {!collapsed && <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Navigation</div>}
//         {NAV.map((item) => (
//           <NavLink
//             key={item.path}
//             to={item.path}
//             end={item.end}
//             onClick={() => setMobileOpen(false)}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group
//               ${isActive
//                 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
//                 : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
//               } ${collapsed ? "justify-center" : ""}`
//             }
//           >
//             {({ isActive }) => (
//               <>
//                 <span className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
//                   {NAV_ICONS[item.path]}
//                 </span>
//                 {!collapsed && <span className="font-medium">{item.label}</span>}
//               </>
//             )}
//           </NavLink>
//         ))}
//       </nav>

//       {/* user section */}
//       <div className="p-3 border-t border-slate-700/50 space-y-2">
//         {!collapsed && (
//           <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800">
//             <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
//               {user?.name?.charAt(0).toUpperCase()}
//             </div>
//             <div className="flex-1 min-w-0">
//               <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
//               <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
//             </div>
//           </div>
//         )}

//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all ${collapsed ? "justify-center" : ""}`}
//         >
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             {collapsed
//               ? <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>
//               : <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>
//             }
//           </svg>
//           {!collapsed && <span>{collapsed ? "Expand" : "Collapse"}</span>}
//         </button>

//         <button
//           onClick={handleLogout}
//           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${collapsed ? "justify-center" : ""}`}
//         >
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
//             <polyline points="16 17 21 12 16 7"/>
//             <line x1="21" y1="12" x2="9" y2="12"/>
//           </svg>
//           {!collapsed && <span>Sign out</span>}
//         </button>
//       </div>
//     </div>
//   )

//   return (
//     <div className="flex h-screen bg-slate-100 overflow-hidden">

//       {/* mobile overlay */}
//       {mobileOpen && (
//         <div
//           className="fixed inset-0 bg-black/60 z-40 lg:hidden"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       {/* sidebar — desktop */}
//       <aside className={`hidden lg:flex flex-col ${collapsed ? "w-[68px]" : "w-64"} bg-slate-900 transition-all duration-300 shrink-0 z-30`}>
//         <SidebarContent />
//       </aside>

//       {/* sidebar — mobile */}
//       <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
//         <SidebarContent />
//       </aside>

//       {/* main content */}
//       <div className="flex-1 flex flex-col overflow-hidden min-w-0">

//         {/* topbar */}
//         <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
//           <div className="flex items-center gap-4">

//             {/* mobile menu button */}
//             <button
//               onClick={() => setMobileOpen(true)}
//               className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
//             >
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <line x1="3" y1="6" x2="21" y2="6"/>
//                 <line x1="3" y1="12" x2="21" y2="12"/>
//                 <line x1="3" y1="18" x2="21" y2="18"/>
//               </svg>
//             </button>

//             <div>
//               <h1 className="text-sm font-bold text-slate-800">{currentPage.title}</h1>
//               <p className="text-xs text-slate-400 hidden sm:block">{currentPage.sub}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-2 sm:gap-3">
//             <div className="hidden sm:block text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
//               {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
//             </div>
//             <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
//               <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
//                 {user?.name?.charAt(0).toUpperCase()}
//               </div>
//               <div className="hidden sm:block">
//                 <div className="text-xs font-medium text-slate-700 leading-tight">{user?.name}</div>
//                 <div className="text-xs text-slate-400 capitalize leading-tight">{user?.role}</div>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* breadcrumb */}
//         <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-2 flex items-center gap-2 text-xs text-slate-400">
//           <span>Admin</span>
//           <span>/</span>
//           <span className="text-slate-600 font-medium">{currentPage.title}</span>
//         </div>

//         {/* page */}
//         <main className="flex-1 overflow-y-auto p-4 lg:p-6">
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
  { path: "/admin",              label: "Dashboard",   end: true  },
  { path: "/admin/menu",         label: "Menu",        end: false },
  { path: "/admin/ingredients",  label: "Ingredients", end: false },
  { path: "/admin/purchases",    label: "Purchases",   end: false },
  { path: "/admin/tables",       label: "Tables",      end: false },
  { path: "/admin/users",        label: "Users",       end: false },
  { path: "/admin/bills",        label: "Bills",       end: false },
  { path: "/admin/feedback",     label: "Feedback",    end: false },
  { path: "/admin/offers",        label: "Offers",         end: false },
  { path: "/admin/discount-game", label: "Discount Game",  end: false },
  { path: "/admin/waste",         label: "Waste Log",      end: false },
  { path: "/admin/forecast",              label: "Forecast",             end: false },
  { path: "/admin/inventory-analytics", label: "Inventory Analytics",  end: false },
  { path: "/admin/audit-log",           label: "Audit Log",            end: false },
]

const NAV_ICONS = {
  "/admin":             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  "/admin/menu":        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>,
  "/admin/ingredients": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2h18v4H3z"/><path d="M3 6l2 16h14l2-16"/><line x1="9" y1="11" x2="15" y2="11"/></svg>,
  "/admin/purchases":   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  "/admin/tables":      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  "/admin/users":       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  "/admin/bills":       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  "/admin/feedback":    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  "/admin/offers":        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  "/admin/discount-game": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  "/admin/waste":       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  "/admin/forecast":              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  "/admin/inventory-analytics":  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="17" x2="21" y2="17"/><line x1="17.5" y1="14" x2="17.5" y2="21"/></svg>,
  "/admin/audit-log":            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
}

const PAGE_TITLES = {
  "/admin":             { title: "Dashboard",             sub: "Overview & analytics"                              },
  "/admin/menu":        { title: "Menu Management",       sub: "Add, edit and manage food items"                   },
  "/admin/ingredients": { title: "Ingredient Management", sub: "Track stock levels and inventory alerts"           },
  "/admin/purchases":   { title: "Purchase Management",   sub: "Record restocks and track procurement spending"    },
  "/admin/tables":      { title: "Table Management",      sub: "Configure restaurant tables"                       },
  "/admin/users":       { title: "User Management",       sub: "Manage staff accounts"                             },
  "/admin/bills":       { title: "Bills & Sales",         sub: "Payment records and revenue"                       },
  "/admin/feedback":    { title: "Customer Feedback",     sub: "Ratings, reviews and satisfaction insights"        },
  "/admin/offers":        { title: "Offers",                sub: "Manage discounts and promotions"                   },
  "/admin/discount-game": { title: "Discount Game",         sub: "Spin wheel game settings and analytics"            },
  "/admin/waste":       { title: "Waste Log",              sub: "Track ingredient waste and calculate losses"           },
  "/admin/forecast":              { title: "AI Forecast",            sub: "Demand and revenue predictions powered by Prophet ML" },
  "/admin/inventory-analytics":  { title: "Inventory Analytics",   sub: "Stock levels, consumption trends, waste and purchase insights" },
  "/admin/audit-log":            { title: "Audit Log",             sub: "Full history of staff actions and system events" },
}

export default function AdminLayout() {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((s) => s.auth)

  const handleLogout = () => { dispatch(logout()); navigate("/login") }
  const currentPage  = PAGE_TITLES[location.pathname] || PAGE_TITLES["/admin"]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">HK</div>
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
                {/* AI badge for forecast */}
                {!collapsed && item.path === "/admin/forecast" && (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>AI</span>
                )}
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
            {collapsed ? <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></> : <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>}
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
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* sidebar desktop */}
      <aside className={`hidden lg:flex flex-col ${collapsed ? "w-[68px]" : "w-64"} bg-slate-900 transition-all duration-300 shrink-0 z-30`}>
        <SidebarContent />
      </aside>

      {/* sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
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

        <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-2 flex items-center gap-2 text-xs text-slate-400">
          <span>Admin</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">{currentPage.title}</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}