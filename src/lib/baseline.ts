import type { IndicatorId } from '../data/indicators'
import { WORSE } from './alerts'
import { MIN_CHANGE } from './trends'

export interface Baseline {
  /** Median of each field, e.g. [systolic, diastolic]. */
  values: number[]
  /** 'preflight' when built from readings before the mission start, else from the first readings. */
  source: 'preflight' | 'early'
  count: number
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * The crew member's own normal for an indicator: the median of readings taken before the
 * mission start, or, without those, of the first 3 readings. Needs at least 3 readings in all.
 */
export function personalBaseline(
  readings: { indicatorId: IndicatorId; at: number; values: number[] }[],
  id: IndicatorId,
  missionStart: number | null,
): Baseline | null {
  const own = readings.filter((r) => r.indicatorId === id).sort((a, b) => a.at - b.at)
  if (own.length < 3) return null
  const pre = missionStart === null ? [] : own.filter((r) => r.at < missionStart)
  const base = pre.length ? pre : own.slice(0, 3)
  const fields = base[0].values.length
  return {
    values: Array.from({ length: fields }, (_, i) => median(base.map((r) => r.values[i]))),
    source: pre.length ? 'preflight' : 'early',
    count: base.length,
  }
}

export interface BaselineDelta {
  /** Change in the main number, rounded for display. */
  delta: number
  /** True when the change is large enough to mention (the app's trend threshold). */
  notable: boolean
  /** True when the change goes the unhealthy way for this indicator. */
  worse: boolean
}

export function compareToBaseline(id: IndicatorId, current: number[], baseline: Baseline): BaselineDelta {
  const raw = current[0] - baseline.values[0]
  const delta = Math.round(raw * 10) / 10
  return { delta, notable: Math.abs(raw) >= MIN_CHANGE[id], worse: raw * WORSE[id] > 0 }
}
