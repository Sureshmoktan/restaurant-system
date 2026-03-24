// import { useEffect, useState } from "react"
// import { useParams }           from "react-router-dom"
// import { fetchMenu }           from "../service/menuService"
// import { placeOrder, fetchOrders } from "../service/orderService"
// import useSocket               from "../hooks/useSocket"

// const FOOD_CATS = ["Breakfast","Lunch","Dinner","Snacks","Desserts","Specials"]
// const BAR_CATS  = ["Beverages","Cocktails","Mocktails","Beer","Wine"]
// const ALL_CATS  = ["all", ...FOOD_CATS, ...BAR_CATS]

// const CAT_ICONS = {
//   all:"🍽", Breakfast:"🌅", Lunch:"🍱", Dinner:"🍛",
//   Snacks:"🍿", Desserts:"🍰", Specials:"⭐",
//   Beverages:"🥤", Cocktails:"🍹", Mocktails:"🧃", Beer:"🍺", Wine:"🍷",
// }

// const STATUS_CONFIG = {
//   pending:   { label: "Received",  color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-500"  },
//   cooking:   { label: "Preparing", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200",dot: "bg-orange-500" },
//   ready:     { label: "Ready! 🎉", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-300", dot: "bg-green-500"  },
//   served:    { label: "Served",    color: "text-zinc-500",   bg: "bg-zinc-50",   border: "border-zinc-200",  dot: "bg-zinc-400"   },
//   cancelled: { label: "Cancelled", color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   dot: "bg-red-500"    },
// }

// // ─── Customize Modal ──────────────────────────────────────────
// function CustomizeModal({ item, onClose, onAdd }) {
//   const [removed, setRemoved] = useState([])
//   const [options, setOptions] = useState({})
//   const [qty,     setQty]     = useState(1)
//   const [error,   setError]   = useState("")

//   const toggleRemove = (name) =>
//     setRemoved((p) => p.includes(name) ? p.filter((n) => n !== name) : [...p, name])

//   const selectOption = (groupName, value, type) => {
//     setOptions((prev) => {
//       const cur = prev[groupName] || []
//       if (type === "single" || type === "scale") return { ...prev, [groupName]: [value] }
//       if (cur.includes(value)) return { ...prev, [groupName]: cur.filter((v) => v !== value) }
//       return { ...prev, [groupName]: [...cur, value] }
//     })
//   }

//   const handleAdd = () => {
//     setError("")
//     for (const group of item.optionGroups || []) {
//       if (group.required && (!options[group.groupName] || !options[group.groupName].length)) {
//         setError(`Please select ${group.groupName}`)
//         return
//       }
//     }
//     onAdd(item, {
//       removed, qty,
//       kept:    item.ingredients?.filter((i) => !removed.includes(i.name)).map((i) => i.name) || [],
//       options: Object.entries(options).map(([groupName, selected]) => ({ groupName, selected })),
//     })
//   }

//   const spiceColors = ["#1D9E75","#639922","#EF9F27","#D85A30","#E24B4A"]
//   const spiceBgs    = ["#E1F5EE","#EAF3DE","#FFF3E0","#FAECE7","#FCEBEB"]
//   const spiceEmoji  = ["😊","🌶","🌶🌶","🌶🌶🌶","🔥"]

//   return (
//     <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
//       <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
//         <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-start justify-between z-10 rounded-t-3xl">
//           <div>
//             <div className="text-lg font-bold text-zinc-900">{item.name}</div>
//             <div className="text-base font-bold text-green-600 mt-0.5">Rs. {item.price}</div>
//           </div>
//           <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xl ml-4 hover:bg-zinc-200 transition-all">×</button>
//         </div>

//         <div className="p-6 space-y-4">
//           {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{error}</div>}

//           {item.optionGroups?.map((group) => {
//             const selected = options[group.groupName] || []
//             return (
//               <div key={group.groupName} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="text-sm font-bold text-zinc-800">{group.groupName}</div>
//                   {group.required
//                     ? <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 border border-red-200 rounded-full font-bold">Required</span>
//                     : <span className="text-xs bg-zinc-200 text-zinc-500 px-2.5 py-1 rounded-full">Optional</span>}
//                 </div>
//                 {(group.type === "scale" || group.type === "single") && (
//                   <div className="flex gap-2">
//                     {group.options.map((opt, idx) => {
//                       const isSel = selected.includes(opt.value)
//                       const color = group.type === "scale" ? (spiceColors[idx] || "#16a34a") : "#16a34a"
//                       const bg    = group.type === "scale" ? (spiceBgs[idx]    || "#f0fdf4") : "#f0fdf4"
//                       return (
//                         <button key={opt.value} onClick={() => selectOption(group.groupName, opt.value, group.type)}
//                           className="flex-1 py-3 px-1 rounded-xl border-2 text-center transition-all"
//                           style={{ background: isSel ? bg : "white", borderColor: isSel ? color : "#e4e4e7" }}>
//                           {group.type === "scale" && <div className="text-lg mb-1">{spiceEmoji[idx] || "•"}</div>}
//                           <div className="text-xs font-bold" style={{ color: isSel ? color : "#a1a1aa" }}>{opt.label}</div>
//                         </button>
//                       )
//                     })}
//                   </div>
//                 )}
//                 {group.type === "multiple" && (
//                   <div className="space-y-2">
//                     {group.options.map((opt) => {
//                       const isSel = selected.includes(opt.value)
//                       return (
//                         <div key={opt.value} onClick={() => selectOption(group.groupName, opt.value, "multiple")}
//                           className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all
//                             ${isSel ? "bg-green-50 border-green-400" : "bg-white border-zinc-200 hover:border-green-300"}`}>
//                           <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-green-600 border-green-600" : "border-zinc-300"}`}>
//                             {isSel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
//                           </div>
//                           <span className={`text-sm font-medium ${isSel ? "text-green-700" : "text-zinc-600"}`}>{opt.label}</span>
//                         </div>
//                       )
//                     })}
//                   </div>
//                 )}
//               </div>
//             )
//           })}

//           {item.ingredients?.filter((i) => i.optional).length > 0 && (
//             <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
//               <div className="text-sm font-bold text-zinc-800 mb-3">Remove ingredients <span className="text-xs text-zinc-400 font-normal ml-1">tap to remove</span></div>
//               <div className="flex flex-wrap gap-2">
//                 {item.ingredients.filter((i) => i.optional).map((ing) => {
//                   const isRem = removed.includes(ing.name)
//                   return (
//                     <button key={ing.name} onClick={() => toggleRemove(ing.name)}
//                       className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all
//                         ${isRem ? "bg-red-50 border-red-300 text-red-600 line-through" : "bg-white border-zinc-200 text-zinc-600 hover:border-red-300"}`}>
//                       {ing.name}
//                     </button>
//                   )
//                 })}
//               </div>
//             </div>
//           )}

//           <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 rounded-2xl px-6 py-4 shadow-lg shadow-green-200">
//             <div className="flex items-center gap-4">
//               <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border-2 border-white/30 text-white text-xl flex items-center justify-center hover:bg-white/10 transition-all">−</button>
//               <span className="text-white font-bold text-xl w-6 text-center">{qty}</span>
//               <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 rounded-full border-2 border-white/30 text-white text-xl flex items-center justify-center hover:bg-white/10 transition-all">+</button>
//             </div>
//             <button onClick={handleAdd} className="text-white font-bold">Add to cart — Rs. {item.price * qty}</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ─── Main ─────────────────────────────────────────────────────
// export default function CustomerTablet() {
//   const { tableNumber } = useParams()
//   const [menu,     setMenu]     = useState([])
//   const [cart,     setCart]     = useState([])
//   const [filter,   setFilter]   = useState("all")
//   const [view,     setView]     = useState("menu")
//   const [orders,   setOrders]   = useState([])
//   const [placing,  setPlacing]  = useState(false)
//   const [selected, setSelected] = useState(null)
//   const [loading,  setLoading]  = useState(true)

//   // ✅ Fetch active orders from backend on mount (fixes refresh issue)
//   useEffect(() => {
//     const loadActiveOrders = async () => {
//       try {
//         const res = await fetchOrders({ tableNumber, status: "pending,cooking,ready,served" })
//         if (res.orders?.length > 0) setOrders(res.orders)
//       } catch {}
//     }
//     loadActiveOrders()
//   }, [tableNumber])

//   useEffect(() => {
//     fetchMenu({ isAvailable: true })
//       .then((d) => setMenu(d.menu || []))
//       .catch(() => {})
//       .finally(() => setLoading(false))
//   }, [])

//   useSocket(
//     {
//       "order-status-update": (data) => {
//         setOrders((prev) => prev.map((o) => o._id === data.orderId ? { ...o, status: data.status } : o))
//       },
//       "order-cancelled": (data) => {
//         setOrders((prev) => prev.map((o) => o._id === data.orderId ? { ...o, status: "cancelled", cancelReason: data.reason } : o))
//       },
//     },
//     [{ event: "join-table", value: tableNumber }]
//   )

//   const filtered     = filter === "all" ? menu : menu.filter((i) => i.category === filter)
//   const cartTotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0)
//   const cartCount    = cart.reduce((s, i) => s + i.quantity, 0)
//   const activeOrders = orders.filter((o) => !["served","cancelled"].includes(o.status))

//   const addToCart = (item, opts = {}) => {
//     const key = item._id + JSON.stringify(opts)
//     setCart((prev) => {
//       const exists = prev.find((c) => c.key === key)
//       if (exists) return prev.map((c) => c.key === key ? { ...c, quantity: c.quantity + (opts.qty || 1) } : c)
//       return [...prev, {
//         key, menuItem: item._id, name: item.name, price: item.price,
//         quantity: opts.qty || 1, image: item.image,
//         selectedIngredients: opts.kept    || [],
//         removedIngredients:  opts.removed || [],
//         selectedOptions:     opts.options || [],
//       }]
//     })
//     setSelected(null)
//   }

//   const updateQty = (key, delta) =>
//     setCart((prev) =>
//       prev.map((c) => c.key === key ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
//         .filter((c) => c.quantity > 0)
//     )

//   const handlePlaceOrder = async () => {
//     if (!cart.length) return
//     setPlacing(true)
//     try {
//       const res = await placeOrder({
//         tableNumber: (tableNumber),
//         items: cart.map(({ menuItem, name, price, quantity, selectedIngredients, removedIngredients, selectedOptions }) => ({
//           menuItem, name, price, quantity, selectedIngredients, removedIngredients, selectedOptions,
//         })),
//         totalAmount: cartTotal,
//       })
//       setOrders((prev) => [...prev, res.order])
//       setCart([])
//       setView("tracker")
//     } catch {}
//     finally { setPlacing(false) }
//   }

//   const handleItemClick = (item) => {
//     const hasCustom = item.ingredients?.some((i) => i.optional) || item.optionGroups?.length > 0
//     if (hasCustom) setSelected(item)
//     else addToCart(item, { qty: 1 })
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col">

//       {/* ── HEADER ── */}
//       <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xl shadow-sm shadow-green-200">🏔</div>
//           <div>
//             <div className="text-base font-bold text-gray-900 leading-tight">Himalaya Kitchen</div>
//             <div className="text-sm text-gray-400">Table {tableNumber}</div>
//           </div>
//         </div>

//         {/* nav tabs */}
//         <div className="flex items-center gap-2">
//           {[
//             { key: "menu",    label: "Menu",    icon: "🍽" },
//             { key: "cart",    label: cartCount > 0 ? `Cart (${cartCount})` : "Cart", icon: "🛒" },
//             { key: "tracker", label: activeOrders.length > 0 ? `Orders (${activeOrders.length})` : "Orders", icon: "📋" },
//           ].map((v) => (
//             <button key={v.key} onClick={() => setView(v.key)}
//               className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
//                 ${view === v.key ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
//               <span>{v.icon}</span>
//               <span>{v.label}</span>
//               {v.key === "tracker" && activeOrders.length > 0 && view !== "tracker" && (
//                 <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{activeOrders.length}</span>
//               )}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── MENU ── */}
//       {view === "menu" && (
//         <div className="flex-1 flex flex-col">
//           {/* category tabs */}
//           <div className="flex gap-2 px-6 py-3 overflow-x-auto bg-white border-b border-gray-100">
//             {ALL_CATS.map((cat) => (
//               <button key={cat} onClick={() => setFilter(cat)}
//                 className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all
//                   ${filter === cat ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
//                 <span>{CAT_ICONS[cat]}</span>
//                 <span>{cat === "all" ? "All Items" : cat}</span>
//               </button>
//             ))}
//           </div>

//           {/* ✅ Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
//           <div className="flex-1 overflow-y-auto p-6 pb-28">
//             {loading ? (
//               <div className="flex flex-col items-center justify-center h-64 gap-4">
//                 <div className="w-10 h-10 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin" />
//                 <span className="text-gray-400 font-medium">Loading menu...</span>
//               </div>
//             ) : filtered.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-64 gap-3">
//                 <span className="text-5xl opacity-20">🍽</span>
//                 <span className="text-gray-400 font-medium">No items in this category</span>
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
//                 {filtered.map((item) => (
//                   <div key={item._id}
//                     className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col cursor-pointer group"
//                     onClick={() => handleItemClick(item)}
//                   >
//                     {/* image */}
//                     <div className="relative bg-gray-50 aspect-square overflow-hidden">
//                       {item.image
//                         ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
//                         : (
//                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
//                             <span className="text-5xl">{CAT_ICONS[item.category] || "🍽"}</span>
//                           </div>
//                         )
//                       }
//                       {/* veg dot */}
//                       <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm
//                         ${item.isVeg ? "bg-green-500 border-green-600" : "bg-red-500 border-red-600"}`}>
//                         <div className="w-2 h-2 rounded-full bg-white" />
//                       </div>
//                       {/* bar badge */}
//                       {item.destination === "bar" && (
//                         <div className="absolute top-2 left-2 bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">Bar</div>
//                       )}
//                       {/* customizable badge */}
//                       {(item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional)) && (
//                         <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">Custom</div>
//                       )}
//                     </div>

//                     {/* info */}
//                     <div className="p-3 flex flex-col flex-1">
//                       <div className="text-sm font-bold text-gray-900 leading-tight mb-1">{item.name}</div>
//                       {item.description && (
//                         <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2 flex-1">{item.description}</div>
//                       )}
//                       <div className="mt-auto pt-2 flex items-center justify-between">
//                         <div className="text-sm font-bold text-green-600">Rs. {item.price}</div>
//                         <div className={`text-xs font-bold px-2.5 py-1 rounded-lg
//                           ${item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional)
//                             ? "bg-amber-100 text-amber-700"
//                             : "bg-green-100 text-green-700"}`}>
//                           {item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional) ? "Customize" : "Order Now"}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* sticky cart bar */}
//           {cartCount > 0 && (
//             <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 shadow-xl z-10">
//               <div className="max-w-2xl mx-auto">
//                 <button onClick={() => setView("cart")}
//                   className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-green-200 hover:-translate-y-0.5 transition-all">
//                   <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">{cartCount} items</span>
//                   <span className="text-base">View Cart →</span>
//                   <span>Rs. {cartTotal}</span>
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* CUSTOMIZE MODAL */}
//       {selected && <CustomizeModal item={selected} onClose={() => setSelected(null)} onAdd={addToCart} />}

//       {/* ── CART ── */}
//       {view === "cart" && (
//         <div className="flex-1 flex flex-col">
//           <div className="flex-1 overflow-y-auto p-6 pb-56">
//             {cart.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-64 gap-4">
//                 <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-5xl">🛒</div>
//                 <div className="text-base font-semibold text-gray-500">Your cart is empty</div>
//                 <button onClick={() => setView("menu")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold">Browse Menu</button>
//               </div>
//             ) : (
//               <div className="max-w-2xl mx-auto space-y-3">
//                 {cart.map((item) => (
//                   <div key={item.key} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4 shadow-sm">
//                     <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
//                       {item.image
//                         ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
//                         : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🍽</div>}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="text-base font-bold text-gray-900">{item.name}</div>
//                       {item.selectedOptions?.map((opt) => (
//                         <div key={opt.groupName} className="text-xs text-blue-500 font-medium mt-0.5">{opt.groupName}: {opt.selected?.join(", ")}</div>
//                       ))}
//                       {item.removedIngredients?.length > 0 && (
//                         <div className="text-xs text-red-400 font-medium mt-0.5">No: {item.removedIngredients.join(", ")}</div>
//                       )}
//                       <div className="text-base font-bold text-green-600 mt-1">Rs. {item.price * item.quantity}</div>
//                     </div>
//                     <div className="flex items-center gap-2 flex-shrink-0">
//                       <button onClick={() => updateQty(item.key, -1)} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all font-bold">−</button>
//                       <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
//                       <button onClick={() => updateQty(item.key, 1)} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all font-bold">+</button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {cart.length > 0 && (
//             <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-sm border-t border-gray-100 shadow-xl z-10">
//               <div className="max-w-2xl mx-auto space-y-3">
//                 <div className="grid grid-cols-3 gap-4 text-sm px-1">
//                   <div className="flex justify-between col-span-1"><span className="text-gray-500">Subtotal</span><span className="font-semibold">Rs. {cartTotal}</span></div>
//                   <div className="flex justify-between col-span-1"><span className="text-gray-500">VAT (13%)</span><span className="font-semibold">Rs. {Math.round(cartTotal * 0.13)}</span></div>
//                   <div className="flex justify-between col-span-1 font-bold text-base"><span>Total</span><span className="text-green-600">Rs. {Math.round(cartTotal * 1.13)}</span></div>
//                 </div>
//                 <button onClick={handlePlaceOrder} disabled={placing}
//                   className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-200 disabled:opacity-70 flex items-center justify-center gap-2 text-base hover:-translate-y-0.5 transition-all">
//                   {placing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing order...</> : "Place Order →"}
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── TRACKER ── */}
//       {view === "tracker" && (
//         <div className="flex-1 overflow-y-auto p-6">
//           {orders.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-64 gap-4">
//               <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-5xl">📋</div>
//               <div className="text-base font-semibold text-gray-500">No orders yet</div>
//               <button onClick={() => setView("menu")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold">Order Now</button>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
//               {orders.map((order) => {
//                 const steps = ["pending","cooking","ready","served"]
//                 const isCancelled = order.status === "cancelled"
//                 const cfg   = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
//                 const stepIdx = steps.indexOf(order.status)

//                 return (
//                   <div key={order._id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm ${cfg.border}`}>
//                     <div className="flex items-center justify-between mb-4">
//                       <div className="flex items-center gap-2">
//                         <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${!isCancelled && order.status !== "served" ? "animate-pulse" : ""}`} />
//                         <span className="font-bold text-gray-900">Order #{order._id?.slice(-4).toUpperCase()}</span>
//                       </div>
//                       <span className={`text-xs px-3 py-1 rounded-full font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
//                     </div>

//                     <div className="space-y-1.5 mb-4">
//                       {order.items?.map((item, i) => (
//                         <div key={i} className="flex justify-between text-sm">
//                           <span className="text-gray-600">{item.quantity}× {item.name}</span>
//                           <span className="text-gray-400 font-medium">Rs. {item.price * item.quantity}</span>
//                         </div>
//                       ))}
//                     </div>

//                     {isCancelled ? (
//                       <div className="bg-red-50 rounded-xl p-4 border border-red-200">
//                         <div className="text-sm font-bold text-red-600 mb-1">❌ Order Cancelled</div>
//                         <div className="text-sm text-red-500 italic">"{order.cancelReason}"</div>
//                         <button onClick={() => setView("menu")} className="mt-3 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">Order something else →</button>
//                       </div>
//                     ) : (
//                       <div className="relative pt-2">
//                         <div className="absolute top-5 left-3.5 right-3.5 h-0.5 bg-gray-100" />
//                         <div className="absolute top-5 left-3.5 h-0.5 bg-green-400 transition-all duration-700"
//                           style={{ width: stepIdx > 0 ? `${(stepIdx / (steps.length - 1)) * 100}%` : "0%" }} />
//                         <div className="relative flex justify-between">
//                           {steps.map((step, i) => {
//                             const done    = i < stepIdx
//                             const current = i === stepIdx
//                             return (
//                               <div key={step} className="flex flex-col items-center gap-1.5">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
//                                   ${done    ? "bg-green-500 border-green-500 text-white"
//                                   : current ? "bg-white border-green-500 text-green-600 shadow-lg shadow-green-100"
//                                   : "bg-white border-gray-200 text-gray-300"}`}>
//                                   {done ? "✓" : i + 1}
//                                 </div>
//                                 <div className={`text-xs font-bold capitalize ${done || current ? "text-green-600" : "text-gray-300"}`}>
//                                   {step === "pending" ? "Recv'd" : step}
//                                 </div>
//                               </div>
//                             )
//                           })}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

import { useEffect, useState } from "react"
import { useParams }           from "react-router-dom"
import { fetchMenu }           from "../service/menuService"
import { placeOrder, fetchOrders } from "../service/orderService"
import useSocket               from "../hooks/useSocket"

const FOOD_CATS = ["Breakfast","Lunch","Dinner","Snacks","Desserts","Specials"]
const BAR_CATS  = ["Beverages","Cocktails","Mocktails","Beer","Wine"]
const ALL_CATS  = ["all", ...FOOD_CATS, ...BAR_CATS]

const CAT_ICONS = {
  all:"🍽", Breakfast:"🌅", Lunch:"🍱", Dinner:"🍛",
  Snacks:"🍿", Desserts:"🍰", Specials:"⭐",
  Beverages:"🥤", Cocktails:"🍹", Mocktails:"🧃", Beer:"🍺", Wine:"🍷",
}

const STATUS_CONFIG = {
  pending:   { label: "Received",  color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-500"  },
  cooking:   { label: "Preparing", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200",dot: "bg-orange-500" },
  ready:     { label: "Ready! 🎉", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-300", dot: "bg-green-500"  },
  served:    { label: "Served",    color: "text-zinc-500",   bg: "bg-zinc-50",   border: "border-zinc-200",  dot: "bg-zinc-400"   },
  cancelled: { label: "Cancelled", color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",   dot: "bg-red-500"    },
}

// ─── Customize Modal ──────────────────────────────────────────
function CustomizeModal({ item, onClose, onAdd }) {
  const [removed, setRemoved] = useState([])
  const [options, setOptions] = useState({})
  const [qty,     setQty]     = useState(1)
  const [error,   setError]   = useState("")

  const toggleRemove = (name) =>
    setRemoved((p) => p.includes(name) ? p.filter((n) => n !== name) : [...p, name])

  const selectOption = (groupName, value, type) => {
    setOptions((prev) => {
      const cur = prev[groupName] || []
      if (type === "single" || type === "scale") return { ...prev, [groupName]: [value] }
      if (cur.includes(value)) return { ...prev, [groupName]: cur.filter((v) => v !== value) }
      return { ...prev, [groupName]: [...cur, value] }
    })
  }

  const handleAdd = () => {
    setError("")
    for (const group of item.optionGroups || []) {
      if (group.required && (!options[group.groupName] || !options[group.groupName].length)) {
        setError(`Please select ${group.groupName}`)
        return
      }
    }
    onAdd(item, {
      removed, qty,
      kept:    item.ingredients?.filter((i) => !removed.includes(i.name)).map((i) => i.name) || [],
      options: Object.entries(options).map(([groupName, selected]) => ({ groupName, selected })),
    })
  }

  const spiceColors = ["#1D9E75","#639922","#EF9F27","#D85A30","#E24B4A"]
  const spiceBgs    = ["#E1F5EE","#EAF3DE","#FFF3E0","#FAECE7","#FCEBEB"]
  const spiceEmoji  = ["😊","🌶","🌶🌶","🌶🌶🌶","🔥"]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-start justify-between z-10 rounded-t-3xl">
          <div>
            <div className="text-lg font-bold text-zinc-900">{item.name}</div>
            <div className="text-base font-bold text-green-600 mt-0.5">Rs. {item.price}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xl ml-4 hover:bg-zinc-200 transition-all">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{error}</div>}

          {item.optionGroups?.map((group) => {
            const selected = options[group.groupName] || []
            return (
              <div key={group.groupName} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-zinc-800">{group.groupName}</div>
                  {group.required
                    ? <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 border border-red-200 rounded-full font-bold">Required</span>
                    : <span className="text-xs bg-zinc-200 text-zinc-500 px-2.5 py-1 rounded-full">Optional</span>}
                </div>
                {(group.type === "scale" || group.type === "single") && (
                  <div className="flex gap-2">
                    {group.options.map((opt, idx) => {
                      const isSel = selected.includes(opt.value)
                      const color = group.type === "scale" ? (spiceColors[idx] || "#16a34a") : "#16a34a"
                      const bg    = group.type === "scale" ? (spiceBgs[idx]    || "#f0fdf4") : "#f0fdf4"
                      return (
                        <button key={opt.value} onClick={() => selectOption(group.groupName, opt.value, group.type)}
                          className="flex-1 py-3 px-1 rounded-xl border-2 text-center transition-all"
                          style={{ background: isSel ? bg : "white", borderColor: isSel ? color : "#e4e4e7" }}>
                          {group.type === "scale" && <div className="text-lg mb-1">{spiceEmoji[idx] || "•"}</div>}
                          <div className="text-xs font-bold" style={{ color: isSel ? color : "#a1a1aa" }}>{opt.label}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {group.type === "multiple" && (
                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const isSel = selected.includes(opt.value)
                      return (
                        <div key={opt.value} onClick={() => selectOption(group.groupName, opt.value, "multiple")}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all
                            ${isSel ? "bg-green-50 border-green-400" : "bg-white border-zinc-200 hover:border-green-300"}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-green-600 border-green-600" : "border-zinc-300"}`}>
                            {isSel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
                          </div>
                          <span className={`text-sm font-medium ${isSel ? "text-green-700" : "text-zinc-600"}`}>{opt.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {item.ingredients?.filter((i) => i.optional).length > 0 && (
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
              <div className="text-sm font-bold text-zinc-800 mb-3">Remove ingredients <span className="text-xs text-zinc-400 font-normal ml-1">tap to remove</span></div>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.filter((i) => i.optional).map((ing) => {
                  const isRem = removed.includes(ing.name)
                  return (
                    <button key={ing.name} onClick={() => toggleRemove(ing.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all
                        ${isRem ? "bg-red-50 border-red-300 text-red-600 line-through" : "bg-white border-zinc-200 text-zinc-600 hover:border-red-300"}`}>
                      {ing.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 rounded-2xl px-6 py-4 shadow-lg shadow-green-200">
            <div className="flex items-center gap-4">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border-2 border-white/30 text-white text-xl flex items-center justify-center hover:bg-white/10 transition-all">−</button>
              <span className="text-white font-bold text-xl w-6 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 rounded-full border-2 border-white/30 text-white text-xl flex items-center justify-center hover:bg-white/10 transition-all">+</button>
            </div>
            <button onClick={handleAdd} className="text-white font-bold">Add to cart — Rs. {item.price * qty}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function CustomerTablet() {
  const { tableNumber } = useParams()
  const [menu,       setMenu]       = useState([])
  const [cart,       setCart]       = useState([])
  const [filter,     setFilter]     = useState("all")
  const [view,       setView]       = useState("menu")
  const [orders,     setOrders]     = useState([])
  const [placing,    setPlacing]    = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [tableValid, setTableValid] = useState(null)

  // Validate table exists in DB
  useEffect(() => {
    const checkTable = async () => {
      try {
        const res = await fetch("/api/v1/tables")
        const data = await res.json()
        const exists = data.tables?.some((t) => t.tableNumber === tableNumber)
        setTableValid(!!exists)
      } catch {
        setTableValid(false)
      }
    }
    checkTable()
  }, [tableNumber])

  // Fetch active orders from backend on mount
  useEffect(() => {
    const loadActiveOrders = async () => {
      try {
        const res = await fetchOrders({ tableNumber, status: "pending,cooking,ready,served" })
        if (res.orders?.length > 0) setOrders(res.orders)
      } catch {}
    }
    loadActiveOrders()
  }, [tableNumber])

  useEffect(() => {
    fetchMenu({ isAvailable: true })
      .then((d) => setMenu(d.menu || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useSocket(
    {
      "order-status-update": (data) => {
        setOrders((prev) => prev.map((o) => o._id === data.orderId ? { ...o, status: data.status } : o))
      },
      "order-cancelled": (data) => {
        setOrders((prev) => prev.map((o) => o._id === data.orderId ? { ...o, status: "cancelled", cancelReason: data.reason } : o))
      },
    },
    [{ event: "join-table", value: tableNumber }]
  )

  const filtered     = filter === "all" ? menu : menu.filter((i) => i.category === filter)
  const cartTotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount    = cart.reduce((s, i) => s + i.quantity, 0)
  const activeOrders = orders.filter((o) => !["served","cancelled"].includes(o.status))

  const addToCart = (item, opts = {}) => {
    const key = item._id + JSON.stringify(opts)
    setCart((prev) => {
      const exists = prev.find((c) => c.key === key)
      if (exists) return prev.map((c) => c.key === key ? { ...c, quantity: c.quantity + (opts.qty || 1) } : c)
      return [...prev, {
        key, menuItem: item._id, name: item.name, price: item.price,
        quantity: opts.qty || 1, image: item.image,
        selectedIngredients: opts.kept    || [],
        removedIngredients:  opts.removed || [],
        selectedOptions:     opts.options || [],
      }]
    })
    setSelected(null)
  }

  const updateQty = (key, delta) =>
    setCart((prev) =>
      prev.map((c) => c.key === key ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter((c) => c.quantity > 0)
    )

  const handlePlaceOrder = async () => {
    if (!cart.length) return
    setPlacing(true)
    try {
      const res = await placeOrder({
        tableNumber: (tableNumber),
        items: cart.map(({ menuItem, name, price, quantity, selectedIngredients, removedIngredients, selectedOptions }) => ({
          menuItem, name, price, quantity, selectedIngredients, removedIngredients, selectedOptions,
        })),
        totalAmount: cartTotal,
      })
      setOrders((prev) => [...prev, res.order])
      setCart([])
      setView("tracker")
    } catch {}
    finally { setPlacing(false) }
  }

  const handleItemClick = (item) => {
    const hasCustom = item.ingredients?.some((i) => i.optional) || item.optionGroups?.length > 0
    if (hasCustom) setSelected(item)
    else addToCart(item, { qty: 1 })
  }

  // Table validation guards
  if (tableValid === null) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Checking table...</span>
      </div>
    </div>
  )

  if (tableValid === false) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-5 p-6">
      <div className="w-24 h-24 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-5xl">🪑</div>
      <div className="text-center">
        <div className="text-xl font-black text-zinc-800 mb-2">Table not found</div>
        <div className="text-sm text-zinc-400">
          Table <span className="font-bold text-zinc-600">{tableNumber}</span> does not exist.
        </div>
        <div className="text-sm text-zinc-400 mt-1">Please scan the correct QR code.</div>
      </div>
      <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-medium max-w-xs text-center">
        ⚠️ This table is not registered in our system.
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xl shadow-sm shadow-green-200">🏔</div>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">Himalaya Kitchen</div>
            <div className="text-sm text-gray-400">Table {tableNumber}</div>
          </div>
        </div>

        {/* nav tabs */}
        <div className="flex items-center gap-2">
          {[
            { key: "menu",    label: "Menu",    icon: "🍽" },
            { key: "cart",    label: cartCount > 0 ? `Cart (${cartCount})` : "Cart", icon: "🛒" },
            { key: "tracker", label: activeOrders.length > 0 ? `Orders (${activeOrders.length})` : "Orders", icon: "📋" },
          ].map((v) => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${view === v.key ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <span>{v.icon}</span>
              <span>{v.label}</span>
              {v.key === "tracker" && activeOrders.length > 0 && view !== "tracker" && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{activeOrders.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU ── */}
      {view === "menu" && (
        <div className="flex-1 flex flex-col">
          {/* category tabs */}
          <div className="flex gap-2 px-6 py-3 overflow-x-auto bg-white border-b border-gray-100">
            {ALL_CATS.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all
                  ${filter === cat ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                <span>{CAT_ICONS[cat]}</span>
                <span>{cat === "all" ? "All Items" : cat}</span>
              </button>
            ))}
          </div>

          {/* ✅ Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
          <div className="flex-1 overflow-y-auto p-6 pb-28">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                <span className="text-gray-400 font-medium">Loading menu...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <span className="text-5xl opacity-20">🍽</span>
                <span className="text-gray-400 font-medium">No items in this category</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((item) => (
                  <div key={item._id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col cursor-pointer group"
                    onClick={() => handleItemClick(item)}
                  >
                    {/* image */}
                    <div className="relative bg-gray-50 aspect-square overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                            <span className="text-5xl">{CAT_ICONS[item.category] || "🍽"}</span>
                          </div>
                        )
                      }
                      {/* veg dot */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm
                        ${item.isVeg ? "bg-green-500 border-green-600" : "bg-red-500 border-red-600"}`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      {/* bar badge */}
                      {item.destination === "bar" && (
                        <div className="absolute top-2 left-2 bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">Bar</div>
                      )}
                      {/* customizable badge */}
                      {(item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional)) && (
                        <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">Custom</div>
                      )}
                    </div>

                    {/* info */}
                    <div className="p-3 flex flex-col flex-1">
                      <div className="text-sm font-bold text-gray-900 leading-tight mb-1">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2 flex-1">{item.description}</div>
                      )}
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="text-sm font-bold text-green-600">Rs. {item.price}</div>
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg
                          ${item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional)
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"}`}>
                          {item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional) ? "Customize" : "Order Now"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* sticky cart bar */}
          {cartCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 shadow-xl z-10">
              <div className="max-w-2xl mx-auto">
                <button onClick={() => setView("cart")}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-green-200 hover:-translate-y-0.5 transition-all">
                  <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">{cartCount} items</span>
                  <span className="text-base">View Cart →</span>
                  <span>Rs. {cartTotal}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CUSTOMIZE MODAL */}
      {selected && <CustomizeModal item={selected} onClose={() => setSelected(null)} onAdd={addToCart} />}

      {/* ── CART ── */}
      {view === "cart" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 pb-56">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-5xl">🛒</div>
                <div className="text-base font-semibold text-gray-500">Your cart is empty</div>
                <button onClick={() => setView("menu")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold">Browse Menu</button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-3">
                {cart.map((item) => (
                  <div key={item.key} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4 shadow-sm">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🍽</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-900">{item.name}</div>
                      {item.selectedOptions?.map((opt) => (
                        <div key={opt.groupName} className="text-xs text-blue-500 font-medium mt-0.5">{opt.groupName}: {opt.selected?.join(", ")}</div>
                      ))}
                      {item.removedIngredients?.length > 0 && (
                        <div className="text-xs text-red-400 font-medium mt-0.5">No: {item.removedIngredients.join(", ")}</div>
                      )}
                      <div className="text-base font-bold text-green-600 mt-1">Rs. {item.price * item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateQty(item.key, -1)} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all font-bold">−</button>
                      <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, 1)} className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-sm border-t border-gray-100 shadow-xl z-10">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm px-1">
                  <div className="flex justify-between col-span-1"><span className="text-gray-500">Subtotal</span><span className="font-semibold">Rs. {cartTotal}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-gray-500">VAT (13%)</span><span className="font-semibold">Rs. {Math.round(cartTotal * 0.13)}</span></div>
                  <div className="flex justify-between col-span-1 font-bold text-base"><span>Total</span><span className="text-green-600">Rs. {Math.round(cartTotal * 1.13)}</span></div>
                </div>
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-200 disabled:opacity-70 flex items-center justify-center gap-2 text-base hover:-translate-y-0.5 transition-all">
                  {placing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing order...</> : "Place Order →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TRACKER ── */}
      {view === "tracker" && (
        <div className="flex-1 overflow-y-auto p-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-5xl">📋</div>
              <div className="text-base font-semibold text-gray-500">No orders yet</div>
              <button onClick={() => setView("menu")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold">Order Now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {orders.map((order) => {
                const steps = ["pending","cooking","ready","served"]
                const isCancelled = order.status === "cancelled"
                const cfg   = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                const stepIdx = steps.indexOf(order.status)

                return (
                  <div key={order._id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm ${cfg.border}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${!isCancelled && order.status !== "served" ? "animate-pulse" : ""}`} />
                        <span className="font-bold text-gray-900">Order #{order._id?.slice(-4).toUpperCase()}</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.quantity}× {item.name}</span>
                          <span className="text-gray-400 font-medium">Rs. {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {isCancelled ? (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <div className="text-sm font-bold text-red-600 mb-1">❌ Order Cancelled</div>
                        <div className="text-sm text-red-500 italic">"{order.cancelReason}"</div>
                        <button onClick={() => setView("menu")} className="mt-3 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all">Order something else →</button>
                      </div>
                    ) : (
                      <div className="relative pt-2">
                        <div className="absolute top-5 left-3.5 right-3.5 h-0.5 bg-gray-100" />
                        <div className="absolute top-5 left-3.5 h-0.5 bg-green-400 transition-all duration-700"
                          style={{ width: stepIdx > 0 ? `${(stepIdx / (steps.length - 1)) * 100}%` : "0%" }} />
                        <div className="relative flex justify-between">
                          {steps.map((step, i) => {
                            const done    = i < stepIdx
                            const current = i === stepIdx
                            return (
                              <div key={step} className="flex flex-col items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                                  ${done    ? "bg-green-500 border-green-500 text-white"
                                  : current ? "bg-white border-green-500 text-green-600 shadow-lg shadow-green-100"
                                  : "bg-white border-gray-200 text-gray-300"}`}>
                                  {done ? "✓" : i + 1}
                                </div>
                                <div className={`text-xs font-bold capitalize ${done || current ? "text-green-600" : "text-gray-300"}`}>
                                  {step === "pending" ? "Recv'd" : step}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}