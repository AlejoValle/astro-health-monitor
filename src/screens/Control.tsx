import { ArrowRight, Moon, Radiation, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { StatusIcon } from '../components/status'
import { indicatorById } from '../data/indicators'
import { LOCATIONS } from '../data/locations'
import { CAREER_LIMIT_MSV } from '../data/radiation'
import { translateVars, useT } from '../i18n'
import { msg } from '../i18n/msg'
import { useCrewStatus, type MemberSummary } from '../lib/crewStatus'
import { getActiveProfileId, ROLES, switchProfile, useProfiles } from '../lib/profiles'
import type { Status } from '../lib/rules'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useNow, useRecords } from '../lib/useRecords'

const HEADLINE: Record<Status, string> = { ok: msg('All clear'), watch: msg('Keep an eye'), alert: msg('Act now') }

/** Mission control: every crew member on this device at a glance, most urgent first. */
export function Control() {
  const t = useT()
  const profiles = useProfiles()
  const records = useRecords()
  const rows = useCrewStatus(profiles, records)
  const activeId = getActiveProfileId()

  const count = (s: Status) => rows?.filter((r) => r.summary.status === s).length ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="label">{t('Mission control')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('The whole crew at a glance')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'For the commander or the crew medical officer. Each line is worked out from that crew member’s own data on this device, most urgent first.',
          )}
        </p>
      </div>

      {rows && (
        <div className="grid grid-cols-3 gap-2">
          {(['alert', 'watch', 'ok'] as Status[]).map((s) => (
            <div key={s} className={`panel rounded-2xl p-3 text-center ${STATUS_STYLE[s].bg}`}>
              <p className={`text-2xl font-semibold tabular-nums ${STATUS_STYLE[s].text}`}>{count(s)}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-ink-dim">
                <StatusIcon status={s} size={12} /> {t(HEADLINE[s])}
              </p>
            </div>
          ))}
        </div>
      )}

      {profiles.length < 2 && (
        <p className="panel rounded-2xl p-4 text-sm text-ink-dim">
          {t('Only one crew member so far.')}{' '}
          <Link to="/crew" className="text-accent">
            {t('Add crewmates')}
          </Link>{' '}
          {t('or')}{' '}
          <Link to="/scenarios" className="text-accent">
            {t('load the demo crew')}
          </Link>
          .
        </p>
      )}

      <ul className="space-y-3">
        {rows?.map(({ profile, summary }) => (
          <li key={profile.id}>
            <MemberCard
              name={profile.name}
              role={t(ROLES[profile.role])}
              avatar={<Avatar profile={profile} size={44} />}
              summary={summary}
              active={profile.id === activeId}
              onOpen={() => switchProfile(profile.id)}
            />
          </li>
        ))}
      </ul>

      <p className="text-xs text-ink-faint">
        {t('Nothing leaves this device. The same rules as each crew member’s own screens are used, so the numbers match.')}
      </p>
    </div>
  )
}

const BAR: Record<Status, string> = { ok: 'bg-ok', watch: 'bg-watch', alert: 'bg-alert' }

function ago(t: ReturnType<typeof useT>, ts: number, now: number) {
  const min = Math.max(0, Math.round((now - ts) / 60_000))
  return min < 60
    ? t('{n} min ago', { n: min })
    : min < 48 * 60
      ? t('{n} h ago', { n: Math.round(min / 60) })
      : t('{n} days ago', { n: Math.round(min / 1440) })
}

function MemberCard(props: {
  name: string
  role: string
  avatar: React.ReactNode
  summary: MemberSummary
  active: boolean
  onOpen: () => void
}) {
  const t = useT()
  const now = useNow()
  const { summary: s } = props
  const style = STATUS_STYLE[s.status]
  const location = LOCATIONS.find((l) => l.id === s.locationId)
  const top = s.alerts.slice(0, 2)
  const dosePct = s.dose ? Math.min(100, (s.dose.careerMSv / CAREER_LIMIT_MSV) * 100) : 0

  return (
    <article className={`panel rounded-3xl border p-4 ${style.ring}`}>
      <div className="flex flex-wrap items-center gap-3">
        {props.avatar}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {props.name}
            {props.active && <span className="ml-2 text-xs font-normal text-accent">{t('You')}</span>}
          </p>
          <p className="text-xs text-ink-dim">
            {props.role} · {location ? t(location.name) : ''}
            {s.missionDay !== null &&
              ` · ${s.locationId === 'mars' ? t('Sol {n}', { n: s.missionDay }) : t('Day {n}', { n: s.missionDay })}`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
          <StatusIcon status={s.status} size={14} /> {t(HEADLINE[s.status])}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {s.vitals.map((v) => (
          <span
            key={v.id}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLE[v.status].bg}`}
          >
            <StatusIcon status={v.status} size={11} /> {t(indicatorById(v.id).short)}
          </span>
        ))}
        {s.vitals.length === 0 && <span className="text-xs text-ink-faint">{t('No readings yet')}</span>}
      </div>

      {top.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {top.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-sm">
              <StatusIcon status={a.status} size={14} />
              <span className="min-w-0">{t(a.title, translateVars(t, a.vars))}</span>
            </li>
          ))}
          {s.alerts.length > top.length && (
            <li className="pl-6 text-xs text-ink-dim">{t('and {n} more', { n: s.alerts.length - top.length })}</li>
          )}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-ink-dim sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-1">
            <Radiation size={12} aria-hidden /> {t('Career dose')}
          </p>
          {s.dose ? (
            <>
              <p className="mt-0.5 tabular-nums text-ink">
                {Math.round(s.dose.careerMSv)} / {CAREER_LIMIT_MSV} mSv
              </p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
                <div className={`h-full ${BAR[s.dose.status]}`} style={{ width: `${dosePct}%` }} />
              </div>
            </>
          ) : (
            <p className="mt-0.5">{t('Not set')}</p>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1">
            <ShieldAlert size={12} aria-hidden /> {t('Routine today')}
          </p>
          <p className="mt-0.5 tabular-nums text-ink">
            {s.routine.done} / {s.routine.total}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1">
            <Moon size={12} aria-hidden /> {t('Last log')}
          </p>
          <p className={`mt-0.5 ${s.quiet ? 'text-watch' : 'text-ink'}`}>
            {s.lastActivity ? ago(t, s.lastActivity, now) : t('Never')}
            {s.quiet && s.lastActivity && ` · ${t('check in with them')}`}
          </p>
        </div>
      </div>

      {!props.active && (
        <button type="button" onClick={props.onOpen} className="mt-3 inline-flex items-center gap-1 text-sm text-accent">
          {t('Open their profile')} <ArrowRight size={14} aria-hidden />
        </button>
      )}
    </article>
  )
}
