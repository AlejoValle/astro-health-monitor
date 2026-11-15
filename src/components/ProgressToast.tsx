import { Award, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { PATCHES } from '../data/routine'
import { useT } from '../i18n'
import { isEmbedded } from '../lib/devicePreview'
import { useReminders } from '../lib/reminders'
import { useSettings } from '../lib/store'
import { useRoutine } from '../lib/useRoutine'

interface Toast {
  id: number
  xp: number
  tasks: string[]
  patches: string[]
}

// Larger jumps come from loading the simulated mission, not from one action.
const MAX_CELEBRATED_XP = 150

/**
 * Celebrates points and patches earned by a real action, and sends routine reminders.
 * Lives in the app shell so it works on every screen.
 */
export function ProgressToast() {
  const routine = useRoutine()
  const reminders = useSettings((s) => s.reminders)
  const [toast, setToast] = useState<Toast | null>(null)
  const t = useT()
  const previous = useRef<{ xp: number; done: Set<string>; patches: Set<string> } | null>(null)

  useReminders(reminders && !isEmbedded, routine?.statuses, routine?.now)

  useEffect(() => {
    if (!routine) return
    const done = new Set(routine.statuses.filter((s) => s.state === 'done').map((s) => s.task.id))
    const patches = new Set(routine.progress.patches.filter((p) => p.unlocked).map((p) => p.id))
    const before = previous.current
    previous.current = { xp: routine.progress.xp, done, patches }
    if (!before) return

    const gained = routine.progress.xp - before.xp
    if (gained <= 0 || gained > MAX_CELEBRATED_XP) return
    const next: Toast = {
      id: Date.now(),
      xp: gained,
      tasks: routine.statuses.filter((s) => done.has(s.task.id) && !before.done.has(s.task.id)).map((s) => s.task.label),
      patches: PATCHES.filter((p) => patches.has(p.id) && !before.patches.has(p.id)).map((p) => p.name),
    }
    // Shown from a timer: a toast is a reaction to new data, not part of rendering it.
    const show = window.setTimeout(() => setToast(next), 0)
    const hide = window.setTimeout(() => setToast((t) => (t?.id === next.id ? null : t)), 4200)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [routine])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] lg:top-16 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass glass-sheet flex max-w-sm items-center gap-3 rounded-3xl py-3 pl-3 pr-5"
          >
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15">
              <span className="pulse-ring absolute inset-0 rounded-full border border-accent/60" aria-hidden />
              {toast.patches.length ? (
                <Award size={22} className="text-watch" aria-hidden />
              ) : (
                <Sparkles size={20} className="text-accent" aria-hidden />
              )}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">
                +{toast.xp} XP
                {toast.patches.length > 0 &&
                  ` · ${t('Patch unlocked: {names}', { names: toast.patches.map((p) => t(p)).join(', ') })}`}
              </span>
              {toast.tasks.length > 0 && (
                <span className="block truncate text-sm text-ink-dim">
                  {t('{tasks} done', { tasks: toast.tasks.map((x) => t(x)).join(' · ') })}
                </span>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
