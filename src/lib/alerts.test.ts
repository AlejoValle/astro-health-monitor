import { describe, expect, it } from 'vitest'
import type { IndicatorId } from '../data/indicators'
import { computeAlerts, dailySeries, outOfRangeStreak, projection, type AlertInput } from './alerts'

/** 15 November 2026 at a local hour, `dayOffset` days earlier or later. */
const at = (hour: number, dayOffset = 0) => new Date(2026, 10, 15 + dayOffset, hour).getTime()
const NOW = at(20)

type Reading = AlertInput['readings'][number]

/** One reading a day for the last `values.length` days, ending today. */
function daily(id: IndicatorId, values: number[][]): Reading[] {
  return values.map((v, i) => ({ indicatorId: id, at: at(8, i - values.length + 1), values: v }))
}

const input = (readings: Reading[], extra: Partial<AlertInput> = {}): AlertInput => ({
  readings,
  workouts: [],
  exerciseTarget: 120,
  now: NOW,
  ...extra,
})

const ids = (a: AlertInput) => computeAlerts(a).map((x) => x.id)

describe('daily series and streaks', () => {
  it('keeps the last reading of each day', () => {
    const r = [...daily('hr', [[70], [72]]), { indicatorId: 'hr' as const, at: at(19), values: [90] }]
    expect(dailySeries(r, 'hr', NOW).map((d) => d.values[0])).toEqual([70, 90])
  })

  it('counts consecutive days out of range, ending today or yesterday', () => {
    const days = dailySeries(daily('sleep', [[8], [6], [5.5], [6]]), 'sleep', NOW)
    expect(outOfRangeStreak(days, 'sleep', NOW)).toBe(3)
    expect(outOfRangeStreak(days, 'sleep', at(9, 3))).toBe(0)
  })
})

describe('computeAlerts', () => {
  it('stays quiet with steady, normal readings', () => {
    expect(ids(input(daily('hr', Array.from({ length: 10 }, () => [68]))))).toEqual([])
  })

  it('flags a streak and escalates physical ones after 7 days', () => {
    const bp = daily('bp', Array.from({ length: 7 }, () => [142, 85]))
    const a = computeAlerts(input(bp)).find((x) => x.id === 'streak-bp')!
    expect(a.status).toBe('alert')
    expect(a.escalate).toBe(true)
    expect(a.vars.n).toBe(7)
  })

  it('projects when a normal value is heading out of range within a week', () => {
    const bp = daily('bp', [[106, 70], [108, 70], [110, 72], [112, 72], [114, 74], [116, 74]])
    const days = dailySeries(bp, 'bp', NOW)
    expect(projection(days, 'bp')?.days).toBe(2)
    const a = computeAlerts(input(bp)).find((x) => x.id === 'projection-bp')!
    expect(a.series?.limit).toBe(119)
  })

  it('reports a worsening trend that is still far from the range limit', () => {
    const hr = daily('hr', [[60], [60], [60], [60], [66], [66], [66]])
    expect(ids(input(hr))).toEqual(['trend-hr'])
  })

  it('prefers a projection when the limit is near', () => {
    const mood = daily('mood', [[5], [5], [5], [5], [4], [4], [4]])
    expect(ids(input(mood))).toEqual(['projection-mood'])
  })

  it('finds fatigue when sleep and mood fall and heart rate rises', () => {
    const r = [
      ...daily('sleep', [[8], [8], [8], [7.5], [6.5], [6], [6]]),
      ...daily('mood', [[5], [5], [4], [4], [3], [3], [3]]),
      ...daily('hr', [[62], [62], [63], [63], [68], [70], [71]]),
    ]
    const a = computeAlerts(input(r)).find((x) => x.id === 'pattern-fatigue')!
    expect(a.status).toBe('alert')
    expect(a.topics).toContain('Heart rate')
  })

  it('adds up sleep debt over the last 7 nights', () => {
    const a = computeAlerts(input(daily('sleep', [[5], [5.5], [5], [6]]))).find((x) => x.id === 'pattern-sleep-debt')!
    expect(a.vars.h).toBe(6.5)
  })

  it('warns when exercise stays below the plan', () => {
    const workouts = Array.from({ length: 7 }, (_, i) => ({ at: at(12, -i - 1), minutes: 30 }))
    const a = computeAlerts(input([], { workouts })).find((x) => x.id === 'pattern-exercise')!
    expect(a.status).toBe('alert')
    expect(a.vars).toEqual({ n: 7, total: 7 })
  })

  it('links a slow reaction test with short sleep', () => {
    const r = daily('sleep', [[6]])
    expect(ids(input(r, { reaction: { status: 'watch', at: at(9) } }))).toContain('pattern-reaction-sleep')
    expect(ids(input(r, { reaction: { status: 'ok', at: at(9) } }))).not.toContain('pattern-reaction-sleep')
  })

  it('puts Act alerts first', () => {
    const r = [...daily('hr', [[60], [60], [60], [60], [66], [66], [66]]), ...daily('sleep', Array.from({ length: 7 }, () => [5]))]
    const statuses = computeAlerts(input(r)).map((a) => a.status)
    expect(statuses).toContain('watch')
    expect(statuses.indexOf('watch')).toBeGreaterThan(statuses.lastIndexOf('alert'))
  })
})
