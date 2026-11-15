import { describe, expect, it } from 'vitest'
import { CAREER_LIMIT_MSV, DOSE_RATE } from '../data/radiation'
import { LOCATIONS } from '../data/locations'
import { assessCareer, assessRate, DAY_MS, estimateDose, measuredRate } from './radiation'

const NOW = Date.UTC(2026, 10, 14)

describe('dose rates (NASA NTRS 20250006168)', () => {
  it('has a rate for every location and solar condition', () => {
    for (const l of LOCATIONS) {
      expect(DOSE_RATE[l.id].max).toBeGreaterThan(0)
      expect(DOSE_RATE[l.id].min).toBeGreaterThan(DOSE_RATE[l.id].max)
    }
  })

  it('is highest in deep space and lowest in Earth orbit', () => {
    expect(DOSE_RATE.transit.min).toBeGreaterThan(DOSE_RATE.moon.min)
    expect(DOSE_RATE.orbit.min).toBeLessThanOrEqual(DOSE_RATE.mars.min)
  })
})

describe('estimateDose', () => {
  const base = { now: NOW, location: 'orbit' as const, solar: 'min' as const, priorMSv: 0, logs: [] }

  it('returns null with no mission start and no dosimeter reading', () => {
    expect(estimateDose({ ...base, missionStart: null })).toBeNull()
  })

  it('multiplies the expected rate by the mission days', () => {
    const e = estimateDose({ ...base, missionStart: NOW - 100 * DAY_MS })!
    expect(e.missionMSv).toBeCloseTo(50)
    expect(e.basis).toBe('estimate')
  })

  it('starts from the latest dosimeter reading when there is one', () => {
    const e = estimateDose({
      ...base,
      missionStart: NOW - 100 * DAY_MS,
      logs: [
        { at: NOW - 20 * DAY_MS, mSv: 30 },
        { at: NOW - 10 * DAY_MS, mSv: 40 },
      ],
    })!
    expect(e.missionMSv).toBeCloseTo(45)
    expect(e.basis).toBe('dosimeter')
  })

  it('adds the prior career dose and counts days to the limit', () => {
    const e = estimateDose({ ...base, missionStart: NOW, priorMSv: 300 })!
    expect(e.careerMSv).toBe(300)
    expect(e.daysToLimit).toBeCloseTo((CAREER_LIMIT_MSV - 300) / 0.5)
  })
})

describe('measuredRate', () => {
  it('needs two readings at least half a day apart', () => {
    expect(measuredRate([{ at: NOW, mSv: 1 }])).toBeNull()
    expect(measuredRate([{ at: NOW, mSv: 1 }, { at: NOW + DAY_MS / 4, mSv: 2 }])).toBeNull()
  })

  it('uses the two latest readings, in any order', () => {
    const logs = [
      { at: NOW + 7 * DAY_MS, mSv: 5.5 },
      { at: NOW, mSv: 0 },
      { at: NOW + 2 * DAY_MS, mSv: 1.5 },
    ]
    expect(measuredRate(logs)).toBeCloseTo(0.8)
  })
})

describe('assessCareer (600 mSv NASA-STD-3001)', () => {
  it.each([
    [0, 'ok', false],
    [299, 'ok', false],
    [300, 'watch', false],
    [480, 'alert', true],
    [600, 'alert', true],
  ])('%d mSv -> %s', (mSv, status, escalate) => {
    const a = assessCareer(mSv)
    expect(a.status).toBe(status)
    expect(a.escalate).toBe(escalate)
  })
})

describe('assessRate', () => {
  it('flags rates above the expected range for the location', () => {
    expect(assessRate(0.4, 'orbit').status).toBe('ok')
    expect(assessRate(0.7, 'orbit').status).toBe('watch')
    expect(assessRate(1.2, 'orbit').status).toBe('alert')
    expect(assessRate(1.2, 'transit').status).toBe('ok')
  })
})
