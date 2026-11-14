import { Check, Earth, MoonStar, Mountain, Rocket, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { LOCATIONS, type LocationId } from '../data/locations'
import { useSettings } from '../lib/store'

export const LOCATION_ICON: Record<LocationId, typeof Earth> = {
  orbit: Earth,
  transit: Rocket,
  moon: MoonStar,
  mars: Mountain,
}

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locationId, setLocation } = useSettings()

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose location"
            className="glass glass-sheet relative w-full max-w-md rounded-t-[32px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:rounded-[32px]"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="label">Mission</p>
                <h2 className="text-xl font-semibold">Where are you?</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-12 items-center justify-center rounded-full bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-2">
              {LOCATIONS.map((l) => {
                const Icon = LOCATION_ICON[l.id]
                const active = l.id === locationId
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLocation(l.id)
                        onClose()
                      }}
                      aria-pressed={active}
                      className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left ${
                        active ? 'border-accent/60 bg-panel-2' : 'border-line bg-panel'
                      }`}
                    >
                      <Icon size={24} strokeWidth={1.5} className={active ? 'text-accent' : 'text-ink-dim'} />
                      <span className="flex-1">
                        <span className="block font-medium">{l.name}</span>
                        <span className="block text-sm text-ink-dim">
                          {l.gravity} · {l.contactLabel}
                        </span>
                      </span>
                      {active && <Check size={20} className="text-accent" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
