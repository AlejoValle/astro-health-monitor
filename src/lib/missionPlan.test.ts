import { describe, expect, it } from 'vitest'
import { MISSION_PLANS } from '../data/missionPlans'
import { planDose } from './missionPlan'

const plan = (id: string) => MISSION_PLANS.find((p) => p.id === id)!

describe('mission dose planner', () => {
  it('adds NASA rates leg by leg', () => {
    const r = planDose(plan('iss'), 'max', 0)
    expect(r.days).toBe(180)
    expect(r.missionMSv).toBeCloseTo(36, 5)
    expect(r.series).toHaveLength(181)
    expect(r.limitDay).toBeNull()
  })

  it('keeps a Mars mission under the limit at solar maximum but not at solar minimum', () => {
    expect(planDose(plan('mars'), 'max', 0).endMSv).toBeCloseTo(0.6 * 360 + 0.35 * 500, 5)
    expect(planDose(plan('mars'), 'max', 0).limitDay).toBeNull()
    const min = planDose(plan('mars'), 'min', 0)
    expect(min.endMSv).toBeGreaterThan(600)
    expect(min.limitDay).not.toBeNull()
  })

  it('starts from the dose of earlier missions', () => {
    const r = planDose(plan('moon'), 'min', 580)
    expect(r.series[0].mSv).toBe(580)
    expect(r.limitDay).not.toBeNull()
  })
})
