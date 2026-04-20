// src/pages/CustomerTablet.jsx

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import { fetchMenu } from "../service/menuService"
import { placeOrder, fetchOrders } from "../service/orderService"
import { fetchCurrentBillByTable, requestCustomerBill, fetchCustomerBillById, initiateEsewaPayment } from "../service/billService"
import { fetchPublicActiveOffers } from "../service/offerService"
import { checkFeedbackExists, submitFeedback } from "../service/feedbackService"
import { fetchPublicGameSettings } from "../service/discountGameService"
import SpinWheelOverlay from "../components/SpinWheelOverlay"
import useSocket from "../hooks/useSocket"

const FOOD_CATS = ["Breakfast", "Thakali", "Snacks", "Pizza", "Non-Veg Special", "Desserts", "Special"]
const BAR_CATS  = ["Beverages", "Seasonal Drinks", "Beer", "Wine", "Hard Drinks"]
const ALL_CATS  = ["all", ...FOOD_CATS, ...BAR_CATS]

const CAT_ICONS = {
  all: "🍽", Breakfast: "🌅", Thakali: "🍛", Dinner: "🍛",
  Snacks: "🍿", "Non-Veg Special": "🍗", Desserts: "🍰", Specials: "⭐",
  Special: "⭐", Pizza: "🍕",
  Beverages: "🥤", "Seasonal Drinks": "🍹", Beer: "🍺", Wine: "🍷", "Hard Drinks": "🥃",
}

const ITEM_STATUS_CONFIG = {
  pending: { label: "Received",  color: "text-amber-600", bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-400"  },
  cooking: { label: "Preparing", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" },
  ready:   { label: "Ready! 🎉", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-300",  dot: "bg-green-500"  },
  served:  { label: "Served",    color: "text-zinc-400",   bg: "bg-zinc-50",   border: "border-zinc-200",   dot: "bg-zinc-300"   },
}

// ─── helpers ──────────────────────────────────────────────────
const getBasePrice = (item) => {
  if (item.variantGroups?.length > 0) {
    const first = item.variantGroups[0]
    if (first.options?.length > 0) return first.options[0].price
  }
  return item.price
}

const getDisplayPrice = (item) => {
  if (item.variantGroups?.length > 0) {
    const opts = item.variantGroups[0].options || []
    if (opts.length === 0) return `Rs. ${item.price}`
    const min = Math.min(...opts.map((o) => o.price))
    const max = Math.max(...opts.map((o) => o.price))
    return min === max ? `Rs. ${min}` : `From Rs. ${min}`
  }
  return `Rs. ${item.price}`
}

// Compute the best applicable offer for an individual menu item.
// Returns null if no offer applies.
function computeItemOfferInfo(item, itemOfferMap, categoryOfferMap) {
  const itemOffer = itemOfferMap[item._id]
  const catOffer  = categoryOfferMap[(item.category || "").toLowerCase()]

  const calcDiscount = (offer, price) => {
    if (!offer) return 0
    return offer.type === "percentage"
      ? (price * offer.value) / 100
      : Math.min(offer.value, price)
  }

  const basePrice    = getBasePrice(item)
  const itemDiscount = calcDiscount(itemOffer, basePrice)
  const catDiscount  = calcDiscount(catOffer,  basePrice)

  if (itemDiscount === 0 && catDiscount === 0) return null

  const useItem        = itemDiscount >= catDiscount
  const bestOffer      = useItem ? itemOffer : catOffer
  const bestDiscount   = useItem ? itemDiscount : catDiscount

  return {
    offer:          bestOffer,
    originalPrice:  basePrice,
    discountedPrice: Math.max(0, basePrice - bestDiscount),
    badgeText:      bestOffer.type === "percentage"
      ? `${bestOffer.value}% OFF`
      : `Rs.${bestOffer.value} OFF`,
    hasVariants: item.variantGroups?.length > 0,
  }
}

// ─── Offer Banners (bill-level) ───────────────────────────────
function OfferBanners({ offers }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (offers.length <= 1) return
    const id = setInterval(() => setCurrent(c => (c + 1) % offers.length), 3500)
    return () => clearInterval(id)
  }, [offers.length])

  if (!offers.length) return null

  const offer = offers[current]

  return (
    <div className="px-4 pt-3 pb-1">
      <div
        className="relative overflow-hidden rounded-2xl px-4 py-3"
        style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-4 w-10 h-10 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">🎉</span>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-tight">
              Today's Offer: {offer.title}
            </div>
            <div className="text-emerald-100 text-xs mt-0.5 leading-snug">
              {offer.description
                ? offer.description
                : offer.type === "percentage"
                  ? `${offer.value}% OFF on your total bill!`
                  : `Rs. ${offer.value} OFF on your total bill!`}
              {offer.endDate && (
                <span className="ml-1">
                  · Valid till {new Date(offer.endDate).toLocaleDateString("en-NP", { day: "2-digit", month: "short" })}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 bg-white/20 rounded-xl px-2.5 py-1.5 text-center">
            <div className="text-white font-black text-sm leading-none">
              {offer.type === "percentage" ? `${offer.value}%` : `Rs.${offer.value}`}
            </div>
            <div className="text-emerald-100 text-[9px] font-semibold mt-0.5">OFF</div>
          </div>
        </div>

        {/* Dot indicators for multiple banners */}
        {offers.length > 1 && (
          <div className="flex gap-1.5 justify-center mt-2">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === current ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Customize Modal ──────────────────────────────────────────
function CustomizeModal({ item, onClose, onAdd }) {
  const [removed,          setRemoved]          = useState([])
  const [options,          setOptions]          = useState({})
  const [selectedVariants, setSelectedVariants] = useState({})
  const [qty,              setQty]              = useState(1)
  const [error,            setError]            = useState("")

  useEffect(() => {
    if (item.variantGroups?.length > 0) {
      const defaults = {}
      item.variantGroups.forEach((g) => {
        if (g.options?.length > 0) defaults[g.groupName] = g.options[0]
      })
      setSelectedVariants(defaults)
    }
  }, [item])

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

  const selectVariant = (groupName, opt) =>
    setSelectedVariants((prev) => ({ ...prev, [groupName]: opt }))

  const resolvedPrice = (() => {
    if (item.variantGroups?.length > 0) {
      const total = Object.values(selectedVariants).reduce(
        (sum, opt) => sum + (opt?.price || 0), 0
      )
      return total > 0 ? total : getBasePrice(item)
    }
    return item.price
  })()

  const handleAdd = () => {
    setError("")
    for (const group of item.variantGroups || []) {
      if (group.required && !selectedVariants[group.groupName]) {
        setError(`Please select ${group.groupName}`)
        return
      }
    }
    for (const group of item.optionGroups || []) {
      if (group.required && (!options[group.groupName] || !options[group.groupName].length)) {
        setError(`Please select ${group.groupName}`)
        return
      }
    }
    onAdd(item, {
      removed,
      qty,
      price: resolvedPrice,
      kept: item.ingredients?.filter((i) => !removed.includes(i.name)).map((i) => i.name) || [],
      options: Object.entries(options).map(([groupName, selected]) => ({ groupName, selected })),
      selectedVariants: Object.entries(selectedVariants).map(([groupName, opt]) => ({
        groupName, label: opt.label, price: opt.price
      })),
    })
  }

  const spiceColors = ["#1D9E75", "#639922", "#EF9F27", "#D85A30", "#E24B4A"]
  const spiceBgs    = ["#E1F5EE", "#EAF3DE", "#FFF3E0", "#FAECE7", "#FCEBEB"]
  const spiceEmoji  = ["😊", "🌶", "🌶🌶", "🌶🌶🌶", "🔥"]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-start justify-between z-10 rounded-t-3xl">
          <div>
            <div className="text-lg font-bold text-zinc-900">{item.name}</div>
            <div className="text-base font-bold text-green-600 mt-0.5">
              {item.variantGroups?.length > 0 ? `Rs. ${resolvedPrice}` : `Rs. ${item.price}`}
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xl ml-4 hover:bg-zinc-200 transition-all">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{error}</div>
          )}

          {item.variantGroups?.map((group) => (
            <div key={group.groupName} className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-zinc-800">{group.groupName}</div>
                {group.required
                  ? <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 border border-red-200 rounded-full font-bold">Required</span>
                  : <span className="text-xs bg-zinc-200 text-zinc-500 px-2.5 py-1 rounded-full">Optional</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isSel = selectedVariants[group.groupName]?.label === opt.label
                  return (
                    <button key={opt.label} onClick={() => selectVariant(group.groupName, opt)}
                      className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[80px]
                        ${isSel ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-zinc-200 text-zinc-600 hover:border-amber-300"}`}>
                      <span className="text-sm font-bold">{opt.label}</span>
                      <span className={`text-xs mt-0.5 font-semibold ${isSel ? "text-white/80" : "text-green-600"}`}>Rs. {opt.price}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

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
                  <div className="flex gap-2 flex-wrap">
                    {group.options.map((opt, idx) => {
                      const isSel  = selected.includes(opt.value)
                      const color  = group.type === "scale" ? (spiceColors[idx] || "#16a34a") : "#16a34a"
                      const bg     = group.type === "scale" ? (spiceBgs[idx]    || "#f0fdf4") : "#f0fdf4"
                      return (
                        <button key={opt.value}
                          onClick={() => selectOption(group.groupName, opt.value, group.type)}
                          className="flex-1 py-3 px-1 rounded-xl border-2 text-center transition-all min-w-[60px]"
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
                        <div key={opt.value}
                          onClick={() => selectOption(group.groupName, opt.value, "multiple")}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all
                            ${isSel ? "bg-green-50 border-green-400" : "bg-white border-zinc-200 hover:border-green-300"}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
                            ${isSel ? "bg-green-600 border-green-600" : "border-zinc-300"}`}>
                            {isSel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" fill="none" /></svg>}
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

          {item.ingredients?.length > 0 && (
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
              {item.ingredients.some((i) => !i.optional) && (
                <>
                  <div className="text-sm font-bold text-zinc-800 mb-3">Ingredients</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.ingredients.filter((i) => !i.optional).map((ing) => (
                      <span key={ing.name} className="px-3 py-1.5 rounded-full text-sm font-medium border-2 bg-zinc-100 border-zinc-200 text-zinc-500 cursor-default">{ing.name}</span>
                    ))}
                  </div>
                </>
              )}
              {item.ingredients.some((i) => i.optional) && (
                <>
                  <div className="text-sm font-bold text-zinc-800 mb-3">
                    Remove ingredients <span className="text-xs text-zinc-400 font-normal ml-1">tap to remove</span>
                  </div>
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
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between bg-[#1D9E75] rounded-2xl px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border-2 border-white/30 text-white text-xl flex items-center justify-center hover:bg-white/10 transition-all">−</button>
              <span className="text-white font-bold text-xl w-6 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-full border-2 border-white/30 text-white text-xl flex items-center justify-center hover:bg-white/10 transition-all">+</button>
            </div>
            <button onClick={handleAdd} className="text-white font-bold text-sm">
              Add to cart — Rs. {resolvedPrice * qty}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MenuItem Card ────────────────────────────────────────────
function MenuItemCard({ item, onClick, offerInfo }) {
  const hasVariants  = item.variantGroups?.length > 0
  const hasCustom    = item.optionGroups?.length > 0 || item.ingredients?.some((i) => i.optional)
  const isUnavailable = item.isAvailable === false

  return (
    <div onClick={isUnavailable ? undefined : onClick}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-200
        ${isUnavailable ? "opacity-60 cursor-not-allowed" : "cursor-pointer group hover:border-gray-200"}`}>
      <div className="relative bg-gray-50 h-[120px] overflow-hidden flex-shrink-0">
        {item.image
          ? <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${!isUnavailable ? "group-hover:scale-105 transition-transform duration-300" : ""}`} />
          : <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <span className="text-5xl">{CAT_ICONS[item.category] || "🍽"}</span>
            </div>
        }

        {/* Out of Stock overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white bg-gray-800/80 px-2.5 py-1 rounded-full tracking-wide">Out of Stock</span>
          </div>
        )}

        {/* Veg / Non-veg dot */}
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${item.isVeg ? "bg-white border-green-600" : "bg-white border-red-600"}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-500"}`} />
        </div>

        {/* Offer badge — highest priority top-left label */}
        {!isUnavailable && offerInfo ? (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-0.5">
            🏷️ {offerInfo.badgeText}
          </div>
        ) : !isUnavailable && item.isPopular ? (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Popular</div>
        ) : !isUnavailable && item.destination === "bar" ? (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Bar</div>
        ) : null}

        {!isUnavailable && hasVariants && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            {item.variantGroups[0].groupName}
          </div>
        )}
        {!isUnavailable && !hasVariants && hasCustom && (
          <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Custom</div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className={`text-sm font-bold leading-tight mb-1 ${isUnavailable ? "text-gray-400" : "text-gray-900"}`}>{item.name}</div>
        {item.description && (
          <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2 flex-1">{item.description}</div>
        )}
        <div className="mt-auto pt-1 flex items-center justify-between gap-2">
          {isUnavailable ? (
            <div className="text-xs font-semibold text-gray-400 line-through">{getDisplayPrice(item)}</div>
          ) : offerInfo ? (
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-gray-400 line-through">
                {offerInfo.hasVariants ? `From Rs. ${offerInfo.originalPrice}` : `Rs. ${offerInfo.originalPrice}`}
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {offerInfo.hasVariants ? `From Rs. ${Math.round(offerInfo.discountedPrice)}` : `Rs. ${Math.round(offerInfo.discountedPrice)}`}
              </span>
            </div>
          ) : (
            <div className="text-sm font-bold text-green-700">{getDisplayPrice(item)}</div>
          )}

          <div className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap
            ${isUnavailable
              ? "bg-gray-100 text-gray-400"
              : hasVariants ? "bg-amber-100 text-amber-700" : hasCustom ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
            {isUnavailable ? "Unavailable" : hasVariants ? "Choose" : hasCustom ? "Customize" : "Order Now"}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────
function CategorySection({ cat, items, onItemClick, itemOfferMap, categoryOfferMap }) {
  if (!items.length) return null
  return (
    <div className="mb-8" id={`cat-${cat}`}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
          {CAT_ICONS[cat] || "🍽"}
        </div>
        <span className="text-base font-bold text-gray-900">{cat}</span>
        <span className="text-xs text-gray-400 ml-auto">{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.map((item) => {
          const offerInfo = computeItemOfferInfo(item, itemOfferMap, categoryOfferMap)
          return (
            <MenuItemCard key={item._id} item={item} onClick={() => onItemClick(item)} offerInfo={offerInfo} />
          )
        })}
      </div>
    </div>
  )
}

// ─── Feedback Modal ───────────────────────────────────────────
const EMOJI_OPTIONS = [
  { key: "loved", emoji: "😍", label: "Loved it" },
  { key: "good",  emoji: "😊", label: "Good"     },
  { key: "okay",  emoji: "😐", label: "Okay"     },
  { key: "poor",  emoji: "😕", label: "Poor"     },
  { key: "bad",   emoji: "😠", label: "Bad"      },
]

const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" }

const CATEGORY_OPTIONS = [
  { key: "food_quality",    label: "Food Quality"    },
  { key: "service",         label: "Service"         },
  { key: "cleanliness",     label: "Cleanliness"     },
  { key: "ambience",        label: "Ambience"        },
  { key: "value_for_money", label: "Value for Money" },
  { key: "speed",           label: "Speed"           },
]

function FeedbackModal({ billId, tableNumber, onDone }) {
  const [selectedEmoji,  setSelectedEmoji]  = useState("")
  const [rating,         setRating]         = useState(0)
  const [hoverRating,    setHoverRating]    = useState(0)
  const [categories,     setCategories]     = useState([])
  const [comment,        setComment]        = useState("")
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState("")
  const [done,           setDone]           = useState(false)

  // auto-close thank-you screen after 5 s
  useEffect(() => {
    if (!done) return
    const t = setTimeout(onDone, 5000)
    return () => clearTimeout(t)
  }, [done, onDone])

  const toggleCategory = (key) =>
    setCategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a star rating before submitting."); return }
    setError("")
    setSubmitting(true)
    try {
      await submitFeedback({ billId, rating, emoji: selectedEmoji, categories, comment })
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-10 text-center max-w-xs w-full shadow-2xl">
        <div className="text-6xl mb-4">🙏</div>
        <div className="text-xl font-black text-gray-900 mb-2">Thank you for your feedback!</div>
        <div className="text-sm text-gray-400">We appreciate your time. See you again!</div>
        <div className="mt-4 w-8 h-1 bg-emerald-500 rounded-full mx-auto animate-pulse" />
      </div>
    </div>
  )

  const displayRating = hoverRating || rating

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-gray-100 z-10">
          <div className="text-center">
            <div className="text-xl font-black text-gray-900">How was your experience?</div>
            <div className="text-xs text-gray-400 mt-1">Your feedback helps us improve</div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Emoji row */}
          <div>
            <div className="flex justify-between gap-2">
              {EMOJI_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setSelectedEmoji(prev => prev === opt.key ? "" : opt.key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all
                    ${selectedEmoji === opt.key
                      ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                      : "border-gray-100 bg-gray-50 hover:border-emerald-200"}`}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={`text-[10px] font-bold leading-tight text-center ${selectedEmoji === opt.key ? "text-emerald-700" : "text-gray-400"}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Star rating */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Rating <span className="text-red-500">*</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <svg width="36" height="36" viewBox="0 0 24 24">
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill={star <= displayRating ? "#f59e0b" : "#e5e7eb"}
                        stroke={star <= displayRating ? "#f59e0b" : "#d1d5db"}
                        strokeWidth="1"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  displayRating >= 4 ? "bg-emerald-50 text-emerald-700" :
                  displayRating === 3 ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-600"
                }`}>
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Quick categories */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">What did you notice?</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(cat => {
                const sel = categories.includes(cat.key)
                return (
                  <button key={cat.key} onClick={() => toggleCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                      ${sel
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300"}`}>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tell us more</div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 500))}
              placeholder="Tell us more (optional)"
              rows={3}
              className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <div className="text-right text-[10px] text-gray-300 mt-1">{comment.length}/500</div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">{error}</div>
          )}

          {/* Buttons */}
          <div className="space-y-2 pb-2">
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                : "Submit Feedback"}
            </button>
            <button onClick={onDone} className="w-full py-2.5 text-gray-400 text-sm hover:text-gray-600 transition-colors">
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Bill Modal ───────────────────────────────────────────────
function BillModal({ tableNumber, onClose, billId, setBillId }) {
  const [bill,          setBill]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [polling,       setPolling]       = useState(true)
  const [esewaLoading,  setEsewaLoading]  = useState(false)
  const [esewaError,    setEsewaError]    = useState("")
  const [gameSettings,  setGameSettings]  = useState(null)
  const [showWheel,     setShowWheel]     = useState(false)

  const fetchBill = useCallback(async () => {
    try {
      const result = billId
        ? await fetchCustomerBillById(billId)
        : await fetchCurrentBillByTable(tableNumber)

      if (result.success && result.bill) {
        setBill(result.bill)
        setError(null)
        setPolling(false)
        return true
      }
      setError("Your bill is being prepared…")
      return false
    } catch {
      setError("Unable to fetch bill. Please wait…")
      return false
    } finally {
      setLoading(false)
    }
  }, [tableNumber, billId])

  useEffect(() => { fetchBill() }, [fetchBill])

  useEffect(() => {
    if (!polling || bill) return
    const id = setInterval(async () => { if (await fetchBill()) clearInterval(id) }, 3000)
    return () => clearInterval(id)
  }, [polling, bill, fetchBill])

  // Fetch public game settings when bill has the game enabled
  useEffect(() => {
    if (bill?.discountGameEnabled && !bill?.discountGamePlayed) {
      fetchPublicGameSettings()
        .then((data) => setGameSettings(data))
        .catch(() => {})
    }
  }, [bill?.discountGameEnabled, bill?.discountGamePlayed])

  const handleRequestBill = async () => {
    setLoading(true); setError(null)
    try {
      const result = await requestCustomerBill(tableNumber)
      if (result.success && result.bill) {
        setBill(result.bill)
        setBillId(result.bill._id)
        setPolling(false)
      }
    } catch { setError("Failed to request bill. Please try again.") }
    finally { setLoading(false) }
  }

  const handleEsewaPay = async () => {
    if (!bill?._id) return
    setEsewaLoading(true); setEsewaError("")
    try {
      const { params, paymentUrl } = await initiateEsewaPayment(bill._id)

      // remember this bill so CustomerTabletPage can verify payment on return
      sessionStorage.setItem(`pendingEsewaBillId_${tableNumber}`, bill._id)

      const origin     = window.location.origin
      const successUrl = `${origin}/esewa/success/${tableNumber}`
      const failureUrl = `${origin}/esewa/failure/${tableNumber}`

      const form = document.createElement("form")
      form.method = "POST"
      form.action = paymentUrl

      const fields = { ...params, success_url: successUrl, failure_url: failureUrl }

      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement("input")
        input.type  = "hidden"
        input.name  = k
        input.value = v
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      setEsewaError(err?.response?.data?.message || "Failed to initiate eSewa payment.")
      setEsewaLoading(false)
    }
  }

  // ── loading ─────────────────────────────────────────────────
  if (loading && !bill) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-[#1D9E75] rounded-full animate-spin mx-auto mb-4" />
        <span className="text-sm text-gray-500">Fetching your bill…</span>
      </div>
    </div>
  )

  // ── no bill yet ──────────────────────────────────────────────
  if (error && !bill) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 mx-auto flex items-center justify-center text-3xl mb-4">🧾</div>
        <div className="text-sm font-bold text-gray-800 mb-1">No Active Bill Found</div>
        <div className="text-xs text-gray-400 mb-5">{error}</div>
        <button onClick={handleRequestBill}
          className="w-full py-3 bg-[#1D9E75] text-white rounded-2xl text-sm font-bold mb-2 hover:bg-[#179060] transition-all">
          Request Bill Now
        </button>
        <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all">
          Close
        </button>
      </div>
    </div>
  )

  if (!bill) return null

  // ── derive items ─────────────────────────────────────────────
  const billItems = (() => {
    if (bill.items?.length > 0) return bill.items
    if (bill.orders?.length > 0) return bill.orders.flatMap(o => (o.items || []))
    return []
  })()

  const subtotal          = Number(bill.subtotal              ?? 0)
  const discount          = Number(bill.discountAmount        ?? 0)
  const gameDiscAmt       = Number(bill.discountGameAmount    ?? 0)
  const gameDiscPct       = bill.discountGameResult ?? 0
  const gameDiscPlayed    = !!bill.discountGamePlayed
  const cashierDiscPct    = Number(bill.cashierDiscount       ?? 0)
  const cashierDiscAmt    = Number(bill.cashierDiscountAmount ?? 0)
  const discSub           = Number(bill.discountedSubtotal    ?? subtotal)
  const vatPct            = Number(bill.vatPercent            ?? 13)
  const vatAmount         = Number(bill.vatAmount             ?? 0)
  const tipAmount         = Number(bill.tipAmount             ?? 0)
  const grandTotal        = Number(bill.totalAmount           ?? 0)
  const isPaid            = bill.paymentStatus === "paid"

  // Offer names for discount line
  const offerNames = bill.appliedOffers?.length > 0
    ? [...new Set(bill.appliedOffers.map(o => o.title))].join(", ")
    : null

  // Cashier discount reason label
  const CASHIER_REASON_LABELS = {
    regular_customer:     "Regular Customer",
    daily_visitor:        "Daily Visitor",
    special_occasion:     "Special Occasion",
    birthday:             "Birthday",
    complaint_resolution: "Complaint Resolution",
    manager_approval:     "Manager Approval",
    other:                "Special",
  }
  const cashierReasonLabel = bill.cashierDiscountReason
    ? (CASHIER_REASON_LABELS[bill.cashierDiscountReason] || bill.cashierDiscountReason)
    : null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center text-lg">🧾</div>
            <div>
              <div className="text-base font-bold text-gray-900">Your Bill</div>
              <div className="text-xs text-gray-400">Table {tableNumber}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 transition-all">×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Receipt header */}
          <div className="text-center pb-4 border-b border-dashed border-gray-200">
            <div className="text-3xl mb-1">🏔</div>
            <div className="text-base font-black text-gray-900">Himalaya Kitchen</div>
            <div className="text-xs text-gray-400 mt-0.5">Table {tableNumber}</div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-[10px] font-mono text-gray-300">#{bill._id?.slice(-8).toUpperCase()}</span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] text-gray-300">
                {new Date(bill.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1.5 border-b border-gray-100">
              <span>Item</span>
              <span>Amount</span>
            </div>
            {billItems.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">No items found</div>
            ) : (
              billItems.map((item, idx) => (
                <div key={idx} className="py-1.5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {item.quantity}× {item.name}
                      </span>
                      {(item.selectedVariants || []).map((v, vi) => (
                        <div key={vi} className="text-[10px] text-amber-600 mt-0.5 ml-3">
                          {v.groupName}: {v.label}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                      Rs. {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-dashed border-gray-200 pt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  <span>🏷️</span>
                  <span>Offer Discount{offerNames ? ` (${offerNames})` : ""}</span>
                </span>
                <span>− Rs. {discount.toLocaleString()}</span>
              </div>
            )}
            {gameDiscPlayed && gameDiscAmt > 0 && (
              <div className="flex justify-between text-sm text-violet-600 font-medium">
                <span className="flex items-center gap-1">
                  <span>🎲</span>
                  <span>Game Discount ({gameDiscPct === 100 ? "FREE!" : `${gameDiscPct}%`})</span>
                </span>
                <span>− Rs. {gameDiscAmt.toLocaleString()}</span>
              </div>
            )}
            {cashierDiscAmt > 0 && (
              <div className="flex justify-between text-sm text-blue-600 font-medium">
                <span className="flex items-center gap-1">
                  <span>🎟️</span>
                  <span>
                    Cashier Discount ({cashierDiscPct}%{cashierReasonLabel ? ` · ${cashierReasonLabel}` : ""})
                  </span>
                </span>
                <span>− Rs. {cashierDiscAmt.toLocaleString()}</span>
              </div>
            )}
            {(discount > 0 || gameDiscAmt > 0 || cashierDiscAmt > 0) && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>After Discounts</span>
                <span>Rs. {discSub.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>VAT ({vatPct}%)</span>
              <span>Rs. {vatAmount.toLocaleString()}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tip</span>
                <span>Rs. {tipAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-base font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-[#1D9E75]">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Discount Game Banner */}
          {!isPaid && bill.discountGameEnabled && !bill.discountGamePlayed && gameSettings?.isEnabled && (
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-center shadow-lg shadow-violet-200">
              <div className="text-3xl mb-1">🎰</div>
              <div className="text-base font-black text-white">Spin & Win a Discount!</div>
              <div className="text-xs text-violet-100 mt-0.5 mb-3">Try your luck before paying</div>
              <button
                onClick={() => setShowWheel(true)}
                className="w-full py-3 bg-white text-violet-600 rounded-xl font-black text-sm hover:bg-violet-50 transition-all active:scale-95 shadow-sm"
              >
                🎲 Spin the Wheel!
              </button>
            </div>
          )}

          {/* Payment section */}
          {isPaid ? (
            <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-sm font-bold text-[#1D9E75]">Bill Paid — Thank you!</div>
              <div className="text-xs text-gray-400 mt-1">
                Method: {bill.paymentMethod?.toUpperCase()}
                {bill.paidAt && ` · ${new Date(bill.paidAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Choose Payment Method</div>

              {esewaError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {esewaError}
                </div>
              )}
              <button
                onClick={handleEsewaPay}
                disabled={esewaLoading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60
                  bg-[#60BB46] hover:bg-[#4ea83a] text-white shadow-md shadow-[#60BB46]/30 active:scale-[0.98]">
                {esewaLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting to eSewa…</>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#60BB46] font-black text-xs">e</span>
                    </div>
                    Pay with eSewa — Rs. {grandTotal.toLocaleString()}
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-gray-100" />
                <span className="text-[10px] text-gray-300 font-medium">or</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-base flex-shrink-0">💵</div>
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Pay at cashier</span> — show this bill to the cashier to pay by cash or card
                </div>
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all">
            Close
          </button>
        </div>
      </div>

      {/* Spin Wheel Overlay — rendered outside the scroll container */}
      {showWheel && gameSettings && (
        <SpinWheelOverlay
          bill={bill}
          gameSettings={gameSettings}
          onSkip={() => setShowWheel(false)}
          onProceedToPayment={() => setShowWheel(false)}
          onBillUpdate={(updatedBill) => {
            setBill(updatedBill)
            setShowWheel(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Order Tracker Card ────────────────────────────────────────
function OrderTrackerCard({ order, now }) {
  const isCancelled = order.status === "cancelled"
  const elapsed = Math.floor((now - new Date(order.createdAt)) / 60000)

  const kitchenItems = order.items?.filter(i => i.destination === "kitchen") || []
  const barItems     = order.items?.filter(i => i.destination === "bar")     || []

  const allServed  = order.items?.every(i => i.status === "served")
  const anyReady   = order.items?.some(i => i.status === "ready")
  const anyCooking = order.items?.some(i => i.status === "cooking")

  const orderBadge = isCancelled  ? { label: "Cancelled",  cls: "bg-red-50 text-red-600 border-red-200"    }
    : allServed                   ? { label: "All Served",  cls: "bg-zinc-100 text-zinc-400 border-zinc-200" }
    : anyReady                    ? { label: "Ready 🎉",    cls: "bg-green-50 text-green-700 border-green-200" }
    : anyCooking                  ? { label: "Preparing",   cls: "bg-orange-50 text-orange-600 border-orange-200" }
    :                               { label: "Received",    cls: "bg-amber-50 text-amber-600 border-amber-200" }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all
      ${isCancelled ? "border-red-200 opacity-70" : allServed ? "border-zinc-200 opacity-60" : "border-gray-100"}`}>

      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isCancelled ? "bg-red-500" : allServed ? "bg-zinc-300" : anyCooking || anyReady ? "bg-orange-500 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
          <span className="text-sm font-bold text-gray-900">Order #{order._id?.slice(-4).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          {elapsed >= 0 && !allServed && !isCancelled && (
            <span className="text-[10px] text-gray-400">{elapsed}m ago</span>
          )}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${orderBadge.cls}`}>
            {orderBadge.label}
          </span>
        </div>
      </div>

      {/* ── Per-item timers are shown inline on each item row below ── */}

      {isCancelled ? (
        <div className="px-4 py-3 bg-red-50">
          <div className="text-xs font-bold text-red-600 mb-1">Order Cancelled</div>
          {order.cancelReason && <div className="text-xs text-red-500 italic">"{order.cancelReason}"</div>}
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {kitchenItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">🍳 Kitchen</span>
              </div>
              <div className="space-y-1.5">
                {kitchenItems.map(item => {
                  const cfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.pending
                  // Per-item countdown (only when cooking + timer data available)
                  let timerNode = null
                  if (item.status === "cooking" && item.cookingStartedAt && item.estimatedSecs) {
                    const deadline = new Date(item.cookingStartedAt).getTime() + item.estimatedSecs * 1000
                    const timeLeft = deadline - now
                    if (timeLeft <= 0) {
                      timerNode = (
                        <span className="text-[10px] font-black text-orange-500 ml-auto flex-shrink-0 animate-pulse">
                          Almost ready!
                        </span>
                      )
                    } else {
                      const m = Math.floor(timeLeft / 60000)
                      const s = Math.floor((timeLeft % 60000) / 1000)
                      timerNode = (
                        <span className="text-[10px] font-black text-orange-500 ml-auto flex-shrink-0 tabular-nums">
                          ~{m}m {s}s
                        </span>
                      )
                    }
                  }
                  return (
                    <div key={item._id} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${item.status === "cooking" ? "animate-pulse" : ""}`} />
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {item.quantity}× {item.name}
                          </span>
                        </div>
                        {item.selectedVariants?.map(v => (
                          <div key={v.groupName} className="text-[10px] text-amber-600 ml-3 mt-0.5">{v.groupName}: {v.label}</div>
                        ))}
                      </div>
                      {timerNode
                        ? timerNode
                        : <span className={`text-[10px] font-bold ml-2 flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {barItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">🍹 Bar</span>
              </div>
              <div className="space-y-1.5">
                {barItems.map(item => {
                  const cfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.pending
                  // Per-item countdown (only when cooking + timer data available)
                  let timerNode = null
                  if (item.status === "cooking" && item.cookingStartedAt && item.estimatedSecs) {
                    const deadline = new Date(item.cookingStartedAt).getTime() + item.estimatedSecs * 1000
                    const timeLeft = deadline - now
                    if (timeLeft <= 0) {
                      timerNode = (
                        <span className="text-[10px] font-black text-orange-500 ml-auto flex-shrink-0 animate-pulse">
                          Almost ready!
                        </span>
                      )
                    } else {
                      const m = Math.floor(timeLeft / 60000)
                      const s = Math.floor((timeLeft % 60000) / 1000)
                      timerNode = (
                        <span className="text-[10px] font-black text-orange-500 ml-auto flex-shrink-0 tabular-nums">
                          ~{m}m {s}s
                        </span>
                      )
                    }
                  }
                  return (
                    <div key={item._id} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${item.status === "cooking" ? "animate-pulse" : ""}`} />
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {item.quantity}× {item.name}
                          </span>
                        </div>
                        {item.selectedVariants?.map(v => (
                          <div key={v.groupName} className="text-[10px] text-amber-600 ml-3 mt-0.5">{v.groupName}: {v.label}</div>
                        ))}
                      </div>
                      {timerNode
                        ? timerNode
                        : <span className={`text-[10px] font-bold ml-2 flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────
export default function CustomerTablet() {
  const { tableNumber: rawTable } = useParams()
  const tableNumber = rawTable.toUpperCase()
  const location    = useLocation()

  const [menu,            setMenu]            = useState([])
  const [cart,            setCart]            = useState([])
  const [filter,          setFilter]          = useState("all")
  const [view,            setView]            = useState("menu")
  const [orders,          setOrders]          = useState([])
  const [placing,         setPlacing]         = useState(false)
  const [selected,        setSelected]        = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [tableValid,      setTableValid]      = useState(null)
  const [activeOffers,    setActiveOffers]    = useState([])
  const [recommendations, setRecommendations] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`rec_${rawTable}`) || "[]") } catch { return [] }
  })
  const [popularItems,    setPopularItems]    = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`pop_${rawTable}`) || "[]") } catch { return [] }
  })
  const [showBill,        setShowBill]        = useState(false)
  const [billRequesting,  setBillRequesting]  = useState(false)
  const [currentBillId,   setCurrentBillId]   = useState(null)
  const [tablePaid,       setTablePaid]       = useState(false)
  const [showFeedback,    setShowFeedback]    = useState(false)
  const [feedbackBillId,  setFeedbackBillId]  = useState(null)
  const [now,             setNow]             = useState(Date.now())
  const [esewaVerifying,  setEsewaVerifying]  = useState(false)
  const [esewaError,      setEsewaError]      = useState("")

  // 1-second tick for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // keep a ref so socket handlers (stable refs) can read the latest billId
  const currentBillIdRef = useRef(null)
  useEffect(() => { currentBillIdRef.current = currentBillId }, [currentBillId])

  // ── Handle eSewa payment result after redirect back ───────────
  useEffect(() => {
    const storageKey = `pendingEsewaBillId_${rawTable}`

    // Case 1: EsewaCallbackPage verified the payment and passed result via router state
    const esewaResult = location.state?.esewaResult
    const stateBillId = location.state?.billId
    if (esewaResult) {
      sessionStorage.removeItem(storageKey)
      if (esewaResult === "success" && stateBillId) {
        checkFeedbackExists(stateBillId)
          .then(res => {
            if (!res.exists) {
              setTimeout(() => { setFeedbackBillId(stateBillId); setShowFeedback(true) }, 800)
            }
          })
          .catch(() => {})
      } else {
        setEsewaError("Payment was not completed. Please try again or pay at the counter.")
      }
      return
    }

    // Case 2: Customer returned directly (closed eSewa tab) — no router state.
    // Fetch the bill to check actual payment status rather than assuming success.
    const pendingBillId = sessionStorage.getItem(storageKey)
    if (!pendingBillId) return
    sessionStorage.removeItem(storageKey)

    setEsewaVerifying(true)
    fetchCustomerBillById(pendingBillId)
      .then(res => {
        const bill = res?.bill
        if (bill?.paymentStatus === "paid") {
          checkFeedbackExists(pendingBillId)
            .then(fr => {
              if (!fr.exists) {
                setTimeout(() => { setFeedbackBillId(pendingBillId); setShowFeedback(true) }, 800)
              }
            })
            .catch(() => {})
        } else {
          setEsewaError("Payment was not completed. Please try again or pay at the counter.")
        }
      })
      .catch(() => {
        setEsewaError("Payment was not completed. Please try again or pay at the counter.")
      })
      .finally(() => setEsewaVerifying(false))
  }, [rawTable])

  // ── Helper: open feedback modal if not yet submitted ──────────
  const maybeTriggerFeedback = useCallback((billId, afterFeedbackDone) => {
    if (!billId) { afterFeedbackDone(); return }
    checkFeedbackExists(billId)
      .then(res => {
        if (!res.exists) {
          setTimeout(() => {
            setFeedbackBillId(billId)
            setShowFeedback(true)
          }, 1500)
        } else {
          afterFeedbackDone()
        }
      })
      .catch(() => afterFeedbackDone())
  }, [])

  // ── Fetch offers (public endpoint, no auth required) ──────────
  useEffect(() => {
    fetchPublicActiveOffers()
      .then(setActiveOffers)
      .catch(() => setActiveOffers([]))
  }, [])

  useEffect(() => {
    const checkTable = async () => {
      try {
        const res  = await fetch("/api/v1/tables")
        const data = await res.json()
        const exists = data.tables?.some(t => t.tableNumber?.toLowerCase() === tableNumber?.toLowerCase())
        setTableValid(!!exists)
      } catch { setTableValid(false) }
    }
    checkTable()
  }, [tableNumber])

  useEffect(() => {
    const loadActiveOrders = async () => {
      try {
        const res = await fetchOrders({ tableNumber, status: "pending,cooking,ready,served" })
        if (res.orders?.length > 0) setOrders(res.orders)
      } catch { }
    }
    loadActiveOrders()
  }, [tableNumber])

  useEffect(() => {
    fetchMenu({ isAvailable: true })
      .then((d) => setMenu(d.menu || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const fetchRecommendations = useCallback(async (orderItems) => {
    if (!orderItems || orderItems.length === 0) { setRecommendations([]); setPopularItems([]); return }
    try {
      const itemNames = orderItems.map((i) => i.name).join(",")
      const recRes    = await fetch(`/api/v1/recommendations?items=${encodeURIComponent(itemNames)}`)
      const recData   = await recRes.json()
      if (recData.success) {
        setRecommendations(recData.recommendations || [])
        sessionStorage.setItem(`rec_${rawTable}`, JSON.stringify(recData.recommendations || []))
      }
      const popRes  = await fetch(`/api/v1/recommendations/popular?exclude=${encodeURIComponent(itemNames)}`)
      const popData = await popRes.json()
      if (popData.success) {
        setPopularItems(popData.popular || [])
        sessionStorage.setItem(`pop_${rawTable}`, JSON.stringify(popData.popular || []))
      }
    } catch {
      setRecommendations([]); setPopularItems([])
      sessionStorage.removeItem(`rec_${rawTable}`)
      sessionStorage.removeItem(`pop_${rawTable}`)
    }
  }, [rawTable])

  useSocket(
    {
      "order-status-update": (data) => {
        if (data.status === "billed") {
          setOrders(prev => prev.filter(o => o._id !== data.orderId))
        } else {
          setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, status: data.status } : o))
        }
      },
      "item-status-update": ({ orderId, itemId, status, orderStatus, cookingStartedAt, estimatedSecs }) => {
        setOrders(prev => prev.map(o => {
          if (o._id !== orderId) return o
          return {
            ...o,
            status: orderStatus || o.status,
            items: o.items.map(i => {
              if (i._id !== itemId) return i
              const updated = { ...i, status }
              // Attach timer data when cooking starts
              if (status === "cooking") {
                if (cookingStartedAt) updated.cookingStartedAt = cookingStartedAt
                if (estimatedSecs)    updated.estimatedSecs    = estimatedSecs
              }
              // Clear timer data when done
              if (status === "ready" || status === "served") {
                updated.cookingStartedAt = null
                updated.estimatedSecs    = null
              }
              return updated
            }),
          }
        }))
      },
      "order-cancelled": (data) => {
        setOrders(prev => prev.map(o =>
          o._id === data.orderId ? { ...o, status: "cancelled", cancelReason: data.reason } : o
        ))
      },
      "table-status-update": ({ tableNumber: tbl, status, billId: paidBillId }) => {
        if (tbl?.toString().toUpperCase() === tableNumber && status === "available") {
          setOrders([])
          setCart([])
          setShowBill(false)
          // prefer billId from socket event; fall back to what customer opened
          const billId = paidBillId || currentBillIdRef.current
          maybeTriggerFeedback(billId, () => setTablePaid(true))
        }
      },
      "bill-paid": ({ billId }) => {
        // eSewa payment verified by backend — clear any verifying state and show feedback
        setEsewaVerifying(false)
        setEsewaError("")
        if (billId) {
          checkFeedbackExists(billId)
            .then(res => {
              if (!res.exists) {
                setTimeout(() => { setFeedbackBillId(billId); setShowFeedback(true) }, 800)
              }
            })
            .catch(() => {})
        }
      },
      "bill-payment-failed": ({ billId: _billId }) => {
        // eSewa payment failed verification
        setEsewaVerifying(false)
        setEsewaError("Payment was not completed. Please try again or pay at the counter.")
      },
      "menu-availability-update": ({ disabledItems }) => {
        if (!disabledItems?.length) return
        setMenu((prev) =>
          prev.map((item) =>
            disabledItems.includes(item._id.toString())
              ? { ...item, isAvailable: false }
              : item
          )
        )
      },
      "order-estimated": ({ orderId, estimatedTime, estimatedAt }) => {
        setOrders(prev => prev.map(o =>
          o._id === orderId ? { ...o, estimatedTime, estimatedAt } : o
        ))
      },
    },
    [{ event: "join-table", value: tableNumber }]
  )

  // ── Offer maps (memoised) ─────────────────────────────────────
  const billOffers = useMemo(
    () => activeOffers.filter(o => o.scope === "bill"),
    [activeOffers]
  )

  // menuItemId (string) → best item-scope offer
  const itemOfferMap = useMemo(() => {
    const map = {}
    activeOffers
      .filter(o => o.scope === "item")
      .forEach(offer => {
        (offer.applicableItems || []).forEach(ref => {
          const id = ref._id || ref
          // Keep offer even if multiple — just use the first found
          if (!map[id]) map[id] = offer
        })
      })
    return map
  }, [activeOffers])

  // category (lowercase) → category-scope offer
  const categoryOfferMap = useMemo(() => {
    const map = {}
    activeOffers
      .filter(o => o.scope === "category" && o.applicableCategory)
      .forEach(offer => { map[offer.applicableCategory.toLowerCase()] = offer })
    return map
  }, [activeOffers])

  // ── Category tab badge helper ─────────────────────────────────
  const getCategoryBadge = useCallback((cat) => {
    if (cat === "all") return null

    // Category-level offer takes priority
    const catOffer = categoryOfferMap[cat.toLowerCase()]
    if (catOffer) {
      return {
        type: "category",
        text: catOffer.type === "percentage" ? `${catOffer.value}% OFF` : `Rs.${catOffer.value} OFF`,
      }
    }

    // Check if any item in this category has an item-level offer
    const hasItemOffer = menu.some(m => m.category === cat && itemOfferMap[m._id])
    if (hasItemOffer) return { type: "item", text: "Offers" }

    return null
  }, [categoryOfferMap, itemOfferMap, menu])

  // ── Derived values ────────────────────────────────────────────
  const cartTotal   = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount   = cart.reduce((s, i) => s + i.quantity, 0)
  const activeOrders = orders.filter(o => !["served", "cancelled", "billed"].includes(o.status))

  const allServed = orders.length > 0 &&
    orders.filter(o => o.status !== "cancelled").length > 0 &&
    orders.filter(o => o.status !== "cancelled").every(o =>
      o.status === "served" || o.status === "billed" ||
      o.items?.every(i => i.status === "served")
    )

  // ── Handlers ──────────────────────────────────────────────────
  const handleCheckBill = async () => {
    setBillRequesting(true)
    try {
      const existing = await fetchCurrentBillByTable(tableNumber)
      if (existing.success && existing.bill) {
        setCurrentBillId(existing.bill._id)
        setShowBill(true)
      } else {
        const result = await requestCustomerBill(tableNumber)
        if (result.success && result.bill) {
          setCurrentBillId(result.bill._id)
          setShowBill(true)
        } else {
          alert("Unable to generate bill. Please contact staff.")
        }
      }
    } catch {
      alert("Unable to fetch bill. Please contact staff.")
    } finally {
      setBillRequesting(false)
    }
  }

  const addToCart = (item, opts = {}) => {
    const key   = item._id + JSON.stringify(opts)
    const price = opts.price !== undefined ? opts.price : item.price
    setCart((prev) => {
      const exists = prev.find((c) => c.key === key)
      if (exists) return prev.map(c => c.key === key ? { ...c, quantity: c.quantity + (opts.qty || 1) } : c)
      return [...prev, {
        key,
        menuItem:            item._id,
        name:                item.name,
        price,
        quantity:            opts.qty || 1,
        image:               item.image,
        selectedIngredients: opts.kept    || [],
        removedIngredients:  opts.removed || [],
        selectedOptions:     opts.options || [],
        selectedVariants:    opts.selectedVariants || [],
      }]
    })
    setSelected(null)
  }

  const updateQty = (key, delta) =>
    setCart(prev =>
      prev.map(c => c.key === key ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter(c => c.quantity > 0)
    )

  const handlePlaceOrder = async () => {
    if (!cart.length) return
    setPlacing(true)
    try {
      const res = await placeOrder({
        tableNumber,
        items: cart.map(({ menuItem, name, price, quantity, selectedIngredients, removedIngredients, selectedOptions, selectedVariants }) => ({
          menuItem, name, price, quantity,
          selectedIngredients, removedIngredients, selectedOptions, selectedVariants,
        })),
        totalAmount: cartTotal,
      })
      const orderedItems = [...cart]
      setOrders(prev => [...prev, res.order])
      setCart([])
      setView("tracker")
      fetchRecommendations(orderedItems)
    } catch { }
    finally { setPlacing(false) }
  }

  const handleItemClick = (item) => {
    if (item.isAvailable === false) return
    const hasVariants = item.variantGroups?.length > 0
    const hasCustom   = item.ingredients?.some(i => i.optional) || item.optionGroups?.length > 0
    if (hasVariants || hasCustom) setSelected(item)
    else addToCart(item, { qty: 1 })
  }

  const filteredSingle = menu.filter(i => i.category === filter)

  // ── Loading / error screens ───────────────────────────────────
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
        <div className="text-sm text-zinc-400">Table <span className="font-bold text-zinc-600">{tableNumber}</span> does not exist.</div>
        <div className="text-sm text-zinc-400 mt-1">Please scan the correct QR code.</div>
      </div>
    </div>
  )

  // ── eSewa: verifying payment spinner ─────────────────────────
  if (esewaVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-[#60BB46] rounded-full animate-spin mx-auto mb-5" />
          <div className="text-base font-bold text-gray-800">Verifying your payment…</div>
          <div className="text-xs text-gray-400 mt-2">Please wait, this only takes a moment</div>
        </div>
      </div>
    )
  }

  // ── eSewa: payment not completed error ────────────────────────
  if (esewaError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-red-500 text-2xl font-black">✕</span>
          </div>
          <div className="text-base font-bold text-gray-900 mb-2">Payment Not Completed</div>
          <div className="text-sm text-gray-500 mb-6">{esewaError}</div>
          <button
            onClick={() => setEsewaError("")}
            className="w-full py-3 bg-[#1D9E75] text-white rounded-2xl text-sm font-bold hover:bg-[#178a64] transition-all">
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  // ── Feedback modal (shown after payment, before paid screen) ──
  if (showFeedback && feedbackBillId) {
    return (
      <FeedbackModal
        billId={feedbackBillId}
        tableNumber={tableNumber}
        onDone={() => {
          setShowFeedback(false)
          setFeedbackBillId(null)
          setOrders([])
          setCart([])
          setShowBill(false)
          setCurrentBillId(null)
          setView("menu")
        }}
      />
    )
  }

  // ── Payment complete screen ───────────────────────────────────
  if (tablePaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-[#1D9E75]/10 flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#1D9E75] flex items-center justify-center shadow-lg shadow-[#1D9E75]/40">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-gray-900 leading-tight">Payment Complete!</div>
            <div className="text-sm text-gray-400 mt-1">Table {tableNumber}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 w-full shadow-sm">
            <div className="text-3xl mb-3">🏔</div>
            <div className="text-base font-bold text-gray-900">Thank you for dining with us!</div>
            <div className="text-sm text-gray-400 mt-1">We hope to see you again at Himalaya Kitchen.</div>
          </div>

          <div className="flex flex-col gap-2 w-full text-xs text-gray-300">
            <div>Your table is now available for new guests.</div>
            <div>Please take all your belongings. Have a great day! 🙏</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main layout ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HEADER (sticky) ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D9E75] flex items-center justify-center text-xl flex-shrink-0">🏔</div>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">Himalaya Kitchen</div>
            <div className="text-xs text-gray-400">Table {tableNumber}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "menu",    label: "Menu",    icon: "🍽" },
            { key: "cart",    label: cartCount > 0 ? `Cart (${cartCount})` : "Cart", icon: "🛒" },
            { key: "tracker", label: activeOrders.length > 0 ? `Orders (${activeOrders.length})` : "Orders", icon: "📋" },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all
                ${view === v.key ? "bg-[#1D9E75] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <span className="text-sm">{v.icon}</span>
              <span>{v.label}</span>
              {v.key === "tracker" && activeOrders.length > 0 && view !== "tracker" && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {activeOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MENU VIEW
      ════════════════════════════════════════════════════════ */}
      {view === "menu" && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Offer banners — scroll with content, not sticky */}
          {billOffers.length > 0 && <OfferBanners offers={billOffers} />}

          {/* ── Category bar — sticky, sits right below the fixed header ── */}
          <div className="sticky top-[64px] z-10 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-none">
              {ALL_CATS.map(cat => {
                const badge     = getCategoryBadge(cat)
                const isActive  = filter === cat
                const hasCatOff = badge?.type === "category"
                return (
                  <button key={cat} onClick={() => setFilter(cat)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all
                      ${isActive
                        ? "bg-[#1D9E75] text-white border-[#1D9E75]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                    <span className="text-sm">{CAT_ICONS[cat]}</span>
                    <span>{cat === "all" ? "All Items" : cat}</span>

                    {/* Category-level offer badge */}
                    {badge && !isActive && (
                      <span className={`ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none
                        ${hasCatOff
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-100 text-emerald-700"}`}>
                        {hasCatOff ? badge.text : "🏷️"}
                      </span>
                    )}
                    {badge && isActive && (
                      <span className="ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none bg-white/25 text-white">
                        {hasCatOff ? badge.text : "🏷️"}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Items grid — scrollable ── */}
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-28">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                <span className="text-gray-400 text-sm font-medium">Loading menu...</span>
              </div>
            ) : filter === "all" ? (
              <>
                {FOOD_CATS.filter(c => menu.some(i => i.category === c)).map(cat => (
                  <CategorySection
                    key={cat} cat={cat}
                    items={menu.filter(i => i.category === cat)}
                    onItemClick={handleItemClick}
                    itemOfferMap={itemOfferMap}
                    categoryOfferMap={categoryOfferMap}
                  />
                ))}
                {BAR_CATS.some(c => menu.some(i => i.category === c)) && (
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase px-2">Bar &amp; Drinks</span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>
                )}
                {BAR_CATS.filter(c => menu.some(i => i.category === c)).map(cat => (
                  <CategorySection
                    key={cat} cat={cat}
                    items={menu.filter(i => i.category === cat)}
                    onItemClick={handleItemClick}
                    itemOfferMap={itemOfferMap}
                    categoryOfferMap={categoryOfferMap}
                  />
                ))}
              </>
            ) : filteredSingle.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <span className="text-5xl opacity-20">🍽</span>
                <span className="text-gray-400 font-medium">No items in this category</span>
              </div>
            ) : (
              <CategorySection
                cat={filter} items={filteredSingle}
                onItemClick={handleItemClick}
                itemOfferMap={itemOfferMap}
                categoryOfferMap={categoryOfferMap}
              />
            )}
          </div>

          {/* Floating cart button */}
          {cartCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 z-10">
              <button onClick={() => setView("cart")}
                className="w-full py-3.5 bg-[#1D9E75] text-white rounded-2xl font-bold flex items-center justify-between px-5">
                <span className="bg-white/20 px-3 py-1 rounded-xl text-xs">{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
                <span>View Cart →</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          CART VIEW
      ════════════════════════════════════════════════════════ */}
      {view === "cart" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 pb-48">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-5xl">🛒</div>
                <div className="text-base font-semibold text-gray-500">Your cart is empty</div>
                <button onClick={() => setView("menu")}
                  className="px-6 py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-bold">Browse Menu</button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-3">
                {cart.map(item => (
                  <div key={item.key} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl opacity-30">🍽</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900">{item.name}</div>
                      {item.selectedVariants?.map(v => (
                        <div key={v.groupName} className="text-xs text-amber-600 font-medium mt-0.5">{v.groupName}: {v.label} (Rs. {v.price})</div>
                      ))}
                      {item.selectedOptions?.map(opt => (
                        <div key={opt.groupName} className="text-xs text-blue-500 font-medium mt-0.5">{opt.groupName}: {opt.selected?.join(", ")}</div>
                      ))}
                      {item.removedIngredients?.length > 0 && (
                        <div className="text-xs text-red-400 font-medium mt-0.5">No: {item.removedIngredients.join(", ")}</div>
                      )}
                      <div className="text-sm font-bold text-green-700 mt-1">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateQty(item.key, -1)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all text-sm font-bold">−</button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, 1)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-all text-sm font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 z-10">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex justify-between items-center text-sm px-1">
                  <div className="flex gap-6">
                    <span className="text-gray-500">Subtotal <span className="text-gray-800 font-semibold">Rs. {cartTotal.toLocaleString()}</span></span>
                    <span className="text-gray-500">VAT 13% <span className="text-gray-800 font-semibold">Rs. {Math.round(cartTotal * 0.13).toLocaleString()}</span></span>
                  </div>
                  <span className="font-bold text-green-700 text-base">Rs. {Math.round(cartTotal * 1.13).toLocaleString()}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="w-full py-3.5 bg-[#1D9E75] text-white rounded-2xl font-bold disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  {placing
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing order...</>
                    : "Place Order →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TRACKER VIEW
      ════════════════════════════════════════════════════════ */}
      {view === "tracker" && (
        <div className="flex-1 overflow-y-auto p-5">

          {/* Recommendations */}
          {recommendations.length > 0 && activeOrders.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-base">🍽️</div>
                <div>
                  <div className="text-sm font-bold text-gray-800">People also order with this</div>
                  <div className="text-xs text-gray-400">Based on popular combinations</div>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {recommendations
                  .map(name => menu.find(m => m.name === name))
                  .filter(Boolean)
                  .map(item => (
                    <div key={item._id} onClick={() => { handleItemClick(item); setView("menu") }}
                      className="flex-shrink-0 w-36 bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-200 transition-all">
                      <div className="w-full h-20 bg-gray-50 flex items-center justify-center">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <span className="text-3xl">{CAT_ICONS[item.category] || "🍽"}</span>}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-bold text-gray-800 truncate">{item.name}</div>
                        <div className="text-xs font-bold text-green-700 mt-0.5">{getDisplayPrice(item)}</div>
                        <div className="mt-2 w-full py-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-lg text-center">+ Add</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Popular items */}
          {popularItems.length > 0 && activeOrders.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-base">⭐</div>
                <div>
                  <div className="text-sm font-bold text-gray-800">You may also like</div>
                  <div className="text-xs text-gray-400">Most loved by our customers</div>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {popularItems
                  .map(name => menu.find(m => m.name === name))
                  .filter(Boolean)
                  .map(item => (
                    <div key={item._id} onClick={() => { handleItemClick(item); setView("menu") }}
                      className="flex-shrink-0 w-36 bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-200 transition-all">
                      <div className="w-full h-20 bg-gray-50 flex items-center justify-center">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <span className="text-3xl">{CAT_ICONS[item.category] || "🍽"}</span>}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-bold text-gray-800 truncate">{item.name}</div>
                        <div className="text-xs font-bold text-green-700 mt-0.5">{getDisplayPrice(item)}</div>
                        <div className="mt-2 w-full py-1.5 bg-[#1D9E75] text-white text-[10px] font-bold rounded-lg text-center">+ Add</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Orders list */}
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-5xl">📋</div>
              <div className="text-base font-semibold text-gray-500">No orders yet</div>
              <button onClick={() => setView("menu")}
                className="px-6 py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-bold">Order Now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {orders.map(order => (
                <OrderTrackerCard key={order._id} order={order} now={now} />
              ))}
            </div>
          )}

          {/* Check bill */}
          {orders.length > 0 && (
            <div className="mt-6 max-w-5xl mx-auto">
              {allServed ? (
                <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center text-xl flex-shrink-0">🧾</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">All orders served!</div>
                      <div className="text-xs text-gray-500 mt-0.5">Please proceed to the cashier to pay.</div>
                    </div>
                  </div>
                  <button onClick={handleCheckBill} disabled={billRequesting}
                    className="w-full sm:w-auto px-6 py-3 bg-[#1D9E75] text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-md shadow-[#1D9E75]/20">
                    {billRequesting
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Requesting...</>
                      : "🧾 View Bill & Pay"}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">🧾</div>
                    <div className="text-xs text-gray-500">Orders in progress — bill will be available once all items are served.</div>
                  </div>
                  <button onClick={handleCheckBill} disabled={billRequesting}
                    className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1.5 transition-all">
                    {billRequesting
                      ? <div className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                      : "Preview Bill"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {selected && <CustomizeModal item={selected} onClose={() => setSelected(null)} onAdd={addToCart} />}
      {showBill && (
        <BillModal
          tableNumber={tableNumber}
          onClose={() => { setShowBill(false); setCurrentBillId(null) }}
          billId={currentBillId}
          setBillId={setCurrentBillId}
        />
      )}
    </div>
  )
}
