import type { Status } from './rules'

/**
 * Plain-text health report for the flight surgeon. Always in English, the working language of
 * the ground team, so it reads the same whatever language the crew member uses in the app.
 */
export interface ReportInput {
  generatedAt: number
  location: { name: string; gravity: string; contact: string }
  missionDay: number | null
  vitals: { name: string; value: string; unit: string; label: string; status: Status; at: number }[]
  alerts: { status: Status; title: string; detail: string }[]
  radiation?: { missionMSv: number; careerMSv: number; limit: number; label: string }
  exercise?: { averageMin: number; targetMin: number; label: string }
  stress?: { score: number; max: number; label: string; at: number }
  reaction?: { ms: number; label: string; at: number }
  routine: { streak: number; doneToday: number; totalToday: number; rank: string }
  note: string
  simulated: boolean
}

const WORD: Record<Status, string> = { ok: 'OK', watch: 'WATCH', alert: 'ACT' }

const pad = (n: number) => String(n).padStart(2, '0')

/** Local date and time as YYYY-MM-DD HH:MM. */
export function stamp(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function buildReport(r: ReportInput): string {
  const lines: string[] = []
  const section = (title: string) => lines.push('', title)

  lines.push('TETHER HEALTH REPORT')
  lines.push(`Generated: ${stamp(r.generatedAt)}`)
  lines.push(`Location: ${r.location.name} (${r.location.gravity}). Contact: ${r.location.contact}.`)
  if (r.missionDay !== null) lines.push(`Mission day: ${r.missionDay}`)
  if (r.simulated) lines.push('NOTE: includes simulated demo data.')

  section('NEEDS ATTENTION')
  if (r.alerts.length === 0) lines.push('- No early warnings.')
  for (const a of r.alerts) lines.push(`- [${WORD[a.status]}] ${a.title}. ${a.detail}`)

  section('LATEST VITALS')
  if (r.vitals.length === 0) lines.push('- No readings yet.')
  for (const v of r.vitals)
    lines.push(`- ${v.name}: ${v.value} ${v.unit} [${WORD[v.status]}: ${v.label}] at ${stamp(v.at)}`)

  if (r.radiation) {
    const share = Math.round((r.radiation.careerMSv / r.radiation.limit) * 100)
    section('RADIATION')
    lines.push(
      `- This mission: ${r.radiation.missionMSv.toFixed(1)} mSv. Career: ${Math.round(r.radiation.careerMSv)} of ${r.radiation.limit} mSv (${share}%). ${r.radiation.label}.`,
    )
  }

  if (r.exercise) {
    section('EXERCISE')
    lines.push(
      `- Last days: ${Math.round(r.exercise.averageMin)} min a day of ${r.exercise.targetMin} planned. ${r.exercise.label}.`,
    )
  }

  if (r.stress || r.reaction) {
    section('MIND')
    if (r.stress) lines.push(`- Stress check: ${r.stress.score}/${r.stress.max} (${r.stress.label}) at ${stamp(r.stress.at)}`)
    if (r.reaction) lines.push(`- Reaction test: ${r.reaction.ms} ms median (${r.reaction.label}) at ${stamp(r.reaction.at)}`)
  }

  section('ROUTINE')
  lines.push(
    `- Streak: ${r.routine.streak} days. Today: ${r.routine.doneToday} of ${r.routine.totalToday} daily tasks. Rank: ${r.routine.rank}.`,
  )

  section('CREW NOTE')
  lines.push(r.note.trim() || 'None.')

  lines.push('', 'Self-care guidance from Tether, not a diagnosis. Rules and sources are listed in the app.')
  return lines.join('\n')
}
