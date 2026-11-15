import { useMemo } from 'react'
import { EXERCISE_PLANS, planMinutes } from '../data/exercise'
import { computeAlerts, type HealthAlert } from './alerts'
import { baselineOf, toSummary } from './mindChecks'
import { assessReaction } from './reaction'
import { useSettings } from './store'
import { useNow, useRecords } from './useRecords'

/** Early warnings from the crew member's own history; `undefined` while loading. */
export function useAlerts(): HealthAlert[] | undefined {
  const records = useRecords()
  const now = useNow()
  const locationId = useSettings((s) => s.locationId)

  return useMemo(() => {
    if (!records) return undefined
    const reactions = records.checks.filter((c) => c.kind === 'reaction').sort((a, b) => a.at - b.at)
    const last = reactions.at(-1)
    const reaction = last && {
      status: assessReaction(toSummary(last), baselineOf(reactions.slice(0, -1))).status,
      at: last.at,
    }
    return computeAlerts({
      readings: records.readings,
      workouts: records.workouts,
      exerciseTarget: planMinutes(EXERCISE_PLANS[locationId]),
      reaction,
      now,
    })
  }, [records, now, locationId])
}
