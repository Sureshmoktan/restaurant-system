// import { useEffect, useState } from "react"
// import api from "../../service/api"

// const CATEGORIES = ["starter", "main", "pizza", "drinks", "dessert"]
// const OPTION_TYPES = ["scale", "single", "multiple"]

// const EMPTY_FORM = {
//   name:         "",
//   description:  "",
//   category:     "main",
//   price:        "",
//   isVeg:        false,
//   isAvailable:  true,
//   ingredients:  [],
//   optionGroups: [],
// }

// const EMPTY_OPTION_GROUP = {
//   groupName: "",
//   type:      "scale",
//   required:  false,
//   options:   [],
// }

// export default function MenuManagement() {
//   const [items,       setItems]       = useState([])
//   const [loading,     setLoading]     = useState(true)
//   const [showModal,   setShowModal]   = useState(false)
//   const [editing,     setEditing]     = useState(null)
//   const [form,        setForm]        = useState(EMPTY_FORM)
//   const [imageFile,   setImageFile]   = useState(null)
//   const [ingInput,    setIngInput]    = useState("")
//   const [ingOptional, setIngOptional] = useState(false)
//   const [submitting,  setSubmitting]  = useState(false)
//   const [error,       setError]       = useState("")
//   const [filter,      setFilter]      = useState("all")
//   const [tab,         setTab]         = useState("basic")

//   const fetchMenu = async () => {
//     try {
//       setLoading(true)
//       const res = await api.get("/menu")
//       setItems(res.data.menu || [])
//     } catch { setItems([]) }
//     finally  { setLoading(false) }
//   }

//   useEffect(() => { fetchMenu() }, [])

//   const openAdd = () => {
//     setEditing(null)
//     setForm(EMPTY_FORM)
//     setImageFile(null)
//     setIngInput("")
//     setIngOptional(false)
//     setError("")
//     setTab("basic")
//     setShowModal(true)
//   }

//   const openEdit = (item) => {
//     setEditing(item)
//     setForm({
//       name:         item.name,
//       description:  item.description || "",
//       category:     item.category,
//       price:        item.price,
//       isVeg:        item.isVeg,
//       isAvailable:  item.isAvailable,
//       ingredients:  item.ingredients  || [],
//       optionGroups: item.optionGroups || [],
//     })
//     setImageFile(null)
//     setError("")
//     setTab("basic")
//     setShowModal(true)
//   }

//   // ── ingredients ──
//   const addIngredient = () => {
//     if (!ingInput.trim()) return
//     setForm((f) => ({
//       ...f,
//       ingredients: [...f.ingredients, { name: ingInput.trim(), optional: ingOptional }]
//     }))
//     setIngInput("")
//     setIngOptional(false)
//   }

//   const removeIngredient = (i) => {
//     setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
//   }

//   const toggleIngOptional = (i) => {
//     setForm((f) => ({
//       ...f,
//       ingredients: f.ingredients.map((ing, idx) =>
//         idx === i ? { ...ing, optional: !ing.optional } : ing
//       )
//     }))
//   }

//   // ── option groups ──
//   const addOptionGroup = () => {
//     setForm((f) => ({
//       ...f,
//       optionGroups: [...f.optionGroups, { ...EMPTY_OPTION_GROUP, options: [] }]
//     }))
//   }

//   const removeOptionGroup = (gi) => {
//     setForm((f) => ({ ...f, optionGroups: f.optionGroups.filter((_, i) => i !== gi) }))
//   }

//   const updateOptionGroup = (gi, key, value) => {
//     setForm((f) => ({
//       ...f,
//       optionGroups: f.optionGroups.map((g, i) => i === gi ? { ...g, [key]: value } : g)
//     }))
//   }

//   const addOption = (gi) => {
//     setForm((f) => ({
//       ...f,
//       optionGroups: f.optionGroups.map((g, i) =>
//         i === gi ? { ...g, options: [...g.options, { label: "", value: "" }] } : g
//       )
//     }))
//   }

//   const removeOption = (gi, oi) => {
//     setForm((f) => ({
//       ...f,
//       optionGroups: f.optionGroups.map((g, i) =>
//         i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g
//       )
//     }))
//   }

//   const updateOption = (gi, oi, key, value) => {
//     setForm((f) => ({
//       ...f,
//       optionGroups: f.optionGroups.map((g, i) =>
//         i === gi
//           ? { ...g, options: g.options.map((o, j) => j === oi ? { ...o, [key]: value } : o) }
//           : g
//       )
//     }))
//   }

//   // auto generate value from label
//   const handleOptionLabel = (gi, oi, label) => {
//     const value = label.toLowerCase().replace(/\s+/g, "_")
//     updateOption(gi, oi, "label", label)
//     updateOption(gi, oi, "value", value)
//   }

//   // ── submit ──
//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError("")
//     if (!form.name || !form.price || !form.category) {
//       setError("Name, price and category are required")
//       return
//     }
//     setSubmitting(true)
//     try {
//       const fd = new FormData()
//       fd.append("name",         form.name)
//       fd.append("description",  form.description)
//       fd.append("category",     form.category)
//       fd.append("price",        form.price)
//       fd.append("isVeg",        form.isVeg)
//       fd.append("isAvailable",  form.isAvailable)
//       fd.append("ingredients",  JSON.stringify(form.ingredients))
//       fd.append("optionGroups", JSON.stringify(form.optionGroups))
//       if (imageFile) fd.append("image", imageFile)

//       if (editing) {
//         await api.put(`/menu/${editing._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } })
//       } else {
//         await api.post("/menu", fd, { headers: { "Content-Type": "multipart/form-data" } })
//       }
//       setShowModal(false)
//       fetchMenu()
//     } catch (err) {
//       setError(err.response?.data?.message || "Something went wrong")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleDelete = async (id) => {
//     if (!confirm("Delete this item?")) return
//     try { await api.delete(`/menu/${id}`); fetchMenu() } catch {}
//   }

//   const toggleAvailability = async (id) => {
//     try { await api.patch(`/menu/${id}/availability`); fetchMenu() } catch {}
//   }

//   const filtered = filter === "all" ? items : items.filter((i) => i.category === filter)

//   return (
//     <div className="space-y-6 max-w-7xl mx-auto mt-8">

//       {/* header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-xl font-bold text-slate-800">Menu Management</h2>
//           <p className="text-sm text-slate-400 mt-0.5">
//             {items.length} items · <span className="text-emerald-500 font-medium">{items.filter(i => i.isAvailable).length} available</span>
//           </p>
//         </div>
//         <button
//           onClick={openAdd}
//           className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
//         >
//           + Add item
//         </button>
//       </div>

//       {/* filters */}
//       <div className="flex gap-2 flex-wrap">
//         {["all", ...CATEGORIES].map((cat) => (
//           <button
//             key={cat}
//             onClick={() => setFilter(cat)}
//             className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize
//               ${filter === cat
//                 ? "bg-slate-800 text-white shadow-sm"
//                 : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"}`}
//           >
//             {cat}
//           </button>
//         ))}
//       </div>

//       {/* grid */}
//       {loading ? (
//         <div className="flex flex-col items-center justify-center h-48 gap-3">
//           <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
//           <span className="text-sm text-slate-400">Loading menu...</span>
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
//           <div className="text-4xl mb-3 opacity-30">🍽</div>
//           <div className="text-sm font-medium text-slate-500 mb-1">No items found</div>
//           <button onClick={openAdd} className="mt-4 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold">Add first item</button>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {filtered.map((item) => (
//             <div key={item._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">

//               {/* image */}
//               <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
//                 {item.image
//                   ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
//                   : <span className="text-4xl opacity-20">🍽</span>}
//                 <div className="absolute top-2.5 right-2.5">
//                   <span className={`text-xs px-2 py-1 rounded-full font-semibold border backdrop-blur-sm
//                     ${item.isVeg ? "bg-emerald-50/90 text-emerald-600 border-emerald-200" : "bg-red-50/90 text-red-500 border-red-200"}`}>
//                     {item.isVeg ? "Veg" : "Non-veg"}
//                   </span>
//                 </div>
//                 {!item.isAvailable && (
//                   <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
//                     <span className="text-xs font-bold text-white bg-slate-700/80 px-3 py-1.5 rounded-full">Unavailable</span>
//                   </div>
//                 )}
//               </div>

//               {/* info */}
//               <div className="p-4">
//                 <div className="flex items-start justify-between gap-2 mb-1">
//                   <div className="text-sm font-bold text-slate-800 leading-tight">{item.name}</div>
//                 </div>
//                 <div className="text-xs text-slate-400 capitalize mb-1.5">{item.category}</div>

//                 <div className="flex gap-1.5 mb-2 flex-wrap">
//                   {item.optionGroups?.length > 0 && (
//                     <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-100 font-medium">
//                       {item.optionGroups.length} customization{item.optionGroups.length > 1 ? "s" : ""}
//                     </span>
//                   )}
//                   {item.ingredients?.length > 0 && (
//                     <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 font-medium">
//                       {item.ingredients.length} ingredients
//                     </span>
//                   )}
//                 </div>

//                 <div className="text-base font-bold text-emerald-600 mb-3">Rs. {item.price}</div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => openEdit(item)}
//                     className="flex-1 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 text-slate-600 transition-all"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => toggleAvailability(item._id)}
//                     className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all
//                       ${item.isAvailable ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
//                   >
//                     {item.isAvailable ? "Available" : "Unavailable"}
//                   </button>
//                   <button
//                     onClick={() => handleDelete(item._id)}
//                     className="p-1.5 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all text-sm"
//                   >
//                     🗑
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ── MODAL ── */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

//             {/* modal header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white text-sm font-bold">
//                   {editing ? "✎" : "+"}
//                 </div>
//                 <h3 className="text-sm font-bold text-slate-800">{editing ? "Edit item" : "Add new item"}</h3>
//               </div>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all text-xl leading-none"
//               >
//                 ×
//               </button>
//             </div>

//             {/* tabs */}
//             <div className="flex gap-1.5 px-6 pt-5">
//               {["basic", "ingredients", "customizations"].map((t) => (
//                 <button
//                   key={t}
//                   onClick={() => setTab(t)}
//                   className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all
//                     ${tab === t ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
//                 >
//                   {t}
//                   {t === "ingredients" && form.ingredients.length > 0 && (
//                     <span className={`text-xs px-1.5 rounded-full font-bold ${tab === t ? "bg-white/20 text-white" : "bg-slate-300 text-slate-600"}`}>
//                       {form.ingredients.length}
//                     </span>
//                   )}
//                   {t === "customizations" && form.optionGroups.length > 0 && (
//                     <span className={`text-xs px-1.5 rounded-full font-bold ${tab === t ? "bg-white/20 text-white" : "bg-slate-300 text-slate-600"}`}>
//                       {form.optionGroups.length}
//                     </span>
//                   )}
//                 </button>
//               ))}
//             </div>

//             <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
//               {error && (
//                 <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
//                   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
//                   {error}
//                 </div>
//               )}

//               {/* ── TAB 1: Basic ── */}
//               {tab === "basic" && (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="col-span-2">
//                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Item name *</label>
//                       <input
//                         value={form.name}
//                         onChange={(e) => setForm({ ...form, name: e.target.value })}
//                         placeholder="e.g. Chicken curry"
//                         className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category *</label>
//                       <select
//                         value={form.category}
//                         onChange={(e) => setForm({ ...form, category: e.target.value })}
//                         className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
//                       >
//                         {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Price (Rs.) *</label>
//                       <input
//                         type="number"
//                         value={form.price}
//                         onChange={(e) => setForm({ ...form, price: e.target.value })}
//                         placeholder="450"
//                         className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
//                       <textarea
//                         value={form.description}
//                         onChange={(e) => setForm({ ...form, description: e.target.value })}
//                         placeholder="Short description..."
//                         rows={2}
//                         className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all resize-none placeholder:text-slate-300"
//                       />
//                     </div>
//                     <div className="col-span-2">
//                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Image</label>
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => setImageFile(e.target.files[0])}
//                         className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 transition-all"
//                       />
//                       {editing?.image && !imageFile && (
//                         <img src={editing.image} alt="current" className="mt-2 h-16 w-16 object-cover rounded-xl border border-slate-200" />
//                       )}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-3">
//                     <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
//                       ${form.isVeg ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
//                       <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="sr-only" />
//                       <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.isVeg ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
//                         {form.isVeg && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
//                       </div>
//                       <div>
//                         <div className="text-xs font-bold text-slate-700">Vegetarian</div>
//                         <div className="text-xs text-slate-400">Green badge on menu</div>
//                       </div>
//                     </label>
//                     <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
//                       ${form.isAvailable ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
//                       <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="sr-only" />
//                       <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.isAvailable ? "bg-blue-500 border-blue-500" : "border-slate-300"}`}>
//                         {form.isAvailable && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
//                       </div>
//                       <div>
//                         <div className="text-xs font-bold text-slate-700">Available</div>
//                         <div className="text-xs text-slate-400">Visible on customer tablet</div>
//                       </div>
//                     </label>
//                   </div>
//                 </div>
//               )}

//               {/* ── TAB 2: Ingredients ── */}
//               {tab === "ingredients" && (
//                 <div className="space-y-4">
//                   <div className="flex items-start gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-700">
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
//                     Add all ingredients. Mark as <strong>optional</strong> if customer can remove it. Required ingredients cannot be removed by customer.
//                   </div>

//                   <div className="flex gap-2">
//                     <input
//                       value={ingInput}
//                       onChange={(e) => setIngInput(e.target.value)}
//                       onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
//                       placeholder="e.g. Onion"
//                       className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
//                     />
//                     <label className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs font-semibold whitespace-nowrap transition-all
//                       ${ingOptional ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
//                       <input type="checkbox" checked={ingOptional} onChange={(e) => setIngOptional(e.target.checked)} className="sr-only" />
//                       Optional
//                     </label>
//                     <button type="button" onClick={addIngredient} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
//                       Add
//                     </button>
//                   </div>

//                   {form.ingredients.length === 0 ? (
//                     <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
//                       <div className="text-2xl mb-2 opacity-20">🌿</div>
//                       <div className="text-sm text-slate-400">No ingredients added yet</div>
//                     </div>
//                   ) : (
//                     <div className="space-y-2">
//                       {form.ingredients.map((ing, i) => (
//                         <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
//                           <div className="flex items-center gap-2.5">
//                             <div className={`w-2 h-2 rounded-full shrink-0 ${ing.optional ? "bg-amber-400" : "bg-emerald-400"}`} />
//                             <span className="text-sm text-slate-700 font-medium">{ing.name}</span>
//                             <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
//                               ${ing.optional ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
//                               {ing.optional ? "Optional" : "Required"}
//                             </span>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <button type="button" onClick={() => toggleIngOptional(i)} className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline">
//                               Toggle
//                             </button>
//                             <button type="button" onClick={() => removeIngredient(i)} className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 text-base">×</button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* ── TAB 3: Customizations ── */}
//               {tab === "customizations" && (
//                 <div className="space-y-4">
//                   <div className="flex items-start gap-3 p-3.5 bg-violet-50 rounded-xl border border-violet-200 text-xs text-violet-700">
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
//                     Add customization groups like Spice level, Salt level, Portion size etc. Each group has options customer can choose from.
//                   </div>

//                   {form.optionGroups.length === 0 ? (
//                     <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
//                       <div className="text-2xl mb-2 opacity-20">⚙</div>
//                       <div className="text-sm text-slate-400">No customizations added yet</div>
//                     </div>
//                   ) : (
//                     form.optionGroups.map((group, gi) => (
//                       <div key={gi} className="border border-slate-200 rounded-2xl overflow-hidden">
//                         <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
//                           <div className="flex items-center gap-2">
//                             <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-white text-xs font-bold">{gi + 1}</div>
//                             <span className="text-xs font-bold text-slate-600">{group.groupName || `Group ${gi + 1}`}</span>
//                           </div>
//                           <button type="button" onClick={() => removeOptionGroup(gi)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove group</button>
//                         </div>

//                         <div className="p-4 space-y-3">
//                           <div className="grid grid-cols-2 gap-3">
//                             <div>
//                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Group name</label>
//                               <input
//                                 value={group.groupName}
//                                 onChange={(e) => updateOptionGroup(gi, "groupName", e.target.value)}
//                                 placeholder="e.g. Spice level"
//                                 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
//                               />
//                             </div>
//                             <div>
//                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type</label>
//                               <select
//                                 value={group.type}
//                                 onChange={(e) => updateOptionGroup(gi, "type", e.target.value)}
//                                 className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
//                               >
//                                 <option value="scale">Scale (slider style)</option>
//                                 <option value="single">Single choice (radio)</option>
//                                 <option value="multiple">Multiple choice (checkbox)</option>
//                               </select>
//                             </div>
//                           </div>

//                           <label className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all w-fit
//                             ${group.required ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}>
//                             <input type="checkbox" checked={group.required} onChange={(e) => updateOptionGroup(gi, "required", e.target.checked)} className="sr-only" />
//                             <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${group.required ? "bg-red-500 border-red-500" : "border-slate-300"}`}>
//                               {group.required && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
//                             </div>
//                             <span className="text-xs font-semibold text-slate-600">Required — customer must choose</span>
//                           </label>

//                           <div>
//                             <div className="flex items-center justify-between mb-2">
//                               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options</label>
//                               <button type="button" onClick={() => addOption(gi)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">+ Add option</button>
//                             </div>
//                             {group.options.length === 0 ? (
//                               <div className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-xl">No options yet — click Add option</div>
//                             ) : (
//                               <div className="space-y-2">
//                                 {group.options.map((opt, oi) => (
//                                   <div key={oi} className="flex gap-2 items-center">
//                                     <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{oi + 1}</div>
//                                     <input
//                                       value={opt.label}
//                                       onChange={(e) => handleOptionLabel(gi, oi, e.target.value)}
//                                       placeholder="Label e.g. Mild"
//                                       className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300"
//                                     />
//                                     <input
//                                       value={opt.value}
//                                       onChange={(e) => updateOption(gi, oi, "value", e.target.value)}
//                                       placeholder="Value e.g. mild"
//                                       className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300"
//                                     />
//                                     <button type="button" onClick={() => removeOption(gi, oi)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-red-400 hover:bg-red-50 hover:border-red-300 shrink-0 text-base">×</button>
//                                   </div>
//                                 ))}
//                               </div>
//                             )}
//                           </div>

//                           {group.options.length > 0 && (
//                             <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
//                               <span className="text-xs text-slate-400 font-medium">Preview: </span>
//                               <span className="text-xs text-slate-600">{group.options.map((o) => o.label).filter(Boolean).join(" → ")}</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))
//                   )}

//                   <button
//                     type="button"
//                     onClick={addOptionGroup}
//                     className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all"
//                   >
//                     + Add customization group
//                   </button>

//                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
//                     <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick add common groups:</div>
//                     <div className="flex flex-wrap gap-2">
//                       {[
//                         { name: "Spice level", opts: ["No spice","Mild","Medium","Hot","Extra hot"] },
//                         { name: "Salt level",  opts: ["Less salt","Normal","More salt"] },
//                         { name: "Oil level",   opts: ["Less oil","Normal","More oil"] },
//                         { name: "Portion size",opts: ["Half","Full","Family"], type: "single" },
//                         { name: "Add extras",  opts: ["Extra rice","Extra gravy","Papad","Salad"], type: "multiple" },
//                       ].map((preset) => (
//                         <button
//                           key={preset.name}
//                           type="button"
//                           onClick={() => {
//                             const exists = form.optionGroups.find((g) => g.groupName === preset.name)
//                             if (exists) return
//                             setForm((f) => ({
//                               ...f,
//                               optionGroups: [...f.optionGroups, {
//                                 groupName: preset.name,
//                                 type:      preset.type || "scale",
//                                 required:  false,
//                                 options:   preset.opts.map((o) => ({
//                                   label: o,
//                                   value: o.toLowerCase().replace(/\s+/g, "_")
//                                 }))
//                               }]
//                             }))
//                           }}
//                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
//                             ${form.optionGroups.find(g => g.groupName === preset.name)
//                               ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
//                               : "bg-white border-slate-200 text-slate-600 hover:border-slate-800 hover:text-slate-800"}`}
//                         >
//                           {form.optionGroups.find(g => g.groupName === preset.name) ? "✓" : "+"} {preset.name}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* footer */}
//               <div className="flex gap-3 pt-4 border-t border-slate-100">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
//                 >
//                   {submitting
//                     ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
//                     : editing ? "Update item" : "Add item"
//                   }
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }



import { useEffect, useState } from "react"
import api from "../../service/api"

const FOOD_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Desserts", "Specials"]
const BAR_CATEGORIES  = ["Beverages", "Cocktails", "Mocktails", "Beer", "Wine"]
const ALL_CATEGORIES  = [...FOOD_CATEGORIES, ...BAR_CATEGORIES]
const OPTION_TYPES    = ["scale", "single", "multiple"]

const EMPTY_FORM = {
  name:         "",
  description:  "",
  category:     "Lunch",
  price:        "",
  isVeg:        false,
  isAvailable:  true,
  ingredients:  [],
  optionGroups: [],
}

const EMPTY_OPTION_GROUP = {
  groupName: "",
  type:      "scale",
  required:  false,
  options:   [],
}

export default function MenuManagement() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [imageFile,   setImageFile]   = useState(null)
  const [ingInput,    setIngInput]    = useState("")
  const [ingOptional, setIngOptional] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState("")
  const [filter,      setFilter]      = useState("all")
  const [tab,         setTab]         = useState("basic")
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [deleting,     setDeleting]     = useState(false)

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const res = await api.get("/menu")
      setItems(res.data.menu || [])
    } catch { setItems([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchMenu() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setIngInput("")
    setIngOptional(false)
    setError("")
    setTab("basic")
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name:         item.name,
      description:  item.description || "",
      category:     item.category,
      price:        item.price,
      isVeg:        item.isVeg,
      isAvailable:  item.isAvailable,
      ingredients:  item.ingredients  || [],
      optionGroups: item.optionGroups || [],
    })
    setImageFile(null)
    setError("")
    setTab("basic")
    setShowModal(true)
  }

  // ── ingredients ──
  const addIngredient = () => {
    if (!ingInput.trim()) return
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { name: ingInput.trim(), optional: ingOptional }]
    }))
    setIngInput("")
    setIngOptional(false)
  }

  const removeIngredient = (i) => {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  }

  const toggleIngOptional = (i) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, idx) =>
        idx === i ? { ...ing, optional: !ing.optional } : ing
      )
    }))
  }

  // ── option groups ──
  const addOptionGroup = () => {
    setForm((f) => ({
      ...f,
      optionGroups: [...f.optionGroups, { ...EMPTY_OPTION_GROUP, options: [] }]
    }))
  }

  const removeOptionGroup = (gi) => {
    setForm((f) => ({ ...f, optionGroups: f.optionGroups.filter((_, i) => i !== gi) }))
  }

  const updateOptionGroup = (gi, key, value) => {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) => i === gi ? { ...g, [key]: value } : g)
    }))
  }

  const addOption = (gi) => {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi ? { ...g, options: [...g.options, { label: "", value: "" }] } : g
      )
    }))
  }

  const removeOption = (gi, oi) => {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g
      )
    }))
  }

  const updateOption = (gi, oi, key, value) => {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi
          ? { ...g, options: g.options.map((o, j) => j === oi ? { ...o, [key]: value } : o) }
          : g
      )
    }))
  }

  const handleOptionLabel = (gi, oi, label) => {
    const value = label.toLowerCase().replace(/\s+/g, "_")
    updateOption(gi, oi, "label", label)
    updateOption(gi, oi, "value", value)
  }

  // ── submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!form.name || !form.price || !form.category) {
      setError("Name, price and category are required")
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name",         form.name)
      fd.append("description",  form.description)
      fd.append("category",     form.category)
      fd.append("price",        form.price)
      fd.append("isVeg",        form.isVeg)
      fd.append("isAvailable",  form.isAvailable)
      fd.append("ingredients",  JSON.stringify(form.ingredients))
      fd.append("optionGroups", JSON.stringify(form.optionGroups))
      if (imageFile) fd.append("image", imageFile)

      if (editing) {
        await api.put(`/menu/${editing._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } })
      } else {
        await api.post("/menu", fd, { headers: { "Content-Type": "multipart/form-data" } })
      }
      setShowModal(false)
      fetchMenu()
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  // ── delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/menu/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetchMenu()
    } catch {}
    finally { setDeleting(false) }
  }

  const toggleAvailability = async (id) => {
    try { await api.patch(`/menu/${id}/availability`); fetchMenu() } catch {}
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter)

  // destination badge
  const getDestBadge = (category) => {
    if (BAR_CATEGORIES.includes(category)) return { label: "Bar", color: "bg-cyan-50 text-cyan-600 border-cyan-200" }
    return { label: "Kitchen", color: "bg-orange-50 text-orange-500 border-orange-200" }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto mt-8">

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Menu Management</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {items.length} items · <span className="text-emerald-500 font-medium">{items.filter(i => i.isAvailable).length} available</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          + Add item
        </button>
      </div>

      {/* filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...ALL_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize
              ${filter === cat
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading menu...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="text-4xl mb-3 opacity-30">🍽</div>
          <div className="text-sm font-medium text-slate-500 mb-1">No items found</div>
          <button onClick={openAdd} className="mt-4 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold">Add first item</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const dest = getDestBadge(item.category)
            return (
              <div key={item._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">

                {/* image */}
                <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <span className="text-4xl opacity-20">🍽</span>}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border backdrop-blur-sm ${dest.color}`}>
                      {dest.label}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border backdrop-blur-sm
                      ${item.isVeg ? "bg-emerald-50/90 text-emerald-600 border-emerald-200" : "bg-red-50/90 text-red-500 border-red-200"}`}>
                      {item.isVeg ? "Veg" : "Non-veg"}
                    </span>
                  </div>
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-slate-700/80 px-3 py-1.5 rounded-full">Unavailable</span>
                    </div>
                  )}
                </div>

                {/* info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-sm font-bold text-slate-800 leading-tight">{item.name}</div>
                  </div>
                  <div className="text-xs text-slate-400 capitalize mb-1.5">{item.category}</div>

                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {item.optionGroups?.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-100 font-medium">
                        {item.optionGroups.length} customization{item.optionGroups.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {item.ingredients?.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 font-medium">
                        {item.ingredients.length} ingredients
                      </span>
                    )}
                  </div>

                  <div className="text-base font-bold text-emerald-600 mb-3">Rs. {item.price}</div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex-1 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 text-slate-600 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleAvailability(item._id)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all
                        ${item.isAvailable ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: item._id, name: item.name })}
                      className="p-1.5 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all text-sm"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl mx-auto mb-4">🗑</div>
              <h3 className="text-base font-bold text-slate-800 text-center mb-2">Delete menu item?</h3>
              <p className="text-sm text-slate-400 text-center">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteTarget.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>
                  : "Yes, delete"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white text-sm font-bold">
                  {editing ? "✎" : "+"}
                </div>
                <h3 className="text-sm font-bold text-slate-800">{editing ? "Edit item" : "Add new item"}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* tabs */}
            <div className="flex gap-1.5 px-6 pt-5">
              {["basic", "ingredients", "customizations"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all
                    ${tab === t ? "bg-slate-800 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {t}
                  {t === "ingredients" && form.ingredients.length > 0 && (
                    <span className={`text-xs px-1.5 rounded-full font-bold ${tab === t ? "bg-white/20 text-white" : "bg-slate-300 text-slate-600"}`}>
                      {form.ingredients.length}
                    </span>
                  )}
                  {t === "customizations" && form.optionGroups.length > 0 && (
                    <span className={`text-xs px-1.5 rounded-full font-bold ${tab === t ? "bg-white/20 text-white" : "bg-slate-300 text-slate-600"}`}>
                      {form.optionGroups.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* ── TAB 1: Basic ── */}
              {tab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Item name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Chicken curry"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                      >
                        <optgroup label="🍳 Kitchen">
                          {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                        <optgroup label="🍹 Bar">
                          {BAR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                      </select>
                      {/* destination preview */}
                      <div className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${BAR_CATEGORIES.includes(form.category) ? "text-cyan-600" : "text-orange-500"}`}>
                        {BAR_CATEGORIES.includes(form.category) ? "🍹 Goes to Bar" : "🍳 Goes to Kitchen"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Price (Rs.) *</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="450"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Short description..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all resize-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 transition-all"
                      />
                      {editing?.image && !imageFile && (
                        <img src={editing.image} alt="current" className="mt-2 h-16 w-16 object-cover rounded-xl border border-slate-200" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                      ${form.isVeg ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                      <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="sr-only" />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.isVeg ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                        {form.isVeg && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">Vegetarian</div>
                        <div className="text-xs text-slate-400">Green badge on menu</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                      ${form.isAvailable ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                      <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="sr-only" />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.isAvailable ? "bg-blue-500 border-blue-500" : "border-slate-300"}`}>
                        {form.isAvailable && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">Available</div>
                        <div className="text-xs text-slate-400">Visible on customer tablet</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* ── TAB 2: Ingredients ── */}
              {tab === "ingredients" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Add all ingredients. Mark as <strong>optional</strong> if customer can remove it. Required ingredients cannot be removed by customer.
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={ingInput}
                      onChange={(e) => setIngInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                      placeholder="e.g. Onion"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
                    />
                    <label className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer text-xs font-semibold whitespace-nowrap transition-all
                      ${ingOptional ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      <input type="checkbox" checked={ingOptional} onChange={(e) => setIngOptional(e.target.checked)} className="sr-only" />
                      Optional
                    </label>
                    <button type="button" onClick={addIngredient} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
                      Add
                    </button>
                  </div>

                  {form.ingredients.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
                      <div className="text-2xl mb-2 opacity-20">🌿</div>
                      <div className="text-sm text-slate-400">No ingredients added yet</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${ing.optional ? "bg-amber-400" : "bg-emerald-400"}`} />
                            <span className="text-sm text-slate-700 font-medium">{ing.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                              ${ing.optional ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                              {ing.optional ? "Optional" : "Required"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => toggleIngOptional(i)} className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline">
                              Toggle
                            </button>
                            <button type="button" onClick={() => removeIngredient(i)} className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 text-base">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3: Customizations ── */}
              {tab === "customizations" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3.5 bg-violet-50 rounded-xl border border-violet-200 text-xs text-violet-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
                    Add customization groups like Spice level, Salt level, Portion size etc. Each group has options customer can choose from.
                  </div>

                  {form.optionGroups.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
                      <div className="text-2xl mb-2 opacity-20">⚙</div>
                      <div className="text-sm text-slate-400">No customizations added yet</div>
                    </div>
                  ) : (
                    form.optionGroups.map((group, gi) => (
                      <div key={gi} className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-white text-xs font-bold">{gi + 1}</div>
                            <span className="text-xs font-bold text-slate-600">{group.groupName || `Group ${gi + 1}`}</span>
                          </div>
                          <button type="button" onClick={() => removeOptionGroup(gi)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove group</button>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Group name</label>
                              <input
                                value={group.groupName}
                                onChange={(e) => updateOptionGroup(gi, "groupName", e.target.value)}
                                placeholder="e.g. Spice level"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type</label>
                              <select
                                value={group.type}
                                onChange={(e) => updateOptionGroup(gi, "type", e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                              >
                                <option value="scale">Scale (slider style)</option>
                                <option value="single">Single choice (radio)</option>
                                <option value="multiple">Multiple choice (checkbox)</option>
                              </select>
                            </div>
                          </div>

                          <label className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all w-fit
                            ${group.required ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}>
                            <input type="checkbox" checked={group.required} onChange={(e) => updateOptionGroup(gi, "required", e.target.checked)} className="sr-only" />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${group.required ? "bg-red-500 border-red-500" : "border-slate-300"}`}>
                              {group.required && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none"/></svg>}
                            </div>
                            <span className="text-xs font-semibold text-slate-600">Required — customer must choose</span>
                          </label>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options</label>
                              <button type="button" onClick={() => addOption(gi)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">+ Add option</button>
                            </div>
                            {group.options.length === 0 ? (
                              <div className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-xl">No options yet — click Add option</div>
                            ) : (
                              <div className="space-y-2">
                                {group.options.map((opt, oi) => (
                                  <div key={oi} className="flex gap-2 items-center">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{oi + 1}</div>
                                    <input
                                      value={opt.label}
                                      onChange={(e) => handleOptionLabel(gi, oi, e.target.value)}
                                      placeholder="Label e.g. Mild"
                                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300"
                                    />
                                    <input
                                      value={opt.value}
                                      onChange={(e) => updateOption(gi, oi, "value", e.target.value)}
                                      placeholder="Value e.g. mild"
                                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300"
                                    />
                                    <button type="button" onClick={() => removeOption(gi, oi)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-red-400 hover:bg-red-50 hover:border-red-300 shrink-0 text-base">×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {group.options.length > 0 && (
                            <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-xs text-slate-400 font-medium">Preview: </span>
                              <span className="text-xs text-slate-600">{group.options.map((o) => o.label).filter(Boolean).join(" → ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={addOptionGroup}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-all"
                  >
                    + Add customization group
                  </button>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick add common groups:</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "Spice level", opts: ["No spice","Mild","Medium","Hot","Extra hot"] },
                        { name: "Salt level",  opts: ["Less salt","Normal","More salt"] },
                        { name: "Oil level",   opts: ["Less oil","Normal","More oil"] },
                        { name: "Portion size",opts: ["Half","Full","Family"], type: "single" },
                        { name: "Add extras",  opts: ["Extra rice","Extra gravy","Papad","Salad"], type: "multiple" },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            const exists = form.optionGroups.find((g) => g.groupName === preset.name)
                            if (exists) return
                            setForm((f) => ({
                              ...f,
                              optionGroups: [...f.optionGroups, {
                                groupName: preset.name,
                                type:      preset.type || "scale",
                                required:  false,
                                options:   preset.opts.map((o) => ({
                                  label: o,
                                  value: o.toLowerCase().replace(/\s+/g, "_")
                                }))
                              }]
                            }))
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                            ${form.optionGroups.find(g => g.groupName === preset.name)
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-800 hover:text-slate-800"}`}
                        >
                          {form.optionGroups.find(g => g.groupName === preset.name) ? "✓" : "+"} {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : editing ? "Update item" : "Add item"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}