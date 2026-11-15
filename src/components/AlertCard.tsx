import { ChevronRight, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { translateVars, useT } from '../i18n'
import { msg } from '../i18n/msg'
import type { AlertKind, HealthAlert } from '../lib/alerts'
import { STATUS_STYLE } from '../lib/statusStyle'
import { ContactBanner } from './ContactBanner'
import { StatusIcon } from './status'

const KIND_LABEL: Record<AlertKind, string> = {
  pattern: msg('Pattern'),
  streak: msg('Streak'),
  projection: msg('Projection'),
  trend: msg('Trend'),
}

/** One early warning. Compact on Home, full with actions on the Alerts screen. */
export function AlertCard({ alert, compact = false }: { alert: HealthAlert; compact?: boolean }) {
  const t = useT()
  const vars = translateVars(t, alert.vars)
  const style = STATUS_STYLE[alert.status]
  const edge = alert.status === 'alert' ? 'border-l-alert' : 'border-l-watch'

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider ${style.text}`}>
          <StatusIcon status={alert.status} size={13} />
          {t(style.word)}
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-dim">{t(KIND_LABEL[alert.kind])}</span>
      </div>
      <p className="mt-2 font-semibold leading-snug">{t(alert.title, vars)}</p>
      <p className="mt-1 text-sm text-ink-dim">{t(alert.detail, vars)}</p>
    </>
  )

  if (compact) {
    return (
      <Link to="/alerts" className={`panel flex items-center gap-3 rounded-2xl border-l-4 p-4 ${edge} active:bg-panel-2`}>
        <span className="min-w-0 flex-1">{body}</span>
        <ChevronRight size={16} className="shrink-0 text-ink-faint" aria-hidden />
      </Link>
    )
  }

  return (
    <article className={`panel rounded-3xl border-l-4 p-5 ${edge}`}>
      {body}
      {alert.series && <Sparkline series={alert.series} />}
      <ul className="mt-3 flex flex-wrap gap-2">
        {alert.topics.map((topic) => (
          <li key={topic} className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-ink-dim">
            {t(topic)}
          </li>
        ))}
      </ul>
      <h3 className="label mt-4">{t('What you can do')}</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {alert.actions.map((a) => (
          <li key={a} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span>{t(a)}</span>
          </li>
        ))}
      </ul>
      {alert.escalate && (
        <div className="mt-4">
          <ContactBanner />
        </div>
      )}
      <Link to="/report" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent">
        <FileText size={16} aria-hidden />
        {t('Prepare report')}
      </Link>
    </article>
  )
}

/** Recent values, a dashed projection and the OK limit, drawn small. */
function Sparkline({ series }: { series: NonNullable<HealthAlert['series']> }) {
  const t = useT()
  const all = [...series.values, ...series.projected, series.limit]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const n = series.values.length + series.projected.length
  const W = 280
  const H = 64
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * (W - 8) + 4 : W / 2)
  const y = (v: number) => (hi === lo ? H / 2 : H - 6 - ((v - lo) / (hi - lo)) * (H - 12))
  const pts = series.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const lastI = series.values.length - 1
  const proj = [series.values[lastI], ...series.projected].map((v, i) => `${x(lastI + i)},${y(v)}`).join(' ')

  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" role="img" aria-label={t('Recent values and projection')}>
        <line x1="0" x2={W} y1={y(series.limit)} y2={y(series.limit)} stroke="var(--color-alert)" strokeOpacity="0.6" strokeDasharray="3 4" />
        <polyline points={pts} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={proj} fill="none" stroke="var(--color-watch)" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx={x(lastI)} cy={y(series.values[lastI])} r="3" fill="var(--color-accent)" />
      </svg>
      <figcaption className="mt-1 flex gap-4 text-[11px] text-ink-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-accent" aria-hidden /> {t('Recent days')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 border-t-2 border-dashed border-watch" aria-hidden /> {t('Projection')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 border-t-2 border-dashed border-alert/60" aria-hidden /> {t('OK limit')}
        </span>
      </figcaption>
    </figure>
  )
}
