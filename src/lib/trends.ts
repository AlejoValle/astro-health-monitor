import type { IndicatorId } from '../data/indicators'

/** Values the rules in rules.ts rate as OK, per field (inclusive). Kept in sync by trends.test.ts. */
export interface OkRange {
  min?: number
  max?: number
}

export const OK_RANGES: Record<IndicatorId, OkRange[]> = {
  hr: [{ min: 60, max: 100 }],
  bp: [{ max: 119 }, { max: 79 }],
  glucose: [{ min: 70, max: 99 }],
  temp: [{ max: 37.9 }],
  sleep: [{ min: 7 }],
  mood: [{ min: 3 }],
}

// Smallest change this app calls a trend instead of day-to-day noise. An app choice, not a clinical rule.
export const MIN_CHANGE: Record<IndicatorId, number> = {
  hr: 5,
  bp: 5,
  glucose: 10,
  temp: 0.5,
  sleep: 0.5,
  mood: 1,
}

export type Direction = 'up' | 'down' | 'steady'

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

/**
 * Compares the average of the last 3 readings with the average of the first 3.
 * Returns null with fewer than 6 readings, when there is not enough data to tell.
 */
export function direction(values: number[], minChange: number): Direction | null {
  if (values.length < 6) return null
  const change = mean(values.slice(-3)) - mean(values.slice(0, 3))
  if (change >= minChange) return 'up'
  if (change <= -minChange) return 'down'
  return 'steady'
}
