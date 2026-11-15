import { CloudOff, ExternalLink, RefreshCw, Sun } from 'lucide-react'
import { useLocale, useT } from '../i18n'
import { assessSpaceWeather, EVENT_LABEL } from '../lib/spaceWeather'
import { useSettings } from '../lib/store'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useNow } from '../lib/useRecords'
import type { SpaceWeatherState } from '../lib/useSpaceWeather'
import { DataBadge } from './DataBadge'
import { StatusPill } from './status'

/** Live NASA DONKI space weather, with the last synced copy shown when there is no link. */
export function SpaceWeatherCard({ state }: { state: SpaceWeatherState }) {
  const t = useT()
  const locale = useLocale()
  const now = useNow()
  const locationId = useSettings((s) => s.locationId)
  const { data, syncing, offline } = state
  const when = (ts: number) => new Date(ts).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const ago = (ts: number) => {
    const min = Math.max(0, Math.round((now - ts) / 60_000))
    return min < 60 ? t('{n} min ago', { n: min }) : min < 48 * 60 ? t('{n} h ago', { n: Math.round(min / 60) }) : t('{n} days ago', { n: Math.round(min / 1440) })
  }
  const assessment = data && assessSpaceWeather(data.events, now, locationId)

  return (
    <section className={`panel rounded-3xl p-5 ${assessment && assessment.status !== 'ok' ? STATUS_STYLE[assessment.status].ring : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="label flex items-center gap-2">
          <Sun size={14} aria-hidden />
          {t('Space weather')}
        </h2>
        <DataBadge kind="live" />
      </div>

      {assessment ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={assessment.status} label={assessment.title} />
          </div>
          <p className="mt-2 text-sm">{t(assessment.advice)}</p>
          <ul className="mt-3 divide-y divide-line">
            {data!.events.slice(0, 4).map((e) => (
              <li key={e.id}>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between gap-3 text-sm"
                >
                  <span className={assessment.drivers.some((d) => d.id === e.id) ? 'font-medium' : 'text-ink-dim'}>
                    {t(EVENT_LABEL[e.type])}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-faint">
                    {when(e.at)}
                    <ExternalLink size={12} aria-hidden />
                  </span>
                </a>
              </li>
            ))}
            {data!.events.length === 0 && <li className="py-2 text-sm text-ink-dim">{t('No events in the last 14 days.')}</li>}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-dim">
          {syncing ? t('Downloading the latest space weather from NASA…') : t('Not synced yet. Space weather downloads when there is a link to Earth.')}
        </p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
        {syncing ? <RefreshCw size={12} className="animate-spin" aria-hidden /> : offline ? <CloudOff size={12} aria-hidden /> : null}
        {data
          ? offline
            ? t('No link right now. Showing NASA data synced {ago}.', { ago: ago(data.fetchedAt) })
            : t('Synced from NASA DONKI {ago}.', { ago: ago(data.fetchedAt) })
          : ''}
        {data && ' '}
        {t('Observed near Earth; conditions at your location may differ.')}
      </p>
    </section>
  )
}
