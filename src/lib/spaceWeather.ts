import type { LocationId } from '../data/locations'
import { msg } from '../i18n/msg'
import type { Status } from './rules'

// Live space weather from NASA's Space Weather Database Of Notifications, Knowledge,
// Information (DONKI), run by the Community Coordinated Modeling Center. Fetched when a link is
// available and cached on the device, so the last known picture is there offline too.

export type EventType = 'SEP' | 'FLR' | 'GST' | 'RBE' | 'CME' | 'IPS' | 'MPC'

export interface SpaceEvent {
  id: string
  type: EventType
  at: number
  url: string
}

export interface SpaceWeather {
  fetchedAt: number
  events: SpaceEvent[]
}

export const EVENT_LABEL: Record<EventType, string> = {
  SEP: msg('Solar energetic particles'),
  FLR: msg('Solar flare'),
  GST: msg('Geomagnetic storm'),
  RBE: msg('Radiation belt enhancement'),
  CME: msg('Coronal mass ejection'),
  IPS: msg('Interplanetary shock'),
  MPC: msg('Magnetopause crossing'),
}

const KNOWN = new Set<string>(Object.keys(EVENT_LABEL))
const DAY = 24 * 60 * 60 * 1000
const API_KEY = (import.meta.env.VITE_NASA_API_KEY as string | undefined) || 'DEMO_KEY'
const CACHE_KEY = 'tether-space-weather'
/** Refresh at most once an hour, to stay well inside the NASA API rate limit. */
export const MAX_AGE_MS = 60 * 60 * 1000

/** Turns DONKI notifications into events, newest first. Unknown types are dropped. */
export function parseNotifications(raw: unknown): SpaceEvent[] {
  if (!Array.isArray(raw)) return []
  return raw
    .flatMap((m: { messageType?: string; messageID?: string; messageIssueTime?: string; messageURL?: string }) => {
      if (!m.messageType || !KNOWN.has(m.messageType) || !m.messageIssueTime) return []
      const at = Date.parse(m.messageIssueTime.endsWith('Z') ? m.messageIssueTime : `${m.messageIssueTime}Z`)
      if (Number.isNaN(at)) return []
      return [{ id: m.messageID ?? `${m.messageType}-${at}`, type: m.messageType as EventType, at, url: m.messageURL ?? '' }]
    })
    .sort((a, b) => b.at - a.at)
}

export interface SpaceWeatherAssessment {
  status: Status
  title: string
  advice: string
  /** Events that set the status. */
  drivers: SpaceEvent[]
}

/**
 * What the recent events mean for the crew member. Particles (SEP) arriving in the last 3 days
 * mean act: they are what the storm shelter is for. Flares, geomagnetic storms and, in Earth
 * orbit, radiation belt enhancements are worth watching. Thresholds are this app's choice.
 */
export function assessSpaceWeather(events: SpaceEvent[], now: number, location: LocationId): SpaceWeatherAssessment {
  const within = (e: SpaceEvent, days: number) => e.at >= now - days * DAY
  const sep = events.filter((e) => e.type === 'SEP' && within(e, 3))
  if (sep.length)
    return {
      status: 'alert',
      title: msg('Solar particles are arriving'),
      advice: msg('Follow the solar storm steps, stay close to the shelter and log your dosimeter afterwards.'),
      drivers: sep,
    }
  const watch = events.filter(
    (e) =>
      (e.type === 'FLR' && within(e, 2)) ||
      (e.type === 'GST' && within(e, 3)) ||
      (e.type === 'RBE' && location === 'orbit' && within(e, 2)),
  )
  if (watch.length)
    return {
      status: 'watch',
      title: msg('Active space weather'),
      advice: msg('Check with the radiation team before a spacewalk and keep the storm steps at hand.'),
      drivers: watch,
    }
  return {
    status: 'ok',
    title: msg('Space weather is quiet'),
    advice: msg('No solar particle event in the last 3 days. Keep logging your dosimeter weekly.'),
    drivers: [],
  }
}

export function readCache(): SpaceWeather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as SpaceWeather) : null
  } catch {
    return null
  }
}

function writeCache(data: SpaceWeather) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Without storage the data lasts for this visit only.
  }
}

/** Last 14 days of DONKI notifications from api.nasa.gov, cached on the device. */
export async function fetchSpaceWeather(now = Date.now()): Promise<SpaceWeather> {
  const day = (ts: number) => new Date(ts).toISOString().slice(0, 10)
  const url = `https://api.nasa.gov/DONKI/notifications?startDate=${day(now - 14 * DAY)}&endDate=${day(now)}&type=all&api_key=${API_KEY}`
  const ctl = new AbortController()
  const timer = window.setTimeout(() => ctl.abort(), 12_000)
  try {
    const res = await fetch(url, { signal: ctl.signal })
    if (!res.ok) throw new Error(`DONKI ${res.status}`)
    const data = { fetchedAt: now, events: parseNotifications(await res.json()) }
    writeCache(data)
    return data
  } finally {
    window.clearTimeout(timer)
  }
}
