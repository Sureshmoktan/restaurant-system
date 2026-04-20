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

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export default function SpinWheelOverlay({
  bill,
  gameSettings,
  onSkip,
  onProceedToPayment,
  onBillUpdate,
}) {
  const [spinning,   setSpinning]   = useState(false)
  const [spinResult, setSpinResult] = useState(null)   // null until spin completes
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
    if (spinning || spinResult || slices.length === 0) return
    setSpinning(true)
    setError("")

    try {
      // 1. Call backend — winner is determined server-side
      const result = await spinWheel(bill._id)

      // 2. Find winner's position on the wheel
      const winnerPos = slicePositions.find((p) => p.discount === result.discount)
        ?? slicePositions[0]
      const winnerCenter = winnerPos.startAngle + winnerPos.angle / 2

      // 3. FIX: Correct rotation so the pointer (top) lands on the winner.
      //    After a CW rotation of X degrees the pointer sees domain angle (360 - X) % 360.
      //    To see domain angle D we need X = (360 - D) % 360.
      //    With 6 full pre-spins: X = 6*360 - D  (always positive for D in [0,360)).
      const targetRotation = 6 * 360 - winnerCenter

      // 4. Apply CSS transition + rotation directly via DOM ref for smooth animation
      if (wheelRef.current) {
        wheelRef.current.style.transition =
          "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
        wheelRef.current.style.transform  = `rotate(${targetRotation}deg)`
      }

      // 5. After animation completes, show result (wheel stays visible)
      setTimeout(() => {
        setSpinResult(result)
        setSpinning(false)

        // 6. Update parent bill state to reflect new amounts
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
  }, [bill, slices, slicePositions, spinning, spinResult, onBillUpdate])

  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Confetti — only after result */}
      {spinResult && <Confetti count={spinResult.discount >= 20 ? 35 : 22} />}

      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto py-6"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)" }}
      >
        <div className="flex flex-col items-center gap-5 w-full max-w-md px-4">

          {/* ── Header ───────────────────────────────────────────────────── */}
          {!spinResult ? (
            <div className="text-center">
              <h2 className="text-3xl font-black text-white tracking-tight">
                Spin to Win Your Discount!
              </h2>
              <p className="text-zinc-400 mt-1.5 text-sm">Try your luck before paying</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-1">
                {spinResult.discount === 100 ? "🏆" : spinResult.discount >= 20 ? "🎉" : "🎊"}
              </div>
              <div className="text-2xl font-black text-white">
                {spinResult.discount === 100 ? "JACKPOT! FREE MEAL!" : "You won a discount!"}
              </div>
            </div>
          )}

          {/* ── The Wheel — always visible ───────────────────────────────── */}
          {slices.length > 0 ? (
            <SpinWheel slices={slices} wheelRef={wheelRef} isSpinning={spinning} />
          ) : (
            <div className="w-[300px] h-[300px] rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm">
              Loading wheel…
            </div>
          )}

          {/* ── Result panel — shown after spin, below the wheel ─────────── */}
          {spinResult && (
            <div className="w-full space-y-3">
              {/* Big discount badge */}
              <div
                className="w-full py-4 rounded-2xl text-center"
                style={{ background: spinResult.color || "#10b981" }}
              >
                <div className="text-3xl font-black text-white">
                  {spinResult.discount === 100 ? "100% FREE!" : `${spinResult.discount}% OFF`}
                </div>
                <div className="text-white/80 text-sm font-semibold mt-0.5">
                  Rs. {spinResult.discountAmount.toLocaleString()} deducted from your bill
                </div>
              </div>

              {/* New total */}
              <div className="bg-zinc-800/90 border border-zinc-700 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400 font-medium">New Total</div>
                  <div className="text-2xl font-black text-emerald-400">
                    Rs. {spinResult.newTotal.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 line-through">
                    Rs. {(bill.totalAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    You saved Rs. {spinResult.discountAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Spin button — before spin ─────────────────────────────────── */}
          {!spinResult && (
            <button
              onClick={handleSpin}
              disabled={spinning || slices.length === 0}
              className={[
                "px-12 py-4 rounded-2xl text-lg font-black transition-all shadow-xl",
                spinning || slices.length === 0
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
              ) : "🎰 Spin!"}
            </button>
          )}

          {/* ── Proceed button — after spin ───────────────────────────────── */}
          {spinResult && (
            <button
              onClick={onProceedToPayment}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl font-black text-base transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Proceed to Payment →
            </button>
          )}

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-300 bg-red-950/60 border border-red-800 px-4 py-3 rounded-xl w-full">
              <span>⚠</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* ── Skip link — before spin only ─────────────────────────────── */}
          {!spinning && !spinResult && (
            <button
              onClick={onSkip}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
            >
              Skip → Payment
            </button>
          )}
        </div>
      </div>
    </>
  )
}
