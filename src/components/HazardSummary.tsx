import { ChevronRight, Orbit, Radiation, Satellite, Users, Wind } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HAZARDS, type HazardId } from '../data/hazards'
import { CAREER_LIMIT_MSV } from '../data/radiation'
import { useT } from '../i18n'
import { hazardStatus } from '../lib/hazards'
import { useSettings } from '../lib/store'
import { useRadiation } from '../lib/useRadiation'
import { useTrackerStatus } from '../lib/useTrackerStatus'
import { CountUp } from './CountUp'
import { StatusIcon, StatusPill } from './status'

export const HAZARD_ICON: Record<HazardId, typeof Radiation> = {
  radiation: Radiation,
  isolation: Users,
  distance: Satellite,
  gravity: Orbit,
  environment: Wind,
}

const LEVEL_DOT = { 1: 'bg-ok', 2: 'bg-watch', 3: 'bg-alert' } as const

/** Home block: radiation dose and the five hazards at the current location, at a glance. */
export function HazardSummary() {
  const status = useTrackerStatus()
  const radiation = useRadiation()
  const locationId = useSettings((s) => s.locationId)
  const t = useT()
  if (!status || !radiation) return null
  const { estimate, overall } = radiation

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label">{t('Mission hazards')}</h2>
        <Link to="/hazards" className="flex min-h-10 items-center gap-1 text-sm text-ink-dim">
          {t('See all')} <ChevronRight size={14} aria-hidden />
        </Link>
      </div>

      <Link to="/radiation" className="panel flex min-h-20 items-center gap-4 rounded-3xl p-4 active:bg-panel-2">
        <Radiation size={26} strokeWidth={1.75} className="shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-dim">{t('Radiation this mission')}</p>
          {estimate ? (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-semibold">
                <CountUp value={Number(estimate.missionMSv.toFixed(1))} decimals={1} />
              </span>
              <span className="text-sm text-ink-dim">
                mSv · {t('{p}% of career limit', { p: Math.round((estimate.careerMSv / CAREER_LIMIT_MSV) * 100) })}
              </span>
            </p>
          ) : (
            <p className="font-medium">{t('Set up your mission')}</p>
          )}
        </div>
        {overall && <StatusPill status={overall.status} label={overall.label} />}
      </Link>

      <ul className="reveal-list mt-3 grid grid-cols-5 gap-2">
        {HAZARDS.map((hazard) => {
          const Icon = HAZARD_ICON[hazard.id]
          const s = hazardStatus(hazard, status)
          const level = hazard.level[locationId].level
          return (
            <li key={hazard.id}>
              <Link
                to="/hazards"
                aria-label={`${t(hazard.name)}: ${t(['', 'Lower', 'Moderate', 'Higher'][level])}`}
                className="panel flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 active:bg-panel-2"
              >
                <Icon size={20} strokeWidth={1.75} className="text-ink-dim" aria-hidden />
                <span className="text-[11px] font-medium">{t(hazard.short)}</span>
                <span className="flex h-4 items-center gap-1" aria-hidden>
                  {s ? (
                    <StatusIcon status={s} size={14} />
                  ) : (
                    [1, 2, 3].map((n) => (
                      <span key={n} className={`size-1.5 rounded-full ${n <= level ? LEVEL_DOT[level] : 'bg-white/10'}`} />
                    ))
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
