import { ExternalLink } from 'lucide-react'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { HAZARD_ICON } from '../components/HazardSummary'
import { TrackerChip } from '../components/TrackerChip'
import { StatusPill } from '../components/status'
import { HAZARDS, LEVEL_WORD, type Hazard, type Level } from '../data/hazards'
import { locationById } from '../data/locations'
import { sourceById } from '../data/sources'
import { hazardStatus, trackerKey, type TrackerStatus } from '../lib/hazards'
import { useTrackerStatus } from '../lib/useTrackerStatus'
import { useSettings } from '../lib/store'
import { STATUS_STYLE } from '../lib/statusStyle'

const STATUS_WORD = { ok: msg('In range'), watch: msg('Keep an eye'), alert: msg('Act now') } as const

export function Hazards() {
  const status = useTrackerStatus()
  const locationId = useSettings((s) => s.locationId)
  const t = useT()
  if (!status) return null
  const location = locationById(locationId)

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('The 5 hazards')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('What space does to you here')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'NASA groups the dangers of spaceflight into five hazards. This is how much each one weighs at your location ({place}), and what you check in this app to stay ahead of it.',
            { place: t(location.name) },
          )}
        </p>
      </div>

      {HAZARDS.map((hazard) => (
        <HazardCard key={hazard.id} hazard={hazard} status={status} />
      ))}

      <p className="px-1 text-xs text-ink-faint">
        {t(
          "The hazards come from NASA's Human Research Program. How much each weighs at a location is this app's reading of NASA's material, not an official rating.",
        )}
      </p>
    </div>
  )
}

function HazardCard({ hazard, status }: { hazard: Hazard; status: TrackerStatus }) {
  const locationId = useSettings((s) => s.locationId)
  const Icon = HAZARD_ICON[hazard.id]
  const overall = hazardStatus(hazard, status)
  const here = hazard.level[locationId]
  const source = sourceById(hazard.sourceIds[0])
  const t = useT()

  return (
    <section className={`panel rounded-3xl p-5 ${overall && overall !== 'ok' ? STATUS_STYLE[overall].ring : ''}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
          <Icon size={22} strokeWidth={1.75} className="text-accent" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{t(hazard.name)}</h2>
          <div className="mt-1.5">
            {overall ? (
              <StatusPill status={overall} label={STATUS_WORD[overall]} />
            ) : (
              <span className="text-xs text-ink-faint">{t('Nothing to measure. Use the tools below.')}</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-dim">{t(hazard.body)}</p>

      <div className="mt-4 flex items-center gap-3">
        <LevelMeter level={here.level} />
        <p className="text-sm">
          <span className="font-medium">{t('{level} here.', { level: t(LEVEL_WORD[here.level]) })} </span>
          <span className="text-ink-dim">{t(here.why)}</span>
        </p>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {hazard.trackers.map((tracker) => (
          <li key={trackerKey(tracker)}>
            <TrackerChip tracker={tracker} status={status} />
          </li>
        ))}
      </ul>

      {source && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-xs text-ink-dim"
        >
          NASA: {source.title}
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
    </section>
  )
}

function LevelMeter({ level }: { level: Level }) {
  return (
    <span className="flex shrink-0 gap-1" aria-hidden>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          style={{ animationDelay: `${300 + n * 90}ms` }}
          className={`level-bar h-5 w-2 origin-bottom rounded-full ${n <= level ? (level === 3 ? 'bg-alert' : level === 2 ? 'bg-watch' : 'bg-ok') : 'bg-white/10'}`}
        />
      ))}
    </span>
  )
}
