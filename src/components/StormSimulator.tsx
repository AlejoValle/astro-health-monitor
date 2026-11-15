import { Zap } from 'lucide-react'
import { useState } from 'react'
import { STORM_ACTION, STORM_SCALE } from '../data/missionPlans'
import { SPE_LIMIT_MSV, STORM_DOSE } from '../data/radiation'
import { useT } from '../i18n'
import type { Status } from '../lib/rules'
import { useSettings } from '../lib/store'
import { STATUS_STYLE } from '../lib/statusStyle'
import { SourceList } from './SourceList'
import { StatusIcon } from './status'

const LEVEL_STATUS: Status[] = ['ok', 'ok', 'watch', 'alert', 'alert']

/** Try each level of NOAA's solar radiation storm scale and see what Tether would tell the crew. */
export function StormSimulator({ onDrill }: { onDrill: () => void }) {
  const t = useT()
  const locationId = useSettings((s) => s.locationId)
  const [i, setI] = useState(2)
  const level = STORM_SCALE[i]
  const status = LEVEL_STATUS[i]
  const style = STATUS_STYLE[status]

  return (
    <section className="panel rounded-3xl p-5">
      <h2 className="label flex items-center gap-2">
        <Zap size={14} aria-hidden /> {t('Solar storm simulator')}
      </h2>
      <p className="mt-2 text-sm text-ink-dim">
        {t('NOAA rates solar radiation storms from S1 to S5. Pick a level to see what Tether would tell you.')}
      </p>

      <div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t('Storm level')}>
        {STORM_SCALE.map((l, k) => (
          <button
            key={l.level}
            type="button"
            role="radio"
            aria-checked={k === i}
            onClick={() => setI(k)}
            className={`min-h-12 rounded-xl border text-sm font-semibold ${
              k === i ? `${STATUS_STYLE[LEVEL_STATUS[k]].ring} ${STATUS_STYLE[LEVEL_STATUS[k]].bg}` : 'border-line text-ink-dim'
            }`}
          >
            {l.level}
          </button>
        ))}
      </div>

      <div className={`mt-3 rounded-2xl border p-4 ${style.ring} ${style.bg}`}>
        <p className={`flex items-center gap-2 font-semibold ${style.text}`}>
          <StatusIcon status={status} size={16} /> {level.level} · {t(level.name)}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-dim">
          <div>
            <dt>{t('Proton flux (10 MeV and up)')}</dt>
            <dd className="text-ink tabular-nums">{level.flux}</dd>
          </div>
          <div>
            <dt>{t('Per 11-year solar cycle')}</dt>
            <dd className="text-ink">{level.perCycle === '<1' ? t('Fewer than 1') : level.perCycle}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm">
          <span className="text-ink-dim">{t('NOAA:')} </span>
          {t(level.crew)}
        </p>
        <p className="mt-2 font-medium leading-snug">{t(STORM_ACTION[level.level])}</p>
        {i >= 3 && (
          <>
            <p className="mt-2 text-sm text-ink-dim">
              {t(STORM_DOSE[locationId])} {t("NASA's limit for one storm is {n} mSv.", { n: SPE_LIMIT_MSV })}
            </p>
            <button
              type="button"
              onClick={onDrill}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-space"
            >
              {t('Run a shelter drill')}
            </button>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{t('A simulation for training. Real alerts come from NASA DONKI above.')}</p>
      <SourceList sourceIds={['noaa-scales', 'nasa-radiation-std']} />
    </section>
  )
}
