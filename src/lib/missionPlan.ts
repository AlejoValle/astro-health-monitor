import { CAREER_LIMIT_MSV, DOSE_RATE, type SolarActivity } from '../data/radiation'
import type { MissionPlan } from '../data/missionPlans'

export interface PlanDose {
  /** Career dose at the end of each day of the mission, starting with day 0. */
  series: { day: number; mSv: number }[]
  missionMSv: number
  endMSv: number
  days: number
  /** First mission day on which the career limit is passed, if it is. */
  limitDay: number | null
}

/** Career dose across an example mission, from the dose before it and NASA's rate for each leg. */
export function planDose(plan: MissionPlan, solar: SolarActivity, priorMSv: number): PlanDose {
  const series = [{ day: 0, mSv: priorMSv }]
  let total = priorMSv
  let day = 0
  let limitDay: number | null = null
  for (const leg of plan.legs) {
    const rate = DOSE_RATE[leg.location][solar]
    for (let i = 0; i < leg.days; i++) {
      total += rate
      day++
      if (limitDay === null && total > CAREER_LIMIT_MSV) limitDay = day
      series.push({ day, mSv: Math.round(total * 10) / 10 })
    }
  }
  return { series, missionMSv: total - priorMSv, endMSv: total, days: day, limitDay }
}
