import { motion } from 'motion/react'
import { Rocket } from 'lucide-react'
import { useT } from '../i18n'
import { JOURNEY, type Journey } from '../lib/garden'

const COLORS = ['#3b82f6', '#cbd5e1', '#ea6834', '#d6a26a']

/** Full routine days move a ship from Earth to the Moon, Mars and beyond. */
export function JourneyMap({ journey }: { journey: Journey }) {
  const t = useT()
  const last = JOURNEY[JOURNEY.length - 1].at
  return (
    <section className="panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="label flex items-center gap-2">
          <Rocket size={14} aria-hidden /> {t('Your journey')}
        </h2>
        <span className="text-xs text-ink-dim">
          {journey.next
            ? t('{n} full days to {place}', { n: journey.next.at - journey.fullDays, place: t(journey.next.name) })
            : t('Route complete')}
        </span>
      </div>
      <div className="relative mt-6 h-14">
        <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/10" />
        <motion.div
          className="absolute left-3 top-1/2 h-0.5 -translate-y-1/2 bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 1.5rem) * ${journey.progress})` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {JOURNEY.map((stop, i) => {
          const reached = journey.fullDays >= stop.at
          return (
            <div
              key={stop.name}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${stop.at / last})` }}
            >
              <span
                className="size-5 rounded-full border-2"
                style={{ background: reached ? COLORS[i] : 'transparent', borderColor: COLORS[i] }}
              />
              <span className={`absolute top-6 whitespace-nowrap text-[11px] ${reached ? 'text-ink' : 'text-ink-faint'}`}>{t(stop.name)}</span>
            </div>
          )
        })}
        <motion.span
          className="absolute top-1/2 -translate-x-1/2 -translate-y-[160%] text-accent"
          initial={{ left: '0.75rem' }}
          animate={{ left: `calc(0.75rem + (100% - 1.5rem) * ${journey.progress})` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        >
          <Rocket size={18} className="rotate-45" />
        </motion.span>
      </div>
      <p className="mt-6 text-xs text-ink-dim">{t('Full days so far: {n}. Each one moves your ship along.', { n: journey.fullDays })}</p>
    </section>
  )
}
