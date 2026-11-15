import type { TrackerStatus } from './hazards'
import { useMindStatus } from './mindChecks'
import { assess } from './rules'
import { useLatest } from './useLatest'
import { useRadiation } from './useRadiation'

/** Latest status of everything the hazards are tracked by; `undefined` while loading. */
export function useTrackerStatus(): TrackerStatus | undefined {
  const latest = useLatest()
  const mind = useMindStatus()
  const radiation = useRadiation()
  if (!latest || !mind || !radiation) return undefined
  const indicators: TrackerStatus['indicators'] = {}
  for (const [id, reading] of Object.entries(latest)) {
    const key = id as keyof typeof latest
    if (reading) indicators[key] = assess(key, reading.values)
  }
  return { indicators, radiation: radiation.overall, stress: mind.stress, reaction: mind.reaction }
}
