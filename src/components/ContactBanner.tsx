import { Radio } from 'lucide-react'
import type { ReactNode } from 'react'
import { locationById } from '../data/locations'
import { useT } from '../i18n'
import { useSettings } from '../lib/store'

/** Tells the crew member to reach the flight surgeon, worded for the comm delay at the current location. */
export function ContactBanner({ children }: { children?: ReactNode }) {
  const location = locationById(useSettings((s) => s.locationId))
  const delayed = location.contact === 'delayed'
  const t = useT()

  return (
    <section className="rounded-3xl border border-alert/40 bg-alert/10 p-4" role="alert">
      <div className="flex items-center gap-2 font-semibold text-alert">
        <Radio size={18} aria-hidden />
        {delayed ? t('Send a report to the flight surgeon') : t('Contact the flight surgeon')}
      </div>
      {children}
      {delayed && (
        <p className="mt-2 text-xs text-ink-dim">
          {t('Contact is delayed at this location. Follow the advice now and do not wait for a reply.')}
        </p>
      )}
    </section>
  )
}
