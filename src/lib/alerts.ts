import { indicatorById, type IndicatorId } from '../data/indicators'
import type { Vars } from '../i18n'
import { msg } from '../i18n/msg'
import { assessExercise, exerciseSummary } from './exerciseStatus'
import { assess, type Status } from './rules'
import { MIN_CHANGE, OK_RANGES } from './trends'

// Early warnings computed from the crew member's own history. Every rule is deterministic and
// explained in its text. Thresholds are this app's triage choices, built on the clinical ranges.

const DAY = 24 * 60 * 60 * 1000

export type AlertKind = 'pattern' | 'streak' | 'projection' | 'trend'

export interface HealthAlert {
  id: string
  kind: AlertKind
  status: Exclude<Status, 'ok'>
  /** English text, translated where shown. String `vars` are translation keys too. */
  title: string
  detail: string
  vars: Vars
  /** What the alert is about, as translation keys (indicator short names or 'Exercise'). */
  topics: string[]
  actions: string[]
  escalate: boolean
  /** Recent values and a projection, for a small chart. */
  series?: { values: number[]; projected: number[]; limit: number }
}

export interface AlertInput {
  readings: { indicatorId: IndicatorId; at: number; values: number[] }[]
  workouts: { at: number; minutes: number }[]
  exerciseTarget: number
  /** Latest reaction test, rated against the crew member's baseline. */
  reaction?: { status: Status; at: number }
  now: number
}

/** Which direction is worse for each indicator's main number. */
export const WORSE: Record<IndicatorId, 1 | -1> = { hr: 1, bp: 1, glucose: 1, temp: 1, sleep: -1, mood: -1 }

const ACTIONS: Record<IndicatorId, string[]> = {
  hr: [msg('Measure at rest at the same time each morning.'), msg('Note any dizziness, palpitations or chest discomfort.')],
  bp: [msg('Measure at the same time each morning after 5 minutes of rest.'), msg('Keep your exercise routine.')],
  glucose: [msg('Review your meals and measure again tomorrow fasting.')],
  temp: [msg('Measure your temperature again in 2 hours.')],
  sleep: [
    msg('Keep a fixed sleep window, same time every day.'),
    msg('Dim the lights an hour before sleep and play a calming sound.'),
  ],
  mood: [msg('Talk with a crewmate or ask for a private call with the ground team.'), msg('Do the stress check in Mind.')],
}

const PHYSICAL: IndicatorId[] = ['hr', 'bp', 'glucose', 'temp']

const dayStart = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const previousDay = (day: number) => dayStart(day - DAY / 2)
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

interface Day {
  day: number
  values: number[]
}

/** The last reading of each day over the last 14 days, oldest first. */
export function dailySeries(readings: AlertInput['readings'], id: IndicatorId, now: number): Day[] {
  const from = dayStart(now) - 13 * DAY
  const byDay = new Map<number, Day>()
  for (const r of [...readings].sort((a, b) => a.at - b.at)) {
    if (r.indicatorId !== id || r.at < from) continue
    const day = dayStart(r.at)
    byDay.set(day, { day, values: r.values })
  }
  return [...byDay.values()].sort((a, b) => a.day - b.day)
}

/** Consecutive most recent days out of the OK range, ending today or yesterday. */
export function outOfRangeStreak(days: Day[], id: IndicatorId, now: number): number {
  const last = days.at(-1)
  if (!last || last.day < previousDay(dayStart(now))) return 0
  let n = 0
  let expected = last.day
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].day !== expected || assess(id, days[i].values).status === 'ok') break
    n++
    expected = previousDay(expected)
  }
  return n
}

/** How much worse the last 3 days are than the up to 7 before them, in the indicator's units. */
export function worsening(days: Day[], id: IndicatorId): { change: number; pct: number } | null {
  if (days.length < 6) return null
  const values = days.map((d) => d.values[0])
  const recent = mean(values.slice(-3))
  const before = mean(values.slice(-10, -3))
  const change = (recent - before) * WORSE[id]
  return { change, pct: before ? Math.round((Math.abs(recent - before) / Math.abs(before)) * 100) : 0 }
}

/** Least-squares slope per day of the main number over the last up to 10 days. */
function slopePerDay(days: Day[]): number {
  const pts = days.slice(-10).map((d) => ({ x: d.day / DAY, y: d.values[0] }))
  const mx = mean(pts.map((p) => p.x))
  const my = mean(pts.map((p) => p.y))
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  return den ? num / den : 0
}

/** Days until the main number leaves the OK range at the current pace, if within 7 days. */
export function projection(days: Day[], id: IndicatorId): { days: number; limit: number; slope: number } | null {
  if (days.length < 5) return null
  const last = days.at(-1)!
  if (assess(id, last.values).status !== 'ok') return null
  const slope = slopePerDay(days)
  if (slope * WORSE[id] <= 0) return null
  const range = OK_RANGES[id][0]
  const limit = WORSE[id] === 1 ? range.max : range.min
  if (limit === undefined) return null
  const d = (limit - last.values[0]) / slope
  return d > 0 && d <= 7 ? { days: Math.max(1, Math.ceil(d)), limit, slope } : null
}

const ORDER: Record<AlertKind, number> = { pattern: 0, streak: 1, projection: 2, trend: 3 }

export function computeAlerts(input: AlertInput): HealthAlert[] {
  const { readings, now } = input
  const alerts: HealthAlert[] = []
  const series = Object.fromEntries(
    (['hr', 'bp', 'glucose', 'temp', 'sleep', 'mood'] as IndicatorId[]).map((id) => [id, dailySeries(readings, id, now)]),
  ) as Record<IndicatorId, Day[]>
  // A pattern combines signals that are each too small to warn about alone, so each one only
  // needs to reach part of its trend threshold. That is what makes the combination useful.
  const PATTERN_SHARE = 0.6
  const worse = (id: IndicatorId) => {
    const w = worsening(series[id], id)
    const lastTwo = series[id].slice(-2)
    return (
      (w !== null && w.change >= MIN_CHANGE[id] * PATTERN_SHARE) ||
      (lastTwo.length === 2 && lastTwo.every((d) => assess(id, d.values).status !== 'ok'))
    )
  }

  // Per indicator: a streak out of range, else a projection, else a trend.
  for (const id of Object.keys(series) as IndicatorId[]) {
    const days = series[id]
    const name = indicatorById(id).short
    const streak = outOfRangeStreak(days, id, now)
    if (streak >= 3) {
      const escalate = streak >= 7 && PHYSICAL.includes(id)
      alerts.push({
        id: `streak-${id}`,
        kind: 'streak',
        status: streak >= 7 ? 'alert' : 'watch',
        title: msg('{name} out of range {n} days in a row'),
        detail: msg('Each of the last {n} daily readings was outside the OK range.'),
        vars: { name, n: streak },
        topics: [name],
        actions: escalate ? [...ACTIONS[id], msg('Report it to the flight surgeon.')] : ACTIONS[id],
        escalate,
      })
      continue
    }
    const p = projection(days, id)
    if (p) {
      const values = days.slice(-10).map((d) => d.values[0])
      const last = values.at(-1)!
      alerts.push({
        id: `projection-${id}`,
        kind: 'projection',
        status: 'watch',
        title: msg('{name} may leave its OK range'),
        detail: msg('If this trend continues, it passes {limit} {unit} in about {d} days.'),
        vars: { name, limit: p.limit, unit: indicatorById(id).unit, d: p.days },
        topics: [name],
        actions: ACTIONS[id],
        escalate: false,
        series: { values, projected: Array.from({ length: p.days }, (_, i) => last + p.slope * (i + 1)), limit: p.limit },
      })
      continue
    }
    const w = worsening(days, id)
    if (w && w.change >= MIN_CHANGE[id]) {
      alerts.push({
        id: `trend-${id}`,
        kind: 'trend',
        status: 'watch',
        title: msg('{name} is getting worse'),
        detail: msg('Your last 3 days average {pct}% worse than the days before.'),
        vars: { name, pct: w.pct },
        topics: [name],
        actions: ACTIONS[id],
        escalate: false,
      })
    }
  }

  // Patterns across indicators.
  if (worse('sleep') && worse('mood')) {
    const hr = worsening(series.hr, 'hr')
    const hrUp = hr !== null && hr.change >= MIN_CHANGE.hr * PATTERN_SHARE
    alerts.push({
      id: 'pattern-fatigue',
      kind: 'pattern',
      status: hrUp ? 'alert' : 'watch',
      title: msg('Possible accumulated fatigue or stress'),
      detail: hrUp
        ? msg('Sleep and mood are falling while your resting heart rate rises. This pattern can mean accumulated fatigue or stress.')
        : msg('Sleep and mood are both falling. This pattern can mean accumulated fatigue or stress.'),
      vars: {},
      topics: hrUp ? ['Sleep', 'Mood', 'Heart rate'] : ['Sleep', 'Mood'],
      actions: [
        msg('Keep a fixed sleep window, same time every day.'),
        msg('Talk with a crewmate or ask for a private call with the ground team.'),
        msg('Take the reaction test in Mind to check your alertness.'),
      ],
      escalate: false,
    })
  }

  const temp = series.temp.at(-1)
  const hrDays = series.hr
  if (temp && temp.day >= previousDay(dayStart(now)) && temp.values[0] >= 37.3 && temp.values[0] < 38) {
    const earlierTemp = series.temp.slice(-8, -1).map((d) => d.values[0])
    const earlierHr = hrDays.slice(-8, -1).map((d) => d.values[0])
    const tempRise = earlierTemp.length ? temp.values[0] - mean(earlierTemp) : 0
    const hrRise = earlierHr.length && hrDays.length ? hrDays.at(-1)!.values[0] - mean(earlierHr) : 0
    if (tempRise >= 0.4 && hrRise >= 8)
      alerts.push({
        id: 'pattern-infection',
        kind: 'pattern',
        status: 'watch',
        title: msg('Possible early infection'),
        detail: msg('Your temperature is rising toward a fever while your resting heart rate is up.'),
        vars: {},
        topics: ['Temperature', 'Heart rate'],
        actions: [msg('Measure your temperature again in 2 hours.'), msg('Rest, drink fluids and wash your hands often.')],
        escalate: false,
      })
  }

  const nights = series.sleep.filter((d) => d.day >= dayStart(now) - 6 * DAY)
  if (nights.length >= 3) {
    const debt = nights.reduce((sum, d) => sum + Math.max(0, 7 - d.values[0]), 0)
    if (debt >= 5)
      alerts.push({
        id: 'pattern-sleep-debt',
        kind: 'pattern',
        status: debt >= 10 ? 'alert' : 'watch',
        title: msg('Sleep debt is building up'),
        detail: msg('You are about {h} hours short of sleep over the last 7 nights.'),
        vars: { h: Math.round(debt * 2) / 2 },
        topics: ['Sleep'],
        actions: [
          msg('Plan an earlier sleep period tonight.'),
          msg('Dim the lights an hour before sleep and play a calming sound.'),
        ],
        escalate: false,
      })
  }

  const exercise = exerciseSummary(input.workouts, input.exerciseTarget, now)
  if (exercise && exercise.perDay.length >= 3) {
    const below = exercise.perDay.filter((m) => m < input.exerciseTarget * 0.8).length
    if (below / exercise.perDay.length >= 0.7)
      alerts.push({
        id: 'pattern-exercise',
        kind: 'pattern',
        // Same severity as the exercise status on the body map and in the report.
        status: assessExercise(exercise.share).status === 'alert' ? 'alert' : 'watch',
        title: msg('Exercise below target'),
        detail: msg('Below 80% of the daily plan on {n} of the last {total} days. Bones and muscles need daily load.'),
        vars: { n: below, total: exercise.perDay.length },
        topics: ['Exercise'],
        actions: [msg('Do the resistance session first today and log every session.'), msg('Add a 20-minute treadmill or cycle block.')],
        escalate: false,
      })
  }

  const lastSleep = series.sleep.at(-1)
  if (
    input.reaction &&
    input.reaction.status !== 'ok' &&
    input.reaction.at >= now - 3 * DAY &&
    lastSleep &&
    lastSleep.day >= previousDay(dayStart(now)) &&
    lastSleep.values[0] < 7
  )
    alerts.push({
      id: 'pattern-reaction-sleep',
      kind: 'pattern',
      status: 'watch',
      title: msg('Fatigue may be slowing you down'),
      detail: msg('Your last reaction test was slower than usual and you slept less than 7 hours.'),
      vars: {},
      topics: ['Reaction test', 'Sleep'],
      actions: [msg('Avoid critical tasks if you can.'), msg('Plan an earlier sleep period tonight.')],
      escalate: false,
    })

  return alerts.sort((a, b) => (a.status === b.status ? ORDER[a.kind] - ORDER[b.kind] : a.status === 'alert' ? -1 : 1))
}
