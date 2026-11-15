import { describe, expect, it } from 'vitest'
import { FULL_DAY_BONUS, PATCHES, RANKS, ROUTINE } from '../data/routine'
import type { IndicatorId } from '../data/indicators'
import {
  creditedDays,
  DAY_MS,
  missionDay,
  nextUp,
  progress,
  slotOf,
  startOfDay,
  todayStatus,
  type RoutineRecords,
} from './routine'

/** 14 November 2026 at a given local hour. */
const at = (hour: number, dayOffset = 0) => new Date(2026, 10, 14 + dayOffset, hour, 0, 0).getTime()

const empty = (): RoutineRecords => ({ readings: [], checks: [], workouts: [], doses: [] })
const reading = (indicatorId: IndicatorId, ts: number, value = 70) => ({ indicatorId, at: ts, values: [value] })

/** A day with every daily task done. */
function fullDay(r: RoutineRecords, dayOffset: number) {
  for (const id of ['sleep', 'hr', 'bp', 'mood'] as IndicatorId[]) r.readings.push(reading(id, at(8, dayOffset), 8))
  r.workouts.push({ at: at(12, dayOffset) })
}

describe('slots', () => {
  it('maps the hour of day to a slot', () => {
    expect(slotOf(at(7))).toBe('morning')
    expect(slotOf(at(13))).toBe('midday')
    expect(slotOf(at(21))).toBe('evening')
    expect(slotOf(at(3))).toBeNull()
  })
})

describe('todayStatus', () => {
  it('marks tasks in the current slot as due and earlier ones as missed', () => {
    const s = todayStatus(empty(), at(13))
    expect(s.find((x) => x.task.id === 'exercise')!.state).toBe('due')
    expect(s.find((x) => x.task.id === 'bp')!.state).toBe('missed')
    expect(s.find((x) => x.task.id === 'mood')!.state).toBe('upcoming')
  })

  it('credits a task from a real record made today', () => {
    const r = empty()
    r.readings.push(reading('bp', at(8)))
    const bp = todayStatus(r, at(9)).find((x) => x.task.id === 'bp')!
    expect(bp.state).toBe('done')
    expect(bp.doneAt).toBe(at(8))
  })

  it('counts a record made later in the current minute', () => {
    const r = empty()
    r.readings.push(reading('bp', at(9) + 30_000))
    expect(todayStatus(r, at(9)).find((x) => x.task.id === 'bp')!.state).toBe('done')
  })

  it('does not count yesterday for a daily task', () => {
    const r = empty()
    r.readings.push(reading('bp', at(8, -1)))
    expect(todayStatus(r, at(9)).find((x) => x.task.id === 'bp')!.state).toBe('due')
  })

  it('keeps a task due every 3 days done inside its window', () => {
    const r = empty()
    r.readings.push(reading('glucose', at(7, -2)))
    const g = todayStatus(r, at(9)).find((x) => x.task.id === 'glucose')!
    expect(g.state).toBe('done')
    expect(g.nextInDays).toBe(1)
  })

  it('suggests the due task first', () => {
    const r = empty()
    r.readings.push(reading('sleep', at(6)))
    expect(nextUp(todayStatus(r, at(9)))!.task.id).toBe('hr')
  })
})

describe('creditedDays', () => {
  it('credits a task due every 7 days at most once a week', () => {
    const task = ROUTINE.find((t) => t.id === 'reaction')!
    const r = empty()
    for (let d = 0; d < 10; d++) r.checks.push({ kind: 'reaction', at: at(20, -d) })
    expect(creditedDays(task, r)).toHaveLength(2)
  })
})

describe('progress', () => {
  it('adds task points and a bonus for full days', () => {
    const r = empty()
    fullDay(r, 0)
    const p = progress(r, at(22))
    expect(p.xp).toBe(5 * 10 + FULL_DAY_BONUS)
    expect(p.streak).toBe(1)
  })

  it('keeps yesterday’s streak while today is still in progress', () => {
    const r = empty()
    for (let d = -3; d <= -1; d++) fullDay(r, d)
    expect(progress(r, at(9)).streak).toBe(3)
  })

  it('breaks the streak after a missed day', () => {
    const r = empty()
    fullDay(r, -3)
    fullDay(r, -1)
    const p = progress(r, at(9))
    expect(p.streak).toBe(1)
    expect(p.bestStreak).toBe(1)
  })

  it('ranks up with points', () => {
    const r = empty()
    for (let d = -9; d <= 0; d++) fullDay(r, d)
    const p = progress(r, at(22))
    expect(p.xp).toBe(10 * (50 + FULL_DAY_BONUS))
    expect(p.rank.name).toBe(RANKS[2].name)
    expect(p.rank.next?.name).toBe(RANKS[3].name)
  })

  it('unlocks patches from records', () => {
    const r = empty()
    for (let d = -6; d <= 0; d++) fullDay(r, d)
    const p = progress(r, at(22))
    const byId = Object.fromEntries(p.patches.map((x) => [x.id, x]))
    expect(byId['first-contact'].unlocked).toBe(true)
    expect(byId['week-streak'].unlocked).toBe(true)
    expect(byId['well-rested'].unlocked).toBe(true)
    expect(byId['iron-crew'].progress).toBe(7)
    expect(byId['iron-crew'].unlocked).toBe(false)
    expect(byId['full-panel'].unlocked).toBe(false)
    expect(p.patches).toHaveLength(PATCHES.length)
  })
})

describe('missionDay', () => {
  it('counts from day 1', () => {
    expect(missionDay(null, at(9))).toBeNull()
    expect(missionDay(at(23, -1), at(1))).toBe(2)
    expect(missionDay(startOfDay(at(9)) - 13 * DAY_MS, at(9))).toBe(14)
  })
})
