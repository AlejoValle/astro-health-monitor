import type { NightMode } from './store'

/** The automatic red display runs from 22:00 to 06:00 local time, the usual crew sleep period. */
export const NIGHT_FROM = 22
export const NIGHT_TO = 6

export function isNight(mode: NightMode, now: number): boolean {
  if (mode !== 'auto') return mode === 'on'
  const h = new Date(now).getHours()
  return h >= NIGHT_FROM || h < NIGHT_TO
}

export const NEXT_MODE: Record<NightMode, NightMode> = { auto: 'on', on: 'off', off: 'auto' }
