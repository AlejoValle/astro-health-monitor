import { AnimatePresence, motion } from 'motion/react'
import { BellRing, ClipboardCheck, Link2, MapPin, Users, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { useIntro } from '../lib/intro'
import { closeGuide, useGuide } from '../lib/guide'
import { StatusIcon } from './status'

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Link2,
    title: msg('Welcome to Tether'),
    body: msg('Your health link to Earth. It checks your vitals, mind, exercise and radiation, and tells you what to do. It works without internet, and your data stays on this device.'),
  },
  {
    icon: ClipboardCheck,
    title: msg('Measure a little every day'),
    body: msg('Use the daily check-in in the morning. Your routine ticks itself off when you log a real measurement, and earns points, patches and a growing garden.'),
  },
  {
    icon: BellRing,
    title: msg('Read the colours'),
    body: msg('Every result has an icon and a word, never colour alone. OK means keep going, Watch means measure again soon, Act means follow the steps now.'),
  },
  {
    icon: MapPin,
    title: msg('Tell Tether where you are'),
    body: msg('Pick Earth orbit, deep space, the Moon or Mars at the top. It changes your exercise plan, your radiation dose and how long a message to Earth takes.'),
  },
  {
    icon: Users,
    title: msg('One device, the whole crew'),
    body: msg('Tap your avatar to switch crew member. Mission control shows everyone at a glance, and Use cases has demo crew members to explore.'),
  },
]

export function WelcomeGuide() {
  const t = useT()
  const open = useGuide((s) => s.open)
  const introDone = useIntro((s) => s.done)
  const step = useGuide((s) => s.step)
  const setStep = (n: number) => useGuide.setState({ step: n })
  const close = closeGuide

  useEffect(() => {
    // Only once it is on screen, so the Escape that skips the intro does not dismiss it too.
    if (!open || !introDone) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeGuide()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, introDone])

  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {open && introDone && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-space/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass w-full max-w-md rounded-[28px] p-6"
          >
            <div className="flex items-center justify-between">
              <s.icon size={30} strokeWidth={1.5} className="text-accent" aria-hidden />
              <span className="text-xs text-ink-dim">
                {step + 1} / {STEPS.length}
              </span>
            </div>
            <h2 id="guide-title" className="mt-4 text-2xl font-semibold tracking-tight">
              {t(s.title)}
            </h2>
            <p className="mt-2 text-ink-dim">{t(s.body)}</p>
            {step === 2 && (
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1"><StatusIcon status="ok" /> {t('OK')}</span>
                <span className="inline-flex items-center gap-1"><StatusIcon status="watch" /> {t('Watch')}</span>
                <span className="inline-flex items-center gap-1"><StatusIcon status="alert" /> {t('Act')}</span>
              </div>
            )}
            <div className="mt-5 flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-white/10'}`} />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={close} className="min-h-12 px-2 text-sm text-ink-dim">
                {t('Skip')}
              </button>
              <button
                type="button"
                onClick={() => (last ? close() : setStep(step + 1))}
                className="min-h-12 rounded-2xl bg-ink px-6 font-semibold text-space"
              >
                {last ? t('Start') : t('Next')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
