import { useState, useEffect } from "react"
import { initAudioOnInteraction } from "../utils/soundAlert"

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns [soundEnabled, toggleSound].
 * Persists preference to localStorage under "soundEnabled".
 */
export function useSoundEnabled() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("soundEnabled") !== "false"
    } catch {
      return true
    }
  })

  // Wire up first-interaction audio-context resume on mount
  useEffect(() => {
    initAudioOnInteraction()
  }, [])

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      try {
        localStorage.setItem("soundEnabled", String(next))
      } catch {}
      return next
    })
  }

  return [soundEnabled, toggleSound]
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Small mute/unmute button.
 * Position it with a wrapper — it renders inline without absolute positioning
 * so the parent page controls placement.
 */
export default function SoundToggle() {
  const [soundEnabled, toggleSound] = useSoundEnabled()

  return (
    <button
      onClick={toggleSound}
      title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
      className={[
        "w-9 h-9 flex items-center justify-center rounded-lg border transition-all text-base",
        soundEnabled
          ? "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
          : "border-red-200 bg-red-50 hover:bg-red-100 text-red-400",
      ].join(" ")}
    >
      {soundEnabled ? "🔊" : "🔇"}
    </button>
  )
}
