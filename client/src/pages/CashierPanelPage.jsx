import { useState, useEffect, useCallback, useRef } from "react"
import { fetchOrdersByTable, fetchAllTables } from "../service/orderService"
import { generateBill, processPayment, fetchBillByTable, applyCashierDiscount, enableTableGame } from "../service/billService"
import { applyOffers } from "../service/offerService"
import { createCashout, fetchCashouts } from "../service/CashoutService"
import useAuth from "../hooks/useAuth"
import { VAT_PERCENT } from "../constants"
import api from "../service/api"
import useSocket from "../hooks/useSocket"
import { fetchIngredients } from "../service/ingredientService"
import StockAlertToast from "../components/StockAlertToast"
import SoundToggle, { useSoundEnabled } from "../components/SoundToggle"
import { newOrderSound, cancelOrderSound, stockAlertSound, billRequestSound } from "../utils/soundAlert"
import { fetchGameSettings } from "../service/discountGameService"
import SpinWheelOverlay from "../components/SpinWheelOverlay"

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { key: "cash",   label: "Cash",   icon: "💵" },
  { key: "esewa",  label: "eSewa",  icon: "📱" },
  { key: "Bank", label: "Bank", icon: "🏦" },
]

const TIP_PRESETS = [0, 5, 10, 15, 20]

const CASHOUT_CATEGORIES = [
  { key: "groceries", label: "Groceries", icon: "🛒" },
  { key: "supplies",  label: "Supplies",  icon: "🧴" },
  { key: "utilities", label: "Utilities", icon: "💡" },
  { key: "repairs",   label: "Repairs",   icon: "🔧" },
  { key: "other",     label: "Other",     icon: "📦" },
]

// ─── Small reusable pieces ────────────────────────────────────────────────────

function ErrorBanner({ msg, onClose }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200">
      <span>⚠</span>
      <span className="flex-1">{msg}</span>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-red-400 hover:text-red-600">✕</button>
      )}
    </div>
  )
}

function Spinner({ size = 5, color = "green" }) {
  return (
    <div
      className={`w-${size} h-${size} border-2 border-${color}-200 border-t-${color}-500 rounded-full animate-spin`}
    />
  )
}

// ─── Table status helpers ─────────────────────────────────────────────────────

const tableStatusColor = (s) => {
  if (s === "occupied") return "border-orange-400 bg-orange-50 text-orange-700"
  if (s === "billing")  return "border-green-400  bg-green-50  text-green-700"
  if (s === "reserved") return "border-blue-400   bg-blue-50   text-blue-700"
  return "border-zinc-200 bg-white text-zinc-400"
}
const tableStatusDot = (s) =>
  s === "occupied" ? "bg-orange-400"
  : s === "billing"  ? "bg-green-400 animate-pulse"
  : s === "reserved" ? "bg-blue-400"
  : "bg-zinc-300"
const tableStatusLabel = (s) =>
  s === "occupied" ? "Dining"
  : s === "billing"  ? "Bill Ready"
  : s === "reserved" ? "Reserved"
  : "Available"

// ─── Sub-components ───────────────────────────────────────────────────────────

function TableGrid({
  tables, loading, selectedTable, onSelect, onRefresh, selectLoading,
  onFixTables, billRequestedTables = new Set(),
  gameSettings, gameEnabledTables = new Set(), onToggleTableGame,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`skel-${i}`} className="h-20 rounded-xl bg-zinc-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (tables.length === 0) {
    return <div className="text-center py-10 text-zinc-400 text-sm">No tables found</div>
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {tables.map((table, idx) => {
        const hasGame    = gameEnabledTables.has(table.tableNumber)
        const showGameBtn = gameSettings?.isEnabled &&
          (table.status === "occupied" || table.status === "billing")

        return (
          <button
            key={table._id ?? `table-${idx}`}
            onClick={() => onSelect(table)}
            disabled={table.status === "available" || selectLoading}
            className={[
              "relative flex flex-col items-center justify-center gap-1 h-20 rounded-xl border-2 font-bold transition-all",
              table.status !== "available"
                ? "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95"
                : "cursor-default opacity-50",
              selectedTable === table.tableNumber ? "ring-2 ring-green-500 ring-offset-2" : "",
              tableStatusColor(table.status),
              billRequestedTables.has(table.tableNumber) ? "bill-request-pulse" : "",
            ].join(" ")}
          >
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${tableStatusDot(table.status)}`} />
            <span className="text-lg">🪑</span>
            <span className="text-sm font-black">{table.tableNumber}</span>
            <span className="text-[10px] font-semibold opacity-70">{tableStatusLabel(table.status)}</span>
            {table.currentOrder && (
              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                !
              </span>
            )}
            {/* Per-table game icon — only on occupied/billing when master switch is on */}
            {showGameBtn && onToggleTableGame && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleTableGame(table) }}
                title={hasGame ? "Game ON — tap to disable" : "Tap to enable discount game for this table"}
                className={[
                  "absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all border",
                  hasGame
                    ? "bg-green-500 border-green-400 text-white shadow-sm shadow-green-300 animate-pulse"
                    : "bg-white border-zinc-300 text-zinc-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50",
                ].join(" ")}
              >
                🎲
              </button>
            )}
          </button>
        )
      })}
    </div>
  )
}

function OrderItemRow({ orderId, item, itemIndex }) {
  return (
    <div
      key={`${orderId}-item-${itemIndex}`}
      className="flex items-start justify-between py-2.5 border-b border-zinc-50 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-800">
          {item.quantity}× {item.name}
        </div>

        {(item.selectedOptions || []).map((opt, optIdx) => (
          <div
            key={`${orderId}-item-${itemIndex}-opt-${optIdx}`}
            className="text-xs text-blue-500 mt-0.5"
          >
            {opt.groupName}: {(opt.selected || []).join(", ")}
          </div>
        ))}

        {(item.removedIngredients || []).length > 0 && (
          <div className="text-xs text-red-400 mt-0.5">
            No: {item.removedIngredients.join(", ")}
          </div>
        )}
      </div>
      <div className="text-sm font-bold text-zinc-700 ml-4 shrink-0">
        Rs. {item.price * item.quantity}
      </div>
    </div>
  )
}

function OrdersList({ orders, selectedTable }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-sm">🧾</div>
        <span className="text-sm font-bold text-zinc-800">Table {selectedTable} — Orders</span>
      </div>
      <div className="p-5 space-y-1">
        {orders.map((order, orderIdx) =>
          (order.items || []).map((item, itemIdx) => (
            <OrderItemRow
              key={`order-${order._id ?? orderIdx}-item-${itemIdx}`}
              orderId={order._id ?? String(orderIdx)}
              item={item}
              itemIndex={itemIdx}
            />
          ))
        )}
      </div>
    </div>
  )
}

function OffersSection({ appliedOffers, totalDiscount }) {
  if (!appliedOffers.length) return null
  return (
    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">🏷️</span>
        <span className="text-sm font-bold text-emerald-800">Offers Applied</span>
      </div>
      {appliedOffers.map((offer, idx) => (
        <div
          key={`applied-offer-${offer.offerId ?? offer.title ?? idx}-${idx}`}
          className="flex justify-between items-center text-sm"
        >
          <div>
            <span className="font-medium text-emerald-700">{offer.title}</span>
            {offer.itemName && (
              <span className="text-xs text-emerald-500 ml-1">({offer.itemName})</span>
            )}
            {offer.category && (
              <span className="text-xs text-emerald-500 ml-1">({offer.category})</span>
            )}
          </div>
          <span className="font-bold text-emerald-700">− Rs. {offer.discountAmount}</span>
        </div>
      ))}
      <div className="flex justify-between items-center text-sm pt-1 border-t border-emerald-200">
        <span className="font-bold text-emerald-800">Total Discount</span>
        <span className="font-black text-emerald-700">− Rs. {totalDiscount}</span>
      </div>
    </div>
  )
}

// ─── Cashier Discount ────────────────────────────────────────────────────────

const CASHIER_DISCOUNT_REASONS = [
  { key: "regular_customer",     label: "Regular Customer"      },
  { key: "daily_visitor",        label: "Daily Visitor"         },
  { key: "special_occasion",     label: "Special Occasion"      },
  { key: "birthday",             label: "Birthday"              },
  { key: "complaint_resolution", label: "Complaint Resolution"  },
  { key: "manager_approval",     label: "Manager Approval"      },
  { key: "other",                label: "Other"                 },
]

function CashierDiscountSection({ bill, onBillUpdate, baseSubtotal }) {
  const [expanded, setExpanded] = useState(false)
  const [pct,      setPct]      = useState(0)
  const [reason,   setReason]   = useState("")
  const [note,     setNote]     = useState("")
  const [applying, setApplying] = useState(false)
  const [discErr,  setDiscErr]  = useState("")

  const previewAmt = pct > 0 ? Math.round(baseSubtotal * (pct / 100)) : 0

  const handleApply = async () => {
    setDiscErr("")
    if (pct > 0 && !reason) { setDiscErr("Please select a reason"); return }
    setApplying(true)
    try {
      const res = await applyCashierDiscount(bill._id, { discountPercent: pct, reason, note })
      onBillUpdate(res.bill)
      setExpanded(false)
    } catch (err) {
      setDiscErr(err.response?.data?.message || "Failed to apply discount")
    } finally {
      setApplying(false)
    }
  }

  const handleRemove = async () => {
    setDiscErr("")
    setApplying(true)
    try {
      const res = await applyCashierDiscount(bill._id, { discountPercent: 0 })
      onBillUpdate(res.bill)
      setPct(0); setReason(""); setNote("")
    } catch (err) {
      setDiscErr(err.response?.data?.message || "Failed to remove discount")
    } finally {
      setApplying(false)
    }
  }

  // ── Applied state (collapsed) ──────────────────────────────────
  if (bill?.cashierDiscount > 0 && !expanded) {
    const reasonLabel = CASHIER_DISCOUNT_REASONS.find(r => r.key === bill.cashierDiscountReason)?.label || bill.cashierDiscountReason
    return (
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-blue-700 mb-0.5">Cashier Discount Applied</div>
            <div className="text-sm font-semibold text-blue-800">
              {bill.cashierDiscount}%{reasonLabel ? ` · ${reasonLabel}` : ""} — Rs. {bill.cashierDiscountAmount?.toLocaleString()}
            </div>
            {bill.cashierDiscountNote && (
              <div className="text-xs text-blue-500 mt-0.5">"{bill.cashierDiscountNote}"</div>
            )}
          </div>
          <button
            onClick={handleRemove}
            disabled={applying}
            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            {applying ? "…" : "Remove"}
          </button>
        </div>
        {discErr && <div className="text-xs text-red-500 mt-1">{discErr}</div>}
      </div>
    )
  }

  // ── Collapsed (no discount yet) ───────────────────────────────
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-xs text-zinc-400 hover:text-emerald-600 font-semibold transition-colors text-left"
      >
        + Add Cashier Discount
      </button>
    )
  }

  // ── Expanded form ─────────────────────────────────────────────
  return (
    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-3">
      <div className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Cashier Discount (max 15%)</div>

      {/* Quick % pills + custom input */}
      <div className="flex gap-2">
        {[5, 10, 15].map((p) => (
          <button
            key={p}
            onClick={() => setPct(p)}
            className={[
              "flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all",
              pct === p
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200"
                : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300",
            ].join(" ")}
          >
            {p}%
          </button>
        ))}
        <input
          type="number"
          min="0"
          max="15"
          value={pct === 0 ? "" : pct}
          onChange={(e) => setPct(Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
          placeholder="1–15"
          className="w-20 px-2 py-2 rounded-xl border-2 border-zinc-200 bg-white text-xs text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-300"
        />
      </div>

      {/* Live preview */}
      {pct > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
          <span>Discount preview:</span>
          <span className="font-black">− Rs. {previewAmt.toLocaleString()}</span>
        </div>
      )}

      {/* Reason dropdown */}
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full text-sm px-3 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-400 text-zinc-700"
      >
        <option value="">Select reason…</option>
        {CASHIER_DISCOUNT_REASONS.map((r) => (
          <option key={r.key} value={r.key}>{r.label}</option>
        ))}
      </select>

      {/* Custom note (only when "other") */}
      {reason === "other" && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the reason…"
          className="w-full text-sm px-3 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-400 placeholder:text-zinc-300"
        />
      )}

      {discErr && <div className="text-xs text-red-500 font-medium">{discErr}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleApply}
          disabled={applying || pct === 0}
          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
        >
          {applying ? "Applying…" : "Apply Discount"}
        </button>
        <button
          onClick={() => { setExpanded(false); setDiscErr("") }}
          className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function TipSelector({ tipPercent, setTipPercent, customTip, setCustomTip, useCustomTip, setUseCustomTip, tipAmount }) {
  return (
    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <span>🙏</span>
        <span className="text-sm font-bold text-amber-800">Add a Tip</span>
        <span className="text-xs text-amber-600 ml-auto">Optional</span>
      </div>
      <div className="flex gap-2 mb-3">
        {TIP_PRESETS.map((pct) => (
          <button
            key={`tip-preset-${pct}`}
            onClick={() => { setTipPercent(pct); setUseCustomTip(false); setCustomTip("") }}
            className={[
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2",
              !useCustomTip && tipPercent === pct
                ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200"
                : "bg-white border-amber-200 text-amber-700 hover:border-amber-400",
            ].join(" ")}
          >
            {pct === 0 ? "No tip" : `${pct}%`}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setUseCustomTip(true); setTipPercent(0) }}
          className={[
            "text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all whitespace-nowrap",
            useCustomTip
              ? "bg-amber-500 border-amber-500 text-white"
              : "bg-white border-amber-200 text-amber-700 hover:border-amber-400",
          ].join(" ")}
        >
          Custom
        </button>
        <input
          type="number"
          min="0"
          value={customTip}
          onChange={(e) => { setCustomTip(e.target.value); setUseCustomTip(true); setTipPercent(0) }}
          placeholder="Enter amount"
          className="flex-1 px-3 py-2 rounded-xl border-2 border-amber-200 bg-white text-sm font-medium text-zinc-900 focus:outline-none focus:border-amber-400 placeholder:text-zinc-300"
        />
        <span className="text-xs text-amber-600 font-bold whitespace-nowrap">Rs. {tipAmount}</span>
      </div>
    </div>
  )
}

function PaymentMethodSelector({ paymentMethod, setPaymentMethod }) {
  return (
    <div>
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Payment Method</div>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map((pm) => (
          <button
            key={`pm-${pm.key}`}
            onClick={() => setPaymentMethod(pm.key)}
            className={[
              "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all",
              paymentMethod === pm.key
                ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                : "border-zinc-200 text-zinc-500 hover:border-green-300 bg-white",
            ].join(" ")}
          >
            <span className="text-xl">{pm.icon}</span>
            {pm.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BillSummary({
  subtotal, vatAmount, totalDiscount, tipAmount, total,
  appliedOffers, tipPercent, setTipPercent,
  customTip, setCustomTip, useCustomTip, setUseCustomTip,
  paymentMethod, setPaymentMethod,
  bill, onBillUpdate, loading, paying,
  onGenerateBill, onPay, orders,
  vatEnabled, setVatEnabled,
}) {
  // When the bill has a cashier discount, use the bill's recalculated values
  // for the breakdown. The parent already threads these through `total`.
  const hasCashierDisc  = bill && bill.cashierDiscount > 0
  const allServed = Array.isArray(orders) && orders.length > 0 && orders.every(o => o.status === "served")
  const hasGameDisc     = bill && bill.discountGamePlayed && bill.discountGameAmount > 0
  // baseSubtotal for cashier discount = subtotal minus offer discount minus game discount
  const baseSubtotalForCashierDisc = subtotal - (bill?.discountAmount ?? totalDiscount) - (bill?.discountGameAmount ?? 0)

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-sm">💰</div>
        <span className="text-sm font-bold text-zinc-800">Bill Summary</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">VAT 13%</span>
          <button
            onClick={() => setVatEnabled(v => !v)}
            disabled={!!bill}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${vatEnabled ? "bg-green-500" : "bg-zinc-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${vatEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>
      <div className="p-5 space-y-5">

        {/* ── Bill breakdown ── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-semibold text-zinc-700">Rs. {subtotal.toLocaleString()}</span>
          </div>

          {/* Offer discount */}
          {totalDiscount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-600 font-medium">🏷️ Offer Discount</span>
              <span className="font-semibold text-emerald-600">− Rs. {totalDiscount.toLocaleString()}</span>
            </div>
          )}

          {/* Game discount (shown after spin is played) */}
          {hasGameDisc && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-violet-600 font-medium">
                🎲 Game Discount ({bill.discountGameResult === 100 ? "FREE!" : `${bill.discountGameResult}%`})
              </span>
              <span className="font-semibold text-violet-600">
                − Rs. {bill.discountGameAmount?.toLocaleString()}
              </span>
            </div>
          )}

          {/* Cashier discount (only shown after bill is generated + discount applied) */}
          {hasCashierDisc && (() => {
            const reasonLabel = CASHIER_DISCOUNT_REASONS.find(r => r.key === bill.cashierDiscountReason)?.label || bill.cashierDiscountReason
            return (
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-600 font-medium">
                  🎟️ Cashier Discount ({bill.cashierDiscount}%{reasonLabel ? ` · ${reasonLabel}` : ""})
                </span>
                <span className="font-semibold text-blue-600">
                  − Rs. {bill.cashierDiscountAmount?.toLocaleString()}
                </span>
              </div>
            )
          })()}

          {/* After-discounts subtotal line (only when any discount is applied) */}
          {(totalDiscount > 0 || hasGameDisc || hasCashierDisc) && (
            <div className="flex justify-between items-center text-sm border-t border-zinc-100 pt-1.5">
              <span className="text-zinc-500 font-medium">After Discounts</span>
              <span className="font-semibold text-zinc-700">
                Rs. {(hasCashierDisc || hasGameDisc ? bill.discountedSubtotal : subtotal - totalDiscount).toLocaleString()}
              </span>
            </div>
          )}

          {vatEnabled ? (
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">VAT ({VAT_PERCENT}%)</span>
              <span className="font-semibold text-zinc-700">
                Rs. {(hasCashierDisc ? bill.vatAmount : vatAmount).toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 line-through">VAT ({VAT_PERCENT}%)</span>
              <span className="text-xs font-semibold text-zinc-400">Not Applied</span>
            </div>
          )}
          {tipAmount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Tip</span>
              <span className="font-semibold text-zinc-700">Rs. {tipAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <OffersSection appliedOffers={appliedOffers} totalDiscount={totalDiscount} />

        {/* Cashier discount widget (only after bill is generated) */}
        {bill && (
          <CashierDiscountSection
            bill={bill}
            onBillUpdate={onBillUpdate}
            baseSubtotal={baseSubtotalForCashierDisc}
          />
        )}

        <TipSelector
          tipPercent={tipPercent} setTipPercent={setTipPercent}
          customTip={customTip}   setCustomTip={setCustomTip}
          useCustomTip={useCustomTip} setUseCustomTip={setUseCustomTip}
          tipAmount={tipAmount}
        />

        {/* Total */}
        <div className="flex justify-between items-center px-4 py-3.5 bg-green-50 rounded-xl border border-green-200">
          <span className="font-bold text-green-800">Total</span>
          <span className="text-xl font-black text-green-600">Rs. {total.toLocaleString()}</span>
        </div>

        <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

        {/* Action button */}
        {!allServed ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
            <span>⏳</span> Food is still being prepared. Bill will be available once all items are served.
          </div>
        ) : !bill ? (
          <button
            onClick={onGenerateBill}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-base transition-all disabled:opacity-50 shadow-md shadow-green-200 hover:-translate-y-0.5"
          >
            {loading ? "Generating…" : "Generate Bill"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
              <span>📄</span> Bill #{bill._id?.slice(-6).toUpperCase()}
            </div>
            <button
              onClick={onPay}
              disabled={paying}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-base transition-all disabled:opacity-70 shadow-md shadow-green-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {paying
                ? <><Spinner size={5} color="white" /> Processing…</>
                : `✓ Confirm Payment — Rs. ${total.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessScreen({ selectedTable, subtotal, vatAmount, totalDiscount, tipAmount, total, paymentMethod, onReset }) {
  const pm = PAYMENT_METHODS.find((p) => p.key === paymentMethod)
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
        <div className="text-6xl mb-3">✅</div>
        <div className="text-xl font-black text-white">Payment Successful!</div>
        <div className="text-green-100 text-sm mt-1">Table {selectedTable}</div>
      </div>
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <div className="text-xs text-zinc-400 font-medium">Subtotal</div>
            <div className="text-base font-black mt-0.5 text-zinc-800">Rs. {subtotal}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <div className="text-xs text-zinc-400 font-medium">VAT ({VAT_PERCENT}%)</div>
            <div className="text-base font-black mt-0.5 text-zinc-800">Rs. {vatAmount}</div>
          </div>
          {totalDiscount > 0 && (
            <div className="col-span-2 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <div className="text-xs text-zinc-400 font-medium">Discount</div>
              <div className="text-base font-black mt-0.5 text-emerald-600">− Rs. {totalDiscount}</div>
            </div>
          )}
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <div className="text-xs text-zinc-400 font-medium">Tip</div>
            <div className="text-base font-black mt-0.5 text-zinc-800">Rs. {tipAmount}</div>
          </div>
          <div className="col-span-2 bg-green-50 rounded-xl p-3 border border-green-200">
            <div className="text-xs text-zinc-400 font-medium">Total Paid</div>
            <div className="text-base font-black mt-0.5 text-green-600">Rs. {total}</div>
          </div>
        </div>
        {pm && (
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <span className="text-lg">{pm.icon}</span>
            <span className="text-sm font-semibold text-zinc-600">Paid via {pm.label}</span>
          </div>
        )}
        <button
          onClick={onReset}
          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-md shadow-green-200 hover:-translate-y-0.5 transition-all"
        >
          ← Back to Tables
        </button>
      </div>
    </div>
  )
}

// ─── Cashout Tab ──────────────────────────────────────────────────────────────

function CashoutTab({ user }) {
  const [cashouts,        setCashouts]        = useState([])
  const [cashoutDesc,     setCashoutDesc]     = useState("")
  const [cashoutAmount,   setCashoutAmount]   = useState("")
  const [cashoutCategory, setCashoutCategory] = useState("groceries")
  const [cashoutLoading,  setCashoutLoading]  = useState(false)
  const [cashoutError,    setCashoutError]    = useState("")
  const [cashoutSuccess,  setCashoutSuccess]  = useState(false)
  const [cashoutsLoading, setCashoutsLoading] = useState(false)

  const loadCashouts = useCallback(async () => {
    setCashoutsLoading(true)
    try {
      const res = await fetchCashouts()
      setCashouts(res.cashouts || [])
    } catch {
      setCashouts([])
    } finally {
      setCashoutsLoading(false)
    }
  }, [])

  useEffect(() => { loadCashouts() }, [loadCashouts])

  const todayTotal = cashouts.reduce((s, c) => s + (c.amount || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cashoutDesc.trim() || !cashoutAmount) return
    setCashoutLoading(true)
    setCashoutError("")
    setCashoutSuccess(false)
    try {
      await createCashout({
        description: cashoutDesc.trim(),
        amount:      Number(cashoutAmount),
        category:    cashoutCategory,
        recordedBy:  user?._id,
      })
      setCashoutSuccess(true)
      setCashoutDesc("")
      setCashoutAmount("")
      setCashoutCategory("groceries")
      loadCashouts()
      setTimeout(() => setCashoutSuccess(false), 3000)
    } catch (err) {
      setCashoutError(err.response?.data?.message || "Failed to record cashout")
    } finally {
      setCashoutLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">

      {/* Today total */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Today's Total Cashout</div>
          <div className="text-2xl font-black text-red-600 mt-0.5">Rs. {todayTotal}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-2xl">💸</div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-sm">➕</div>
          <span className="text-sm font-bold text-zinc-800">Record Cash Out</span>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Category</div>
            <div className="flex gap-2 flex-wrap">
              {CASHOUT_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={`cat-${cat.key}`}
                  onClick={() => setCashoutCategory(cat.key)}
                  className={[
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all",
                    cashoutCategory === cat.key
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-zinc-200 text-zinc-500 bg-white hover:border-red-300",
                  ].join(" ")}
                >
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
            <input
              type="text"
              value={cashoutDesc}
              onChange={(e) => setCashoutDesc(e.target.value)}
              placeholder="e.g. Bought sugar and oil from market"
              required
              className="mt-1.5 w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:border-red-400 focus:bg-white transition-all placeholder:text-zinc-300"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount (Rs.)</label>
            <input
              type="number"
              min="1"
              value={cashoutAmount}
              onChange={(e) => setCashoutAmount(e.target.value)}
              placeholder="0"
              required
              className="mt-1.5 w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:border-red-400 focus:bg-white transition-all placeholder:text-zinc-300"
            />
          </div>

          <ErrorBanner msg={cashoutError} />

          {cashoutSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-xl border border-green-200">
              <span>✅</span> Cashout recorded successfully
            </div>
          )}

          <button
            type="submit"
            disabled={cashoutLoading}
            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-md shadow-red-200 hover:-translate-y-0.5"
          >
            {cashoutLoading ? "Saving…" : "💸 Record Cashout"}
          </button>
        </form>
      </div>

      {/* Log */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-sm">📋</div>
          <span className="text-sm font-bold text-zinc-800">Today's Cashout Log</span>
        </div>
        {cashoutsLoading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Loading…</div>
        ) : cashouts.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">No cashouts recorded today</div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {cashouts.map((c, idx) => {
              const cat = CASHOUT_CATEGORIES.find((x) => x.key === c.category)
              return (
                <div key={c._id ?? `cashout-${idx}`} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-base flex-shrink-0">
                    {cat?.icon || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-zinc-800 truncate">{c.description}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {cat?.label} · {c.recordedBy?.name || "Cashier"} ·{" "}
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="text-sm font-black text-red-600 ml-2 shrink-0">−Rs. {c.amount}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CashierPanel() {
  const { handleLogout, user } = useAuth()
  useSoundEnabled() // registers first-interaction AudioContext resume

  const [activeTab,     setActiveTab]     = useState("billing")
  const [tables,        setTables]        = useState([])
  const [tablesLoading, setTablesLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState(null)
  const [orders,        setOrders]        = useState([])
  const [bill,          setBill]          = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [loading,       setLoading]       = useState(false)
  const [paying,        setPaying]        = useState(false)
  const [error,         setError]         = useState("")
  const [success,       setSuccess]       = useState(false)
  const [tipPercent,    setTipPercent]    = useState(0)
  const [customTip,     setCustomTip]     = useState("")
  const [useCustomTip,  setUseCustomTip]  = useState(false)
  const [totalDiscount, setTotalDiscount] = useState(0)
  const [appliedOffers, setAppliedOffers] = useState([])

  // ── Discount game ────────────────────────────────────────────────────────────
  const [gameSettings,      setGameSettings]      = useState(null)
  // Per-table game enable: Set of tableNumbers the cashier has activated the game for
  const [gameEnabledTables, setGameEnabledTables] = useState(new Set())
  const [showGamePrompt,    setShowGamePrompt]    = useState(false)
  const [showWheelOverlay,  setShowWheelOverlay]  = useState(false)

  // ── Stock badge ─────────────────────────────────────────────────────────────
  const [stockAlertItems,   setStockAlertItems]   = useState([])
  const [showStockDropdown, setShowStockDropdown] = useState(false)
  const stockDropdownRef = useRef(null)

  // ── Bill-request pulse: set of tableNumbers with amber border pulse ──────
  const [billRequestedTables, setBillRequestedTables] = useState(new Set())

  const [vatEnabled, setVatEnabled] = useState(true)

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal           = orders.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const discountedSubtotal = subtotal - totalDiscount
  const vatAmount          = vatEnabled ? Math.round(discountedSubtotal * (VAT_PERCENT / 100)) : 0
  const tipAmount          = useCustomTip
    ? (Number(customTip) || 0)
    : Math.round(discountedSubtotal * (tipPercent / 100))

  // When the bill has a cashier or game discount, the server has recalculated
  // discountedSubtotal and vatAmount — use those instead of our local values.
  const useBillAmounts   = (bill?.cashierDiscount > 0) || (bill?.discountGamePlayed && (bill?.discountGameAmount ?? 0) > 0)
  const effectiveDiscSub = useBillAmounts ? (bill.discountedSubtotal ?? discountedSubtotal) : discountedSubtotal
  const effectiveVat     = useBillAmounts ? (bill.vatAmount          ?? vatAmount)          : vatAmount
  const total            = effectiveDiscSub + effectiveVat + tipAmount

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadTables = useCallback(async () => {
    setTablesLoading(true)
    try {
      const res = await fetchAllTables()
      setTables(res.tables || [])
    } catch {
      setTables([])
    } finally {
      setTablesLoading(false)
    }
  }, [])

  useEffect(() => { loadTables() }, [loadTables])

  // ── Fetch game settings on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchGameSettings().then((data) => setGameSettings(data.settings)).catch(() => {})
  }, [])

  // Load initial low/out ingredients for the badge
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetchIngredients({ limit: 300 })
        const all  = res.data?.ingredients || res.data?.data || []
        const alerts = all
          .filter(i => i.currentStock === 0 || (i.minThreshold > 0 && i.currentStock <= i.minThreshold))
          .map(i => ({ ...i, stockStatus: i.currentStock === 0 ? "out" : "low" }))
        setStockAlertItems(alerts)
      } catch {}
    }
    load()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(e.target)) {
        setShowStockDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ── Real-time socket updates ─────────────────────────────────────────────────
  useSocket(
    {
      "table-status-update": ({ tableNumber, status }) => {
        setTables((prev) =>
          prev.map((t) =>
            t.tableNumber === tableNumber ? { ...t, status } : t
          )
        )
      },
      "new-order": () => {
        newOrderSound()
        loadTables()
      },
      "order-cancelled": () => {
        cancelOrderSound()
        loadTables()
      },
      "bill_requested": ({ tableNumber }) => {
        billRequestSound()
        setBillRequestedTables(prev => {
          const next = new Set(prev).add(tableNumber)
          setTimeout(() => {
            setBillRequestedTables(p => { const s = new Set(p); s.delete(tableNumber); return s })
          }, 2000)
          return next
        })
        loadTables()

        // If game was enabled locally for this occupied table, persist the flag
        // to the newly-created bill so the customer sees the spin wheel.
        if (gameEnabledTables.has(tableNumber)) {
          enableTableGame(tableNumber, true).catch(() => {})
        }
      },
      "stock-alert": ({ ingredient, type }) => {
        stockAlertSound()
        setStockAlertItems(prev => {
          const exists = prev.find(i => i._id === ingredient._id)
          if (exists) return prev.map(i => i._id === ingredient._id ? { ...i, ...ingredient, stockStatus: type } : i)
          return [...prev, { ...ingredient, stockStatus: type }]
        })
      },
      "stock-restored": ({ ingredient }) => {
        setStockAlertItems(prev => prev.filter(i => i._id !== ingredient._id))
      },
    },
    [{ event: "join-cashier", value: undefined }]
  )

  // ── Refresh bill while billing screen is open (catch customer game plays) ────
  // When customer spins the wheel on their tablet the cashier's bill state goes
  // stale. Poll every 8 s while the game hasn't been played yet so the cashier
  // sees the discount before processing payment.
  useEffect(() => {
    if (!bill?._id || !selectedTable) return
    if (bill.paymentStatus === "paid" || bill.discountGamePlayed) return

    const id = setInterval(async () => {
      try {
        const billRes = await fetchBillByTable(selectedTable)
        if (billRes.bill) setBill(billRes.bill)
      } catch {}
    }, 8000)

    return () => clearInterval(id)
  }, [bill?._id, bill?.paymentStatus, bill?.discountGamePlayed, selectedTable])

  // ── Per-table game toggle ────────────────────────────────────────────────────
  // Toggles game for a single table. For "billing" tables (bill already exists)
  // we also persist the state to the bill via API. For "occupied" (no bill yet)
  // we keep it in client state and enable on the bill when it's generated.
  const handleToggleTableGame = async (table) => {
    const isEnabled   = gameEnabledTables.has(table.tableNumber)
    const shouldEnable = !isEnabled

    // Optimistic client update
    setGameEnabledTables(prev => {
      const next = new Set(prev)
      shouldEnable ? next.add(table.tableNumber) : next.delete(table.tableNumber)
      return next
    })

    // If the table already has a bill (billing status), persist to DB
    if (table.status === "billing") {
      try {
        await enableTableGame(table.tableNumber, shouldEnable)
      } catch {
        // Revert on failure
        setGameEnabledTables(prev => {
          const next = new Set(prev)
          shouldEnable ? next.delete(table.tableNumber) : next.add(table.tableNumber)
          return next
        })
      }
    }
    // For "occupied" tables (no bill yet) we just hold it in client state.
    // The bill will be created when cashier clicks "Generate Bill" and we'll
    // enable it on the fresh bill at that point.
  }

  const fixTableStatuses = async () => {
    try {
      await api.post("/tables/fix-all-status")
      await loadTables()
    } catch (err) {
      console.error("Failed to fix table statuses:", err)
    }
  }

  const loadAndApplyOffers = async (fetchedOrders) => {
    try {
      const items = fetchedOrders.flatMap((order) =>
        (order.items || []).map((item) => ({
          menuItemId: item.menuItemId || item._id,
          name:       item.name,
          price:      item.price,
          quantity:   item.quantity,
          category:   item.category || "",
        }))
      )
      const orderSubtotal = fetchedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
      const applyRes = await applyOffers(items, orderSubtotal)
      if (applyRes.success) {
        setTotalDiscount(applyRes.data.totalDiscount || 0)
        setAppliedOffers(applyRes.data.appliedOffers || [])
      }
    } catch {
      setTotalDiscount(0)
      setAppliedOffers([])
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const resetBilling = () => {
    setOrders([]);        setBill(null);         setError("");
    setSuccess(false);    setPaymentMethod("cash")
    setTipPercent(0);     setCustomTip("");       setUseCustomTip(false)
    setTotalDiscount(0);  setAppliedOffers([])
    setShowGamePrompt(false); setShowWheelOverlay(false)
  }

  const handleFullReset = () => {
    setSelectedTable(null)
    resetBilling()
    loadTables()
  }

  const handleSelectTable = async (table) => {
    if (table.status === "available") return
    resetBilling()
    setSelectedTable(table.tableNumber)
    setLoading(true)
    try {
      const res    = await fetchOrdersByTable(table.tableNumber)
      const active = (res.orders || []).filter(
        (o) => !["cancelled", "billed"].includes(o.status)
      )
      if (active.length === 0) {
        setError("No active orders for this table")
        return
      }
      setOrders(active)
      await loadAndApplyOffers(active)

      // If customer already requested a bill, pre-load it so cashier
      // can process payment directly without generating a duplicate bill
      try {
        const billRes = await fetchBillByTable(table.tableNumber)
        if (billRes.bill && billRes.bill.paymentStatus === "unpaid") {
          setBill(billRes.bill)
          // Show game prompt if:
          // 1. Bill already has discountGameEnabled = true (set earlier on a billing table), OR
          // 2. Cashier had enabled the game for this table while it was still "occupied"
          //    (auto-generated bill doesn't carry that flag — check local gameEnabledTables)
          const gameEnabledLocally = gameEnabledTables.has(table.tableNumber)
          if (
            gameSettings?.isEnabled &&
            (billRes.bill.discountGameEnabled || gameEnabledLocally) &&
            !billRes.bill.discountGamePlayed
          ) {
            // Persist to DB if the flag wasn't saved yet
            if (!billRes.bill.discountGameEnabled && gameEnabledLocally) {
              try {
                await enableTableGame(table.tableNumber, true)
                setBill({ ...billRes.bill, discountGameEnabled: true })
              } catch {}
            }
            setShowGamePrompt(true)
          }
        }
      } catch {} // no bill yet — cashier will generate one manually
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBill = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await generateBill({
        tableNumber:    selectedTable,
        orders:         orders.map((o) => o._id),
        subtotal,
        discountAmount: totalDiscount,
        appliedOffers,
        vatPercent:     vatEnabled ? VAT_PERCENT : 0,
        vatAmount,
        tipAmount,
        totalAmount:    total,
        paymentMethod,
      })
      const newBill = res.bill
      setBill(newBill)

      // If cashier had enabled the game for this table, activate it on the freshly-created bill
      if (gameSettings?.isEnabled && gameEnabledTables.has(selectedTable) && !newBill.discountGamePlayed) {
        try {
          await enableTableGame(selectedTable, true)
          // Update local bill state to reflect game is enabled
          setBill({ ...newBill, discountGameEnabled: true })
          setShowGamePrompt(true)
        } catch {
          // Silent fail — cashier can still proceed to payment normally
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate bill")
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!bill) return
    setPaying(true)
    setError("")
    try {
      // Re-fetch before payment so cashier sees the latest game discount
      // (customer may have spun the wheel on their tablet)
      try {
        const billRes = await fetchBillByTable(selectedTable)
        if (billRes.bill) setBill(billRes.bill)
      } catch {}

      await processPayment(bill._id, { paymentMethod, tipAmount })
      setSuccess(true)
      loadTables()
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xl shadow-md shadow-green-200">
            💳
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-800 leading-tight">Cashier Panel</div>
            <div className="text-xs text-zinc-400">Himalaya Kitchen</div>
          </div>
        </div>
        <div className="flex items-center gap-3">

          {/* ── Stock alert bell badge ── */}
          <div className="relative" ref={stockDropdownRef}>
            <button
              onClick={() => setShowStockDropdown(p => !p)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              title="Stock alerts"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {stockAlertItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                  {stockAlertItems.length > 9 ? "9+" : stockAlertItems.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showStockDropdown && (
              <div className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700">Stock Alerts</span>
                    {stockAlertItems.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">
                        {stockAlertItems.length}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowStockDropdown(false)} className="text-zinc-400 hover:text-zinc-600 text-sm transition-colors">✕</button>
                </div>

                {stockAlertItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="text-2xl mb-1.5 opacity-40">✅</div>
                    <div className="text-xs text-zinc-400 font-medium">All stock levels are healthy</div>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50">
                    {stockAlertItems.map(item => (
                      <div key={item._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.stockStatus === "out" ? "bg-red-500" : "bg-amber-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-zinc-700 truncate">{item.name}</div>
                          <div className="text-xs text-zinc-400 tabular-nums">
                            {item.currentStock} {item.unit} remaining
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.stockStatus === "out"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.stockStatus === "out" ? "OUT" : "LOW"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <SoundToggle />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-zinc-600">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-zinc-200 px-6">
        <div className="flex gap-1 max-w-2xl mx-auto">
          {[
            { key: "billing",  label: "Billing",   icon: "🧾" },
            { key: "cashout",  label: "Cashouts",  icon: "💸" },
          ].map((tab) => (
            <button
              key={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all",
                activeTab === tab.key
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-zinc-400 hover:text-zinc-600",
              ].join(" ")}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">

          {success ? (
            <SuccessScreen
              selectedTable={selectedTable}
              subtotal={subtotal}
              vatAmount={vatAmount}
              totalDiscount={totalDiscount}
              tipAmount={tipAmount}
              total={total}
              paymentMethod={paymentMethod}
              onReset={handleFullReset}
            />

          ) : selectedTable && orders.length > 0 ? (
            <>
              <button
                onClick={handleFullReset}
                className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                ← Back to Tables
              </button>

              <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <span className="text-base">🪑</span>
                <span className="text-sm font-bold text-zinc-800">Table {selectedTable}</span>
                <span className="ml-auto text-xs font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg">
                  {orders.length} order{orders.length > 1 ? "s" : ""}
                </span>
              </div>

              <ErrorBanner msg={error} />

              <OrdersList orders={orders} selectedTable={selectedTable} />

              <BillSummary
                subtotal={subtotal}
                vatAmount={effectiveVat}
                totalDiscount={totalDiscount}
                tipAmount={tipAmount}
                total={total}
                appliedOffers={appliedOffers}
                tipPercent={tipPercent}       setTipPercent={setTipPercent}
                customTip={customTip}         setCustomTip={setCustomTip}
                useCustomTip={useCustomTip}   setUseCustomTip={setUseCustomTip}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                bill={bill}
                onBillUpdate={setBill}
                loading={loading}
                paying={paying}
                onGenerateBill={handleGenerateBill}
                onPay={handlePay}
                orders={orders}
                vatEnabled={vatEnabled}
                setVatEnabled={setVatEnabled}
              />
            </>

          ) : (
            /* Table grid */
            <>
              <ErrorBanner msg={error} onClose={() => setError("")} />

              <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-800">Select a Table</span>
                  <div className="flex gap-2">
                    <button
                      onClick={fixTableStatuses}
                      className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      🔧 Fix Tables
                    </button>
                    <button
                      onClick={loadTables}
                      className="text-xs font-semibold text-zinc-400 hover:text-green-600 transition-colors flex items-center gap-1"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  {[
                    { dot: "bg-orange-400", label: "Occupied" },
                    { dot: "bg-green-400",  label: "Bill Ready" },
                    { dot: "bg-zinc-300",   label: "Available" },
                  ].map((leg) => (
                    <div key={`legend-${leg.label}`} className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                      <div className={`w-2.5 h-2.5 rounded-full ${leg.dot}`} />
                      {leg.label}
                    </div>
                  ))}
                </div>

                <TableGrid
                  tables={tables}
                  loading={tablesLoading}
                  selectedTable={selectedTable}
                  onSelect={handleSelectTable}
                  onRefresh={loadTables}
                  selectLoading={loading}
                  onFixTables={fixTableStatuses}
                  billRequestedTables={billRequestedTables}
                  gameSettings={gameSettings}
                  gameEnabledTables={gameEnabledTables}
                  onToggleTableGame={handleToggleTableGame}
                />
              </div>

              {loading && selectedTable && (
                <div className="flex items-center justify-center gap-3 py-8 text-zinc-500 text-sm font-medium">
                  <Spinner />
                  Loading orders for {selectedTable}…
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Cashout Tab */}
      {activeTab === "cashout" && <CashoutTab user={user} />}

      {/* Stock alert toasts — cashier room already joined by useSocket above */}
      <StockAlertToast />

      {/* ── Discount Game Prompt Modal ──────────────────────────────────────── */}
      {showGamePrompt && bill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-100 w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-5 text-center">
              <div className="text-4xl mb-1">🎰</div>
              <h3 className="text-lg font-black text-white">Discount Game is Active!</h3>
              <p className="text-emerald-100 text-sm mt-0.5">Let the customer spin for a discount?</p>
            </div>

            {/* Bill hint */}
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 text-center">
              <span className="text-xs text-zinc-400">Bill #</span>
              <span className="text-xs font-bold text-zinc-600 font-mono ml-1">{bill._id?.slice(-6).toUpperCase()}</span>
              <span className="mx-2 text-zinc-300">·</span>
              <span className="text-xs text-zinc-400">Rs.</span>
              <span className="text-xs font-bold text-zinc-700 ml-1">{bill.subtotal?.toLocaleString()}</span>
            </div>

            {/* Buttons */}
            <div className="p-5 space-y-3">
              <button
                onClick={() => { setShowGamePrompt(false); setShowWheelOverlay(true) }}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl font-black text-base transition-all shadow-md shadow-emerald-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                🎰 Spin the Wheel!
              </button>
              <button
                onClick={() => setShowGamePrompt(false)}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 rounded-xl font-semibold text-sm transition-all"
              >
                Skip → Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Spin Wheel Overlay ──────────────────────────────────────────────── */}
      {showWheelOverlay && bill && (
        <SpinWheelOverlay
          bill={bill}
          gameSettings={gameSettings}
          onSkip={() => setShowWheelOverlay(false)}
          onProceedToPayment={() => setShowWheelOverlay(false)}
          onBillUpdate={(updatedBill) => {
            setBill(updatedBill)
            // Remove this table from gameEnabledTables — game is one-time per bill
            if (selectedTable) {
              setGameEnabledTables(prev => {
                const next = new Set(prev)
                next.delete(selectedTable)
                return next
              })
            }
          }}
        />
      )}
    </div>
  )
}