import { useMemo } from 'react'
import { progress, todayStatus, type Progress, type TaskStatus } from './routine'
import { useNow, useRecords } from './useRecords'

export { useNow } from './useRecords'

export interface RoutineState {
  now: number
  statuses: TaskStatus[]
  progress: Progress
  simulated: boolean
}

/** Today's routine and the crew member's points, streak, rank and patches; `undefined` while loading. */
export function useRoutine(): RoutineState | undefined {
  const now = useNow()
  const records = useRecords()

  return useMemo(
    () =>
      records && {
        now,
        statuses: todayStatus(records, now),
        progress: progress(records, now),
        simulated: records.simulated,
      },
    [records, now],
  )
}
