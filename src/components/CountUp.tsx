import { animate, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'

const format = (n: number, decimals: number) => n.toFixed(decimals)

/**
 * A number that counts up to its value when it first appears, and glides to new values.
 * Renders the final value directly with reduced motion.
 */
export function CountUp({ value, decimals = 0, duration = 1.1 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef<number | null>(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current ?? 0
    if (reduce || from === value) {
      el.textContent = format(value, decimals)
      shown.current = value
      return
    }
    el.textContent = format(from, decimals)
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) => {
        shown.current = n
        el.textContent = format(n, decimals)
      },
    })
    return () => controls.stop()
  }, [value, decimals, duration, reduce])

  return (
    <span ref={ref} className="tabular-nums">
      {format(value, decimals)}
    </span>
  )
}
