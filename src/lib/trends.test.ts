import { describe, expect, it } from 'vitest'
import { INDICATORS } from '../data/indicators'
import { assess } from './rules'
import { direction, OK_RANGES } from './trends'

describe('OK_RANGES', () => {
  for (const indicator of INDICATORS) {
    const ranges = OK_RANGES[indicator.id]
    const inRange = ranges.map((r) => r.min ?? r.max!)
    const round = (v: number) => Math.round(v * 10) / 10

    it(`${indicator.id}: edges are OK and one step outside is not`, () => {
      expect(ranges.length).toBe(indicator.fields.length)
      expect(assess(indicator.id, inRange).status).toBe('ok')
      ranges.forEach((range, field) => {
        const step = indicator.fields[field].step
        const withField = (v: number) => inRange.map((base, i) => (i === field ? round(v) : base))
        if (range.min !== undefined) {
          expect(assess(indicator.id, withField(range.min)).status).toBe('ok')
          expect(assess(indicator.id, withField(range.min - step)).status).not.toBe('ok')
        }
        if (range.max !== undefined) {
          expect(assess(indicator.id, withField(range.max)).status).toBe('ok')
          expect(assess(indicator.id, withField(range.max + step)).status).not.toBe('ok')
        }
      })
    })
  }
})

describe('direction', () => {
  it('needs at least 6 readings', () => {
    expect(direction([1, 2, 3, 4, 5], 1)).toBeNull()
  })

  it('compares the last 3 readings with the first 3', () => {
    expect(direction([60, 61, 62, 70, 71, 72], 5)).toBe('up')
    expect(direction([72, 71, 70, 62, 61, 60], 5)).toBe('down')
    expect(direction([60, 62, 61, 63, 62, 64], 5)).toBe('steady')
  })
})
