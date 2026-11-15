import type { IndicatorId } from '../data/indicators'
import { db, type Dose, type MindCheck, type Reading, type Workout } from './db'
import { useSettings } from './store'

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

/** Simulated active dosimeter readings, one a week, at about 0.35 mSv per day (ISS range). */
export function simulatedDoses(now = Date.now(), days = 14): Omit<Dose, 'id'>[] {
  return [days, 7, 1].map((d) => ({
    at: now - d * DAY,
    mSv: Math.round((days - d) * 0.35 * 10) / 10,
    origin: 'simulated' as const,
  }))
}

/** Simulated exercise on most days, and mind checks every few days, so the routine has history. */
export function simulatedActivity(now = Date.now(), days = 14) {
  const workouts: Omit<Workout, 'id'>[] = []
  const checks: Omit<MindCheck, 'id'>[] = []
  for (let d = days - 1; d >= 1; d--) {
    const day = now - d * DAY
    if (d % 5 !== 3) workouts.push({ at: day, locationId: 'orbit', blockId: 'resistance', minutes: 30, origin: 'simulated' })
    if (d % 3 === 1) checks.push({ kind: 'stress', at: day, score: 3 + ((days - d) >> 2), origin: 'simulated' })
    if (d % 7 === 6)
      checks.push({ kind: 'reaction', at: day, score: 290 + (days - d) * 3, lapses: 1, falseStarts: 0, responses: 60, origin: 'simulated' })
  }
  return { workouts, checks }
}

// Each runs in one transaction, so the app sees a single change and does not
// celebrate the simulated history as if the crew member had just earned it.
export async function loadSimulatedMission() {
  const { workouts, checks } = simulatedActivity()
  await db.transaction('rw', [db.readings, db.doses, db.workouts, db.checks], async () => {
    await deleteSimulated()
    await db.readings.bulkAdd(simulatedMission() as Reading[])
    await db.doses.bulkAdd(simulatedDoses() as Dose[])
    await db.workouts.bulkAdd(workouts as Workout[])
    await db.checks.bulkAdd(checks as MindCheck[])
  })
  const { missionStart, setMission } = useSettings.getState()
  if (missionStart === null) setMission({ missionStart: Date.now() - 14 * DAY })
}

export function clearSimulatedMission() {
  return db.transaction('rw', [db.readings, db.doses, db.workouts, db.checks], deleteSimulated)
}

async function deleteSimulated() {
  await db.readings.where('origin').equals('simulated').delete()
  await db.doses.where('origin').equals('simulated').delete()
  await db.workouts.filter((w) => w.origin === 'simulated').delete()
  await db.checks.filter((c) => c.origin === 'simulated').delete()
}
