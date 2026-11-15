import { useLiveQuery } from 'dexie-react-hooks'
import { useSyncExternalStore } from 'react'
import { db, type Dose, type MindCheck, type Reading, type Workout } from './db'

const MINUTE = 60_000

const subscribeClock = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(id)
}

/** The current time, rounded to the minute, so time-based views move on as the day goes by. */
export function useNow() {
  return useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / MINUTE) * MINUTE)
}

export interface Records {
  readings: Reading[]
  checks: MindCheck[]
  workouts: Workout[]
  doses: Dose[]
  simulated: boolean
}

/** Every record on the device; `undefined` while loading. Shared by routine, alerts, report and body map. */
export function useRecords(): Records | undefined {
  return useLiveQuery(async () => {
    const [readings, checks, workouts, doses] = await Promise.all([
      db.readings.orderBy('at').toArray(),
      db.checks.toArray(),
      db.workouts.toArray(),
      db.doses.toArray(),
    ])
    const simulated =
      readings.some((x) => x.origin === 'simulated') || workouts.some((x) => x.origin === 'simulated')
    return { readings, checks, workouts, doses, simulated }
  }, [])
}
