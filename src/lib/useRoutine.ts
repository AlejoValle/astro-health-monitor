import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useSyncExternalStore } from 'react'
import { db } from './db'
import { progress, todayStatus, type Progress, type RoutineRecords, type TaskStatus } from './routine'

const MINUTE = 60_000

const subscribeClock = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000)
  return () => window.clearInterval(id)
}

/** The current time, rounded to the minute, so the routine moves on as the day goes by. */
export function useNow() {
  return useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / MINUTE) * MINUTE)
}

export interface RoutineState {
  now: number
  statuses: TaskStatus[]
  progress: Progress
  simulated: boolean
}

/** Today's routine and the crew member's points, streak, rank and patches; `undefined` while loading. */
export function useRoutine(): RoutineState | undefined {
  const now = useNow()
  const records = useLiveQuery(async () => {
    const [readings, checks, workouts, doses] = await Promise.all([
      db.readings.toArray(),
      db.checks.toArray(),
      db.workouts.toArray(),
      db.doses.toArray(),
    ])
    const simulated =
      readings.some((x) => x.origin === 'simulated') || workouts.some((x) => x.origin === 'simulated')
    return { records: { readings, checks, workouts, doses } satisfies RoutineRecords, simulated }
  }, [])

  return useMemo(
    () =>
      records && {
        now,
        statuses: todayStatus(records.records, now),
        progress: progress(records.records, now),
        simulated: records.simulated,
      },
    [records, now],
  )
}
