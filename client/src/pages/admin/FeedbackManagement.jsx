import { useEffect, useState, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  fetchFeedbacks,
  fetchFeedbackStats,
  fetchSmartSummary,
  clearSmartSummary,
} from "../../features/feedbackSlice"

// ── helpers ───────────────────────────────────────────────────────────────────
const STAR_COLORS   = { 5: "#10b981", 4: "#34d399", 3: "#f59e0b", 2: "#f97316", 1: "#ef4444" }
const EMOJI_MAP     = { loved: "😍", good: "😊", okay: "😐", poor: "😕", bad: "😠" }
const CATEGORY_LABELS = {
  food_quality: "Food Quality", service: "Service", cleanliness: "Cleanliness",
  ambience: "Ambience", value_for_money: "Value for Money", speed: "Speed",
}

function Stars({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={s <= rating ? STAR_COLORS[rating] || "#f59e0b" : "#e5e7eb"}
            stroke={s <= rating ? STAR_COLORS[rating] || "#f59e0b" : "#d1d5db"}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ── Smart Summary Card ────────────────────────────────────────────────────────
function SmartSummaryCard({ data, onRefresh, loading, onClose }) {
  if (loading) return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <div className="text-sm text-emerald-700 font-medium">Analyzing feedback…</div>
    </div>
  )

  if (!data) return null

  if (data.insufficient) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
      <div className="text-3xl">📊</div>
      <div>
        <div className="text-sm font-bold text-amber-800">{data.message}</div>
        <div className="text-xs text-amber-600 mt-1">Collect more feedback to unlock smart insights.</div>
      </div>
      <button onClick={onClose} className="ml-auto text-amber-400 hover:text-amber-600">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )

  const sentimentColor =
    data.overallSentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
    data.overallSentiment === "negative" ? "bg-red-100 text-red-700" :
    "bg-amber-100 text-amber-700"

  const trendColor =
    data.trend?.direction === "up"   ? "text-emerald-600" :
    data.trend?.direction === "down" ? "text-red-500" :
    "text-slate-500"

  const trendIcon =
    data.trend?.direction === "up"   ? "📈" :
    data.trend?.direction === "down" ? "📉" : "➡️"

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl overflow-hidden">

      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-white/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-sm font-bold text-slate-700">Smart Summary</span>
          <span className="text-xs text-slate-400">· Last 30 days · {data.totalReviewed} reviews</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:text-emerald-800 px-3 py-1.5 bg-emerald-100 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Row 1 — Sentiment badge + summary text */}
        <div className="space-y-2">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full capitalize ${sentimentColor}`}>
            {data.overallSentiment} Sentiment
          </span>
          <p className="text-sm text-slate-600 leading-relaxed">{data.summary}</p>
        </div>

        {/* Row 2 — Sentiment bar */}
        <div>
          <div className="flex rounded-xl overflow-hidden h-4">
            {data.sentimentBreakdown.positive > 0 && (
              <div className="bg-emerald-500 transition-all" style={{ width: `${data.sentimentBreakdown.positive}%` }} title={`Positive ${data.sentimentBreakdown.positive}%`} />
            )}
            {data.sentimentBreakdown.neutral > 0 && (
              <div className="bg-amber-400 transition-all" style={{ width: `${data.sentimentBreakdown.neutral}%` }} title={`Neutral ${data.sentimentBreakdown.neutral}%`} />
            )}
            {data.sentimentBreakdown.negative > 0 && (
              <div className="bg-red-400 transition-all" style={{ width: `${data.sentimentBreakdown.negative}%` }} title={`Negative ${data.sentimentBreakdown.negative}%`} />
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs font-medium">
            <span className="text-emerald-600">● Positive {data.sentimentBreakdown.positive}%</span>
            <span className="text-amber-600">● Neutral {data.sentimentBreakdown.neutral}%</span>
            <span className="text-red-500">● Negative {data.sentimentBreakdown.negative}%</span>
          </div>
        </div>

        {/* Row 3 — Strengths + Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Strengths
            </div>
            {data.strengths.length === 0 ? (
              <div className="text-xs text-slate-400">Not enough data yet</div>
            ) : data.strengths.map(s => (
              <div key={s.category} className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-700 font-medium">✓ {s.category}</span>
                <span className="text-emerald-600 font-bold">{s.count} mentions ({s.percentage}%)</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100">
            <div className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              Needs Improvement
            </div>
            {data.weaknesses.length === 0 ? (
              <div className="text-xs text-emerald-600 font-medium">No significant complaints — great job!</div>
            ) : data.weaknesses.map(w => (
              <div key={w.category} className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-700 font-medium">△ {w.category}</span>
                <span className="text-amber-700 font-bold">{w.count} mentions ({w.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4 — Keywords */}
        {(data.positiveKeywords.length > 0 || data.negativeKeywords.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-slate-500 mb-2">Customers say:</div>
              <div className="flex flex-wrap gap-1.5">
                {data.positiveKeywords.length === 0
                  ? <span className="text-xs text-slate-400">No data</span>
                  : data.positiveKeywords.map(k => (
                    <span key={k.word} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                      {k.word} ({k.count})
                    </span>
                  ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 mb-2">Watch out for:</div>
              <div className="flex flex-wrap gap-1.5">
                {data.negativeKeywords.length === 0
                  ? <span className="text-xs text-emerald-600 font-medium">No negative keywords found!</span>
                  : data.negativeKeywords.map(k => (
                    <span key={k.word} className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full">
                      {k.word} ({k.count})
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Row 5 — Action Items */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Action Items
          </div>
          <div className="space-y-2">
            {data.actionItems.map((item, i) => (
              <div key={i} className="text-xs text-blue-800 flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">→</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 6 — Trend + Peak times */}
        <div className="flex flex-wrap gap-4 text-xs border-t border-emerald-100 pt-4">
          {data.trend && (
            <div className={`flex items-center gap-1.5 font-medium ${trendColor}`}>
              {trendIcon} Trend: Rating {data.trend.direction === "stable" ? "stable" : `${data.trend.direction} by ${data.trend.difference}`} this week
              {data.trend.lastWeekAvg > 0 && ` (${data.trend.lastWeekAvg} → ${data.trend.thisWeekAvg})`}
            </div>
          )}
          {data.peakTimes?.bestRated && (
            <div className="text-slate-500 flex items-center gap-1">
              🕐 Best: <span className="font-semibold text-slate-700">{data.peakTimes.bestRated.period} ({data.peakTimes.bestRated.avg}★)</span>
              {data.peakTimes.worstRated && data.peakTimes.worstRated.period !== data.peakTimes.bestRated.period && (
                <> · Lowest: <span className="font-semibold text-slate-700">{data.peakTimes.worstRated.period} ({data.peakTimes.worstRated.avg}★)</span></>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Individual feedback card ──────────────────────────────────────────────────
function FeedbackCard({ fb }) {
  const ratingColor =
    fb.rating >= 5 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    fb.rating >= 4 ? "bg-green-50 text-green-700 border-green-200" :
    fb.rating >= 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
    fb.rating >= 2 ? "bg-orange-50 text-orange-700 border-orange-200" :
    "bg-red-50 text-red-700 border-red-200"

  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-3 ${ratingColor.split(" ")[2]} border`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${ratingColor}`}>
            {fb.emoji ? EMOJI_MAP[fb.emoji] : "⭐"}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700">Table {fb.tableNumber}</div>
            <div className="text-xs text-slate-400">
              {new Date(fb.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars rating={fb.rating} size={13} />
          {fb.billAmount > 0 && (
            <span className="text-[10px] text-slate-400">Rs. {fb.billAmount.toLocaleString()}</span>
          )}
        </div>
      </div>

      {fb.categories?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fb.categories.map(c => (
            <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {CATEGORY_LABELS[c] || c}
            </span>
          ))}
        </div>
      )}

      {fb.comment && (
        <div className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 leading-relaxed italic">
          "{fb.comment}"
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeedbackManagement() {
  const dispatch = useDispatch()
  const { list, total, pages, stats, smartSummary, isLoading, statsLoading, summaryLoading } =
    useSelector(s => s.feedback)

  const [showSummary,  setShowSummary]  = useState(false)
  const [page,         setPage]         = useState(1)
  const [ratingFilter, setRatingFilter] = useState("")
  const [search,       setSearch]       = useState("")
  const [searchInput,  setSearchInput]  = useState("")
  const [startDate,    setStartDate]    = useState("")
  const [endDate,      setEndDate]      = useState("")

  // load stats on mount
  useEffect(() => {
    dispatch(fetchFeedbackStats())
  }, [dispatch])

  // load feedback list
  const loadFeedback = useCallback(() => {
    dispatch(fetchFeedbacks({
      page,
      limit:     20,
      rating:    ratingFilter || undefined,
      search:    search       || undefined,
      startDate: startDate    || undefined,
      endDate:   endDate      || undefined,
    }))
  }, [dispatch, page, ratingFilter, search, startDate, endDate])

  useEffect(() => { loadFeedback() }, [loadFeedback])

  const handleSearch = () => { setPage(1); setSearch(searchInput) }
  const handleClearFilters = () => {
    setRatingFilter(""); setSearch(""); setSearchInput("")
    setStartDate(""); setEndDate(""); setPage(1)
  }

  const handleGenerateSummary = () => {
    setShowSummary(true)
    dispatch(fetchSmartSummary())
  }

  const handleRefreshSummary = () => { dispatch(fetchSmartSummary()) }

  // ── derived stats ─────────────────────────────────────────────
  const s              = stats?.stats
  const distribution   = stats?.distribution   || []
  const emojiDist      = stats?.emojiDistribution || []
  const categoryDist   = stats?.categoryDistribution || []
  const dailyTrend     = stats?.dailyTrend     || []
  const totalDistCount = distribution.reduce((acc, d) => acc + d.count, 0)

  const avgColor =
    !s ? "text-slate-700" :
    s.overallAvg >= 4 ? "text-emerald-600" :
    s.overallAvg >= 3 ? "text-amber-600" :
    "text-red-500"

  const trendLabel =
    !s ? null :
    s.trendDirection === "up"     ? { text: `↑ ${s.trendDiff} from last week`, cls: "text-emerald-600" } :
    s.trendDirection === "down"   ? { text: `↓ ${s.trendDiff} from last week`, cls: "text-red-500"     } :
    { text: "→ Same as last week", cls: "text-slate-400" }

  const EMOJI_ORDER = ["loved", "good", "okay", "poor", "bad"]
  const emojiMap = Object.fromEntries(emojiDist.map(e => [e.emoji, e.count]))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Feedback</h2>
          <p className="text-xs text-slate-400 mt-0.5">Reviews and satisfaction insights</p>
        </div>
        <button onClick={handleGenerateSummary}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-200">
          <span className="text-base">✨</span>
          Generate Smart Summary
        </button>
      </div>

      {/* ── Smart Summary Card ── */}
      {showSummary && (
        <SmartSummaryCard
          data={smartSummary}
          loading={summaryLoading}
          onRefresh={handleRefreshSummary}
          onClose={() => { setShowSummary(false); dispatch(clearSmartSummary()) }}
        />
      )}

      {/* ── Stats Cards ── */}
      {statsLoading ? <Spinner /> : s && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: "Average Rating",
              value: <span className={`text-3xl font-black ${avgColor}`}>{s.overallAvg || "—"}</span>,
              sub:   <div className="flex items-center gap-1 mt-1"><Stars rating={Math.round(s.overallAvg)} size={12} /></div>,
              icon:  "⭐",
              accent: "bg-amber-500",
            },
            {
              label: "Total Reviews",
              value: <span className="text-3xl font-black text-slate-800">{s.totalCount}</span>,
              sub:   null,
              icon:  "💬",
              accent: "bg-blue-500",
            },
            {
              label: "This Week's Avg",
              value: <span className="text-3xl font-black text-slate-800">{s.thisWeekAvg || "—"}</span>,
              sub:   trendLabel && <div className={`text-xs font-semibold mt-1 ${trendLabel.cls}`}>{trendLabel.text}</div>,
              icon:  "📅",
              accent: "bg-violet-500",
            },
            {
              label: "This Month's Avg",
              value: <span className="text-3xl font-black text-slate-800">{s.thisMonthAvg || "—"}</span>,
              sub:   <div className="text-xs text-slate-400 mt-1">{s.thisWeekCount} reviews this week</div>,
              icon:  "📆",
              accent: "bg-emerald-500",
            },
          ].map(card => (
            <div key={card.label} className="relative bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${card.accent}`} />
              <div className={`w-10 h-10 rounded-xl ${card.accent} bg-opacity-10 flex items-center justify-center text-lg mb-3`}>
                {card.icon}
              </div>
              {card.value}
              {card.sub}
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts ── */}
      {!statsLoading && s && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Rating distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Rating Distribution</h3>
            {distribution.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[5,4,3,2,1].map(star => {
                    const found = distribution.find(d => d.stars === star)
                    return { name: `${star}★`, count: found?.count || 0, star }
                  })}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    formatter={(val, _name, props) => {
                      const pct = totalDistCount > 0 ? Math.round((val / totalDistCount) * 100) : 0
                      return [`${val} reviews (${pct}%)`, `${props.payload.star} stars`]
                    }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 11 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {[5,4,3,2,1].map(star => (
                      <Cell key={star} fill={STAR_COLORS[star]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rating trend (14 days) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Rating Trend (Last 14 Days)</h3>
            {dailyTrend.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dailyTrend} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={d => d.slice(5)} />
                  <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val} avg`, "Rating"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 11 }}
                  />
                  <Line
                    type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2.5}
                    dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Emoji distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Emoji Distribution</h3>
            <div className="flex justify-around items-end py-4">
              {EMOJI_ORDER.map(key => {
                const count = emojiMap[key] || 0
                const max   = Math.max(...EMOJI_ORDER.map(k => emojiMap[k] || 0), 1)
                return (
                  <div key={key} className="flex flex-col items-center gap-2">
                    <div className="text-xs font-bold text-slate-600">{count}</div>
                    <div
                      className="w-10 bg-emerald-100 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(4, (count / max) * 80)}px` }}
                    />
                    <div className="text-2xl">{EMOJI_MAP[key]}</div>
                    <div className="text-[10px] text-slate-400 font-medium capitalize">{key}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top feedback categories */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Top Feedback Categories</h3>
            {categoryDist.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">No data yet</div>
            ) : (
              <div className="space-y-3">
                {categoryDist.map(c => {
                  const maxCount = categoryDist[0]?.count || 1
                  const pct      = Math.round((c.count / maxCount) * 100)
                  return (
                    <div key={c.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600">{c.label}</span>
                        <span className="font-bold text-slate-700">{c.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Feedback list ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-700">All Feedback</h3>
          <p className="text-xs text-slate-400 mt-0.5">{total} total reviews</p>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-50 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search in comments…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
            />
            <button onClick={handleSearch}
              className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">
              Search
            </button>
          </div>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setPage(1) }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 bg-white"
          >
            <option value="">All Ratings</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2 text-xs">
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-400 text-xs" />
            <span className="text-slate-300">—</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }}
              className="border border-slate-200 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-400 text-xs" />
          </div>

          {(ratingFilter || search || startDate || endDate) && (
            <button onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-slate-600 underline">Clear filters</button>
          )}
        </div>

        {/* List */}
        <div className="p-5">
          {isLoading ? <Spinner /> : list.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-30">💬</div>
              <div className="text-sm text-slate-400 font-medium">No feedback found</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {list.map(fb => <FeedbackCard key={fb._id} fb={fb} />)}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
