import { Check, Copy, Download, FileText, Share2 } from 'lucide-react'
import { useState } from 'react'
import { EXERCISE_PLANS, planMinutes } from '../data/exercise'
import { INDICATORS } from '../data/indicators'
import { locationById } from '../data/locations'
import { CAREER_LIMIT_MSV } from '../data/radiation'
import { STRESS_MAX, assessStress } from '../data/stressCheck'
import { translate, useT } from '../i18n'
import { assessExercise, exerciseSummary } from '../lib/exerciseStatus'
import { baselineOf, toSummary } from '../lib/mindChecks'
import { assessReaction } from '../lib/reaction'
import { buildReport, stamp, type ReportInput } from '../lib/report'
import { missionDay } from '../lib/routine'
import { assess, formatValue } from '../lib/rules'
import { useSettings } from '../lib/store'
import { useAlerts } from '../lib/useAlerts'
import { useLatest } from '../lib/useLatest'
import { useRadiation } from '../lib/useRadiation'
import { useNow, useRecords } from '../lib/useRecords'
import { useRoutine } from '../lib/useRoutine'
import { profileKey } from '../lib/profiles'
import { isCoreDaily } from '../data/routine'

const NOTE_KEY = profileKey('astrovitals-report-note')

const readNote = () => {
  try {
    return localStorage.getItem(NOTE_KEY) ?? ''
  } catch {
    return ''
  }
}

// The report is always in English for the ground team.
const en = (text: string, vars?: Record<string, string | number>) => translate('en', text, vars)

/** Gathers everything the report needs; `undefined` while loading. */
function useReportInput(note: string): ReportInput | undefined {
  const latest = useLatest()
  const alerts = useAlerts()
  const radiation = useRadiation()
  const routine = useRoutine()
  const records = useRecords()
  const now = useNow()
  const { locationId, missionStart } = useSettings()
  if (!latest || !alerts || !radiation || !routine || !records) return undefined

  const location = locationById(locationId)
  const stress = records.checks.filter((c) => c.kind === 'stress').sort((a, b) => a.at - b.at).at(-1)
  const reactions = records.checks.filter((c) => c.kind === 'reaction').sort((a, b) => a.at - b.at)
  const reaction = reactions.at(-1)
  const target = planMinutes(EXERCISE_PLANS[locationId])
  const exercise = exerciseSummary(records.workouts, target, now)
  const daily = routine.statuses.filter((s) => isCoreDaily(s.task))

  return {
    generatedAt: now,
    location: { name: location.name, gravity: location.gravity, contact: location.contactLabel },
    missionDay: missionDay(missionStart, now),
    vitals: INDICATORS.flatMap((i) => {
      const r = latest[i.id]
      if (!r) return []
      const a = assess(i.id, r.values)
      return [{ name: i.name, value: formatValue(i.id, r.values), unit: i.unit, label: a.label, status: a.status, at: r.at }]
    }),
    alerts: alerts.map((a) => ({ status: a.status, title: en(a.title, a.vars), detail: en(a.detail, a.vars) })),
    radiation: radiation.estimate
      ? {
          missionMSv: radiation.estimate.missionMSv,
          careerMSv: radiation.estimate.careerMSv,
          limit: CAREER_LIMIT_MSV,
          label: radiation.overall?.label ?? '',
        }
      : undefined,
    exercise: exercise
      ? { averageMin: exercise.average, targetMin: target, label: assessExercise(exercise.share).label }
      : undefined,
    stress: stress && { score: stress.score, max: STRESS_MAX, label: assessStress(stress.score).label, at: stress.at },
    reaction: reaction && {
      ms: reaction.score,
      label: assessReaction(toSummary(reaction), baselineOf(reactions.slice(0, -1))).label,
      at: reaction.at,
    },
    routine: {
      streak: routine.progress.streak,
      doneToday: daily.filter((s) => s.state === 'done').length,
      totalToday: daily.length,
      rank: routine.progress.rank.name,
    },
    note,
    simulated: records.simulated,
  }
}

export function Report() {
  const t = useT()
  const [note, setNote] = useState(readNote)
  const [done, setDone] = useState<string | null>(null)
  const input = useReportInput(note)
  const location = locationById(useSettings((s) => s.locationId))
  if (!input) return null
  const text = buildReport(input)

  const flash = (what: string) => {
    setDone(what)
    window.setTimeout(() => setDone(null), 2000)
  }
  const saveNote = (value: string) => {
    setNote(value)
    try {
      localStorage.setItem(NOTE_KEY, value)
    } catch {
      // The note then lasts for this visit only.
    }
  }
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    flash('copy')
  }
  const share = async () => {
    try {
      await navigator.share({ title: 'Tether health report', text })
      flash('share')
    } catch {
      // Closing the share sheet is not an error.
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `tether-report-${stamp(input.generatedAt).replace(/[ :]/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    flash('download')
  }
  const canShare = typeof navigator.share === 'function'

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Report')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Report for the flight surgeon')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {location.contact === 'delayed'
            ? t('Contact is delayed here. Send the whole picture in one message so the ground team can answer in one go.')
            : t('Everything the ground team needs in one message: vitals, warnings, radiation, exercise and your note.')}
        </p>
      </div>

      <section className="panel rounded-3xl p-5">
        <label htmlFor="report-note" className="label">
          {t('Your note (optional)')}
        </label>
        <textarea
          id="report-note"
          value={note}
          maxLength={400}
          onChange={(e) => saveNote(e.target.value)}
          placeholder={t('Symptoms, how you feel, what you already did…')}
          className="panel mt-2 min-h-24 w-full rounded-2xl p-3 text-base outline-none focus:border-accent/60"
        />
        <p className="mt-1 text-right text-xs text-ink-faint">{note.length}/400</p>
      </section>

      <div className={`grid gap-3 ${canShare ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <ActionButton onClick={() => void copy()} icon={done === 'copy' ? Check : Copy} label={done === 'copy' ? t('Copied') : t('Copy')} />
        {canShare && (
          <ActionButton onClick={() => void share()} icon={done === 'share' ? Check : Share2} label={t('Share')} />
        )}
        <ActionButton
          onClick={download}
          icon={done === 'download' ? Check : Download}
          label={done === 'download' ? t('Saved') : t('Download')}
        />
      </div>

      <section className="panel rounded-3xl p-5">
        <h2 className="label flex items-center gap-2">
          <FileText size={14} aria-hidden />
          {t('Preview')}
        </h2>
        <p className="mt-1 text-xs text-ink-faint">{t('The report is in English so the ground team can read it.')}</p>
        <pre
          lang="en"
          className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 font-mono text-xs leading-relaxed text-ink-dim"
        >
          {text}
        </pre>
      </section>
    </div>
  )
}

function ActionButton({ onClick, icon: Icon, label }: { onClick: () => void; icon: typeof Copy; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-ink text-sm font-semibold text-space"
    >
      <Icon size={18} aria-hidden />
      {label}
    </button>
  )
}
