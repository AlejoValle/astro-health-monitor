import Dexie, { type EntityTable } from 'dexie'
import type { IndicatorId } from '../data/indicators'

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
}

export const db = new Dexie('astrovitals') as Dexie & {
  readings: EntityTable<Reading, 'id'>
  checks: EntityTable<MindCheck, 'id'>
}

db.version(1).stores({
  readings: '++id, indicatorId, at, origin, [indicatorId+at]',
})
db.version(2).stores({
  checks: '++id, [kind+at]',
})

export function addReading(indicatorId: IndicatorId, values: number[], origin: Reading['origin'] = 'manual') {
  return db.readings.add({ indicatorId, values, at: Date.now(), origin })
}

export function addCheck(check: Omit<MindCheck, 'id' | 'at'>) {
  return db.checks.add({ ...check, at: Date.now() })
}
