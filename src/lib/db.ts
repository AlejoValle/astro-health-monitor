import Dexie, { type EntityTable } from 'dexie'
import { dbNameFor, getActiveProfileId } from './profiles'
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

export type TetherDb = Dexie & {
  readings: EntityTable<Reading, 'id'>
  checks: EntityTable<MindCheck, 'id'>
  workouts: EntityTable<Workout, 'id'>
  doses: EntityTable<Dose, 'id'>
}

/** Opens one crew member's database. Every profile has the same schema. */
export function openDb(name: string): TetherDb {
  const d = new Dexie(name) as TetherDb
  d.version(1).stores({
    readings: '++id, indicatorId, at, origin, [indicatorId+at]',
  })
  d.version(2).stores({
    checks: '++id, [kind+at]',
  })
  d.version(3).stores({
    workouts: '++id, at',
  })
  d.version(4).stores({
    doses: '++id, at, origin',
  })
  return d
}

/** The active crew member's database. Switching profile reloads the app, so this stays fixed. */
export const db = openDb(dbNameFor(getActiveProfileId()))

/** Deletes a crew member's database. */
export function deleteProfileData(id: string) {
  return Dexie.delete(dbNameFor(id))
}

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
