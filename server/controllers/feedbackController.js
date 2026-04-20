const Feedback     = require("../models/Feedback")
const Bill         = require("../models/Bill")
const MESSAGES     = require("../constants/messages")
const STATUS_CODES = require("../constants/statusCodes")
const asyncHandler = require("../utils/asyncHandler")
const { SOCKET_EVENTS } = require("../constants")

// ── Category label map ────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  food_quality:    "Food Quality",
  service:         "Service",
  cleanliness:     "Cleanliness",
  ambience:        "Ambience",
  value_for_money: "Value for Money",
  speed:           "Speed",
}

// ── POST /api/v1/feedback  (public — no auth) ─────────────────────────────────
const submitFeedback = asyncHandler(async (req, res) => {
  const { billId, rating, emoji, categories, comment } = req.body

  if (!billId || !rating) {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("billId and rating are required")
  }

  // verify bill exists and is paid
  const bill = await Bill.findById(billId)
  if (!bill) {
    res.status(STATUS_CODES.NOT_FOUND)
    throw new Error(MESSAGES.BILL.NOT_FOUND)
  }
  if (bill.paymentStatus !== "paid") {
    res.status(STATUS_CODES.BAD_REQUEST)
    throw new Error("Feedback can only be submitted for paid bills")
  }

  // one feedback per bill (unique index handles it, but give friendly error)
  const existing = await Feedback.findOne({ billId })
  if (existing) {
    res.status(STATUS_CODES.CONFLICT)
    throw new Error("Feedback already submitted for this bill")
  }

  const feedback = await Feedback.create({
    billId,
    tableNumber: bill.tableNumber,
    billAmount:  bill.totalAmount || 0,
    rating,
    emoji:      emoji      || "",
    categories: categories || [],
    comment:    comment    || "",
  })

  // notify admin via socket
  const io = req.app.get("io")
  if (io) io.emit(SOCKET_EVENTS.NEW_FEEDBACK, { feedback })

  res.status(STATUS_CODES.CREATED).json({
    success:  true,
    message:  "Thank you for your feedback!",
    feedback,
  })
})

// ── GET /api/v1/feedback/:billId  (public — check before showing modal) ───────
const checkFeedbackByBill = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({ billId: req.params.billId })
  res.status(STATUS_CODES.OK).json({
    success:  true,
    exists:   !!feedback,
    feedback: feedback || null,
  })
})

// ── GET /api/v1/feedback  (admin) ─────────────────────────────────────────────
const getAllFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, rating, search, startDate, endDate } = req.query

  const filter = {}
  if (rating)    filter.rating = Number(rating)
  if (search)    filter.comment = { $regex: search, $options: "i" }
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate)   filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Feedback.countDocuments(filter)

  const feedbacks = await Feedback
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  res.status(STATUS_CODES.OK).json({
    success: true,
    total,
    page:    Number(page),
    pages:   Math.ceil(total / Number(limit)),
    feedbacks,
  })
})

// ── GET /api/v1/feedback/stats  (admin) ───────────────────────────────────────
const getFeedbackStats = asyncHandler(async (req, res) => {
  const now       = new Date()
  const weekAgo   = new Date(now - 7  * 24 * 60 * 60 * 1000)
  const monthAgo  = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const [overall, thisWeek, thisMonth] = await Promise.all([
    Feedback.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]),
    Feedback.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]),
    Feedback.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]),
  ])

  // last week average (8-14 days ago) for trend
  const lastWeekStart = new Date(now - 14 * 24 * 60 * 60 * 1000)
  const lastWeek = await Feedback.aggregate([
    { $match: { createdAt: { $gte: lastWeekStart, $lt: weekAgo } } },
    { $group: { _id: null, avg: { $avg: "$rating" } } }
  ])

  // rating distribution
  const distribution = await Feedback.aggregate([
    { $group: { _id: "$rating", count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ])

  // emoji distribution
  const emojiDist = await Feedback.aggregate([
    { $match: { emoji: { $ne: "" } } },
    { $group: { _id: "$emoji", count: { $sum: 1 } } }
  ])

  // category distribution (last 30 days)
  const catDist = await Feedback.aggregate([
    { $match: { createdAt: { $gte: monthAgo } } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])

  // daily trend — last 14 days
  const dailyTrend = await Feedback.aggregate([
    { $match: { createdAt: { $gte: new Date(now - 14 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        avg:   { $avg: "$rating" },
        count: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ])

  const totalCount        = overall[0]?.count  || 0
  const overallAvg        = overall[0]?.avg    || 0
  const thisWeekAvg       = thisWeek[0]?.avg   || 0
  const lastWeekAvg       = lastWeek[0]?.avg   || 0
  const thisMonthAvg      = thisMonth[0]?.avg  || 0
  const thisWeekCount     = thisWeek[0]?.count || 0

  const trendDirection =
    thisWeekAvg > lastWeekAvg ? "up" :
    thisWeekAvg < lastWeekAvg ? "down" : "stable"

  res.status(STATUS_CODES.OK).json({
    success: true,
    stats: {
      totalCount,
      overallAvg:    parseFloat(overallAvg.toFixed(1)),
      thisWeekAvg:   parseFloat(thisWeekAvg.toFixed(1)),
      lastWeekAvg:   parseFloat(lastWeekAvg.toFixed(1)),
      thisMonthAvg:  parseFloat(thisMonthAvg.toFixed(1)),
      thisWeekCount,
      trendDirection,
      trendDiff:     parseFloat(Math.abs(thisWeekAvg - lastWeekAvg).toFixed(1)),
    },
    distribution: distribution.map(d => ({ stars: d._id, count: d.count })),
    emojiDistribution: emojiDist.map(e => ({ emoji: e._id, count: e.count })),
    categoryDistribution: catDist.map(c => ({
      key:   c._id,
      label: CATEGORY_LABELS[c._id] || c._id,
      count: c.count,
    })),
    dailyTrend: dailyTrend.map(d => ({
      date:  d._id,
      avg:   parseFloat(d.avg.toFixed(2)),
      count: d.count,
    })),
  })
})

// ── GET /api/v1/feedback/smart-summary  (admin) ───────────────────────────────
const getSmartSummary = asyncHandler(async (req, res) => {
  const now      = new Date()
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000)
  const twoWeeks = new Date(now - 14 * 24 * 60 * 60 * 1000)

  const allFeedback = await Feedback.find({ createdAt: { $gte: monthAgo } }).lean()
  const total = allFeedback.length

  if (total < 5) {
    return res.status(STATUS_CODES.OK).json({
      success:      true,
      insufficient: true,
      count:        total,
      message:      `Need at least 5 reviews to generate summary. Current: ${total} reviews.`,
    })
  }

  // ── 1. SENTIMENT BREAKDOWN ──────────────────────────────────────────────────
  const positiveCount = allFeedback.filter(f => f.rating >= 4).length
  const neutralCount  = allFeedback.filter(f => f.rating === 3).length
  const negativeCount = allFeedback.filter(f => f.rating <= 2).length

  const positivePercent = Math.round((positiveCount / total) * 100)
  const neutralPercent  = Math.round((neutralCount  / total) * 100)
  const negativePercent = Math.round((negativeCount / total) * 100)

  const overallSentiment =
    positivePercent >= 60 ? "positive" :
    negativePercent >= 40 ? "negative" : "mixed"

  const avgRating = parseFloat(
    (allFeedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1)
  )

  // ── 2. STRENGTHS (categories from 4-5 star reviews) ────────────────────────
  const positiveFeedback = allFeedback.filter(f => f.rating >= 4)
  const catCountPos = {}
  positiveFeedback.forEach(f => {
    f.categories.forEach(c => { catCountPos[c] = (catCountPos[c] || 0) + 1 })
  })
  const strengths = Object.entries(catCountPos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({
      category:   CATEGORY_LABELS[key] || key,
      count,
      percentage: Math.round((count / positiveFeedback.length) * 100),
    }))

  // ── 3. WEAKNESSES (categories from 1-2 star reviews) ───────────────────────
  const negativeFeedback = allFeedback.filter(f => f.rating <= 2)
  const catCountNeg = {}
  negativeFeedback.forEach(f => {
    f.categories.forEach(c => { catCountNeg[c] = (catCountNeg[c] || 0) + 1 })
  })
  const weaknesses = Object.entries(catCountNeg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({
      category:   CATEGORY_LABELS[key] || key,
      count,
      percentage: negativeCount > 0 ? Math.round((count / negativeCount) * 100) : 0,
    }))

  // ── 4. KEYWORD ANALYSIS ─────────────────────────────────────────────────────
  const POSITIVE_KW = ["delicious","amazing","great","excellent","best","loved","fresh","tasty","friendly","perfect","wonderful","clean","fast"]
  const NEGATIVE_KW = ["slow","cold","bad","worst","dirty","rude","expensive","small","wait","long","stale","bland","noisy","raw"]

  const comments = allFeedback.map(f => (f.comment || "").toLowerCase()).join(" ")

  const countKeyword = (kw) => {
    const matches = comments.match(new RegExp(`\\b${kw}\\b`, "g"))
    return matches ? matches.length : 0
  }

  const positiveKeywords = POSITIVE_KW
    .map(w => ({ word: w, count: countKeyword(w) }))
    .filter(k => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const negativeKeywords = NEGATIVE_KW
    .map(w => ({ word: w, count: countKeyword(w) }))
    .filter(k => k.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── 5. TREND COMPARISON ─────────────────────────────────────────────────────
  const thisWeekFb   = allFeedback.filter(f => new Date(f.createdAt) >= weekAgo)
  const lastWeekFb   = await Feedback.find({
    createdAt: { $gte: twoWeeks, $lt: weekAgo }
  }).lean()

  const thisWeekAvg = thisWeekFb.length
    ? parseFloat((thisWeekFb.reduce((s, f) => s + f.rating, 0) / thisWeekFb.length).toFixed(1))
    : 0
  const lastWeekAvg = lastWeekFb.length
    ? parseFloat((lastWeekFb.reduce((s, f) => s + f.rating, 0) / lastWeekFb.length).toFixed(1))
    : 0

  const trendDirection =
    thisWeekAvg > lastWeekAvg ? "up" :
    thisWeekAvg < lastWeekAvg ? "down" : "stable"

  // ── 6. SUMMARY TEXT ─────────────────────────────────────────────────────────
  const top3StrengthNames = strengths.map(s => s.category).join(", ") || "your service"
  const top3WeaknessNames = weaknesses.map(w => w.category).join(", ")

  let summaryText = `Based on ${total} reviews this month (average ${avgRating} stars), customer sentiment is ${overallSentiment}. ${positivePercent}% of customers rated 4-5 stars.`
  if (strengths.length > 0) summaryText += ` Your strongest areas are ${top3StrengthNames}.`
  if (weaknesses.length > 0) summaryText += ` Areas needing attention include ${top3WeaknessNames}.`

  // ── 7. ACTION ITEMS (rule-based) ────────────────────────────────────────────
  const negCategoryKeys = Object.keys(catCountNeg)
  const allActions = []

  if (negCategoryKeys.includes("speed"))           allActions.push("Consider optimizing kitchen workflow during peak hours to improve service speed")
  if (negCategoryKeys.includes("service"))         allActions.push("Staff training on customer service could improve the dining experience")
  if (negCategoryKeys.includes("food_quality"))    allActions.push("Review food preparation standards and ingredient freshness")
  if (negCategoryKeys.includes("cleanliness"))     allActions.push("Increase cleaning frequency, especially during busy periods")
  if (negCategoryKeys.includes("value_for_money")) allActions.push("Review portion sizes and pricing to match customer expectations")
  if (negCategoryKeys.includes("ambience"))        allActions.push("Consider improvements to restaurant atmosphere — lighting, music, seating comfort")
  if (avgRating > 4.5) allActions.push("Excellent performance! Maintain current standards and consider a loyalty program")
  if (trendDirection === "up")   allActions.push("Ratings are improving — keep up the good work!")
  if (trendDirection === "down") allActions.push("Ratings have declined recently — review recent changes and address feedback")
  const noCommentFb = allFeedback.filter(f => !f.comment || f.comment.trim() === "")
  if (noCommentFb.length / total > 0.7) allActions.push("Consider encouraging customers to leave detailed comments for more actionable insights")
  if (allActions.length === 0) allActions.push("Keep up the great work — customers are satisfied!")

  const actionItems = allActions.slice(0, 3)

  // ── 8. PEAK RATING TIMES ────────────────────────────────────────────────────
  const hourBuckets = {}
  allFeedback.forEach(f => {
    const h = new Date(f.createdAt).getHours()
    if (!hourBuckets[h]) hourBuckets[h] = { total: 0, count: 0 }
    hourBuckets[h].total += f.rating
    hourBuckets[h].count += 1
  })

  const hourAvgs = Object.entries(hourBuckets).map(([h, v]) => ({
    hour: Number(h),
    avg:  parseFloat((v.total / v.count).toFixed(1)),
    count: v.count,
  })).filter(h => h.count >= 1)

  const getPeriod = (h) => {
    if (h >= 6  && h < 11) return `Morning (${h}-${h+1} AM)`
    if (h >= 11 && h < 14) return `Lunch (${h === 12 ? 12 : h}-${h < 12 ? h+1 : h-11} ${h < 12 ? "AM" : "PM"})`
    if (h >= 14 && h < 18) return `Afternoon (${h-12}-${h-11} PM)`
    if (h >= 18 && h < 22) return `Dinner (${h-12}-${h-11} PM)`
    return `Late night (${h > 12 ? h-12 : h} ${h >= 12 ? "PM" : "AM"})`
  }

  let bestRated  = null
  let worstRated = null

  if (hourAvgs.length > 0) {
    const sorted = [...hourAvgs].sort((a, b) => b.avg - a.avg)
    bestRated  = { period: getPeriod(sorted[0].hour),  avg: sorted[0].avg }
    worstRated = { period: getPeriod(sorted[sorted.length - 1].hour), avg: sorted[sorted.length - 1].avg }
  }

  res.status(STATUS_CODES.OK).json({
    success: true,
    overallSentiment,
    sentimentBreakdown: {
      positive: positivePercent,
      neutral:  neutralPercent,
      negative: negativePercent,
    },
    summary:          summaryText,
    strengths,
    weaknesses,
    positiveKeywords,
    negativeKeywords,
    actionItems,
    trend: {
      direction:   trendDirection,
      difference:  parseFloat(Math.abs(thisWeekAvg - lastWeekAvg).toFixed(1)),
      thisWeekAvg,
      lastWeekAvg,
    },
    peakTimes: {
      bestRated,
      worstRated,
    },
    totalReviewed: total,
    periodDays:    30,
  })
})

module.exports = {
  submitFeedback,
  checkFeedbackByBill,
  getAllFeedback,
  getFeedbackStats,
  getSmartSummary,
}
