import { Bot, FlaskConical, Radio, Rocket, Stethoscope } from 'lucide-react'
import { msg } from '../i18n/msg'

/** Where a number or rule comes from, so nothing is mistaken for something it is not. */
export type DataKind = 'nasa' | 'live' | 'clinical' | 'app' | 'simulated'

export const DATA_KIND: Record<DataKind, { label: string; note: string; icon: typeof Rocket; className: string }> = {
  nasa: { label: msg('NASA source'), note: msg('A number stated in a cited NASA document.'), icon: Rocket, className: 'border-accent/40 text-accent' },
  live: { label: msg('NASA live data'), note: msg('Downloaded from a NASA service when a link is available.'), icon: Radio, className: 'border-ok/40 text-ok' },
  clinical: { label: msg('Clinical range'), note: msg('A range from a cited clinical guideline (AHA, ADA, CDC).'), icon: Stethoscope, className: 'border-line text-ink-dim' },
  app: { label: msg('App rule'), note: msg("A choice made by this app, explained where it is shown."), icon: Bot, className: 'border-watch/40 text-watch' },
  simulated: { label: msg('Simulated'), note: msg('Demo data, never mixed with real readings.'), icon: FlaskConical, className: 'border-line text-ink-faint' },
}
