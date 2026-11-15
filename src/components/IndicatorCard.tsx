import { Droplet, HeartPulse, Activity, Moon, Smile, Thermometer } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Indicator, IndicatorId } from '../data/indicators'
import type { Reading } from '../lib/db'
import { useT } from '../i18n'
import { compareToBaseline, type Baseline } from '../lib/baseline'
import { assess, formatValue } from '../lib/rules'
import { CountUp } from './CountUp'
import { StatusPill } from './status'

export const INDICATOR_ICON: Record<IndicatorId, typeof HeartPulse> = {
  hr: HeartPulse,
  bp: Activity,
  glucose: Droplet,
  temp: Thermometer,
  sleep: Moon,
  mood: Smile,
}

export function IndicatorCard({ indicator, reading, baseline }: { indicator: Indicator; reading?: Reading; baseline?: Baseline }) {
  const Icon = INDICATOR_ICON[indicator.id]
  const assessment = reading && assess(indicator.id, reading.values)
  const t = useT()

  return (
    <Link
      to={`/measure?i=${indicator.id}`}
      className="panel flex min-h-36 flex-col justify-between rounded-3xl p-4 active:bg-panel-2"
    >
      <div className="flex items-center gap-2 text-ink-dim">
        <Icon size={18} strokeWidth={1.75} aria-hidden />
        <span className="text-sm">{t(indicator.short)}</span>
      </div>
      {reading && assessment ? (
        <>
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-[2rem] font-semibold leading-none tabular-nums tracking-tight">
              {formatValue(indicator.id, reading.values)
                .split('/')
                .map((part, i) => (
                  <span key={i}>
                    {i > 0 && '/'}
                    <CountUp value={Number(part)} decimals={(part.split('.')[1] ?? '').length} />
                  </span>
                ))}
            </span>
            <span className="text-sm text-ink-dim">{indicator.unit}</span>
          </p>
          <BaselineLine indicator={indicator} reading={reading} baseline={baseline} />
          <div>
            <StatusPill status={assessment.status} label={assessment.label} />
          </div>
        </>
      ) : (
        <>
          <p className="text-[2rem] font-semibold leading-none text-ink-faint">--</p>
          <p className="text-xs text-ink-dim">{t('Tap to measure')}</p>
        </>
      )}
    </Link>
  )
}

/** One line comparing the latest reading with the crew member's own baseline. */
function BaselineLine({ indicator, reading, baseline }: { indicator: Indicator; reading: Reading; baseline?: Baseline }) {
  const t = useT()
  if (!baseline) return null
  const c = compareToBaseline(indicator.id, reading.values, baseline)
  if (!c.notable) return <p className="text-[11px] text-ink-faint">{t('Near your baseline')}</p>
  return (
    <p className={`text-[11px] font-medium ${c.worse ? 'text-watch' : 'text-ink-dim'}`}>
      {t('{delta} vs your baseline', { delta: `${c.delta > 0 ? '+' : ''}${c.delta}` })}
    </p>
  )
}
