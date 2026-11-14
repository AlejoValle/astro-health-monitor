import type { LocationId } from './locations'

// The facts in `why` and `note` come from the cited NASA pages. The block lengths and the
// step wording are this app's suggestion, not a NASA prescription, and the screen says so.

export type BlockKind = 'resistance' | 'run' | 'cycle' | 'intervals' | 'balance'

export interface ExerciseBlock {
  id: string
  kind: BlockKind
  name: string
  minutes: number
  steps: string[]
  why: string
}

export interface ExercisePlan {
  note: string
  blocks: ExerciseBlock[]
  sourceIds: string[]
}

const surfacePlan = (place: string, weight: string): ExercisePlan => ({
  note: `How much exercise the body needs on ${place} is still being studied. Use this plan as a starting point.`,
  blocks: [
    {
      id: 'resistance',
      kind: 'resistance',
      name: 'Resistance',
      minutes: 30,
      steps: ['Squats', 'Deadlifts or pulls', 'Heel raises', 'Presses'],
      why: `Here your body carries ${weight} of its Earth weight, so bones and muscles get less load than they are built for.`,
    },
    {
      id: 'aerobic',
      kind: 'run',
      name: 'Walk or run',
      minutes: 30,
      steps: ['Warm up at an easy pace', 'Hold a steady effort', 'Cool down at an easy pace'],
      why: 'Long missions lower aerobic capacity, which you need for surface work.',
    },
    {
      id: 'balance',
      kind: 'balance',
      name: 'Balance',
      minutes: 10,
      steps: ['Stand on one leg next to a handhold', 'Switch legs', 'Walk heel to toe in a straight line'],
      why: 'Moving from one gravity level to another affects balance, coordination and walking.',
    },
  ],
  sourceIds: ['nasa-exercise', 'nasa-bone-muscle', 'hrp-hazards'],
})

export const EXERCISE_PLANS: Record<LocationId, ExercisePlan> = {
  orbit: {
    note: 'Space station crews average two hours of exercise a day on a resistance device, a treadmill and a cycle.',
    blocks: [
      {
        id: 'resistance',
        kind: 'resistance',
        name: 'Resistance device',
        minutes: 60,
        steps: ['Squats', 'Deadlifts', 'Heel raises', 'Presses'],
        why: 'Without gravity, weight-bearing bones lose about 1% of their density each month unless you load them.',
      },
      {
        id: 'treadmill',
        kind: 'run',
        name: 'Treadmill with harness',
        minutes: 30,
        steps: ['Clip the harness so it pulls you onto the belt', 'Warm up walking', 'Run at a steady effort'],
        why: 'The harness adds a gravity-like force, so your legs and bones take impact again.',
      },
      {
        id: 'cycle',
        kind: 'cycle',
        name: 'Cycle',
        minutes: 30,
        steps: ['Strap your feet in', 'Pedal at a steady effort', 'Finish with an easy spin'],
        why: 'Long stays in space lower aerobic capacity. Cycling helps keep your heart and lungs fit.',
      },
    ],
    sourceIds: ['nasa-exercise', 'nasa-bone-muscle'],
  },
  transit: {
    note: 'A deep space vehicle may carry a single compact exercise device, so sessions are shorter and harder.',
    blocks: [
      {
        id: 'intervals',
        kind: 'intervals',
        name: 'Hard intervals',
        minutes: 30,
        steps: ['Warm up at an easy effort', 'Alternate a hard effort with an easy recovery', 'Cool down'],
        why: "In NASA's Sprint study, shorter and harder workouts gave results similar to longer ones and saved crew time.",
      },
      {
        id: 'resistance',
        kind: 'resistance',
        name: 'Resistance',
        minutes: 30,
        steps: ['Squats', 'Deadlifts or pulls', 'Heel raises', 'Presses'],
        why: 'Without gravity, weight-bearing bones lose about 1% of their density each month unless you load them.',
      },
    ],
    sourceIds: ['nasa-exercise', 'nasa-bone-muscle'],
  },
  moon: surfacePlan('the Moon', 'one sixth'),
  mars: surfacePlan('Mars', 'three eighths'),
}

export const planMinutes = (plan: ExercisePlan) => plan.blocks.reduce((sum, b) => sum + b.minutes, 0)

export function startOfDay(now: number) {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

/** Minutes logged per block. */
export function minutesByBlock(workouts: { blockId: string; minutes: number }[]) {
  const out: Record<string, number> = {}
  for (const w of workouts) out[w.blockId] = (out[w.blockId] ?? 0) + w.minutes
  return out
}
