import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, LabelList,
} from "recharts"
import { fetchInventoryAnalytics } from "../../service/ingredientService"

// ─── palette ─────────────────────────────────────────────────────────────────
const LINE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

const REASON_COLORS = {
  expired:    "#ef4444",
  spoiled:    "#f97316",
  damaged:    "#f59e0b",
  spilled:    "#3b82f6",
  overcooked: "#8b5cf6",
  other:      "#6b7280",
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtRs = (n) =>
  `Rs. ${Number(n ?? 0).toLocaleString("en-NP", { maximumFractionDigits: 0 })}`

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })

const stockColor = (status) =>
  status === "out" ? "#ef4444" : status === "low" ? "#f59e0b" : "#10b981"

// ─── tiny sub-components ─────────────────────────────────────────────────────

function SectionTitle({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[120px]">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function InsightRow({ icon, text, badge, badgeColor }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="mt-0.5 text-base shrink-0">{icon}</span>
      <p className="text-sm text-slate-700 flex-1">{text}</p>
      {badge && (
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

// custom tooltip for stock bar chart
function StockTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d?.name}</p>
      <p>Stock: <span className="font-bold">{d?.currentStock} {d?.unit}</span></p>
      <p>Threshold: <span className="font-bold">{d?.minThreshold} {d?.unit}</span></p>
      <p className="mt-1 capitalize">
        Status: <span className="font-bold" style={{ color: stockColor(d?.status) }}>{d?.status}</span>
      </p>
    </div>
  )
}

// custom tooltip for line chart
function ConsumptionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-2">{fmtDate(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-600">{p.dataKey}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// custom label for pie
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── section 1: Stock Levels ──────────────────────────────────────────────────
function StockLevelsSection({ data }) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? data : data.slice(0, 20)

  const outCount  = data.filter((d) => d.status === "out").length
  const lowCount  = data.filter((d) => d.status === "low").length
  const okCount   = data.filter((d) => d.status === "ok").length

  const chartData = displayed.map((d) => ({
    ...d,
    fill: stockColor(d.status),
  }))

  return (
    <section>
      <SectionTitle title="Stock Levels" sub="Current stock vs minimum threshold for all ingredients" />
      <div className="flex flex-wrap gap-3 mb-5">
        <StatPill label="Out of Stock" value={outCount}  color="#ef4444" />
        <StatPill label="Low Stock"    value={lowCount}  color="#f59e0b" />
        <StatPill label="Healthy"      value={okCount}   color="#10b981" />
      </div>
      <Card>
        <ResponsiveContainer width="100%" height={Math.max(280, displayed.length * 28)}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 60, bottom: 4, left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              width={96}
            />
            <Tooltip content={<StockTooltip />} />
            <Bar dataKey="currentStock" name="Current Stock" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="currentStock"
                position="right"
                style={{ fontSize: 10, fill: "#64748b" }}
                formatter={(v, entry) => `${v} ${chartData[entry?.index ?? 0]?.unit ?? ""}`}
              />
            </Bar>
            <Bar dataKey="minThreshold" name="Min Threshold" fill="#cbd5e1" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
        {data.length > 20 && (
          <div className="text-center mt-3">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              {showAll ? "Show less" : `Show all ${data.length} ingredients`}
            </button>
          </div>
        )}
      </Card>
    </section>
  )
}

// ─── section 2: Consumption Trends ───────────────────────────────────────────
function ConsumptionTrendsSection({ data }) {
  const { top5Ingredients, dailyData } = data
  const [selected, setSelected] = useState(top5Ingredients.slice(0, 3))

  const toggleIng = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  return (
    <section>
      <SectionTitle title="Consumption Trends" sub="Daily waste/usage of top ingredients over last 30 days" />
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          {top5Ingredients.map((name, i) => (
            <button
              key={name}
              onClick={() => toggleIng(name)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                selected.includes(name)
                  ? "border-transparent text-white shadow-sm"
                  : "border-slate-200 text-slate-500 bg-white"
              }`}
              style={selected.includes(name) ? { background: LINE_COLORS[i % LINE_COLORS.length] } : {}}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: LINE_COLORS[i % LINE_COLORS.length] }}
              />
              {name}
            </button>
          ))}
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">Select at least one ingredient above.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyData} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ConsumptionTooltip />} />
              {top5Ingredients.map((name, i) =>
                selected.includes(name) ? (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </section>
  )
}

// ─── section 3: Waste Analysis ────────────────────────────────────────────────
function WasteAnalysisSection({ data }) {
  const { byReason, byIngredient, totalCost } = data

  const pieData = byReason.map((r) => ({
    name:  r.reason,
    value: parseFloat(r.quantity.toFixed(2)),
    color: REASON_COLORS[r.reason] || "#6b7280",
  }))

  return (
    <section>
      <SectionTitle title="Waste Analysis" sub="Waste breakdown for last 30 days" />
      <div className="mb-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 inline-flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          <div>
            <p className="text-xs text-red-600 font-medium">Total Waste Cost (30 days)</p>
            <p className="text-xl font-bold text-red-700">{fmtRs(totalCost)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* pie chart */}
        <Card>
          <p className="text-sm font-semibold text-slate-700 mb-4">Waste by Reason</p>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No waste logged in last 30 days.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [`${v} units`, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {pieData.map((entry) => (
                  <span key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
                    <span className="capitalize">{entry.name}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* bar chart: most wasted ingredients */}
        <Card>
          <p className="text-sm font-semibold text-slate-700 mb-4">Most Wasted Ingredients (by cost)</p>
          {byIngredient.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No waste data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byIngredient} layout="vertical" margin={{ top: 2, right: 50, bottom: 2, left: 90 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${v}`} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  width={86}
                />
                <Tooltip
                  formatter={(v) => [fmtRs(v), "Waste Cost"]}
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  <LabelList
                    dataKey="cost"
                    position="right"
                    style={{ fontSize: 10, fill: "#64748b" }}
                    formatter={(v) => fmtRs(v)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </section>
  )
}

// ─── section 4: Purchase History ─────────────────────────────────────────────
function PurchaseHistorySection({ data }) {
  const { monthlySpending, topSuppliers, expensiveIngredients } = data

  return (
    <section>
      <SectionTitle title="Purchase History" sub="Procurement spending analysis over last 6 months" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* monthly spending bar chart */}
        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold text-slate-700 mb-4">Monthly Spending</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySpending} margin={{ top: 4, right: 20, bottom: 4, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [fmtRs(v), "Spending"]}
                contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList
                  dataKey="total"
                  position="top"
                  style={{ fontSize: 10, fill: "#64748b" }}
                  formatter={(v) => v > 0 ? `${(v / 1000).toFixed(1)}k` : ""}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* top suppliers */}
        <Card>
          <p className="text-sm font-semibold text-slate-700 mb-3">Top Suppliers</p>
          {topSuppliers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No purchase data.</p>
          ) : (
            <div className="space-y-2.5">
              {topSuppliers.map((s, i) => (
                <div key={s.supplier} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{s.supplier}</p>
                    <p className="text-xs text-slate-400">{fmtRs(s.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* most expensive ingredients */}
      <Card className="mt-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Most Expensive Ingredients (total spend)</p>
        {expensiveIngredients.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No purchase data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expensiveIngredients} margin={{ top: 4, right: 60, bottom: 4, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [fmtRs(v), "Total Spent"]}
                contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList
                  dataKey="total"
                  position="top"
                  style={{ fontSize: 10, fill: "#64748b" }}
                  formatter={(v) => v > 0 ? fmtRs(v) : ""}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </section>
  )
}

// ─── section 5: Smart Insights ────────────────────────────────────────────────
function SmartInsightsSection({ data }) {
  const { likelyRunOut, frequentlyWasted } = data

  const urgency = (daysLeft) => {
    if (daysLeft <= 1)  return { label: "Critical",  cls: "bg-red-100 text-red-700"    }
    if (daysLeft <= 3)  return { label: "Urgent",    cls: "bg-orange-100 text-orange-700" }
    return               { label: "This week", cls: "bg-amber-100 text-amber-700"  }
  }

  return (
    <section>
      <SectionTitle title="Smart Insights" sub="Automated recommendations based on last 30 days of data" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* likely to run out */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-sm">⚠️</span>
            <p className="text-sm font-semibold text-slate-700">Likely to Run Out This Week</p>
          </div>
          {likelyRunOut.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-slate-500">All ingredients have sufficient stock for the week.</p>
            </div>
          ) : (
            <div>
              {likelyRunOut.map((item) => {
                const { label, cls } = urgency(item.daysLeft)
                return (
                  <InsightRow
                    key={item.name}
                    icon="📦"
                    text={
                      <>
                        <span className="font-semibold">{item.name}</span> — {item.currentStock} {item.unit} left,
                        consuming ~{item.avgDailyUsage} {item.unit}/day
                        <span className="text-slate-400"> ({item.daysLeft} days left)</span>
                      </>
                    }
                    badge={label}
                    badgeColor={cls}
                  />
                )
              })}
            </div>
          )}
        </Card>

        {/* frequently wasted */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm">🗑️</span>
            <p className="text-sm font-semibold text-slate-700">Frequently Wasted — Order Less</p>
          </div>
          {frequentlyWasted.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-slate-500">No significant waste patterns detected.</p>
            </div>
          ) : (
            <div>
              {frequentlyWasted.map((item) => (
                <InsightRow
                  key={item.name}
                  icon="📉"
                  text={
                    <>
                      <span className="font-semibold">{item.name}</span> — {item.totalWasted} {item.unit} wasted
                      this month (~{item.avgPerDay} {item.unit}/day)
                    </>
                  }
                  badge="Reduce Order"
                  badgeColor="bg-amber-100 text-amber-700"
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}

// ─── skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i}>
          <div className="h-5 w-48 bg-slate-200 rounded-lg mb-4" />
          <div className="bg-white rounded-2xl border border-slate-200 p-5 h-48" />
        </div>
      ))}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function InventoryAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchInventoryAnalytics()
      setAnalytics(res.data.data)
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Skeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={load}
          className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const { stockLevels, consumptionTrends, wasteAnalysis, purchaseHistory, smartInsights } = analytics

  return (
    <div className="space-y-10">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Last updated {new Date().toLocaleString("en-NP", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      <StockLevelsSection      data={stockLevels}       />
      <ConsumptionTrendsSection data={consumptionTrends}  />
      <WasteAnalysisSection    data={wasteAnalysis}      />
      <PurchaseHistorySection  data={purchaseHistory}    />
      <SmartInsightsSection    data={smartInsights}      />
    </div>
  )
}
