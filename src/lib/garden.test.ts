import { describe, expect, it } from 'vitest'
import { journey, plantState } from './garden'

const day = (offset: number) => new Date(2026, 10, 15 + offset).setHours(0, 0, 0, 0)
const NOW = new Date(2026, 10, 15, 18).getTime()

describe('plantState', () => {
  it('starts as a seed', () => {
    expect(plantState(new Set(), NOW)).toEqual({ stage: 0, growth: 0, wilting: false })
  })

  it('grows with full days in the last 10', () => {
    const full = new Set([0, -1, -2, -3, -4, -5, -6].map(day))
    expect(plantState(full, NOW).stage).toBe(3)
    expect(plantState(new Set([...full, day(-7), day(-8), day(-9)]), NOW).stage).toBe(4)
  })

  it('wilts after two days without a full day', () => {
    expect(plantState(new Set([day(-3), day(-4)]), NOW).wilting).toBe(true)
    expect(plantState(new Set([day(-1), day(-4)]), NOW).wilting).toBe(false)
  })
})

describe('journey', () => {
  it('moves from Earth to the Moon and on to Mars', () => {
    expect(journey(0).next?.name).toBe('Moon')
    expect(journey(7).reached.name).toBe('Moon')
    expect(journey(7).next?.name).toBe('Mars')
    expect(journey(50).next).toBeUndefined()
    expect(journey(50).progress).toBe(1)
  })
})
