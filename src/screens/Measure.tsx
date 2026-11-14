import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HeartRateSensor } from '../components/HeartRateSensor'
import { INDICATOR_ICON } from '../components/IndicatorCard'
import { MoodPicker } from '../components/MoodPicker'
import { NumberField } from '../components/NumberField'
import { ResultPanel } from '../components/ResultPanel'
import { INDICATORS, type Indicator } from '../data/indicators'
import { addReading, type Reading } from '../lib/db'
import { parseField } from '../lib/fields'

export function Measure() {
  const [params] = useSearchParams()
  const indicator = INDICATORS.find((i) => i.id === params.get('i'))
  return indicator ? <MeasureIndicator key={indicator.id} indicator={indicator} /> : <IndicatorPicker />
}

function IndicatorPicker() {
  return (
    <div className="mx-auto max-w-xl">
      <p className="label">Measure</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">What do you want to check?</h1>
      <ul className="mt-5 space-y-2">
        {INDICATORS.map((indicator) => {
          const Icon = INDICATOR_ICON[indicator.id]
          return (
            <li key={indicator.id}>
              <Link
                to={`/measure?i=${indicator.id}`}
                className="panel flex min-h-16 items-center gap-4 rounded-2xl px-4 active:bg-panel-2"
              >
                <Icon size={24} strokeWidth={1.5} className="text-accent" aria-hidden />
                <span className="flex-1 font-medium">{indicator.name}</span>
                <ChevronRight size={18} className="text-ink-faint" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MeasureIndicator({ indicator }: { indicator: Indicator }) {
  const [texts, setTexts] = useState<string[]>(() => indicator.fields.map(() => ''))
  const [saved, setSaved] = useState<number[] | null>(null)

  const save = async (values: number[], origin: Reading['origin']) => {
    await addReading(indicator.id, values, origin)
    setSaved(values)
    window.scrollTo({ top: 0 })
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-xl">
        <ResultPanel indicator={indicator} values={saved} />
      </div>
    )
  }

  const parsed = indicator.fields.map((field, i) => parseField(field, texts[i]))
  const complete = parsed.every((v) => v !== undefined)
  const bpOrderWrong = indicator.id === 'bp' && complete && parsed[0]! <= parsed[1]!
  const setText = (i: number, text: string) => setTexts((t) => t.map((old, j) => (j === i ? text : old)))

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link to="/measure" className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim">
          <ChevronLeft size={18} aria-hidden />
          All checks
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{indicator.name}</h1>
      </div>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">How to measure</h2>
        <ol className="mt-3 space-y-3">
          {indicator.howTo.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {indicator.id === 'hr' && (
        <>
          <HeartRateSensor onSave={(bpm) => void save([bpm], 'sensor')} />
          <p className="label text-center">or enter it by hand</p>
        </>
      )}

      {indicator.id === 'mood' ? (
        <MoodPicker value={parsed[0]} onChange={(score) => setText(0, String(score))} />
      ) : (
        <div className="space-y-4">
          {indicator.fields.map((field, i) => (
            <NumberField
              key={field.key}
              field={field}
              unit={indicator.unit}
              value={texts[i]}
              onChange={(text) => setText(i, text)}
            />
          ))}
        </div>
      )}

      {bpOrderWrong && (
        <p className="text-sm text-alert" role="alert">
          The top number must be higher than the bottom number.
        </p>
      )}

      <button
        type="button"
        disabled={!complete || bpOrderWrong}
        onClick={() => void save(parsed as number[], 'manual')}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space disabled:opacity-40"
      >
        Save and check
      </button>
    </div>
  )
}
