import { Droplet, HeartPulse, Activity, Moon, Smile, Thermometer } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Indicator, IndicatorId } from '../data/indicators'
import type { Reading } from '../lib/db'
import { assess, formatValue } from '../lib/rules'
import { StatusPill } from './status'

export const INDICATOR_ICON: Record<IndicatorId, typeof HeartPulse> = {
  hr: HeartPulse,
  bp: Activity,
  glucose: Droplet,
  temp: Thermometer,
  sleep: Moon,
  mood: Smile,
}

export function IndicatorCard({ indicator, reading }: { indicator: Indicator; reading?: Reading }) {
  const Icon = INDICATOR_ICON[indicator.id]
  const assessment = reading && assess(indicator.id, reading.values)

  return (
    <Link
      to={`/measure?i=${indicator.id}`}
      className="panel flex min-h-36 flex-col justify-between rounded-3xl p-4 active:bg-panel-2"
    >
      <div className="flex items-center gap-2 text-ink-dim">
        <Icon size={18} strokeWidth={1.75} aria-hidden />
        <span className="text-sm">{indicator.short}</span>
      </div>
      {reading && assessment ? (
        <>
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-[2rem] font-semibold leading-none tabular-nums tracking-tight">
              {formatValue(indicator.id, reading.values)}
            </span>
            <span className="text-sm text-ink-dim">{indicator.unit}</span>
          </p>
          <div>
            <StatusPill status={assessment.status} label={assessment.label} />
          </div>
        </>
      ) : (
        <>
          <p className="text-[2rem] font-semibold leading-none text-ink-faint">--</p>
          <p className="text-xs text-ink-dim">Tap to measure</p>
        </>
      )}
    </Link>
  )
}
