import { AudioLines, BookOpen, ChartLine, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContactBanner } from '../components/ContactBanner'
import { IndicatorCard } from '../components/IndicatorCard'
import { StatusIcon } from '../components/status'
import { INDICATORS } from '../data/indicators'
import { assess, worst, type Status } from '../lib/rules'
import { clearSimulatedMission, loadSimulatedMission } from '../lib/seed'
import { useSoundPlayer } from '../lib/soundPlayer'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useLatest } from '../lib/useLatest'

const HEADLINE: Record<Status, string> = {
  ok: 'All clear',
  watch: 'Keep an eye',
  alert: 'Act now',
}

const QUICK_LINKS = [
  { to: '/trends', label: 'Trends', icon: ChartLine },
  { to: '/sounds', label: 'Sounds', icon: AudioLines },
  { to: '/sources', label: 'Sources', icon: BookOpen },
]

export function Home() {
  const latest = useLatest()
  const soundPlaying = useSoundPlayer((s) => s.playing !== null)

  if (!latest) return null

  const assessed = INDICATORS.flatMap((indicator) => {
    const reading = latest[indicator.id]
    return reading ? [{ indicator, reading, assessment: assess(indicator.id, reading.values) }] : []
  })
  const hasData = assessed.length > 0
  const simulated = assessed.some((a) => a.reading.origin === 'simulated')
  const overall = worst(assessed.map((a) => a.assessment.status))
  const attention = assessed.filter((a) => a.assessment.status !== 'ok')
  const escalations = assessed.filter((a) => a.assessment.escalate)
  const style = STATUS_STYLE[overall]

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6 lg:space-y-0">
      <div className="space-y-5">
        <section className={`glass rounded-[32px] p-6 ${hasData ? style.glow : ''}`}>
          {hasData ? (
            <div className="flex items-center gap-5">
              <div
                className={`flex size-20 shrink-0 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}
              >
                <StatusIcon status={overall} size={36} />
              </div>
              <div>
                <p className="label">Your health today</p>
                <h1 className="text-3xl font-semibold tracking-tight">{HEADLINE[overall]}</h1>
                <p className="mt-1 text-sm text-ink-dim">
                  {attention.length === 0
                    ? `All ${assessed.length} checks are in range.`
                    : `${attention.length} of ${assessed.length} checks need attention.`}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="label">Your health today</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">No checks yet</h1>
              <p className="mt-1 text-sm text-ink-dim">Take your first measurement to see your status.</p>
              <Link
                to="/measure"
                className="mt-5 flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space"
              >
                Start a check
              </Link>
            </div>
          )}
        </section>

        {escalations.length > 0 && (
          <ContactBanner>
            <ul className="mt-2 space-y-2 text-sm">
              {escalations.map(({ indicator, assessment }) => (
                <li key={indicator.id}>
                  <span className="font-medium">{indicator.short}: </span>
                  <span className="text-ink-dim">{assessment.advice}</span>
                </li>
              ))}
            </ul>
          </ContactBanner>
        )}

        <section className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="panel flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl">
              <Icon size={22} strokeWidth={1.75} className="text-accent" aria-hidden />
              <span className="text-sm font-medium">{to === '/sounds' && soundPlaying ? 'Playing' : label}</span>
            </Link>
          ))}
        </section>
      </div>

      <div className="space-y-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="label">Vitals</h2>
            {simulated && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-dim">
                <FlaskConical size={12} aria-hidden />
                Simulated data
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {INDICATORS.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} reading={latest[indicator.id]} />
            ))}
          </div>
        </section>

        <section className="text-center">
          {simulated ? (
            <button
              type="button"
              onClick={() => void clearSimulatedMission()}
              className="min-h-12 px-4 text-sm text-ink-dim underline underline-offset-4"
            >
              Remove simulated data
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void loadSimulatedMission()}
              className="min-h-12 px-4 text-sm text-ink-dim underline underline-offset-4"
            >
              Load a simulated 14-day mission
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
