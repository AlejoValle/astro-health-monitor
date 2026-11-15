import type { CheckKind } from '../lib/db'
import type { IndicatorId } from './indicators'

// The routine, points, ranks and patches are this app's design, not a NASA schedule.
// Tasks are credited automatically from real records, so they cannot be ticked without doing them.

export type Slot = 'morning' | 'midday' | 'evening'

/** Local hours each slot covers: [start, end). */
export const SLOT_HOURS: Record<Slot, [number, number]> = {
  morning: [5, 11],
  midday: [11, 17],
  evening: [17, 24],
}

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning check',
  midday: 'Midday',
  evening: 'Evening',
}

/** What record completes a task. */
export type TaskTarget =
  | { kind: 'reading'; indicator: IndicatorId }
  | { kind: 'check'; check: CheckKind | CheckKind[] }
  | { kind: 'workout' }
  | { kind: 'dose' }

export interface RoutineTask {
  id: string
  label: string
  /** One short line on why it is in the routine. */
  why: string
  slot: Slot
  /** 1 for daily; otherwise the task is due once every N days. */
  everyDays: number
  target: TaskTarget
  to: string
  xp: number
  /** Bonus tasks earn points but do not count toward a full day. */
  bonus?: boolean
}

/** A daily task that counts toward a full day and the streak. */
export const isCoreDaily = (t: RoutineTask) => t.everyDays === 1 && !t.bonus

export const ROUTINE: RoutineTask[] = [
  {
    id: 'sleep',
    label: 'Log last night’s sleep',
    why: 'Sleep loss builds up quietly in a noisy habitat.',
    slot: 'morning',
    everyDays: 1,
    target: { kind: 'reading', indicator: 'sleep' },
    to: '/measure?i=sleep',
    xp: 10,
  },
  {
    id: 'hr',
    label: 'Resting heart rate',
    why: 'Best measured before you get moving.',
    slot: 'morning',
    everyDays: 1,
    target: { kind: 'reading', indicator: 'hr' },
    to: '/measure?i=hr',
    xp: 10,
  },
  {
    id: 'bp',
    label: 'Blood pressure',
    why: 'Fluid shifts in low gravity change it day to day.',
    slot: 'morning',
    everyDays: 1,
    target: { kind: 'reading', indicator: 'bp' },
    to: '/measure?i=bp',
    xp: 10,
  },
  {
    id: 'glucose',
    label: 'Fasting glucose',
    why: 'Every 3 days, before breakfast.',
    slot: 'morning',
    everyDays: 3,
    target: { kind: 'reading', indicator: 'glucose' },
    to: '/measure?i=glucose',
    xp: 20,
  },
  {
    id: 'exercise',
    label: 'Exercise session',
    why: 'Protects bone, muscle and heart in low gravity.',
    slot: 'midday',
    everyDays: 1,
    target: { kind: 'workout' },
    to: '/exercise',
    xp: 10,
  },
  {
    id: 'mood',
    label: 'Mood check-in',
    why: 'Small changes are easier to catch early.',
    slot: 'evening',
    everyDays: 1,
    target: { kind: 'reading', indicator: 'mood' },
    to: '/measure?i=mood',
    xp: 10,
  },
  {
    id: 'stress',
    label: 'Stress check',
    why: 'Every 3 days, four quick questions.',
    slot: 'evening',
    everyDays: 3,
    target: { kind: 'check', check: 'stress' },
    to: '/mind?v=stress',
    xp: 20,
  },
  {
    id: 'reaction',
    label: 'Reaction test',
    why: 'Once a week, to track alertness against your own baseline.',
    slot: 'evening',
    everyDays: 7,
    target: { kind: 'check', check: 'reaction' },
    to: '/mind?v=reaction',
    xp: 30,
  },
  {
    id: 'quiz',
    label: 'Daily space quiz',
    why: 'One question a day about health in space. A bonus.',
    slot: 'midday',
    everyDays: 1,
    bonus: true,
    target: { kind: 'check', check: 'quiz' },
    to: '/games?g=quiz',
    xp: 5,
  },
  {
    id: 'brain',
    label: 'Brain game',
    why: 'Every 2 days, to track memory and speed against your own baseline.',
    slot: 'evening',
    everyDays: 2,
    target: { kind: 'check', check: ['nback', 'dsst'] },
    to: '/games',
    xp: 20,
  },
  {
    id: 'dose',
    label: 'Log your dosimeter',
    why: 'Once a week keeps your radiation total honest.',
    slot: 'evening',
    everyDays: 7,
    target: { kind: 'dose' },
    to: '/radiation',
    xp: 30,
  },
]

/** Bonus for a day where at least this share of the daily tasks is done. */
export const FULL_DAY_SHARE = 0.8
export const FULL_DAY_BONUS = 25

export const RANKS = [
  { name: 'Cadet', xp: 0 },
  { name: 'Crew member', xp: 200 },
  { name: 'Flight engineer', xp: 600 },
  { name: 'Mission specialist', xp: 1200 },
  { name: 'Commander', xp: 2000 },
] as const

export type PatchId =
  | 'first-contact'
  | 'full-panel'
  | 'week-streak'
  | 'iron-crew'
  | 'sharp-mind'
  | 'dose-keeper'
  | 'well-rested'
  | 'steady-nerves'

export interface Patch {
  id: PatchId
  name: string
  goal: string
  target: number
  /** Hue of the patch ring. */
  color: string
}

export const PATCHES: Patch[] = [
  { id: 'first-contact', name: 'First Contact', goal: 'Log your first measurement', target: 1, color: '#7dd3fc' },
  { id: 'full-panel', name: 'Full Panel', goal: 'Log all six vitals in one day', target: 1, color: '#a78bfa' },
  { id: 'week-streak', name: 'Seven Sunrises', goal: 'Keep a 7-day streak', target: 7, color: '#fbbf24' },
  { id: 'iron-crew', name: 'Iron Crew', goal: 'Log 10 exercise sessions', target: 10, color: '#f87171' },
  { id: 'sharp-mind', name: 'Sharp Mind', goal: 'Take 3 reaction tests', target: 3, color: '#34d399' },
  { id: 'dose-keeper', name: 'Dose Keeper', goal: 'Log your dosimeter 4 times', target: 4, color: '#fb923c' },
  { id: 'well-rested', name: 'Well Rested', goal: 'Sleep 7 hours or more on 7 nights', target: 7, color: '#818cf8' },
  { id: 'steady-nerves', name: 'Steady Nerves', goal: 'Do 5 stress checks', target: 5, color: '#2dd4bf' },
]
