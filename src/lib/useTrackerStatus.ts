import { EXERCISE_PLANS, planMinutes } from '../data/exercise'
import { assessExercise, exerciseSummary } from './exerciseStatus'
import type { TrackerStatus } from './hazards'
import { useMindStatus } from './mindChecks'
import { assess } from './rules'
import { useSettings } from './store'
import { useLatest } from './useLatest'
import { useRadiation } from './useRadiation'
import { useNow, useRecords } from './useRecords'

/** Latest status of everything the hazards and body systems are tracked by; `undefined` while loading. */
export function useTrackerStatus(): TrackerStatus | undefined {
  const latest = useLatest()
  const mind = useMindStatus()
  const radiation = useRadiation()
  const records = useRecords()
  const now = useNow()
  const locationId = useSettings((s) => s.locationId)
  if (!latest || !mind || !radiation || !records) return undefined
  const indicators: TrackerStatus['indicators'] = {}
  for (const [id, reading] of Object.entries(latest)) {
    const key = id as keyof typeof latest
    if (reading) indicators[key] = assess(key, reading.values)
  }
  const exercise = exerciseSummary(records.workouts, planMinutes(EXERCISE_PLANS[locationId]), now)
  return {
    indicators,
    radiation: radiation.overall,
    stress: mind.stress,
    reaction: mind.reaction,
    exercise: exercise ? assessExercise(exercise.share) : undefined,
  }
}
