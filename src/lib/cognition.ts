import { msg } from '../i18n/msg'
import type { Assessment } from './rules'

// Brain games modelled on two tests of NASA's "Cognition" battery used on the ISS:
// a 2-back working-memory task and a digit-symbol substitution task for processing speed.
// Lengths, scoring and the bands below are this app's choice; results are compared with the
// crew member's own earlier games, never with a population norm.

export const NBACK_LETTERS = ['B', 'F', 'K', 'M', 'Q', 'R', 'T', 'X']
export const NBACK_TRIALS = 24
export const NBACK_N = 2

export const DSST_SYMBOLS = ['◐', '◆', '✚', '▲', '●', '■', '★', '⬟', '✦']
export const DSST_SECONDS = 60

/** A 2-back sequence where about a third of the trials (after the first two) are targets. */
export function nbackSequence(rand: () => number, length = NBACK_TRIALS, n = NBACK_N): string[] {
  const seq: string[] = []
  for (let i = 0; i < length; i++) {
    if (i >= n && rand() < 0.33) {
      seq.push(seq[i - n])
    } else {
      const avoid = i >= n ? seq[i - n] : undefined
      const pool = NBACK_LETTERS.filter((l) => l !== avoid)
      seq.push(pool[Math.floor(rand() * pool.length)])
    }
  }
  return seq
}

export interface NBackScore {
  hits: number
  misses: number
  falseAlarms: number
  /** Share of trials answered right (tap on a target, no tap otherwise), 0 to 100. */
  accuracy: number
}

/** `taps[i]` is true when the crew member tapped "Match" on trial i. The first n trials are not scored. */
export function scoreNBack(seq: string[], taps: boolean[], n = NBACK_N): NBackScore {
  let hits = 0
  let misses = 0
  let falseAlarms = 0
  let right = 0
  for (let i = n; i < seq.length; i++) {
    const target = seq[i] === seq[i - n]
    const tapped = !!taps[i]
    if (target && tapped) hits++
    if (target && !tapped) misses++
    if (!target && tapped) falseAlarms++
    if (target === tapped) right++
  }
  return { hits, misses, falseAlarms, accuracy: Math.round((right / Math.max(1, seq.length - n)) * 100) }
}

/** A random symbol-to-digit key: symbol i maps to digit key[i] (1 to 9). */
export function dsstKey(rand: () => number): number[] {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[digits[i], digits[j]] = [digits[j], digits[i]]
  }
  return digits
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Rates a game score (higher is better) against the median of the crew member's earlier games. */
export function assessCognition(score: number, earlier: number[]): Assessment {
  if (earlier.length === 0)
    return {
      status: 'ok',
      label: msg('Baseline saved'),
      advice: msg('Play again on other days to build your own baseline.'),
      escalate: false,
    }
  const base = median(earlier)
  const drop = base > 0 ? 1 - score / base : 0
  if (drop >= 0.3)
    return {
      status: 'alert',
      label: msg('Much lower than usual'),
      advice: msg('Your score fell a lot. Check your sleep and stress, avoid critical tasks if you can and play again after resting.'),
      escalate: false,
    }
  if (drop >= 0.15)
    return {
      status: 'watch',
      label: msg('Lower than usual'),
      advice: msg('A little below your usual. Rest, then try again later today or tomorrow.'),
      escalate: false,
    }
  return { status: 'ok', label: msg('As sharp as usual'), advice: msg('Keep your sleep schedule.'), escalate: false }
}

export const seededRandom = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
