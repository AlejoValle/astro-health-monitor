import { describe, expect, it } from 'vitest'
import { isNight } from './night'

const at = (h: number) => new Date(2026, 10, 15, h, 30).getTime()

describe('night mode', () => {
  it('turns on automatically between 22:00 and 06:00', () => {
    expect(isNight('auto', at(23))).toBe(true)
    expect(isNight('auto', at(3))).toBe(true)
    expect(isNight('auto', at(6))).toBe(false)
    expect(isNight('auto', at(14))).toBe(false)
  })

  it('follows a manual choice at any hour', () => {
    expect(isNight('on', at(14))).toBe(true)
    expect(isNight('off', at(23))).toBe(false)
  })
})
