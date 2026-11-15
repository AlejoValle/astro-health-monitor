import { ArrowRight, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { SourceList } from '../components/SourceList'
import { isActive, TIMELINE } from '../data/timeline'
import { useT } from '../i18n'
import { missionDay } from '../lib/routine'
import { useSettings } from '../lib/store'
import { useNow } from '../lib/useRecords'

/** What the body goes through over a mission, with today's mission day marked. */
export function Timeline() {
  const t = useT()
  const now = useNow()
  const { missionStart, locationId } = useSettings()
  const day = missionDay(missionStart, now)

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Mission timeline')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('What to expect, and when')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('How the body changes over a mission, so nothing comes as a surprise. Each step links to where Tether helps.')}
        </p>
      </div>

      <p className="panel flex items-center gap-2 rounded-2xl p-4 text-sm">
        <MapPin size={16} className="shrink-0 text-accent" aria-hidden />
        {day !== null ? (
          <span>
            {t('You are on {day}. Steps that apply now are highlighted.', {
              day: locationId === 'mars' ? t('Sol {n}', { n: day }) : t('Day {n}', { n: day }),
            })}
          </span>
        ) : (
          <span>
            {t('Set your mission start in')}{' '}
            <Link to="/radiation" className="text-accent">
              {t('Radiation')}
            </Link>{' '}
            {t('to see where you are.')}
          </span>
        )}
      </p>

      <ol className="relative space-y-3 pl-6">
        <span className="absolute bottom-3 left-2 top-3 w-px bg-line" aria-hidden />
        {TIMELINE.map((m, i) => {
          const active = day !== null && isActive(m, day)
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <span
                className={`absolute -left-[22px] top-5 size-3 rounded-full border-2 ${
                  active ? 'border-accent bg-accent' : 'border-line bg-space'
                }`}
                aria-hidden
              />
              <article className={`panel rounded-3xl p-4 ${active ? 'border-accent/60' : ''}`}>
                <p className={`text-xs font-medium ${active ? 'text-accent' : 'text-ink-dim'}`}>
                  {t(m.when)}
                  {active && ` · ${t('Now')}`}
                </p>
                <h2 className="mt-1 font-semibold">{t(m.title)}</h2>
                <p className="mt-1 text-sm text-ink-dim">{t(m.body)}</p>
                <Link to={m.link} className="mt-2 inline-flex items-center gap-1 text-sm text-accent">
                  {t(m.toLabel)} <ArrowRight size={14} aria-hidden />
                </Link>
                <SourceList sourceIds={m.sourceIds} />
              </article>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
