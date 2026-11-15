import { Link } from 'react-router-dom'
import type { Indicator } from '../data/indicators'
import { useT } from '../i18n'
import { assess, formatValue } from '../lib/rules'
import { STATUS_STYLE } from '../lib/statusStyle'
import { ContactBanner } from './ContactBanner'
import { SourceList } from './SourceList'
import { StatusIcon } from './status'

export function ResultPanel({ indicator, values }: { indicator: Indicator; values: number[] }) {
  const assessment = assess(indicator.id, values)
  const style = STATUS_STYLE[assessment.status]
  const t = useT()

  return (
    <div className="space-y-4">
      <section className={`glass rounded-[32px] p-6 text-center ${style.glow}`}>
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}
        >
          <StatusIcon status={assessment.status} size={30} />
        </div>
        <p className="label mt-4">{t(indicator.name)}</p>
        <p className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">
            {formatValue(indicator.id, values)}
          </span>
          <span className="text-ink-dim">{indicator.unit}</span>
        </p>
        <p className={`mt-2 text-lg font-semibold ${style.text}`}>{t(assessment.label)}</p>
      </section>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('What to do')}</h2>
        <p className="mt-2 text-lg leading-snug">{t(assessment.advice)}</p>
      </section>

      {assessment.escalate && <ContactBanner />}

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('Why we check this')}</h2>
        <p className="mt-2 text-sm text-ink-dim">{t(indicator.why)}</p>
        <h2 className="label mt-4">{t('Based on')}</h2>
        <SourceList sourceIds={indicator.sourceIds} />
        <p className="mt-3 text-xs text-ink-faint">{t('Guidance for self-care, not a medical diagnosis.')}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/trends?i=${indicator.id}`}
          className="panel flex min-h-14 items-center justify-center rounded-2xl font-medium"
        >
          {t('See trend')}
        </Link>
        <Link to="/" className="flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space">
          {t('Done')}
        </Link>
      </div>
    </div>
  )
}
