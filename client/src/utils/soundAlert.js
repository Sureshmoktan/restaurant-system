// soundAlert.js — Web Audio API sound effects for restaurant alerts
// No mp3 files needed. All tones generated programmatically.

let audioCtx = null

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume()
  }
  return audioCtx
}

// Wire up the first-interaction handler once to unblock autoplay
let interactionListenerAdded = false
export const initAudioOnInteraction = () => {
  if (interactionListenerAdded) return
  interactionListenerAdded = true
  const resume = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume()
    }
    document.removeEventListener("click",     resume)
    document.removeEventListener("touchstart", resume)
    document.removeEventListener("keydown",   resume)
  }
  document.addEventListener("click",     resume, { once: true })
  document.addEventListener("touchstart", resume, { once: true })
  document.addEventListener("keydown",   resume, { once: true })
}

/**
 * Play a single tone with smooth fade-in / fade-out to avoid clicking/popping.
 * @param {number} frequency  Hz
 * @param {number} duration   seconds (total, including fade)
 * @param {number} volume     peak gain (0–1)
 * @param {number} delay      seconds from now before tone starts
 */
const playTone = (frequency, duration, volume = 0.3, delay = 0) => {
  try {
    const ctx        = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode   = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

    const t0      = ctx.currentTime + delay
    const fadeIn  = 0.01            // 10 ms ramp up
    const fadeOut = 0.05            // 50 ms ramp down before stop
    const holdEnd = t0 + duration - fadeOut

    gainNode.gain.setValueAtTime(0,      t0)
    gainNode.gain.linearRampToValueAtTime(volume, t0 + fadeIn)
    gainNode.gain.setValueAtTime(volume, holdEnd)
    gainNode.gain.linearRampToValueAtTime(0, t0 + duration)

    oscillator.start(t0)
    oscillator.stop(t0 + duration + 0.05) // tiny buffer so ramp completes
  } catch (err) {
    // Silently ignore — autoplay policy may block before first interaction
    console.debug("[soundAlert] playTone suppressed:", err.message)
  }
}

// ─── isSoundEnabled helper ────────────────────────────────────────────────────
// Checked inline so each sound respects the current toggle state without
// needing React state passed all the way down.
const isSoundEnabled = () => {
  try {
    return localStorage.getItem("soundEnabled") !== "false"
  } catch {
    return true
  }
}

// ─── Sound presets ────────────────────────────────────────────────────────────

/**
 * Pleasant double-ding (restaurant service bell).
 * First ding 830 Hz then second ding 1050 Hz.
 */
export const newOrderSound = () => {
  if (!isSoundEnabled()) return
  playTone(830,  0.15, 0.3, 0)      // first ding
  playTone(1050, 0.20, 0.3, 0.30)   // second ding after ~300 ms gap
}

/**
 * Low descending two-note warning for cancelled orders.
 */
export const cancelOrderSound = () => {
  if (!isSoundEnabled()) return
  playTone(500, 0.20, 0.3, 0)
  playTone(350, 0.30, 0.3, 0.25)
}

/**
 * Three quick urgent beeps for stock alerts.
 */
export const stockAlertSound = () => {
  if (!isSoundEnabled()) return
  playTone(700, 0.10, 0.25, 0)
  playTone(700, 0.10, 0.25, 0.20)
  playTone(700, 0.10, 0.25, 0.40)
}

/**
 * Single soft chime for bill requests (cashier).
 */
export const billRequestSound = () => {
  if (!isSoundEnabled()) return
  playTone(900, 0.30, 0.25, 0)
}
