import { msg } from '../i18n/msg'
import { median } from './bluetooth'
import type { Intake } from './db'
import type { Assessment } from './rules'

// Water, meals and body mass. NASA's Twins Study saw a 7% loss of body mass on a year-long mission
// with about 30% fewer calories eaten than expected, so eating less than planned is worth a warning.
// The targets and thresholds below are this app's choices.

const DAY = 24 * 60 * 60 * 1000

/** Daily water target, in mL. */
export const WATER_TARGET_ML = 2000
/** Planned meals a day. */
export const MEALS_PER_DAY = 3

const dayStart = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

type Entry = Pick<Intake, 'kind' | 'amount' | 'at'>

export function today(intake: Entry[], now: number) {
  const from = dayStart(now)
  const list = intake.filter((x) => x.at >= from)
  const water = list.filter((x) => x.kind === 'water').reduce((s, x) => s + x.amount, 0)
  const meals = list.filter((x) => x.kind === 'meal')
  return { water, meals: meals.length, eaten: meals.reduce((s, x) => s + x.amount, 0) }
}

/** Share of planned meals eaten per day, over the last 3 days with any meal logged before today. */
export function recentMealShare(intake: Entry[], now: number): number | null {
  const byDay = new Map<number, number>()
  for (const x of intake) {
    if (x.kind !== 'meal' || x.at >= dayStart(now) || x.at < dayStart(now) - 7 * DAY) continue
    const d = dayStart(x.at)
    byDay.set(d, (byDay.get(d) ?? 0) + x.amount)
  }
  const days = [...byDay.entries()].sort((a, b) => b[0] - a[0]).slice(0, 3)
  if (days.length < 2) return null
  return days.reduce((s, [, v]) => s + Math.min(1, v / MEALS_PER_DAY), 0) / days.length
}

/** Change of the latest body mass from the median of the first readings, as a share. */
export function massChange(intake: Entry[]): { latest: number; baseline: number; change: number } | null {
  const mass = intake.filter((x) => x.kind === 'mass').sort((a, b) => a.at - b.at)
  if (mass.length < 2) return null
  const baseline = median(mass.slice(0, Math.min(3, mass.length - 1)).map((x) => x.amount))
  const latest = mass.at(-1)!.amount
  return { latest, baseline, change: (latest - baseline) / baseline }
}

export function assessMeals(share: number): Assessment {
  if (share < 0.5)
    return { status: 'alert', label: msg('Eating far less than planned'), advice: msg('Tell the flight surgeon and plan meals you like. Losing weight weakens muscles and bones.'), escalate: true }
  if (share < 0.75)
    return { status: 'watch', label: msg('Eating less than planned'), advice: msg('Try smaller, more frequent meals and keep snacks you like close by.'), escalate: false }
  return { status: 'ok', label: msg('Eating as planned'), advice: msg('Keep it up.'), escalate: false }
}

export function assessMass(change: number): Assessment {
  if (change <= -0.05)
    return { status: 'alert', label: msg('Losing body mass'), advice: msg('More than 5% below your start. Tell the flight surgeon and review meals and exercise.'), escalate: true }
  if (change <= -0.03)
    return { status: 'watch', label: msg('Body mass going down'), advice: msg('More than 3% below your start. Eat your planned meals and weigh again next week.'), escalate: false }
  return { status: 'ok', label: msg('Body mass steady'), advice: msg('Weigh again next week.'), escalate: false }
}
