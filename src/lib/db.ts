import Dexie, { type EntityTable } from 'dexie'
import type { IndicatorId } from '../data/indicators'

export interface Reading {
  id: number
  indicatorId: IndicatorId
  values: number[]
  at: number
  origin: 'manual' | 'sensor' | 'simulated'
}

export const db = new Dexie('astrovitals') as Dexie & {
  readings: EntityTable<Reading, 'id'>
}

db.version(1).stores({
  readings: '++id, indicatorId, at, origin, [indicatorId+at]',
})

export function addReading(indicatorId: IndicatorId, values: number[], origin: Reading['origin'] = 'manual') {
  return db.readings.add({ indicatorId, values, at: Date.now(), origin })
}
