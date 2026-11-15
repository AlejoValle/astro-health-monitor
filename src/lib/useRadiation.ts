import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Dose } from './db'
import { assessCareer, assessRate, estimateDose, measuredRate, type DoseEstimate } from './radiation'
import { worst, type Assessment } from './rules'
import { useSettings } from './store'

export interface RadiationState {
  doses: Dose[]
  estimate: DoseEstimate | null
  career?: Assessment
  measured: number | null
  rate?: Assessment
  /** The more serious of the career and rate assessments. */
  overall?: Assessment
  simulated: boolean
}

/** Radiation dose for the current mission; `undefined` while loading. */
export function useRadiation(): RadiationState | undefined {
  const { locationId, solar, missionStart, priorDoseMSv } = useSettings()

  return useLiveQuery(async () => {
    const doses = await db.doses.orderBy('at').toArray()
    const estimate = estimateDose({
      now: Date.now(),
      location: locationId,
      solar,
      missionStart,
      priorMSv: priorDoseMSv,
      logs: doses,
    })
    const career = estimate ? assessCareer(estimate.careerMSv) : undefined
    const measured = measuredRate(doses)
    const rate = measured !== null ? assessRate(measured, locationId) : undefined
    const both = [career, rate].filter((a): a is Assessment => a !== undefined)
    const overall = both.length ? both.find((a) => a.status === worst(both.map((b) => b.status))) : undefined
    return { doses, estimate, career, measured, rate, overall, simulated: doses.some((d) => d.origin === 'simulated') }
  }, [locationId, solar, missionStart, priorDoseMSv])
}
