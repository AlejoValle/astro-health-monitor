import { Minus, Plus } from 'lucide-react'
import type { IndicatorField } from '../data/indicators'
import { parseField } from '../lib/fields'

const decimals = (step: number) => (String(step).split('.')[1] ?? '').length

export function NumberField({
  field,
  unit,
  value,
  onChange,
}: {
  field: IndicatorField
  unit: string
  value: string
  onChange: (text: string) => void
}) {
  const invalid = value.trim() !== '' && parseField(field, value) === undefined

  const nudge = (direction: 1 | -1) => {
    const current = parseField(field, value)
    const next = current === undefined ? field.start : current + direction * field.step
    onChange(Math.min(field.max, Math.max(field.min, next)).toFixed(decimals(field.step)))
  }

  return (
    <div>
      <label htmlFor={`field-${field.key}`} className="label">
        {field.label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label={`Lower ${field.label}`}
          className="panel flex size-14 shrink-0 items-center justify-center rounded-2xl active:bg-panel-2"
        >
          <Minus size={22} aria-hidden />
        </button>
        <div
          className={`panel flex h-14 min-w-0 flex-1 items-baseline justify-center gap-1.5 rounded-2xl px-3 ${
            invalid ? 'border-alert/60' : 'focus-within:border-accent/60'
          }`}
        >
          <input
            id={`field-${field.key}`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="--"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid}
            className="h-full w-24 min-w-0 bg-transparent text-right text-3xl font-semibold tabular-nums outline-none placeholder:text-ink-faint"
          />
          <span className="w-12 shrink-0 text-sm text-ink-dim">{unit}</span>
        </div>
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label={`Raise ${field.label}`}
          className="panel flex size-14 shrink-0 items-center justify-center rounded-2xl active:bg-panel-2"
        >
          <Plus size={22} aria-hidden />
        </button>
      </div>
      {invalid && (
        <p className="mt-1.5 text-xs text-alert">
          Enter a value between {field.min} and {field.max}.
        </p>
      )}
    </div>
  )
}
