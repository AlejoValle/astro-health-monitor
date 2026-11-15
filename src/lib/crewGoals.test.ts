import { describe, expect, it } from 'vitest'
import { questionOfDay, TRIVIA, triviaSourcesExist } from '../data/trivia'
import { CREW_MINUTES_EACH, crewGoals } from './crewGoals'

describe('crewGoals', () => {
  const m = (id: string, sleep: boolean, min: number, mind: boolean) => ({ profileId: id, sleepLogged: sleep, exerciseMin: min, mindThisWeek: mind })

  it('completes a per-member goal only when everyone has done it', () => {
    const goals = crewGoals([m('a', true, 30, true), m('b', false, 90, true)])
    expect(goals.find((g) => g.id === 'sleep')).toMatchObject({ done: ['a'], complete: false })
    expect(goals.find((g) => g.id === 'mind')!.complete).toBe(true)
  })

  it('adds exercise minutes across the crew', () => {
    const g = crewGoals([m('a', true, 70, false), m('b', true, 60, false)]).find((x) => x.id === 'exercise')!
    expect(g.value).toBe(130)
    expect(g.target).toBe(2 * CREW_MINUTES_EACH)
    expect(g.complete).toBe(true)
  })
})

describe('daily quiz', () => {
  it('cites a known source for every question and has a valid answer', () => {
    expect(triviaSourcesExist()).toBe(true)
    for (const q of TRIVIA) expect(q.answer).toBeLessThan(q.options.length)
  })

  it('keeps the same question all day and changes the next day', () => {
    const a = questionOfDay(new Date(2026, 10, 15, 8).getTime())
    expect(questionOfDay(new Date(2026, 10, 15, 22).getTime())).toBe(a)
    expect(questionOfDay(new Date(2026, 10, 16, 8).getTime())).toBe((a + 1) % TRIVIA.length)
  })
})
