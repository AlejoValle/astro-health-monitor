import type { IndicatorId } from '../data/indicators'
import { db, type Reading } from './db'

const DAY = 24 * 60 * 60 * 1000

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Simulated crew member for demos: 14 days where sleep gets shorter and blood
 * pressure creeps up. Every row is tagged `simulated` and never mixed silently
 * with real readings.
 */
export function simulatedMission(now = Date.now(), days = 14): Omit<Reading, 'id'>[] {
  const rnd = mulberry32(42)
  const jitter = (spread: number) => (rnd() - 0.5) * 2 * spread
  const rows: Omit<Reading, 'id'>[] = []
  const push = (indicatorId: IndicatorId, values: number[], at: number) =>
    rows.push({ indicatorId, values, at, origin: 'simulated' })

  for (let d = days - 1; d >= 0; d--) {
    const at = now - d * DAY - 2 * 60 * 60 * 1000
    const progress = (days - 1 - d) / (days - 1)
    push('hr', [Math.round(66 + progress * 8 + jitter(4))], at)
    push('bp', [Math.round(116 + progress * 16 + jitter(4)), Math.round(74 + progress * 7 + jitter(3))], at)
    push('glucose', [Math.round(90 + jitter(6))], at)
    push('temp', [Math.round((36.7 + jitter(0.3)) * 10) / 10], at)
    push('sleep', [Math.round((7.8 - progress * 1.6 + jitter(0.4)) * 2) / 2], at)
    push('mood', [Math.max(1, Math.min(5, Math.round(4.2 - progress * 1.4 + jitter(0.6))))], at)
  }
  return rows
}

export async function loadSimulatedMission() {
  await db.readings.where('origin').equals('simulated').delete()
  await db.readings.bulkAdd(simulatedMission() as Reading[])
}

export function clearSimulatedMission() {
  return db.readings.where('origin').equals('simulated').delete()
}
