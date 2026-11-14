import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Indicator } from '../data/indicators'
import { sourceById } from '../data/sources'
import { assess, formatValue } from '../lib/rules'
import { STATUS_STYLE } from '../lib/statusStyle'
import { ContactBanner } from './ContactBanner'
import { StatusIcon } from './status'

export function ResultPanel({ indicator, values }: { indicator: Indicator; values: number[] }) {
  const assessment = assess(indicator.id, values)
  const style = STATUS_STYLE[assessment.status]
  const sources = indicator.sourceIds.flatMap((id) => sourceById(id) ?? [])

  return (
    <div className="space-y-4">
      <section className={`glass rounded-[32px] p-6 text-center ${style.glow}`}>
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}
        >
          <StatusIcon status={assessment.status} size={30} />
        </div>
        <p className="label mt-4">{indicator.name}</p>
        <p className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">
            {formatValue(indicator.id, values)}
          </span>
          <span className="text-ink-dim">{indicator.unit}</span>
        </p>
        <p className={`mt-2 text-lg font-semibold ${style.text}`}>{assessment.label}</p>
      </section>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">What to do</h2>
        <p className="mt-2 text-lg leading-snug">{assessment.advice}</p>
      </section>

      {assessment.escalate && <ContactBanner />}

      <section className="panel rounded-3xl p-5">
        <h2 className="label">Why we check this</h2>
        <p className="mt-2 text-sm text-ink-dim">{indicator.why}</p>
        <h2 className="label mt-4">Based on</h2>
        <ul className="mt-2 space-y-2">
          {sources.map((source) => (
            <li key={source.id}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center gap-3 text-sm"
              >
                <span className="flex-1">
                  <span className="block text-ink-dim">{source.org}</span>
                  <span className="block">{source.title}</span>
                </span>
                <ExternalLink size={16} className="shrink-0 text-ink-faint" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">Guidance for self-care, not a medical diagnosis.</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/measure" className="panel flex min-h-14 items-center justify-center rounded-2xl font-medium">
          Measure more
        </Link>
        <Link to="/" className="flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space">
          Done
        </Link>
      </div>
    </div>
  )
}
