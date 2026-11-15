import { useSyncExternalStore } from 'react'
import { msg } from '../i18n/msg'

// Crew profiles on one shared device. Each profile has its own database and settings, so one
// crew member's readings never mix with another's. Switching reloads the app on that profile.

export type RoleId = 'commander' | 'pilot' | 'engineer' | 'specialist' | 'medical'

export const ROLES: Record<RoleId, string> = {
  commander: msg('Commander'),
  pilot: msg('Pilot'),
  engineer: msg('Flight engineer'),
  specialist: msg('Mission specialist'),
  medical: msg('Crew medical officer'),
}

export const PROFILE_COLORS = ['#7dd3fc', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#2dd4bf', '#f472b6']

export interface Profile {
  id: string
  name: string
  role: RoleId
  callSign?: string
  color: string
  createdAt: number
  /** Set for demo crew members created from a use-case scenario. */
  scenario?: string
}

/** The profile that existed before profiles: it keeps the original database and settings. */
export const DEFAULT_ID = 'default'

const REGISTRY_KEY = 'tether-profiles'
const ACTIVE_KEY = 'tether-active-profile'
const CHANGE_EVENT = 'tether:profiles'

const DEFAULT_PROFILE: Profile = { id: DEFAULT_ID, name: 'Crew member', role: 'specialist', color: PROFILE_COLORS[0], createdAt: 0 }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage blocked: profiles then last for this visit only.
  }
}

export function listProfiles(): Profile[] {
  const list = read<Profile[]>(REGISTRY_KEY, [])
  return list.length ? list : [DEFAULT_PROFILE]
}

export function getActiveProfileId(): string {
  const id = read<string>(ACTIVE_KEY, DEFAULT_ID)
  return listProfiles().some((p) => p.id === id) ? id : listProfiles()[0].id
}

export const dbNameFor = (id: string) => (id === DEFAULT_ID ? 'astrovitals' : `tether-${id}`)
export const settingsKeyFor = (id: string) => (id === DEFAULT_ID ? 'astrovitals-settings' : `tether-settings-${id}`)

/** A per-profile localStorage key. The default profile keeps the original key. */
export function profileKey(base: string, id = getActiveProfileId()) {
  return id === DEFAULT_ID ? base : `${base}:${id}`
}

function saveProfiles(list: Profile[]) {
  write(REGISTRY_KEY, list)
  snapshot = null
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function createProfile(input: Omit<Profile, 'id' | 'createdAt' | 'color'> & { color?: string }): Profile {
  const list = listProfiles()
  const profile: Profile = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    color: input.color ?? PROFILE_COLORS[list.length % PROFILE_COLORS.length],
    createdAt: Date.now(),
  }
  saveProfiles([...list, profile])
  return profile
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>) {
  saveProfiles(listProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p)))
}

/** Removes a profile from the registry and its settings. The caller deletes its database. */
export function removeProfile(id: string) {
  const rest = listProfiles().filter((p) => p.id !== id)
  saveProfiles(rest.length ? rest : [DEFAULT_PROFILE])
  try {
    localStorage.removeItem(settingsKeyFor(id))
  } catch {
    // Nothing to clean.
  }
}

/** Switches the device to another crew member. The app reloads to open that profile's data. */
export function switchProfile(id: string) {
  write(ACTIVE_KEY, id)
  window.location.reload()
}

/** Writes initial settings for a profile that has not been opened yet. */
export function seedProfileSettings(id: string, state: Record<string, unknown>) {
  write(settingsKeyFor(id), { state, version: 0 })
}

let snapshot: Profile[] | null = null
const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** All crew profiles, kept up to date when they change. */
export function useProfiles(): Profile[] {
  return useSyncExternalStore(subscribe, () => (snapshot ??= listProfiles()))
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?'
