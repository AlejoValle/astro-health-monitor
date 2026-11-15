import { Anchor, Home, Mountain, Ship, Snowflake, Trees, WifiOff, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EARTH_USES, type EarthUseId } from '../data/earthUses'
import { useT } from '../i18n'

const ICON: Record<EarthUseId, LucideIcon> = {
  antarctica: Snowflake,
  submarine: Anchor,
  offshore: Ship,
  rural: Trees,
  expedition: Mountain,
  home: Home,
}

/** Who else could use Tether: teams far from a doctor and from a good connection. */
export function Earth() {
  const t = useT()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="label">{t('Tether on Earth')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Built for space, useful at home')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'What a crew needs far from Earth is what many people need far from a hospital: clear checks, early warnings and an app that keeps working without internet.',
          )}
        </p>
      </div>

      <p className="panel flex items-start gap-3 rounded-2xl p-4 text-sm">
        <WifiOff size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
        {t('Tether runs entirely on the device. Readings never leave it unless the user shares a report.')}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {EARTH_USES.map((u, i) => {
          const Icon = ICON[u.id]
          return (
            <motion.li
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="panel rounded-3xl p-5"
            >
              <Icon size={24} strokeWidth={1.5} className="text-accent" aria-hidden />
              <h2 className="mt-2 font-semibold">{t(u.title)}</h2>
              <p className="text-xs text-ink-dim">{t(u.who)}</p>
              <p className="mt-2 text-sm">{t(u.body)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.uses.map((x) => (
                  <span key={x} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-dim">
                    {t(x)}
                  </span>
                ))}
              </div>
            </motion.li>
          )
        })}
      </ul>

      <p className="text-xs text-ink-faint">{t('These are the Tether team’s proposals, not NASA programmes.')}</p>
    </div>
  )
}
