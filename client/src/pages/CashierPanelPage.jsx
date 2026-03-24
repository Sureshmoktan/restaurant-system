import { useState } from "react"
import { fetchOrdersByTable } from "../service/orderService"
import { generateBill, processPayment } from "../service/billService"
import useAuth from "../hooks/useAuth"
import { VAT_PERCENT } from "../constants"

const PAYMENT_METHODS = [
  { key: "cash",   label: "Cash",   icon: "💵" },
  { key: "esewa",  label: "eSewa",  icon: "📱" },
  { key: "khalti", label: "Khalti", icon: "📱" },
  { key: "card",   label: "Card",   icon: "💳" },
]

const TIP_PRESETS = [0, 5, 10, 15, 20]

export default function CashierPanel() {
  const { handleLogout, user } = useAuth()

  const [tableInput,    setTableInput]    = useState("")
  const [orders,        setOrders]        = useState([])
  const [bill,          setBill]          = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [loading,       setLoading]       = useState(false)
  const [paying,        setPaying]        = useState(false)
  const [error,         setError]         = useState("")
  const [success,       setSuccess]       = useState(false)
  const [tableNumber,   setTableNumber]   = useState(null)
  const [tipPercent,    setTipPercent]    = useState(0)
  const [customTip,     setCustomTip]     = useState("")
  const [useCustomTip,  setUseCustomTip]  = useState(false)

  const handleFetch = async (e) => {
    e.preventDefault()
    setError("")
    setOrders([])
    setBill(null)
    setSuccess(false)
    setTipPercent(0)
    setCustomTip("")
    setUseCustomTip(false)
    if (!tableInput) return
    setLoading(true)
    try {
      const res = await fetchOrdersByTable(tableInput)
      const activeOrders = (res.orders || []).filter((o) => !["cancelled", "billed"].includes(o.status))
      if (activeOrders.length === 0) {
        setError("No active orders found for this table")
        return
      }
      setOrders(activeOrders)
      setTableNumber(tableInput)
    } catch (err) {
      setError(err.response?.data?.message || "Table not found")
    } finally {
      setLoading(false)
    }
  }

  const subtotal  = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const vatAmount = Math.round(subtotal * (VAT_PERCENT / 100))

  // ✅ Tip calculation
  const tipAmount = useCustomTip
    ? (Number(customTip) || 0)
    : Math.round(subtotal * (tipPercent / 100))

  const total = subtotal + vatAmount + tipAmount

  const handleGenerateBill = async () => {
    setLoading(true)
    try {
      const res = await generateBill({
        tableNumber,
        orders:      orders.map((o) => o._id),
        subtotal,
        vatPercent:  VAT_PERCENT,
        vatAmount,
        tipAmount,
        totalAmount: total,
        paymentMethod,
      })
      setBill(res.bill)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate bill")
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!bill) return
    setPaying(true)
    try {
      await processPayment(bill._id, { paymentMethod, tipAmount })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  const handleReset = () => {
    setTableInput("")
    setOrders([])
    setBill(null)
    setError("")
    setSuccess(false)
    setTableNumber(null)
    setPaymentMethod("cash")
    setTipPercent(0)
    setCustomTip("")
    setUseCustomTip(false)
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">

      {/* HEADER */}
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-zinc-600">{user?.name}</span>
          </div>
          <button onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-lg text-zinc-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
            Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4">

        {/* SUCCESS */}
        {success ? (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="text-6xl mb-3">✅</div>
              <div className="text-xl font-black text-white">Payment Successful!</div>
              <div className="text-green-100 text-sm mt-1">Table {tableNumber}</div>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Subtotal",   value: `Rs. ${subtotal}` },
                  { label: "VAT (13%)",  value: `Rs. ${vatAmount}` },
                  { label: "Tip",        value: `Rs. ${tipAmount}` },
                  { label: "Total Paid", value: `Rs. ${total}`, bold: true },
                ].map((r) => (
                  <div key={r.label} className={`bg-zinc-50 rounded-xl p-3 border border-zinc-100 ${r.bold ? "col-span-2 bg-green-50 border-green-200" : ""}`}>
                    <div className="text-xs text-zinc-400 font-medium">{r.label}</div>
                    <div className={`text-base font-black mt-0.5 ${r.bold ? "text-green-600" : "text-zinc-800"}`}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-lg">{PAYMENT_METHODS.find(p => p.key === paymentMethod)?.icon}</span>
                <span className="text-sm font-semibold text-zinc-600">Paid via {PAYMENT_METHODS.find(p => p.key === paymentMethod)?.label}</span>
              </div>
              <button onClick={handleReset}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-md shadow-green-200 hover:-translate-y-0.5 transition-all">
                + New Bill
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TABLE LOOKUP */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-sm">🔍</div>
                <span className="text-sm font-bold text-zinc-800">Find Table</span>
              </div>
              <form onSubmit={handleFetch} className="flex gap-3">
                <input
                  type="text"
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  placeholder="Enter table name e.g. G1, T2"
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-zinc-300 placeholder:font-normal"
                />
                <button type="submit" disabled={loading}
                  className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-70 shadow-md shadow-green-200">
                  {loading ? "..." : "Fetch"}
                </button>
              </form>
              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200">
                  <span>⚠</span> {error}
                </div>
              )}
            </div>

            {/* ORDERS */}
            {orders.length > 0 && (
              <>
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-sm">🧾</div>
                    <span className="text-sm font-bold text-zinc-800">Table {tableNumber} — Order Details</span>
                    <span className="ml-auto text-xs font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg">{orders.length} order{orders.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="p-5 space-y-2">
                    {orders.map((order) =>
                      order.items?.map((item, i) => (
                        <div key={`${order._id}-${i}`} className="flex items-start justify-between py-2.5 border-b border-zinc-50 last:border-0">
                          <div>
                            <div className="text-sm font-semibold text-zinc-800">{item.quantity}× {item.name}</div>
                            {item.selectedOptions?.map((opt) => (
                              <div key={opt.groupName} className="text-xs text-blue-500 mt-0.5">{opt.groupName}: {opt.selected?.join(", ")}</div>
                            ))}
                            {item.removedIngredients?.length > 0 && (
                              <div className="text-xs text-red-400 mt-0.5">No: {item.removedIngredients.join(", ")}</div>
                            )}
                          </div>
                          <div className="text-sm font-bold text-zinc-700 ml-4 shrink-0">Rs. {item.price * item.quantity}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* BILL SUMMARY + TIP + PAYMENT */}
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-sm">💰</div>
                    <span className="text-sm font-bold text-zinc-800">Bill Summary</span>
                  </div>

                  <div className="p-5 space-y-5">

                    {/* amounts */}
                    <div className="space-y-2">
                      {[
                        { label: "Subtotal",  value: subtotal  },
                        { label: `VAT (${VAT_PERCENT}%)`, value: vatAmount },
                      ].map((r) => (
                        <div key={r.label} className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">{r.label}</span>
                          <span className="font-semibold text-zinc-700">Rs. {r.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* TIP SECTION */}
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">🙏</span>
                        <span className="text-sm font-bold text-amber-800">Add a Tip</span>
                        <span className="text-xs text-amber-600 ml-auto">Optional</span>
                      </div>

                      {/* preset tip buttons */}
                      <div className="flex gap-2 mb-3">
                        {TIP_PRESETS.map((pct) => (
                          <button
                            key={pct}
                            onClick={() => { setTipPercent(pct); setUseCustomTip(false); setCustomTip("") }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2
                              ${!useCustomTip && tipPercent === pct
                                ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200"
                                : "bg-white border-amber-200 text-amber-700 hover:border-amber-400"}`}
                          >
                            {pct === 0 ? "No tip" : `${pct}%`}
                          </button>
                        ))}
                      </div>

                      {/* custom tip */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setUseCustomTip(true); setTipPercent(0) }}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all whitespace-nowrap
                            ${useCustomTip ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-amber-200 text-amber-700 hover:border-amber-400"}`}
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

                    {/* total */}
                    <div className="flex justify-between items-center px-4 py-3.5 bg-green-50 rounded-xl border border-green-200">
                      <span className="font-bold text-green-800">Total</span>
                      <span className="text-xl font-black text-green-600">Rs. {total}</span>
                    </div>

                    {/* payment method */}
                    <div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Payment Method</div>
                      <div className="grid grid-cols-4 gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                          <button key={pm.key} onClick={() => setPaymentMethod(pm.key)}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all
                              ${paymentMethod === pm.key
                                ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                                : "border-zinc-200 text-zinc-500 hover:border-green-300 bg-white"}`}>
                            <span className="text-xl">{pm.icon}</span>
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* action button */}
                    {!bill ? (
                      <button onClick={handleGenerateBill} disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-base transition-all disabled:opacity-70 shadow-md shadow-green-200 hover:-translate-y-0.5">
                        {loading ? "Generating..." : "Generate Bill"}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
                          <span>📄</span> Bill generated — #{bill._id?.slice(-6).toUpperCase()}
                        </div>
                        <button onClick={handlePay} disabled={paying}
                          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-base transition-all disabled:opacity-70 shadow-md shadow-green-200 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                          {paying
                            ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                            : `✓ Confirm Payment — Rs. ${total}`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}