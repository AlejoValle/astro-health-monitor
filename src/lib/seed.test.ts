import { describe, expect, it } from 'vitest'
import { EXERCISE_PLANS, planMinutes } from '../data/exercise'
import { computeAlerts } from './alerts'
import { baselineOf, toSummary } from './mindChecks'
import { assessReaction } from './reaction'
import { simulatedActivity, simulatedMission } from './seed'

describe('simulated mission', () => {
  // The demo should always have a story for the early warnings to find, at any hour.
  it.each([1, 9, 15, 23])('shows fatigue, sleep and exercise warnings at %i:00', (hour) => {
    const now = new Date(2026, 10, 15, hour).getTime()
    const readings = simulatedMission(now)
    const { workouts, checks } = simulatedActivity(now)
    const reactions = checks.filter((c) => c.kind === 'reaction').sort((a, b) => a.at - b.at)
    const last = reactions.at(-1)!
    const alerts = computeAlerts({
      readings,
      workouts,
      exerciseTarget: planMinutes(EXERCISE_PLANS.orbit),
      reaction: {
        status: assessReaction(toSummary({ ...last, id: 0 }), baselineOf(reactions.slice(0, -1).map((c) => ({ ...c, id: 0 })))).status,
        at: last.at,
      },
      now,
    })
    const ids = alerts.map((a) => a.id)
    expect(ids).toContain('pattern-fatigue')
    expect(ids).toContain('pattern-exercise')
    expect(ids.some((id) => id.includes('sleep'))).toBe(true)
    expect(alerts.length).toBeLessThanOrEqual(8)
  })
})
