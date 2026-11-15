import { describe, expect, it } from 'vitest'
import { compareToBaseline, personalBaseline } from './baseline'

const DAY = 86_400_000
const r = (values: number[], day: number) => ({ indicatorId: 'bp' as const, at: day * DAY, values })

describe('personalBaseline', () => {
  it('needs 3 readings', () => {
    expect(personalBaseline([r([120, 80], 1), r([118, 78], 2)], 'bp', null)).toBeNull()
  })

  it('uses readings before the mission start when there are some', () => {
    const b = personalBaseline([r([110, 70], 1), r([114, 72], 2), r([130, 85], 5), r([132, 86], 6)], 'bp', 3 * DAY)!
    expect(b.source).toBe('preflight')
    expect(b.values).toEqual([112, 71])
  })

  it('falls back to the median of the first 3 readings', () => {
    const b = personalBaseline([r([116, 74], 3), r([110, 70], 1), r([112, 76], 2), r([140, 90], 4)], 'bp', null)!
    expect(b.source).toBe('early')
    expect(b.values).toEqual([112, 74])
  })
})

describe('compareToBaseline', () => {
  const base = { values: [112, 74], source: 'early' as const, count: 3 }
  it('says how far and which way the main number moved', () => {
    expect(compareToBaseline('bp', [126, 80], base)).toEqual({ delta: 14, notable: true, worse: true })
    expect(compareToBaseline('bp', [114, 80], base)).toEqual({ delta: 2, notable: false, worse: true })
  })

  it('treats lower as worse for sleep', () => {
    expect(compareToBaseline('sleep', [6], { values: [7.5], source: 'early', count: 3 }).worse).toBe(true)
  })
})
