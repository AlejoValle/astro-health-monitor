import { Check, ChevronLeft, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { INDICATOR_ICON } from '../components/IndicatorCard'
import { MoodPicker } from '../components/MoodPicker'
import { NumberField } from '../components/NumberField'
import { StatusIcon } from '../components/status'
import { indicatorById, type IndicatorId } from '../data/indicators'
import { useT } from '../i18n'
import { addReading, db } from '../lib/db'
import { parseField } from '../lib/fields'
import { assess } from '../lib/rules'
import { useLatest, type LatestByIndicator } from '../lib/useLatest'

/** The order a crew member goes through in the morning: how the night went first, then vitals. */
const ORDER: IndicatorId[] = ['sleep', 'mood', 'hr', 'temp', 'bp', 'glucose']

interface Row {
  texts: string[]
  /** Only rows the crew member confirms are saved, so a copied value is never logged by accident. */
  include: boolean
}

/** Every daily check on one screen, filled in with the last values so it takes about a minute. */
export function CheckIn() {
  const latest = useLatest()
  return latest ? <CheckInForm latest={latest} /> : null
}

function CheckInForm({ latest }: { latest: LatestByIndicator }) {
  const t = useT()
  const [rows, setRows] = useState<Record<IndicatorId, Row>>(
    () =>
      Object.fromEntries(
        ORDER.map((id) => {
          const last = latest[id]
          // Mood is never copied: it has to be today's answer.
          const texts = id === 'mood' || !last ? indicatorById(id).fields.map(() => '') : last.values.map(String)
          return [id, { texts, include: false }]
        }),
      ) as Record<IndicatorId, Row>,
  )
  const [saved, setSaved] = useState<{ id: IndicatorId; values: number[] }[] | null>(null)

  const parsed = (id: IndicatorId) => indicatorById(id).fields.map((f, i) => parseField(f, rows[id].texts[i]))
  const valid = (id: IndicatorId) => {
    const v = parsed(id)
    return v.every((x) => x !== undefined) && (id !== 'bp' || v[0]! > v[1]!)
  }
  const chosen = ORDER.filter((id) => rows[id].include && valid(id))

  const setText = (id: IndicatorId, i: number, text: string) =>
    setRows((all) => ({
      ...all,
      [id]: { texts: all[id].texts.map((old, j) => (j === i ? text : old)), include: true },
    }))
  const toggle = (id: IndicatorId) => setRows((all) => ({ ...all, [id]: { ...all[id], include: !all[id].include } }))

  const save = async () => {
    const list = chosen.map((id) => ({ id, values: parsed(id) as number[] }))
    await db.transaction('rw', db.readings, () => Promise.all(list.map((x) => addReading(x.id, x.values))))
    setSaved(list)
    window.scrollTo({ top: 0 })
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t('Check-in saved')}</h1>
        <ul className="panel divide-y divide-line rounded-3xl">
          {saved.map(({ id, values }) => {
            const a = assess(id, values)
            const ind = indicatorById(id)
            return (
              <li key={id} className="flex items-center gap-3 p-4">
                <StatusIcon status={a.status} size={18} />
                <span className="flex-1">
                  <span className="block font-medium">{t(ind.short)}</span>
                  <span className="text-sm text-ink-dim">{t(a.label)}</span>
                </span>
                <span className="tabular-nums text-ink-dim">
                  {values.join('/')} {ind.unit}
                </span>
              </li>
            )
          })}
        </ul>
        <Link to="/" className="flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space">
          {t('Back to home')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Link to="/" className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim">
          <ChevronLeft size={18} aria-hidden />
          {t('Home')}
        </Link>
        <p className="label flex items-center gap-1.5">
          <Timer size={13} aria-hidden /> {t('About 1 minute')}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Daily check-in')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'Your last values are filled in to save time. Change what is different today and tick each one you actually measured. Only ticked checks are saved.',
          )}
        </p>
      </div>

      {ORDER.map((id) => {
        const ind = indicatorById(id)
        const Icon = INDICATOR_ICON[id]
        const row = rows[id]
        const last = latest[id]
        return (
          <section key={id} className={`panel rounded-3xl p-4 ${row.include ? 'border-accent/50' : ''}`}>
            <div className="flex items-center gap-3">
              <Icon size={20} strokeWidth={1.5} className="text-accent" aria-hidden />
              <h2 className="flex-1 font-medium">{t(ind.name)}</h2>
              <button
                type="button"
                role="checkbox"
                aria-checked={row.include}
                onClick={() => toggle(id)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm ${
                  row.include ? 'border-accent/60 bg-accent/15 text-accent' : 'border-line text-ink-dim'
                }`}
              >
                <Check size={14} aria-hidden className={row.include ? '' : 'opacity-30'} />
                {t('Measured today')}
              </button>
            </div>
            {last && id !== 'mood' && !row.include && (
              <p className="mt-1 text-xs text-ink-faint">{t('Filled in from your last reading.')}</p>
            )}
            <div className="mt-3">
              {id === 'mood' ? (
                <MoodPicker value={parsed('mood')[0]} onChange={(score) => setText('mood', 0, String(score))} />
              ) : (
                <div className="space-y-3">
                  {ind.fields.map((field, i) => (
                    <NumberField
                      key={field.key}
                      field={field}
                      unit={ind.unit}
                      value={row.texts[i]}
                      onChange={(text) => setText(id, i, text)}
                    />
                  ))}
                </div>
              )}
            </div>
            {id === 'bp' && row.include && !valid('bp') && parsed('bp').every((x) => x !== undefined) && (
              <p className="mt-2 text-sm text-alert" role="alert">
                {t('The top number must be higher than the bottom number.')}
              </p>
            )}
          </section>
        )
      })}

      <button
        type="button"
        disabled={chosen.length === 0}
        onClick={() => void save()}
        className="sticky bottom-24 flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space shadow-lg disabled:opacity-40 lg:bottom-4"
      >
        {chosen.length === 0 ? t('Tick at least one check') : t('Save {n} checks', { n: chosen.length })}
      </button>
    </div>
  )
}
