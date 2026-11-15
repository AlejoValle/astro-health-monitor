import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'

// 4-7-8 breathing: in for 4 seconds, hold for 7, out for 8. A common relaxation technique;
// using it here is this app's choice, not a NASA protocol.
const PHASES = [
  { label: msg('Breathe in'), seconds: 4, scale: 1 },
  { label: msg('Hold'), seconds: 7, scale: 1 },
  { label: msg('Breathe out'), seconds: 8, scale: 0.55 },
]
const BREATH_CYCLES = 4

/** Guided 4-7-8 breathing with an expanding and shrinking circle. Calls `onDone` at the end. */
export function Breathing({ onDone }: { onDone: () => void }) {
  const t = useT()
  // One state for position and seconds left, advanced by a pure update so nothing double-counts.
  const [{ step, left }, setClock] = useState({ step: 0, left: PHASES[0].seconds })
  const cycle = Math.floor(step / PHASES.length)
  const phase = PHASES[step % PHASES.length]
  const finished = cycle >= BREATH_CYCLES

  useEffect(() => {
    if (finished) {
      onDone()
      return
    }
    const id = window.setInterval(() => {
      setClock((c) =>
        c.left > 1 ? { ...c, left: c.left - 1 } : { step: c.step + 1, left: PHASES[(c.step + 1) % PHASES.length].seconds },
      )
    }, 1000)
    return () => window.clearInterval(id)
  }, [finished, onDone])

  if (finished) return null

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative flex size-64 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-accent/60 bg-accent/10"
          initial={{ scale: 0.55 }}
          animate={{ scale: phase.scale }}
          transition={{ duration: phase.seconds, ease: 'easeInOut' }}
          aria-hidden
        />
        <span className="relative text-center" aria-live="polite">
          <span className="block text-2xl font-semibold">{t(phase.label)}</span>
          <span className="block text-5xl font-semibold tabular-nums">{left}</span>
        </span>
      </div>
      <p className="mt-6 text-sm text-ink-dim">{t('Cycle {n} of {total}', { n: cycle + 1, total: BREATH_CYCLES })}</p>
    </div>
  )
}
