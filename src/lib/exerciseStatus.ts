import { msg } from '../i18n/msg'
import type { Assessment } from './rules'

const DAY = 24 * 60 * 60 * 1000

const dayStart = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export interface ExerciseSummary {
  /** Minutes per day for each counted day, oldest first. */
  perDay: number[]
  /** Average minutes per counted day. */
  average: number
  /** Average as a share of the daily plan. */
  share: number
}

/**
 * Exercise over the last 7 full days, counting only days since the first logged workout so a
 * new crew member is not penalised for days before they started. Today counts only when it is
 * the first day. Null when nothing has been logged.
 */
export function exerciseSummary(
  workouts: { at: number; minutes: number }[],
  targetMinutes: number,
  now: number,
): ExerciseSummary | null {
  if (workouts.length === 0 || targetMinutes <= 0) return null
  const today = dayStart(now)
  const first = dayStart(Math.min(...workouts.map((w) => w.at)))
  const days: number[] = []
  for (let i = 7; i >= 1; i--) {
    const d = dayStart(today - i * DAY + DAY / 2)
    if (d >= first) days.push(d)
  }
  if (days.length === 0) days.push(today)
  const perDay = days.map((d) =>
    workouts.filter((w) => dayStart(w.at) === d).reduce((sum, w) => sum + w.minutes, 0),
  )
  const average = perDay.reduce((a, b) => a + b, 0) / perDay.length
  return { perDay, average, share: average / targetMinutes }
}

// Bands are this app's choice: 80% of the plan keeps loading close to what crews do on the ISS.
export function assessExercise(share: number): Assessment {
  if (share >= 0.8)
    return { status: 'ok', label: msg('On target'), advice: msg('Keep your daily sessions.'), escalate: false }
  if (share >= 0.4)
    return {
      status: 'watch',
      label: msg('Below target'),
      advice: msg('Add a resistance session today. Bones and muscles need daily load.'),
      escalate: false,
    }
  return {
    status: 'alert',
    label: msg('Far below target'),
    advice: msg('Do the resistance session first today and log every session.'),
    escalate: false,
  }
}
