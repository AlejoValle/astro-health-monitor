import { describe, expect, it } from 'vitest'
import { EXERCISE_PLANS, minutesByBlock, planMinutes, startOfDay } from './exercise'
import { LOCATIONS } from './locations'
import { sourceById } from './sources'

describe('exercise plans', () => {
  it('has a plan with cited sources for every location', () => {
    for (const location of LOCATIONS) {
      const plan = EXERCISE_PLANS[location.id]
      expect(plan.blocks.length).toBeGreaterThan(0)
      expect(plan.sourceIds.length).toBeGreaterThan(0)
      for (const id of plan.sourceIds) expect(sourceById(id), id).toBeDefined()
    }
  })

  it('uses unique block ids within a plan', () => {
    for (const plan of Object.values(EXERCISE_PLANS)) {
      const ids = plan.blocks.map((b) => b.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('matches the two hours a day NASA reports for station crews', () => {
    expect(planMinutes(EXERCISE_PLANS.orbit)).toBe(120)
  })

  it('adds balance work only where there is gravity to stand in', () => {
    const hasBalance = (id: keyof typeof EXERCISE_PLANS) => EXERCISE_PLANS[id].blocks.some((b) => b.kind === 'balance')
    expect(hasBalance('moon')).toBe(true)
    expect(hasBalance('mars')).toBe(true)
    expect(hasBalance('orbit')).toBe(false)
    expect(hasBalance('transit')).toBe(false)
  })
})

describe('workout helpers', () => {
  it('sums minutes per block', () => {
    expect(
      minutesByBlock([
        { blockId: 'cycle', minutes: 10 },
        { blockId: 'resistance', minutes: 30 },
        { blockId: 'cycle', minutes: 5 },
      ]),
    ).toEqual({ cycle: 15, resistance: 30 })
  })

  it('finds local midnight', () => {
    const noon = new Date(2026, 10, 14, 12, 30).getTime()
    expect(startOfDay(noon)).toBe(new Date(2026, 10, 14).getTime())
  })
})
