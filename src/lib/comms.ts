import type { LocationId } from '../data/locations'

// How long a message to the ground team takes. Low Earth orbit has near real-time links.
// The Moon is about 1.3 light-seconds away. NASA gives up to 20 minutes one way for Mars;
// the real figure changes with where the planets are, so the crew can set it.

export const MOON_DELAY_MS = 1300
/** NASA HRP, Distance from Earth: "a communication delay of up to 20 minutes one way". */
export const MARS_MAX_DELAY_MIN = 20

/** One-way delay in ms. `farMinutes` is used in deep space and on Mars. */
export function oneWayDelay(location: LocationId, farMinutes: number): number {
  if (location === 'orbit') return 0
  if (location === 'moon') return MOON_DELAY_MS
  return Math.round(farMinutes * 60_000)
}

export type MessageState = 'sending' | 'delivered'

export interface MessageProgress {
  state: MessageState
  /** 0 to 1 while the signal travels to Earth. */
  progress: number
  arrivesAt: number
  /** Earliest moment a reply can be back, if the ground answers at once. */
  replyAt: number
}

export function messageProgress(m: { at: number; delayMs: number }, now: number): MessageProgress {
  const arrivesAt = m.at + m.delayMs
  const progress = m.delayMs === 0 ? 1 : Math.min(1, Math.max(0, (now - m.at) / m.delayMs))
  return { state: now >= arrivesAt ? 'delivered' : 'sending', progress, arrivesAt, replyAt: m.at + 2 * m.delayMs }
}

/** A delay in words: seconds below 2 minutes, otherwise minutes. */
export function delayParts(ms: number): { n: number; unit: 's' | 'min' } {
  return ms < 120_000 ? { n: Math.round(ms / 100) / 10, unit: 's' } : { n: Math.round(ms / 60_000), unit: 'min' }
}
