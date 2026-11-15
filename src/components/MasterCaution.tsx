import { OctagonAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { INDICATORS } from '../data/indicators'
import { useT } from '../i18n'
import { assess } from '../lib/rules'
import { useAlerts } from '../lib/useAlerts'
import { useLatest } from '../lib/useLatest'
import { profileKey } from '../lib/profiles'

const ACK_KEY = profileKey('tether-master-caution-ack')

const readAck = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(ACK_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

/**
 * Cockpit-style master caution: a flashing bar while anything at Act level has not been
 * acknowledged. Acknowledging silences it until something new needs action.
 */
export function MasterCaution() {
  const t = useT()
  const alerts = useAlerts()
  const latest = useLatest()
  const [ack, setAck] = useState<string[]>(readAck)
  if (!alerts || !latest) return null

  const items = [
    ...alerts.filter((a) => a.status === 'alert').map((a) => a.id),
    ...INDICATORS.flatMap((i) => {
      const r = latest[i.id]
      return r && assess(i.id, r.values).status === 'alert' ? [`reading-${r.id}`] : []
    }),
  ]
  const pending = items.filter((id) => !ack.includes(id))

  const acknowledge = () => {
    setAck(items)
    try {
      localStorage.setItem(ACK_KEY, JSON.stringify(items))
    } catch {
      // Without storage it stays silenced for this visit only.
    }
  }

  return (
    <AnimatePresence>
      {pending.length > 0 && (
        <motion.section
          role="alert"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-alert/60 bg-alert/12 px-4 py-3"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-alert/20">
            <span className="pulse-ring absolute inset-0 rounded-full border-2 border-alert" aria-hidden />
            <OctagonAlert size={20} className="text-alert" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
            <span className="block text-sm font-bold uppercase tracking-[0.18em] text-alert">{t('Master caution')}</span>
            <span className="block text-sm text-ink-dim">{t('Need action: {n}', { n: pending.length })}</span>
          </span>
          <span className="flex w-full justify-end gap-2 sm:w-auto">
            <Link to="/alerts" className="flex min-h-10 items-center rounded-full border border-alert/50 px-4 text-sm font-semibold text-alert">
              {t('Review')}
            </Link>
            <button
              type="button"
              onClick={acknowledge}
              className="flex min-h-10 items-center rounded-full bg-alert px-4 text-sm font-semibold text-space"
            >
              {t('Acknowledge')}
            </button>
          </span>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
