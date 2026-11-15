import Dexie, { type EntityTable } from 'dexie'
import type { IndicatorId } from '../data/indicators'
import type { LocationId } from '../data/locations'

export interface Reading {
  id: number
  indicatorId: IndicatorId
  values: number[]
  at: number
  origin: 'manual' | 'sensor' | 'simulated'
}

/** A mind check result. `score` is the stress total (0 to 16) or the median reaction time in ms. */
export interface MindCheck {
  id: number
  kind: 'stress' | 'reaction'
  at: number
  score: number
  lapses?: number
  falseStarts?: number
  responses?: number
  origin?: 'simulated'
}

export interface Workout {
  id: number
  at: number
  locationId: LocationId
  blockId: string
  minutes: number
  origin?: 'simulated'
}

/** An active dosimeter reading: total mission dose so far, in mSv. */
export interface Dose {
  id: number
  at: number
  mSv: number
  origin: 'manual' | 'simulated'
}

export const db = new Dexie('astrovitals') as Dexie & {
  readings: EntityTable<Reading, 'id'>
  checks: EntityTable<MindCheck, 'id'>
  workouts: EntityTable<Workout, 'id'>
  doses: EntityTable<Dose, 'id'>
}

db.version(1).stores({
  readings: '++id, indicatorId, at, origin, [indicatorId+at]',
})
db.version(2).stores({
  checks: '++id, [kind+at]',
})
db.version(3).stores({
  workouts: '++id, at',
})
db.version(4).stores({
  doses: '++id, at, origin',
})

export function addDose(mSv: number) {
  return db.doses.add({ mSv, at: Date.now(), origin: 'manual' })
}

export function addReading(indicatorId: IndicatorId, values: number[], origin: Reading['origin'] = 'manual') {
  return db.readings.add({ indicatorId, values, at: Date.now(), origin })
}

export function addCheck(check: Omit<MindCheck, 'id' | 'at'>) {
  return db.checks.add({ ...check, at: Date.now() })
}

export function addWorkout(workout: Omit<Workout, 'id' | 'at'>) {
  return db.workouts.add({ ...workout, at: Date.now() })
}
