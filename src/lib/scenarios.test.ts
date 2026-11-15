import { describe, expect, it } from 'vitest'
import { EXERCISE_PLANS, planMinutes } from '../data/exercise'
import { SCENARIOS } from '../data/scenarios'
import { assessStress } from '../data/stressCheck'
import { computeAlerts } from './alerts'
import { baselineOf, toSummary } from './mindChecks'
import { assessCareer, assessRate, estimateDose, measuredRate } from './radiation'
import { assessReaction } from './reaction'

const NOW = new Date(2026, 10, 15, 10).getTime()
const byId = (id: string) => SCENARIOS.find((s) => s.id === id)!

function run(id: string) {
  const s = byId(id)
  const data = s.build(NOW)
  const reactions = data.checks.filter((c) => c.kind === 'reaction').map((c, i) => ({ ...c, id: i })).sort((a, b) => a.at - b.at)
  const last = reactions.at(-1)
  const alerts = computeAlerts({
    readings: data.readings,
    workouts: data.workouts,
    exerciseTarget: planMinutes(EXERCISE_PLANS[s.location]),
    reaction: last && { status: assessReaction(toSummary(last), baselineOf(reactions.slice(0, -1))).status, at: last.at },
    now: NOW,
  })
  return { s, data, alerts, ids: alerts.map((a) => a.id) }
}

describe('use-case scenarios', () => {
  it.each(SCENARIOS.map((s) => s.id))('%s triggers the warnings it promises', (id) => {
    const { s, ids } = run(id)
    for (const expected of s.expectAlerts) expect(ids).toContain(expected)
  })

  it('keeps the healthy crew member free of warnings', () => {
    expect(run('healthy').ids).toEqual([])
  })

  it('raises the blood pressure streak to Act with a call to the flight surgeon', () => {
    const a = run('pressure').alerts.find((x) => x.id === 'streak-bp')!
    expect(a.status).toBe('alert')
    expect(a.escalate).toBe(true)
  })

  it('puts the low-mood crew member at High strain', () => {
    const last = run('lowmood').data.checks.filter((c) => c.kind === 'stress').at(-1)!
    expect(assessStress(last.score).status).toBe('alert')
  })

  it('shows the solar storm jump as far above the expected rate', () => {
    const { s, data } = run('radiation')
    const rate = measuredRate(data.doses)!
    expect(assessRate(rate, s.location).status).toBe('alert')
    const dose = estimateDose({ now: NOW, location: s.location, solar: 'max', missionStart: NOW - s.missionDays * 86_400_000, priorMSv: s.priorDoseMSv, logs: data.doses })!
    expect(assessCareer(dose.careerMSv).status).toBe('watch')
  })
})
