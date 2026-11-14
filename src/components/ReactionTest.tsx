import { useEffect, useRef, useState } from 'react'
import {
  ANTICIPATION_MS,
  FEEDBACK_MS,
  MAX_EXTRA_WAIT_MS,
  summarize,
  type ReactionSummary,
} from '../lib/reaction'

type Trial = { state: 'waiting' } | { state: 'stimulus' } | { state: 'feedback'; text: string }

/** Full-screen tap target. Calls `onDone` once when the time is up. */
export function ReactionTest({ durationMs, onDone }: { durationMs: number; onDone: (s: ReactionSummary) => void }) {
  const [trial, setTrial] = useState<Trial>({ state: 'waiting' })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000))
  const startedAt = useRef(0)
  const onsetAt = useRef(0)
  const reactionTimes = useRef<number[]>([])
  const earlyTaps = useRef(0)
  const done = useRef(onDone)

  useEffect(() => {
    done.current = onDone
  }, [onDone])

  // Test clock.
  useEffect(() => {
    startedAt.current = performance.now()
    const tick = window.setInterval(() => {
      const left = durationMs - (performance.now() - startedAt.current)
      setRemaining(Math.max(0, Math.ceil(left / 1000)))
      if (left <= 0) {
        window.clearInterval(tick)
        done.current(summarize(reactionTimes.current, earlyTaps.current))
      }
    }, 250)
    return () => window.clearInterval(tick)
  }, [durationMs])

  // Trial sequence: wait, show the counter, show the result for 1 s, repeat.
  useEffect(() => {
    if (trial.state === 'waiting') {
      const wait = window.setTimeout(() => setTrial({ state: 'stimulus' }), Math.random() * MAX_EXTRA_WAIT_MS)
      return () => window.clearTimeout(wait)
    }
    if (trial.state === 'feedback') {
      const feedback = window.setTimeout(() => setTrial({ state: 'waiting' }), FEEDBACK_MS)
      return () => window.clearTimeout(feedback)
    }
    onsetAt.current = performance.now()
    let frame = requestAnimationFrame(function count() {
      setElapsedMs(Math.round(performance.now() - onsetAt.current))
      frame = requestAnimationFrame(count)
    })
    return () => cancelAnimationFrame(frame)
  }, [trial])

  const tap = () => {
    if (trial.state === 'stimulus') {
      const rt = Math.round(performance.now() - onsetAt.current)
      reactionTimes.current.push(rt)
      setTrial({ state: 'feedback', text: rt < ANTICIPATION_MS ? 'Too soon' : `${rt} ms` })
    } else if (trial.state === 'waiting') {
      earlyTaps.current += 1
      setTrial({ state: 'feedback', text: 'Too soon' })
    }
  }

  return (
    <button
      type="button"
      onPointerDown={tap}
      data-state={trial.state}
      className="fixed inset-0 z-50 flex touch-none select-none flex-col items-center justify-center bg-space"
    >
      <span className="label absolute top-[max(1.5rem,env(safe-area-inset-top))]">{remaining} s left</span>
      <span
        className={`flex size-64 items-center justify-center rounded-full border-2 text-5xl font-semibold tabular-nums ${
          trial.state === 'stimulus' ? 'border-accent bg-accent/15 text-accent' : 'border-line text-ink-dim'
        }`}
      >
        {trial.state === 'stimulus' ? elapsedMs : trial.state === 'feedback' ? trial.text : ''}
      </span>
      <span className="mt-8 text-ink-dim">Tap anywhere when the counter starts</span>
    </button>
  )
}
