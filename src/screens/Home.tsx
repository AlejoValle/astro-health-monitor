import { AudioLines, BellRing, BookOpen, ChartLine, ChevronRight, FileText, FlaskConical, PersonStanding, Users, Gamepad2 } from 'lucide-react'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { Link } from 'react-router-dom'
import { AlertCard } from '../components/AlertCard'
import { ContactBanner } from '../components/ContactBanner'
import { HazardSummary } from '../components/HazardSummary'
import { IndicatorCard } from '../components/IndicatorCard'
import { NextUpCard } from '../components/NextUpCard'
import { StatusIcon } from '../components/status'
import { INDICATORS } from '../data/indicators'
import { assess, worst, type Status } from '../lib/rules'
import { clearSimulatedMission, loadSimulatedMission } from '../lib/seed'
import { useSoundPlayer } from '../lib/soundPlayer'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useAlerts } from '../lib/useAlerts'
import { useBaselines } from '../lib/useBaselines'
import { useLatest } from '../lib/useLatest'
import { useRadiation } from '../lib/useRadiation'

const HEADLINE: Record<Status, string> = {
  ok: msg('All clear'),
  watch: msg('Keep an eye'),
  alert: msg('Act now'),
}

const QUICK_LINKS = [
  { to: '/body', label: msg('Body map'), icon: PersonStanding },
  { to: '/alerts', label: msg('Alerts'), icon: BellRing },
  { to: '/report', label: msg('Report'), icon: FileText },
  { to: '/trends', label: msg('Trends'), icon: ChartLine },
  { to: '/sounds', label: msg('Sounds'), icon: AudioLines },
  { to: '/sources', label: msg('Sources'), icon: BookOpen },
  { to: '/games', label: msg('Games'), icon: Gamepad2 },
  { to: '/crew', label: msg('Crew'), icon: Users },
  { to: '/scenarios', label: msg('Use cases'), icon: FlaskConical },
]

export function Home() {
  const latest = useLatest()
  const radiation = useRadiation()
  const alerts = useAlerts()
  const baselines = useBaselines()
  const soundPlaying = useSoundPlayer((s) => s.playing !== null)
  const t = useT()

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
  const radiationEscalation = radiation?.overall?.escalate ? radiation.overall : undefined
  const style = STATUS_STYLE[overall]

  return (
    <div className="no-rise space-y-5 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6 lg:space-y-0">
      <div className="reveal-list space-y-5">
        <section className={`glass rounded-[32px] p-6 ${hasData ? style.glow : ''}`}>
          {hasData ? (
            <div className="flex items-center gap-5">
              <div
                className={`relative flex size-20 shrink-0 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}
              >
                {overall !== 'ok' && (
                  <span className={`pulse-ring absolute -inset-0.5 rounded-full border-2 ${style.ring}`} aria-hidden />
                )}
                <StatusIcon status={overall} size={36} />
              </div>
              <div>
                <p className="label">{t('Your health today')}</p>
                <h1 className="text-3xl font-semibold tracking-tight">{t(HEADLINE[overall])}</h1>
                <p className="mt-1 text-sm text-ink-dim">
                  {attention.length === 0
                    ? t('All {n} checks are in range.', { n: assessed.length })
                    : t('{n} of {total} checks need attention.', { n: attention.length, total: assessed.length })}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="label">{t('Your health today')}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('No checks yet')}</h1>
              <p className="mt-1 text-sm text-ink-dim">{t('Take your first measurement to see your status.')}</p>
              <Link
                to="/measure"
                className="mt-5 flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space"
              >
                {t('Start a check')}
              </Link>
            </div>
          )}
        </section>

        {(escalations.length > 0 || radiationEscalation) && (
          <ContactBanner>
            <ul className="mt-2 space-y-2 text-sm">
              {escalations.map(({ indicator, assessment }) => (
                <li key={indicator.id}>
                  <span className="font-medium">{t(indicator.short)}: </span>
                  <span className="text-ink-dim">{t(assessment.advice)}</span>
                </li>
              ))}
              {radiationEscalation && (
                <li>
                  <span className="font-medium">{t('Radiation')}: </span>
                  <span className="text-ink-dim">{t(radiationEscalation.advice)}</span>
                </li>
              )}
            </ul>
          </ContactBanner>
        )}

        <NextUpCard />

        <section className="reveal-list grid grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="panel relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl">
              <Icon size={22} strokeWidth={1.75} className="text-accent" aria-hidden />
              <span className="text-sm font-medium">{to === '/sounds' && soundPlaying ? t('Playing') : t(label)}</span>
              {to === '/alerts' && alerts && alerts.length > 0 && (
                <span className="absolute right-2 top-2 flex min-w-5 items-center justify-center rounded-full bg-alert px-1.5 text-[11px] font-semibold text-space">
                  {alerts.length}
                </span>
              )}
            </Link>
          ))}
        </section>
      </div>

      <div className="reveal-list space-y-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="label">{t('Vitals')}</h2>
            {simulated && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-dim">
                <FlaskConical size={12} aria-hidden />
                {t('Simulated data')}
              </span>
            )}
          </div>
          <div className="reveal-list grid grid-cols-2 gap-3 md:grid-cols-3">
            {INDICATORS.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} reading={latest[indicator.id]} baseline={baselines[indicator.id]} />
            ))}
          </div>
        </section>

        {alerts && alerts.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="label">{t('Early warnings')}</h2>
              <Link to="/alerts" className="flex min-h-10 items-center gap-1 text-sm text-ink-dim">
                {t('See all ({n})', { n: alerts.length })} <ChevronRight size={14} aria-hidden />
              </Link>
            </div>
            <div className="reveal-list grid gap-3 md:grid-cols-2">
              {alerts.slice(0, 2).map((a) => (
                <AlertCard key={a.id} alert={a} compact />
              ))}
            </div>
          </section>
        )}

        <HazardSummary />

        <section className="text-center">
          {simulated ? (
            <button
              type="button"
              onClick={() => void clearSimulatedMission()}
              className="min-h-12 px-4 text-sm text-ink-dim underline underline-offset-4"
            >
              {t('Remove simulated data')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void loadSimulatedMission()}
              className="min-h-12 px-4 text-sm text-ink-dim underline underline-offset-4"
            >
              {t('Load a simulated 14-day mission')}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
