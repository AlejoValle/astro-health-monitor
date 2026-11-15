import { motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { warp } from '../lib/warp'

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const EASE_IN = [0.7, 0, 0.84, 0] as const

/** How long the intro holds before leaving on its own, in ms. */
const HOLD_MS = 2700
const HOLD_REDUCED_MS = 900

// The app's logo: the heartbeat line from the icon, in a 64 × 64 box.
const PULSE = 'M8 34h12l5-14 9 28 6-18 4 4h12'

// "Astro" in white, "Vitals" in the accent colour, one entry per letter.
const LETTERS = [
  ...[...'Astro'].map((ch) => ({ ch, className: 'text-ink' })),
  ...[...'Vitals'].map((ch) => ({ ch, className: 'text-accent' })),
]

/**
 * Opening animation shown every time the app starts, like a game or streaming logo:
 * an orbit draws, the heartbeat traces and beats, the name assembles, then the logo
 * flies toward the viewer and the stars jump to warp. Tap or press any key to skip.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const left = useRef(false)
  const t = useT()

  const leave = useCallback(() => {
    if (left.current) return
    left.current = true
    warp()
    setLeaving(true)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(leave, reduce ? HOLD_REDUCED_MS : HOLD_MS)
    window.addEventListener('keydown', leave)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', leave)
    }
  }, [leave, reduce])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-space"
      onClick={leave}
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.55, delay: leaving ? 0.3 : 0, ease: EASE_OUT }}
      onAnimationComplete={() => {
        if (leaving) onDone()
      }}
    >
      <span className="sr-only">{t('AstroVitals is starting. Press any key to skip.')}</span>

      {/* Soft glow that breathes behind the logo. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute size-[34rem] rounded-full bg-[radial-gradient(circle,rgb(125_211_252/0.16),transparent_62%)]"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1, 0.92, 1], opacity: 1 }}
        transition={{ duration: 2.2, ease: EASE_OUT, times: [0, 0.5, 0.75, 1] }}
      />

      <motion.div
        aria-hidden
        className="relative flex flex-col items-center"
        initial={{ scale: 0.86, opacity: 0 }}
        animate={
          leaving
            ? { scale: 2.2, opacity: 0, filter: 'blur(12px)' }
            : { scale: 1, opacity: 1, filter: 'blur(0px)' }
        }
        transition={leaving ? { duration: 0.7, ease: EASE_IN } : { duration: 1.1, ease: EASE_OUT }}
      >
        <Emblem />

        <motion.h1
          className="mt-7 flex text-5xl font-semibold tracking-tight sm:text-6xl"
          initial={{ letterSpacing: '0.45em' }}
          animate={{ letterSpacing: '-0.02em' }}
          transition={{ duration: 1.4, delay: 0.95, ease: EASE_OUT }}
        >
          {LETTERS.map(({ ch, className }, i) => (
            <motion.span
              key={i}
              className={`inline-block ${className}`}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 1.0 + i * 0.05, ease: EASE_OUT }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="label mt-4 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.75, ease: EASE_OUT }}
        >
          {t('Health monitoring for spaceflight')}
        </motion.p>

        {/* A streak of light that sweeps across the logo once it is assembled. */}
        <motion.span
          className="pointer-events-none absolute inset-y-[-20%] w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-screen blur-md"
          initial={{ left: '-30%', opacity: 0 }}
          animate={{ left: '120%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.9, delay: 1.85, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.p
        className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] text-xs text-ink-faint"
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ delay: leaving ? 0 : 1.2, duration: 0.6 }}
      >
        {t('Tap to skip')}
      </motion.p>
    </motion.div>
  )
}

/** Orbit ring with a satellite around the heartbeat line, drawn in sequence. */
function Emblem() {
  return (
    <motion.svg
      viewBox="-16 -16 96 96"
      className="size-36 overflow-visible drop-shadow-[0_0_18px_rgb(125_211_252/0.55)] sm:size-44"
      // Two beats once the line is drawn, like a pulse.
      animate={{ scale: [1, 1, 1.09, 1, 1.05, 1] }}
      transition={{ duration: 0.9, delay: 1.25, times: [0, 0.05, 0.25, 0.45, 0.65, 1], ease: 'easeOut' }}
    >
      {/* Outer dashed ring turning slowly. */}
      <motion.circle
        cx="32"
        cy="32"
        r="46"
        fill="none"
        stroke="rgb(125 211 252 / 0.22)"
        strokeWidth="0.8"
        strokeDasharray="1.5 4"
        initial={{ opacity: 0, rotate: -40 }}
        animate={{ opacity: 1, rotate: 40 }}
        transition={{ opacity: { duration: 0.8, delay: 0.3 }, rotate: { duration: 3, ease: 'linear' } }}
      />
      {/* Orbit ring drawing itself. */}
      <motion.circle
        cx="32"
        cy="32"
        r="38"
        fill="none"
        stroke="rgb(125 211 252 / 0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.1, ease: EASE_OUT }}
      />
      {/* Satellite: the transparent circle centres the group so it turns around the logo. */}
      <motion.g
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 270, opacity: 1 }}
        transition={{ rotate: { duration: 2.8, delay: 0.1, ease: [0.3, 0, 0.2, 1] }, opacity: { delay: 0.2 } }}
      >
        <circle cx="32" cy="32" r="38" fill="none" stroke="none" />
        <circle cx="70" cy="32" r="2.6" fill="#f4f6f8" />
        <circle cx="70" cy="32" r="5" fill="rgb(125 211 252 / 0.35)" />
      </motion.g>
      {/* Heartbeat line from the app icon. */}
      <motion.path
        d={PULSE}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ pathLength: { duration: 0.85, delay: 0.45, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.1, delay: 0.45 } }}
      />
    </motion.svg>
  )
}
