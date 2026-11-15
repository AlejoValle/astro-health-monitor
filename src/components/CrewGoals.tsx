import { Check, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { crewGoals, useCrewToday } from '../lib/crewGoals'
import { useProfiles } from '../lib/profiles'
import { useRecords } from '../lib/useRecords'
import { Avatar } from './Avatar'

/** Shared goals for everyone on this device: progress together, never a ranking. */
export function CrewGoals() {
  const t = useT()
  const profiles = useProfiles()
  const records = useRecords()
  const members = useCrewToday(profiles, records)

  return (
    <section className="panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="label flex items-center gap-2">
          <Users size={14} aria-hidden /> {t('Crew goals')}
        </h2>
        <Link to="/crew" className="text-xs text-ink-dim">
          {t('{n} crew members', { n: profiles.length })}
        </Link>
      </div>
      {profiles.length < 2 ? (
        <p className="mt-2 text-sm text-ink-dim">
          {t('Add your crewmates in Crew to share goals. Goals are reached together, not a competition.')}
        </p>
      ) : !members ? null : (
        <ul className="mt-3 space-y-4">
          {crewGoals(members).map((g) => (
            <li key={g.id}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className={g.complete ? 'font-medium text-ok' : ''}>
                  {g.complete && <Check size={14} className="mr-1 inline" aria-hidden />}
                  {t(g.title)}
                </span>
                <span className="shrink-0 tabular-nums text-ink-dim">
                  {g.value}/{g.target}
                  {g.id === 'exercise' ? ' min' : ''}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full ${g.complete ? 'bg-ok' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (g.value / Math.max(1, g.target)) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {profiles.map((p) => (
                  <span key={p.id} className={g.done.includes(p.id) ? '' : 'opacity-25 grayscale'} title={p.name}>
                    <Avatar profile={p} size={22} />
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink-faint">
        {t('Team cohesion matters on long missions, so these goals are shared. Each crew member’s data stays in their own profile.')}
      </p>
    </section>
  )
}
