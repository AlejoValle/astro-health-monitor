import {
  FULL_DAY_BONUS,
  FULL_DAY_SHARE,
  PATCHES,
  RANKS,
  ROUTINE,
  SLOT_HOURS,
  type PatchId,
  type RoutineTask,
  type Slot,
  type TaskTarget,
} from '../data/routine'
import { INDICATORS, type IndicatorId } from '../data/indicators'

export const DAY_MS = 24 * 60 * 60 * 1000

/** The records the routine is credited from. */
export interface RoutineRecords {
  readings: { indicatorId: IndicatorId; at: number; values: number[] }[]
  checks: { kind: 'stress' | 'reaction'; at: number }[]
  workouts: { at: number }[]
  doses: { at: number }[]
}

export const startOfDay = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Calendar days between two day starts, robust to daylight saving changes. */
const daysBetween = (a: number, b: number) => Math.round((b - a) / DAY_MS)

function timesFor(target: TaskTarget, r: RoutineRecords): number[] {
  switch (target.kind) {
    case 'reading':
      return r.readings.filter((x) => x.indicatorId === target.indicator).map((x) => x.at)
    case 'check':
      return r.checks.filter((x) => x.kind === target.check).map((x) => x.at)
    case 'workout':
      return r.workouts.map((x) => x.at)
    case 'dose':
      return r.doses.map((x) => x.at)
  }
}

export const slotOf = (ts: number): Slot | null => {
  const h = new Date(ts).getHours()
  for (const [slot, [from, to]] of Object.entries(SLOT_HOURS) as [Slot, [number, number]][]) {
    if (h >= from && h < to) return slot
  }
  return null
}

/**
 * Days on which a task earned points. A daily task earns on every day it was done.
 * A task due every N days earns at most once per N days, so repeating it does not farm points.
 */
export function creditedDays(task: RoutineTask, r: RoutineRecords): number[] {
  const days = [...new Set(timesFor(task.target, r).map(startOfDay))].sort((a, b) => a - b)
  if (task.everyDays === 1) return days
  const out: number[] = []
  for (const d of days) {
    const last = out.at(-1)
    if (last === undefined || daysBetween(last, d) >= task.everyDays) out.push(d)
  }
  return out
}

export type TaskState = 'done' | 'due' | 'missed' | 'upcoming'

export interface TaskStatus {
  task: RoutineTask
  state: TaskState
  /** When it was last done, if within its window. */
  doneAt?: number
  /** For tasks due every N days that are done: days until due again. */
  nextInDays?: number
}

/** Where each task of the routine stands right now. */
export function todayStatus(r: RoutineRecords, now: number, tasks = ROUTINE): TaskStatus[] {
  const today = startOfDay(now)
  const slot = slotOf(now)
  const order: Slot[] = ['morning', 'midday', 'evening']
  const slotIndex = slot ? order.indexOf(slot) : new Date(now).getHours() < SLOT_HOURS.morning[0] ? -1 : 3

  return tasks.map((task) => {
    const windowStart = today - (task.everyDays - 1) * DAY_MS
    // No upper bound: `now` is rounded to the minute, and a record from this very minute must count.
    const last = Math.max(-Infinity, ...timesFor(task.target, r).filter((t) => t >= windowStart))
    if (Number.isFinite(last)) {
      const nextInDays = task.everyDays > 1 ? task.everyDays - daysBetween(startOfDay(last), today) : undefined
      return { task, state: 'done', doneAt: last, nextInDays }
    }
    const taskIndex = order.indexOf(task.slot)
    const state: TaskState = taskIndex === slotIndex ? 'due' : taskIndex < slotIndex ? 'missed' : 'upcoming'
    return { task, state }
  })
}

/** The task to suggest next: due now, then missed earlier today, then the next one coming. */
export function nextUp(statuses: TaskStatus[]): TaskStatus | undefined {
  return (
    statuses.find((s) => s.state === 'due') ??
    statuses.find((s) => s.state === 'missed') ??
    statuses.find((s) => s.state === 'upcoming')
  )
}

export interface Progress {
  xp: number
  /** Days in a row with a full day (FULL_DAY_SHARE of daily tasks), counting today once it is full. */
  streak: number
  bestStreak: number
  fullDays: Set<number>
  rank: { name: string; xp: number; next?: { name: string; xp: number } }
  patches: { id: PatchId; progress: number; unlocked: boolean }[]
}

export function progress(r: RoutineRecords, now: number, tasks = ROUTINE): Progress {
  const today = startOfDay(now)
  const daily = tasks.filter((t) => t.everyDays === 1)

  let xp = 0
  const doneCount = new Map<number, number>()
  for (const task of tasks) {
    const days = creditedDays(task, r).filter((d) => d <= today)
    xp += days.length * task.xp
    if (task.everyDays === 1) for (const d of days) doneCount.set(d, (doneCount.get(d) ?? 0) + 1)
  }
  const fullDays = new Set([...doneCount].filter(([, n]) => n >= daily.length * FULL_DAY_SHARE).map(([d]) => d))
  xp += fullDays.size * FULL_DAY_BONUS

  // Current streak: today counts once it is full; otherwise the run ending yesterday still stands.
  let streak = 0
  let day = fullDays.has(today) ? today : today - DAY_MS
  while (fullDays.has(startOfDay(day + DAY_MS / 2))) {
    streak++
    day -= DAY_MS
  }

  // Best streak over the whole history.
  let bestStreak = 0
  let run = 0
  let prev: number | undefined
  for (const d of [...fullDays].sort((a, b) => a - b)) {
    run = prev !== undefined && daysBetween(prev, d) === 1 ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    prev = d
  }

  const rankIndex = RANKS.reduce((acc, rk, i) => (xp >= rk.xp ? i : acc), 0)
  const rank = { ...RANKS[rankIndex], next: RANKS[rankIndex + 1] }

  return { xp, streak, bestStreak, fullDays, rank, patches: patchProgress(r, bestStreak) }
}

function patchProgress(r: RoutineRecords, bestStreak: number): Progress['patches'] {
  const vitalsByDay = new Map<number, Set<IndicatorId>>()
  for (const x of r.readings) {
    const d = startOfDay(x.at)
    const set = vitalsByDay.get(d) ?? new Set()
    set.add(x.indicatorId)
    vitalsByDay.set(d, set)
  }
  const fullPanel = [...vitalsByDay.values()].some((s) => s.size >= INDICATORS.length) ? 1 : 0
  const restedNights = new Set(
    r.readings.filter((x) => x.indicatorId === 'sleep' && x.values[0] >= 7).map((x) => startOfDay(x.at)),
  ).size

  const value: Record<PatchId, number> = {
    'first-contact': r.readings.length + r.checks.length + r.workouts.length + r.doses.length > 0 ? 1 : 0,
    'full-panel': fullPanel,
    'week-streak': bestStreak,
    'iron-crew': r.workouts.length,
    'sharp-mind': r.checks.filter((c) => c.kind === 'reaction').length,
    'dose-keeper': r.doses.length,
    'well-rested': restedNights,
    'steady-nerves': r.checks.filter((c) => c.kind === 'stress').length,
  }
  return PATCHES.map((p) => ({ id: p.id, progress: Math.min(p.target, value[p.id]), unlocked: value[p.id] >= p.target }))
}

/** Mission day number, from 1, or null without a mission start. */
export function missionDay(missionStart: number | null, now: number) {
  if (missionStart === null) return null
  return Math.max(1, daysBetween(startOfDay(missionStart), startOfDay(now)) + 1)
}
