import { msg } from '../i18n/msg'

// Rewards drawn from the routine. The garden is inspired by NASA's Veggie plant chamber on the
// ISS; the journey turns full days into distance. Both are this app's design.

const DAY = 24 * 60 * 60 * 1000
const dayStart = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const back = (day: number, n: number) => dayStart(day - n * DAY + DAY / 2)

export const PLANT_STAGES = [msg('Seed'), msg('Sprout'), msg('Seedling'), msg('Leafy'), msg('Ready to harvest')]

export interface Plant {
  /** 0 seed to 4 ready to harvest. */
  stage: number
  /** Full days in the last 10, which make it grow. */
  growth: number
  /** True when neither of the last two days was full: the plant needs care. */
  wilting: boolean
}

export function plantState(fullDays: Set<number>, now: number): Plant {
  const today = dayStart(now)
  let growth = 0
  for (let i = 0; i < 10; i++) if (fullDays.has(back(today, i))) growth++
  const stage = growth === 0 ? 0 : growth <= 2 ? 1 : growth <= 5 ? 2 : growth <= 8 ? 3 : 4
  const wilting = growth > 0 && !fullDays.has(back(today, 1)) && !fullDays.has(back(today, 2)) && !fullDays.has(today)
  return { stage, growth, wilting }
}

export const JOURNEY = [
  { name: msg('Earth'), at: 0 },
  { name: msg('Moon'), at: 5 },
  { name: msg('Mars'), at: 20 },
  { name: msg('Jupiter'), at: 45 },
] as const

export interface Journey {
  fullDays: number
  /** 0 to 1 along the whole route. */
  progress: number
  /** The next stop, or undefined at the end of the route. */
  next?: (typeof JOURNEY)[number]
  reached: (typeof JOURNEY)[number]
}

export function journey(fullDays: number): Journey {
  const last = JOURNEY[JOURNEY.length - 1]
  const reached = [...JOURNEY].reverse().find((s) => fullDays >= s.at)!
  const next = JOURNEY.find((s) => s.at > fullDays)
  return { fullDays, progress: Math.min(1, fullDays / last.at), next, reached }
}
