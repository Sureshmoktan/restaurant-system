import { useEffect, useState } from "react"
import {
  fetchForecastOrders,
  fetchForecastRevenue,
  fetchForecastItems,
  fetchForecastHours,
  fetchForecastSuggestions,
} from "../../service/forecastService"
import { createOffer } from "../../service/offerService"
import { fetchMenu } from "../../service/menuService"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOUR_LABELS = {
  0:"12am",1:"1am",2:"2am",3:"3am",4:"4am",5:"5am",
  6:"6am",7:"7am",8:"8am",9:"9am",10:"10am",11:"11am",
  12:"12pm",13:"1pm",14:"2pm",15:"3pm",16:"4pm",17:"5pm",
  18:"6pm",19:"7pm",20:"8pm",21:"9pm",22:"10pm",23:"11pm"
}

function StatCard({ icon, label, value, sub, color = "emerald" }) {
  const colors = {
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
    blue:    "from-blue-500 to-blue-600 shadow-blue-200",
    amber:   "from-amber-500 to-amber-600 shadow-amber-200",
    purple:  "from-purple-500 to-purple-600 shadow-purple-200",
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white text-lg shadow-lg`}>
          {icon}
        </div>
        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">7-day</span>
      </div>
      <div className="text-2xl font-black text-slate-800 mb-1">{value}</div>
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, color = "#10b981", label, unit = "" }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d[valueKey]))

  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => {
          const pct = max > 0 ? (d[valueKey] / max) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10">
                {unit}{Math.round(d[valueKey]).toLocaleString()}
              </div>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color, opacity: 0.85 }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-xs text-slate-400 truncate">
            {d[labelKey]}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, icon, children, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base">{icon}</div>
        <div>
          <div className="text-sm font-bold text-slate-800">{title}</div>
          {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Prophet ML
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : children}
    </div>
  )
}

export default function ForecastPage() {
  const [ordersData,   setOrdersData]   = useState(null)
  const [revenueData,  setRevenueData]  = useState(null)
  const [itemsData,    setItemsData]    = useState(null)
  const [hoursData,    setHoursData]    = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [suggestions,  setSuggestions]  = useState([])  // AI discount suggestions
  const [discountEdits,setDiscountEdits]= useState({})  // item → edited % value
  const [approving,    setApproving]    = useState({})  // item → bool

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [o, r, i, h, s] = await Promise.all([
          fetchForecastOrders(),
          fetchForecastRevenue(),
          fetchForecastItems(),
          fetchForecastHours(),
          fetchForecastSuggestions().catch(() => ({ suggestions: [] })),
        ])
        setOrdersData(o)
        setRevenueData(r)
        setItemsData(i)
        setHoursData(h)
        const suggs = s?.suggestions || []
        setSuggestions(suggs)
        // Pre-fill edits with Prophet's suggested values
        const edits = {}
        suggs.forEach(s => { edits[s.item] = s.suggested_discount })
        setDiscountEdits(edits)
      } catch (err) {
        setError("Could not load forecast data. Make sure Prophet server is running on port 5001.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleApproveSuggestion = async (suggestion) => {
    setApproving(a => ({ ...a, [suggestion.item]: true }))
    const discountValue = Number(discountEdits[suggestion.item] ?? suggestion.suggested_discount)
    const today   = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7)

    try {
      // Look up the menu item by name so we can target it specifically
      const menuData    = await fetchMenu()
      const allItems    = menuData.menu || []
      const matched     = allItems.find(
        m => m.name.toLowerCase() === suggestion.item.toLowerCase()
      )

      await createOffer({
        title:              `AI Discount — ${suggestion.item}`,
        description:        `Prophet AI suggested ${discountValue}% off (${suggestion.gap_pct}% below avg demand)`,
        type:               "percentage",
        value:              discountValue,
        // If we found the exact item → item-scoped offer; otherwise fall back to bill-scoped
        scope:              matched ? "item" : "bill",
        applicableItems:    matched ? [matched._id] : [],
        applicableCategory: null,
        startDate:          today.toISOString().slice(0, 10),
        endDate:            endDate.toISOString().slice(0, 10),
        isActive:           true,
        source:             "ai_suggested",
        suggestedDiscount:  suggestion.suggested_discount,
      })
      setSuggestions(prev => prev.filter(s => s.item !== suggestion.item))
    } catch {
      // silently fail — offer page will show any errors
    } finally {
      setApproving(a => ({ ...a, [suggestion.item]: false }))
    }
  }

  const handleRejectSuggestion = (itemName) => {
    setSuggestions(prev => prev.filter(s => s.item !== itemName))
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl">⚠️</div>
      <div className="text-center">
        <div className="font-bold text-slate-800 mb-1">Forecast server unavailable</div>
        <div className="text-sm text-slate-500 max-w-md">{error}</div>
      </div>
      <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-600">python prophet_app.py</code>
    </div>
  )

  // Prepare chart data
  const orderChartData = ordersData?.forecast?.slice(0, 7).map(d => ({
    label: new Date(d.ds).toLocaleDateString("en-US", { weekday: "short" }),
    value: d.yhat,
  })) || []

  const revenueChartData = revenueData?.forecast?.slice(0, 7).map(d => ({
    label: new Date(d.ds).toLocaleDateString("en-US", { weekday: "short" }),
    value: d.yhat,
  })) || []

  const hourChartData = hoursData?.hourly?.map(h => ({
    label: HOUR_LABELS[h.hour],
    value: h.count,
    hour:  h.hour,
  })) || []

  const peakHours = hoursData?.peak_hours || []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">AI Demand Forecast</h2>
          <p className="text-sm text-slate-400">Powered by Facebook Prophet — trained on your order history</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live predictions
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          label="Expected Orders"
          value={loading ? "—" : ordersData?.summary?.next_7_days_total?.toLocaleString() || "—"}
          sub={`Next 7 days · ~${ordersData?.summary?.daily_average || "—"}/day`}
          color="emerald"
        />
        <StatCard
          icon="💰"
          label="Expected Revenue"
          value={loading ? "—" : `Rs. ${(revenueData?.summary?.next_7_days_total || 0).toLocaleString()}`}
          sub={`Next 7 days · Rs. ${(revenueData?.summary?.daily_average || 0).toLocaleString()}/day`}
          color="blue"
        />
        <StatCard
          icon="📈"
          label="Busiest Day"
          value={loading ? "—" : ordersData?.summary?.peak_day ? new Date(ordersData.summary.peak_day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—"}
          sub={`${ordersData?.summary?.peak_day_orders || "—"} orders expected`}
          color="amber"
        />
        <StatCard
          icon="⏰"
          label="Peak Hour"
          value={loading ? "—" : HOUR_LABELS[hoursData?.summary?.busiest_hour] || "—"}
          sub="Busiest time of day"
          color="purple"
        />
      </div>

      {/* Order Volume + Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <SectionCard
          title="Order Volume Forecast"
          subtitle="Expected orders for next 7 days"
          icon="📦"
          loading={loading}
        >
          <BarChart
            data={orderChartData}
            valueKey="value"
            labelKey="label"
            color="#10b981"
            unit=""
          />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {ordersData?.forecast?.slice(0, 3).map((d, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">{new Date(d.ds).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                <div className="text-lg font-black text-emerald-600">{Math.round(d.yhat)}</div>
                <div className="text-xs text-slate-400">orders</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Revenue Forecast"
          subtitle="Expected revenue for next 7 days"
          icon="💰"
          loading={loading}
        >
          <BarChart
            data={revenueChartData}
            valueKey="value"
            labelKey="label"
            color="#3b82f6"
            unit="Rs. "
          />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {revenueData?.forecast?.slice(0, 3).map((d, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">{new Date(d.ds).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                <div className="text-lg font-black text-blue-600">Rs. {Math.round(d.yhat).toLocaleString()}</div>
                <div className="text-xs text-slate-400">revenue</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Peak Hours + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <SectionCard
          title="Peak Hours Analysis"
          subtitle="Order activity by hour of day"
          icon="⏰"
          loading={loading}
        >
          <BarChart
            data={hourChartData}
            valueKey="value"
            labelKey="label"
            color="#f59e0b"
          />
          <div className="mt-4 flex gap-3">
            {peakHours.map((p, i) => (
              <div key={i} className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <div className="text-xs text-amber-600 font-bold mb-1">#{i + 1} Busiest</div>
                <div className="text-base font-black text-slate-800">{HOUR_LABELS[p.hour]}</div>
                <div className="text-xs text-slate-400">{p.count} orders</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Top Item Demand Forecast"
          subtitle="Expected demand for top 5 items — next 7 days"
          icon="🍽️"
          loading={loading}
        >
          {itemsData && (
            <div className="space-y-3">
              {(itemsData.top_items || []).map((itemName) => {
                const forecasts = itemsData.forecasts?.[itemName] || []
                const total     = forecasts.reduce((s, d) => s + d.yhat, 0)
                const max       = Math.max(...(itemsData.top_items || []).map(n =>
                  (itemsData.forecasts?.[n] || []).reduce((s, d) => s + d.yhat, 0)
                ))
                const pct = max > 0 ? (total / max) * 100 : 0
                return (
                  <div key={itemName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-700">{itemName}</span>
                      <span className="text-xs font-bold text-emerald-600">{Math.round(total)} units</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <div className="text-xs text-emerald-700 font-semibold">💡 Stock Suggestion</div>
            <div className="text-xs text-emerald-600 mt-1">
              Highest demand: <span className="font-bold">{itemsData?.summary?.highest_demand_item || "—"}</span> — prepare extra stock for the coming week.
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 14 Day Forecast Table */}
      <SectionCard
        title="14-Day Detailed Forecast"
        subtitle="Full order and revenue predictions"
        icon="📅"
        loading={loading}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 pb-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 pb-3">Day</th>
                <th className="text-right text-xs font-semibold text-slate-500 pb-3">Orders (est.)</th>
                <th className="text-right text-xs font-semibold text-slate-500 pb-3">Range</th>
                <th className="text-right text-xs font-semibold text-slate-500 pb-3">Revenue (est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(ordersData?.forecast || []).map((row, i) => {
                const rev     = revenueData?.forecast?.[i]
                const isToday = row.ds === new Date().toISOString().split("T")[0]
                return (
                  <tr key={i} className={`${isToday ? "bg-emerald-50" : "hover:bg-slate-50"} transition-colors`}>
                    <td className="py-3 text-slate-600 font-medium">
                      {row.ds}
                      {isToday && <span className="ml-2 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                    </td>
                    <td className="py-3 text-slate-400">{new Date(row.ds).toLocaleDateString("en-US", { weekday: "long" })}</td>
                    <td className="py-3 text-right font-bold text-emerald-600">{Math.round(row.yhat)}</td>
                    <td className="py-3 text-right text-xs text-slate-400">{Math.round(row.yhat_lower)}–{Math.round(row.yhat_upper)}</td>
                    <td className="py-3 text-right font-bold text-blue-600">Rs. {rev ? Math.round(rev.yhat).toLocaleString() : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* AI Discount Suggestions */}
      {!loading && suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
          {/* header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-violet-50 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-base">🤖</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-800">AI Discount Suggestions</div>
              <div className="text-xs text-slate-400">Prophet detected slow-selling items — approve to create an offer automatically</div>
            </div>
            <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full">
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* suggestion rows */}
          <div className="divide-y divide-slate-50">
            {suggestions.map((s) => {
              const editedPct = discountEdits[s.item] ?? s.suggested_discount
              const isApproving = approving[s.item]
              return (
                <div key={s.item} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-800 truncate">{s.item}</span>
                      <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500 ring-1 ring-red-100">
                        {s.gap_pct}% below avg
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Forecast: <span className="font-semibold text-slate-600">{s.forecasted_qty} units/day</span></span>
                      <span>Average: <span className="font-semibold text-slate-600">{s.avg_qty} units/day</span></span>
                    </div>
                    {/* mini demand bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 relative">
                        <div
                          className="bg-slate-400 h-1.5 rounded-full"
                          style={{ width: "100%" }}
                        />
                        <div
                          className="absolute top-0 left-0 bg-red-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min((s.forecasted_qty / s.avg_qty) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-400 font-semibold shrink-0">
                        {Math.round((s.forecasted_qty / s.avg_qty) * 100)}% of avg
                      </span>
                    </div>
                  </div>

                  {/* discount input + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2">
                      <span className="text-xs text-violet-500 font-semibold">Prophet:</span>
                      <span className="text-xs font-bold text-violet-700">{s.suggested_discount}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">Override:</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editedPct}
                          onChange={(e) => setDiscountEdits(prev => ({ ...prev, [s.item]: e.target.value }))}
                          className="w-16 pl-2 pr-5 py-1.5 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-center"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveSuggestion(s)}
                      disabled={isApproving}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 transition-all active:scale-95 shadow-sm"
                    >
                      {isApproving ? "Creating…" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRejectSuggestion(s.item)}
                      disabled={isApproving}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-60 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="text-lg shrink-0">ℹ️</div>
        <div className="text-xs text-slate-500 leading-relaxed">
          Forecasts are generated by <span className="font-semibold text-slate-700">Facebook Prophet</span> trained on your historical order data.
          Predictions improve over time as more real orders accumulate. Retrain the model monthly by running <code className="bg-slate-200 px-1 rounded">python prophet_train.py</code> in the <code className="bg-slate-200 px-1 rounded">ml/</code> folder.
        </div>
      </div>
    </div>
  )
}