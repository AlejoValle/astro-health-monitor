import { describe, expect, it } from 'vitest'
import { assessMass, assessMeals, massChange, recentMealShare, today } from './nutrition'

const NOW = new Date(2026, 10, 15, 18).getTime()
const DAY = 86_400_000

describe('nutrition', () => {
  it('adds up today’s water and meals', () => {
    const t = today(
      [
        { kind: 'water', amount: 250, at: NOW - 1000 },
        { kind: 'water', amount: 500, at: NOW - 2000 },
        { kind: 'water', amount: 900, at: NOW - DAY },
        { kind: 'meal', amount: 0.5, at: NOW - 3000 },
      ],
      NOW,
    )
    expect(t).toEqual({ water: 750, meals: 1, eaten: 0.5 })
  })

  it('averages the share of planned meals eaten over recent days', () => {
    const meals = [1, 2, 3].flatMap((d) => [0.5, 0.5, 0.5].map((amount) => ({ kind: 'meal' as const, amount, at: NOW - d * DAY })))
    expect(recentMealShare(meals, NOW)).toBeCloseTo(0.5)
    expect(assessMeals(0.5).status).toBe('watch')
    expect(assessMeals(0.4).status).toBe('alert')
    expect(recentMealShare(meals.slice(0, 3), NOW)).toBeNull()
  })

  it('compares body mass with the first readings', () => {
    const m = massChange([
      { kind: 'mass', amount: 80, at: 1 },
      { kind: 'mass', amount: 80, at: 2 },
      { kind: 'mass', amount: 74.4, at: 3 },
    ])!
    expect(m.change).toBeCloseTo(-0.07)
    expect(assessMass(m.change).status).toBe('alert')
    expect(assessMass(-0.035).status).toBe('watch')
    expect(assessMass(0.01).status).toBe('ok')
  })
})
