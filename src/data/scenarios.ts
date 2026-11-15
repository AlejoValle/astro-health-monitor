import type { IndicatorId } from './indicators'
import type { LocationId } from './locations'
import type { RoleId } from '../lib/profiles'

// Use cases: demo crew members whose last 14 days tell a story, to show how Tether reacts to
// different conditions. All data is simulated and labelled as such.

export type ScenarioId = 'healthy' | 'infection' | 'lowmood' | 'sleep' | 'pressure' | 'radiation' | 'deconditioning'

export interface ScenarioData {
  readings: { indicatorId: IndicatorId; at: number; values: number[]; origin: 'simulated' }[]
  checks: { kind: 'stress' | 'reaction'; at: number; score: number; lapses?: number; falseStarts?: number; responses?: number; origin: 'simulated' }[]
  workouts: { at: number; locationId: LocationId; blockId: string; minutes: number; origin: 'simulated' }[]
  doses: { at: number; mSv: number; origin: 'simulated' }[]
}

export interface Scenario {
  id: ScenarioId
  /** The demo crew member's name and role. */
  person: string
  role: RoleId
  /** Short name of the case. */
  title: string
  /** What is happening to this crew member, in one or two sentences. */
  story: string
  /** How Tether reacts, as a list a judge can check on screen. */
  reactions: string[]
  location: LocationId
  missionDays: number
  priorDoseMSv: number
  /** Alert ids the data must trigger; checked by a test. */
  expectAlerts: string[]
  build: (now: number) => ScenarioData
}

const DAY = 24 * 60 * 60 * 1000
const DAYS = 14

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Daily = Partial<Record<IndicatorId, (p: number, j: (spread: number) => number) => number[]>>

/** One reading per indicator per morning for 14 days; `p` goes from 0 (first day) to 1 (today). */
function days(now: number, seed: number, daily: Daily): ScenarioData['readings'] {
  const r = rng(seed)
  const j = (spread: number) => (r() - 0.5) * 2 * spread
  const out: ScenarioData['readings'] = []
  for (let d = DAYS - 1; d >= 0; d--) {
    const at = now - d * DAY - 60 * 60 * 1000
    const p = (DAYS - 1 - d) / (DAYS - 1)
    for (const [id, fn] of Object.entries(daily) as [IndicatorId, NonNullable<Daily[IndicatorId]>][]) {
      out.push({ indicatorId: id, at, values: fn(p, j), origin: 'simulated' })
    }
  }
  return out
}

const round = (v: number, step = 1) => Math.round(v / step) * step
const clampMood = (v: number) => Math.max(1, Math.min(5, Math.round(v)))

/** Workouts on most days, `minutes(d)` for d days ago. */
function workouts(now: number, location: LocationId, minutes: (d: number) => number): ScenarioData['workouts'] {
  const out: ScenarioData['workouts'] = []
  for (let d = DAYS - 1; d >= 1; d--) {
    if (d % 6 === 4) continue
    out.push({ at: now - d * DAY, locationId: location, blockId: 'resistance', minutes: Math.round(minutes(d)), origin: 'simulated' })
  }
  return out
}

const steadyVitals: Daily = {
  hr: (_, j) => [round(64 + j(3))],
  bp: (_, j) => [round(114 + j(3)), round(73 + j(2))],
  glucose: (_, j) => [round(88 + j(4))],
  temp: (_, j) => [round(36.6 + j(0.2), 0.1)],
  sleep: (_, j) => [round(7.6 + j(0.3), 0.5)],
  mood: (_, j) => [clampMood(4.3 + j(0.4))],
}

const stress = (now: number, scores: number[]): ScenarioData['checks'] =>
  scores.map((score, i) => ({ kind: 'stress', at: now - (scores.length - i) * 3 * DAY + DAY, score, origin: 'simulated' }))

const reaction = (now: number, ms: number[], lapses: number[]): ScenarioData['checks'] =>
  ms.map((m, i) => ({
    kind: 'reaction',
    at: now - (ms.length - 1 - i) * 4 * DAY - 2 * 60 * 60 * 1000,
    score: m,
    lapses: lapses[i],
    falseStarts: 0,
    responses: 60,
    origin: 'simulated',
  }))

export const SCENARIOS: Scenario[] = [
  {
    id: 'healthy',
    person: 'Dr. Ana Ortiz',
    role: 'specialist',
    title: 'Steady and well',
    story: 'Two weeks into a station mission, with steady vitals, good sleep and daily exercise.',
    reactions: [
      'Home says All clear and every vital is near her baseline.',
      'No early warnings and no master caution.',
      'A long streak, a high rank and most mission patches.',
    ],
    location: 'orbit',
    missionDays: 14,
    priorDoseMSv: 40,
    expectAlerts: [],
    build: (now) => ({
      readings: days(now, 1, steadyVitals),
      checks: [...stress(now, [2, 3, 2, 2]), ...reaction(now, [282, 279, 285, 280], [0, 1, 0, 0])],
      workouts: workouts(now, 'orbit', () => 125),
      doses: [0, 5, 10].map((k, i) => ({ at: now - (DAYS - k * 1.3) * DAY, mSv: round(i * 2.4, 0.1), origin: 'simulated' as const })),
    }),
  },
  {
    id: 'infection',
    person: 'Lt. Kai Moreno',
    role: 'engineer',
    title: 'Early infection',
    story: 'For two days his temperature has crept up toward a fever while his resting pulse rises.',
    reactions: [
      'A Possible early infection warning before he reaches a fever.',
      'Heart rate flagged as getting worse.',
      'Advice to rest, drink fluids, wash hands and measure again in 2 hours.',
      'The symptom guide (Whole body) and the report for the flight surgeon carry it forward.',
    ],
    location: 'orbit',
    missionDays: 30,
    priorDoseMSv: 60,
    expectAlerts: ['pattern-infection'],
    build: (now) => ({
      readings: days(now, 2, {
        ...steadyVitals,
        temp: (p, j) => [round(p > 0.84 ? 37.4 + (p - 0.84) * 3 : 36.6 + j(0.15), 0.1)],
        hr: (p, j) => [round(p > 0.7 ? 66 + (p - 0.7) * 60 : 65 + j(2))],
        mood: (p, j) => [clampMood(4 - p * 0.8 + j(0.3))],
      }),
      checks: stress(now, [3, 3, 4, 5]),
      workouts: workouts(now, 'orbit', (d) => (d <= 2 ? 40 : 110)),
      doses: [],
    }),
  },
  {
    id: 'lowmood',
    person: 'Cmdr. Lena Vogel',
    role: 'pilot',
    title: 'Isolation and low mood',
    story: 'Months into a Mars transit, her mood has slid day by day and the stress check keeps rising.',
    reactions: [
      'Mood and sleep out of range day after day, plus a fatigue or stress pattern.',
      'Stress check at High strain, so the Isolation hazard turns red.',
      'Advice to talk with a crewmate and ask for a private call with the ground team.',
      'The breathing exercise and calming sounds are one tap away.',
    ],
    location: 'transit',
    missionDays: 120,
    priorDoseMSv: 150,
    expectAlerts: ['streak-mood'],
    build: (now) => ({
      readings: days(now, 3, {
        ...steadyVitals,
        mood: (p, j) => [clampMood(4.4 - p * 3.2 + j(0.2))],
        sleep: (p, j) => [round(7.4 - p * 0.9 + j(0.25), 0.5)],
      }),
      checks: stress(now, [4, 7, 10, 12]),
      workouts: workouts(now, 'transit', () => 70),
      doses: [],
    }),
  },
  {
    id: 'sleep',
    person: 'Cmdr. Raj Patel',
    role: 'commander',
    title: 'Sleep deprivation',
    story: 'A busy week of operations: five hours of sleep a night, and his last reaction test was slow.',
    reactions: [
      'Sleep out of range 7 days in a row, raised to Act.',
      'A Sleep debt warning that counts the hours he is short.',
      'Fatigue may be slowing you down: slow reactions plus short sleep.',
      'Advice to avoid critical tasks and plan an earlier sleep period.',
    ],
    location: 'moon',
    missionDays: 20,
    priorDoseMSv: 80,
    expectAlerts: ['streak-sleep', 'pattern-sleep-debt', 'pattern-reaction-sleep'],
    build: (now) => ({
      readings: days(now, 4, {
        ...steadyVitals,
        sleep: (p, j) => [round(p < 0.5 ? 7.4 + j(0.3) : 5.2 + j(0.3), 0.5)],
        mood: (p, j) => [clampMood(4.2 - p * 0.9 + j(0.3))],
      }),
      checks: reaction(now, [281, 286, 290, 352], [0, 1, 1, 12]),
      workouts: workouts(now, 'moon', () => 90),
      doses: [],
    }),
  },
  {
    id: 'pressure',
    person: 'Sgt. Mia Torres',
    role: 'engineer',
    title: 'Rising blood pressure',
    story: 'Her blood pressure has been climbing for two weeks and has stayed high for more than a week.',
    reactions: [
      'Blood pressure out of range 7 days or more, raised to Act.',
      'A master caution and a banner to contact the flight surgeon.',
      'The heart on the body map and the Gravity hazard turn red.',
      'The report for the flight surgeon lists the readings and warnings.',
    ],
    location: 'orbit',
    missionDays: 60,
    priorDoseMSv: 90,
    expectAlerts: ['streak-bp'],
    build: (now) => ({
      readings: days(now, 5, {
        ...steadyVitals,
        bp: (p, j) => [round(118 + p * 28 + j(2)), round(76 + p * 14 + j(2))],
        hr: (p, j) => [round(70 + p * 6 + j(2))],
      }),
      checks: [],
      workouts: workouts(now, 'orbit', () => 115),
      doses: [],
    }),
  },
  {
    id: 'radiation',
    person: 'Dr. Yuki Tanaka',
    role: 'medical',
    title: 'Solar storm exposure',
    story: 'On a Mars transit, her dosimeter jumped after a solar storm, on top of a long career in orbit.',
    reactions: [
      'Radiation rate Far above expected, with advice to go to the storm shelter.',
      'Career dose over half of the 600 mSv NASA limit.',
      'The Radiation hazard turns red and the storm steps are one tap away.',
    ],
    location: 'transit',
    missionDays: 90,
    priorDoseMSv: 260,
    expectAlerts: [],
    build: (now) => ({
      readings: days(now, 6, steadyVitals),
      checks: [],
      workouts: workouts(now, 'transit', () => 75),
      doses: [
        { at: now - 13 * DAY, mSv: 72, origin: 'simulated' },
        { at: now - 6 * DAY, mSv: 79, origin: 'simulated' },
        { at: now - 2 * DAY, mSv: 83, origin: 'simulated' },
        { at: now - 2 * 60 * 60 * 1000, mSv: 91, origin: 'simulated' },
      ],
    }),
  },
  {
    id: 'deconditioning',
    person: 'Lt. Omar Haddad',
    role: 'specialist',
    title: 'Skipping exercise',
    story: 'On the Mars surface, his exercise sessions have shrunk to a few minutes a day.',
    reactions: [
      'Exercise far below the plan, raised to Act.',
      'Bones and muscles turn red on the body map.',
      'Advice to do the resistance session first and log every session.',
    ],
    location: 'mars',
    missionDays: 45,
    priorDoseMSv: 120,
    expectAlerts: ['pattern-exercise'],
    build: (now) => ({
      readings: days(now, 7, steadyVitals),
      checks: [],
      workouts: workouts(now, 'mars', (d) => (d > 9 ? 60 : 12)),
      doses: [],
    }),
  },
]
