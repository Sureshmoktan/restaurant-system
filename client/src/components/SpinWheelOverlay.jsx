// client/src/components/SpinWheelOverlay.jsx
// Full-screen spin-wheel overlay for the Discount Game.

import { useState, useRef, useMemo, useCallback } from "react"
import { spinWheel } from "../service/discountGameService"

// ─── SVG Wheel helpers ────────────────────────────────────────────────────────

const CX = 150
const CY = 150
const R  = 138

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function buildSlicePath(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle)
  const e = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)} Z`
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6",
  "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
]

function Confetti({ count = 28 }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left:     Math.random() * 100,
      size:     6 + Math.random() * 6,
      duration: 2 + Math.random() * 2,
      delay:    Math.random() * 0.8,
      isCircle: Math.random() > 0.5,
    }))
  }, [count])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[70]">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position:        "absolute",
            left:            `${p.left}%`,
            top:             "-20px",
            width:           `${p.size}px`,
            height:          `${p.size}px`,
            backgroundColor: p.color,
            borderRadius:    p.isCircle ? "50%" : "2px",
            animation:       `confettiFall ${p.duration}s ${p.delay}s ease-in forwards,
                              confettiSway ${p.duration * 0.6}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─── SVG Wheel ────────────────────────────────────────────────────────────────

function SpinWheel({ slices, wheelRef, isSpinning }) {
  const totalWeight = slices.reduce((s, sl) => s + sl.weight, 0)

  let cumAngle = 0
  const computed = slices.map((sl) => {
    const angle      = (sl.weight / totalWeight) * 360
    const startAngle = cumAngle
    const endAngle   = cumAngle + angle
    const midAngle   = startAngle + angle / 2
    cumAngle        += angle
    return { ...sl, angle, startAngle, endAngle, midAngle }
  })

  return (
    <div className="relative" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}>
      {/* Pointer (white triangle at top, pointing down) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ top: "-14px" }}
      >
        <svg width="28" height="22" viewBox="0 0 28 22">
          <polygon
            points="14,22 0,0 28,0"
            fill="white"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Wheel ring shadow */}
      <div
        className="rounded-full"
        style={{ boxShadow: "inset 0 0 0 4px rgba(255,255,255,0.15)" }}
      >
        <svg
          ref={wheelRef}
          width="300"
          height="300"
          viewBox="0 0 300 300"
          style={{
            display:        "block",
            willChange:     "transform",
            transformOrigin: "center",
          }}
        >
          {/* Outer border ring */}
          <circle cx={CX} cy={CY} r={R + 4} fill="white" opacity="0.15" />

          {/* Slices */}
          {computed.map((sl, i) => (
            <g key={i}>
              <path
                d={buildSlicePath(CX, CY, R, sl.startAngle, sl.endAngle)}
                fill={sl.color}
                stroke="white"
                strokeWidth="2"
              />
              {/* Label */}
              {sl.angle > 8 && (() => {
                const textR   = R * 0.65
                const textPos = polarToCartesian(CX, CY, textR, sl.midAngle)
                const fontSize = sl.angle < 20 ? 9 : sl.angle < 35 ? 11 : 13
                return (
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="bold"
                    fontFamily="system-ui, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${sl.midAngle}, ${textPos.x}, ${textPos.y})`}
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {sl.label}
                  </text>
                )
              })()}
            </g>
          ))}

          {/* Center circle */}
          <circle cx={CX} cy={CY} r={28} fill="white" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
          <text
            x={CX}
            y={CY}
            fill="#1f2937"
            fontSize="10"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            SPIN
          </text>
        </svg>
      </div>
    </div>
  )
}

// ─── Result celebration ───────────────────────────────────────────────────────

function getCelebrationConfig(discount) {
  if (discount === 100) {
    return {
      emoji:       "🤩🏆",
      headline:    "JACKPOT! FREE MEAL!",
      headlineCls: "jackpot-text text-4xl font-black text-amber-400",
      confettiCnt: 40,
      themeCls:    "from-amber-500/20 to-yellow-500/10",
    }
  }
  if (discount >= 20) {
    return {
      emoji:       "🎉",
      headline:    `Amazing! ${discount}% OFF!`,
      headlineCls: "celebration-bounce text-3xl font-black text-amber-400",
      confettiCnt: 30,
      themeCls:    "from-amber-500/15 to-orange-500/10",
    }
  }
  return {
    emoji:       "🎊",
    headline:    `You won ${discount}% OFF!`,
    headlineCls: "celebration-bounce text-3xl font-black text-emerald-400",
    confettiCnt: 22,
    themeCls:    "from-emerald-500/15 to-green-500/10",
  }
}

// ─── Bill breakdown preview ───────────────────────────────────────────────────

function BillPreview({ bill, spinResult }) {
  const afterOfferSubtotal  = bill.subtotal - (bill.discountAmount || 0)
  const afterGameSubtotal   = afterOfferSubtotal - spinResult.discountAmount
  const cashierPct          = bill.cashierDiscount || 0
  let finalSubtotal = afterGameSubtotal
  let cashierDiscAmt = 0
  if (cashierPct > 0) {
    cashierDiscAmt = Math.round(afterGameSubtotal * (cashierPct / 100))
    finalSubtotal  = afterGameSubtotal - cashierDiscAmt
  }
  const vatPct    = bill.vatPercent || 13
  const vatAmount = Math.round(finalSubtotal * (vatPct / 100))
  const tipAmount = bill.tipAmount || 0
  const total     = spinResult.newTotal

  return (
    <div className="bg-zinc-800/80 backdrop-blur rounded-2xl border border-zinc-700 p-5 w-full max-w-sm mx-auto">
      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Updated Bill</div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-zinc-300">
          <span>Subtotal</span>
          <span className="font-semibold">Rs. {bill.subtotal.toLocaleString()}</span>
        </div>

        {(bill.discountAmount || 0) > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>🏷️ Offer Discount</span>
            <span className="font-semibold">−Rs. {bill.discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-violet-400">
          <span>
            🎲 Game Discount ({spinResult.discount === 100 ? "FREE!" : `${spinResult.discount}%`})
          </span>
          <span className="font-semibold">−Rs. {spinResult.discountAmount.toLocaleString()}</span>
        </div>

        {cashierDiscAmt > 0 && (
          <div className="flex justify-between text-blue-400">
            <span>🎟️ Cashier Discount ({cashierPct}%)</span>
            <span className="font-semibold">−Rs. {cashierDiscAmt.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-zinc-400 border-t border-zinc-700 pt-2">
          <span>After Discounts</span>
          <span className="font-semibold text-zinc-200">Rs. {finalSubtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-zinc-400">
          <span>VAT ({vatPct}%)</span>
          <span className="font-semibold text-zinc-200">Rs. {vatAmount.toLocaleString()}</span>
        </div>

        {tipAmount > 0 && (
          <div className="flex justify-between text-amber-400">
            <span>🙏 Tip</span>
            <span className="font-semibold">Rs. {tipAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-black border-t border-zinc-600 pt-2.5 mt-1">
          <span className="text-white">Total</span>
          <span className="text-emerald-400">Rs. {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export default function SpinWheelOverlay({
  bill,
  gameSettings,
  onSkip,
  onProceedToPayment,
  onBillUpdate,
}) {
  const [phase,      setPhase]      = useState("wheel")  // "wheel" | "result"
  const [spinning,   setSpinning]   = useState(false)
  const [spun,       setSpun]       = useState(false)
  const [spinResult, setSpinResult] = useState(null)
  const [error,      setError]      = useState("")

  const wheelRef = useRef(null)

  // ── Find slices for this bill's tier ────────────────────────────────────────
  const slices = useMemo(() => {
    if (!gameSettings?.tiers) return []
    const tier = gameSettings.tiers.find(
      (t) => bill.subtotal >= t.minBill && bill.subtotal <= t.maxBill
    )
    return tier?.slices || []
  }, [gameSettings, bill.subtotal])

  // ── Build slice position map (weight-proportional angles) ───────────────────
  const slicePositions = useMemo(() => {
    const totalWeight = slices.reduce((s, sl) => s + sl.weight, 0)
    let cumAngle = 0
    return slices.map((sl) => {
      const angle      = (sl.weight / totalWeight) * 360
      const startAngle = cumAngle
      cumAngle        += angle
      return { discount: sl.discount, startAngle, angle }
    })
  }, [slices])

  // ── Spin handler ─────────────────────────────────────────────────────────────
  const handleSpin = useCallback(async () => {
    if (spinning || spun || slices.length === 0) return
    setSpinning(true)
    setError("")

    try {
      // 1. Call backend — winner is determined server-side
      const result = await spinWheel(bill._id)

      // 2. Find winner's position on the wheel
      const winnerPos = slicePositions.find((p) => p.discount === result.discount)
        ?? slicePositions[0]
      const winnerCenter = winnerPos.startAngle + winnerPos.angle / 2

      // 3. Calculate total rotation (5 full spins + angle to bring winner to top)
      const targetRotation = 5 * 360 + winnerCenter

      // 4. Apply CSS transition + rotation directly via DOM ref for smooth animation
      if (wheelRef.current) {
        wheelRef.current.style.transition =
          "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
        wheelRef.current.style.transform  = `rotate(${targetRotation}deg)`
      }

      setSpun(true)

      // 5. Server auto-disables the game on this bill during spin (discountGameEnabled = false)
      // No global toggle call needed.

      // 6. After animation completes, switch to result screen
      setTimeout(() => {
        setSpinResult(result)
        setSpinning(false)
        setPhase("result")

        // 7. Update parent bill state to reflect new amounts
        if (onBillUpdate) {
          const afterOfferSubtotal = bill.subtotal - (bill.discountAmount || 0)
          const afterGameSubtotal  = afterOfferSubtotal - result.discountAmount
          const cashierPct         = bill.cashierDiscount || 0
          let finalSubtotal = afterGameSubtotal
          let cashierDiscAmt = 0
          if (cashierPct > 0) {
            cashierDiscAmt = Math.round(afterGameSubtotal * (cashierPct / 100))
            finalSubtotal  = afterGameSubtotal - cashierDiscAmt
          }
          const vatPct = bill.vatPercent || 13
          const newVat = Math.round(finalSubtotal * (vatPct / 100))

          onBillUpdate({
            ...bill,
            discountGamePlayed:  true,
            discountGameResult:  result.discount,
            discountGameAmount:  result.discountAmount,
            discountedSubtotal:  finalSubtotal,
            vatAmount:           newVat,
            totalAmount:         result.newTotal,
            ...(cashierDiscAmt > 0 ? { cashierDiscountAmount: cashierDiscAmt } : {}),
          })
        }
      }, 4200)
    } catch (err) {
      setError(err?.response?.data?.message || "Spin failed. Please skip to payment.")
      setSpinning(false)
    }
  }, [bill, slices, slicePositions, spinning, spun, onBillUpdate])

  // ── Celebration config ───────────────────────────────────────────────────────
  const celebration = spinResult ? getCelebrationConfig(spinResult.discount) : null

  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Confetti — only on result phase */}
      {phase === "result" && celebration && (
        <Confetti count={celebration.confettiCnt} />
      )}

      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto py-6"
        style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
      >

        {/* ── WHEEL PHASE ─────────────────────────────────────────────────── */}
        {phase === "wheel" && (
          <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">

            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-black text-white tracking-tight">
                Spin to Win Your Discount!
              </h2>
              <p className="text-zinc-400 mt-1.5 text-sm">Try your luck!</p>
            </div>

            {/* The Wheel */}
            {slices.length > 0 ? (
              <SpinWheel slices={slices} wheelRef={wheelRef} isSpinning={spinning} />
            ) : (
              <div className="w-[300px] h-[300px] rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm">
                Loading wheel…
              </div>
            )}

            {/* Spin Button */}
            <button
              onClick={handleSpin}
              disabled={spinning || spun || slices.length === 0}
              className={[
                "px-12 py-4 rounded-2xl text-lg font-black transition-all shadow-xl",
                spinning || spun || slices.length === 0
                  ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500 hover:-translate-y-0.5 active:scale-95 shadow-emerald-500/30",
              ].join(" ")}
            >
              {spinning ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="15" strokeLinecap="round" />
                  </svg>
                  Spinning…
                </span>
              ) : spun ? "Spinning…" : "🎰 Spin!"}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-300 bg-red-950/60 border border-red-800 px-4 py-3 rounded-xl w-full">
                <span>⚠</span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Skip link */}
            {!spinning && !spun && (
              <button
                onClick={onSkip}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
              >
                Skip → Payment
              </button>
            )}
          </div>
        )}

        {/* ── RESULT PHASE ────────────────────────────────────────────────── */}
        {phase === "result" && celebration && spinResult && (
          <div className="flex flex-col items-center gap-5 w-full max-w-md px-4">

            {/* Emoji */}
            <div className="text-6xl select-none">{celebration.emoji}</div>

            {/* Headline */}
            <div
              className={celebration.headlineCls}
              style={{ textAlign: "center" }}
            >
              {celebration.headline}
            </div>

            {/* Discount badge */}
            <div
              className="px-6 py-2 rounded-full text-sm font-bold text-white"
              style={{ background: spinResult.color || "#10b981" }}
            >
              {spinResult.discount === 100
                ? "100% — Completely FREE!"
                : `${spinResult.discount}% discount applied!`}
            </div>

            {/* Bill preview card */}
            <BillPreview bill={bill} spinResult={spinResult} />

            {/* Proceed button */}
            <button
              onClick={onProceedToPayment}
              className="w-full max-w-sm py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl font-black text-base transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Proceed to Payment →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
