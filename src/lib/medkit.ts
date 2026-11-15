import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { msg } from '../i18n/msg'
import type { Status } from './rules'

// The crew medical kit is shared by everyone on board, so it is stored once for the device,
// not per profile. The contents below are an example list by purpose, without doses: the flight
// surgeon's own kit list and instructions always come first.

const DAY = 24 * 60 * 60 * 1000
const MONTH = 30 * DAY

export interface KitItem {
  id: string
  name: string
  purpose: string
  count: number
  expires: number
}

const EXAMPLE: (Omit<KitItem, 'expires'> & { months: number })[] = [
  { id: 'pain', name: msg('Pain and fever reliever'), purpose: msg('Headache, back pain, fever'), count: 40, months: 18 },
  { id: 'nausea', name: msg('Anti-nausea medicine'), purpose: msg('Space motion sickness'), count: 20, months: 14 },
  { id: 'sleep', name: msg('Sleep aid'), purpose: msg('Only as the flight surgeon directs'), count: 10, months: 2 },
  { id: 'decongestant', name: msg('Nasal decongestant'), purpose: msg('Stuffy nose from the fluid shift'), count: 12, months: 20 },
  { id: 'allergy', name: msg('Allergy medicine'), purpose: msg('Itching, rash, runny nose'), count: 2, months: 24 },
  { id: 'eyedrops', name: msg('Lubricating eye drops'), purpose: msg('Dry eyes from the cabin air'), count: 6, months: 10 },
  { id: 'dressing', name: msg('Wound dressings'), purpose: msg('Cuts and scrapes'), count: 30, months: 36 },
  { id: 'burn', name: msg('Burn gel'), purpose: msg('Minor burns'), count: 4, months: 1 },
]

const exampleKit = (now: number): KitItem[] =>
  EXAMPLE.map(({ months, ...item }) => ({ ...item, expires: now + months * MONTH }))

/** Days within which an expiry is flagged. */
export const EXPIRY_SOON_DAYS = 60
/** Count at or below which an item is running low. */
export const LOW_COUNT = 2

export function itemStatus(item: Pick<KitItem, 'count' | 'expires'>, now: number): { status: Status; label: string } {
  if (item.expires <= now) return { status: 'alert', label: msg('Expired') }
  if (item.count <= 0) return { status: 'alert', label: msg('Empty') }
  if (item.expires - now <= EXPIRY_SOON_DAYS * DAY) return { status: 'watch', label: msg('Expires soon') }
  if (item.count <= LOW_COUNT) return { status: 'watch', label: msg('Running low') }
  return { status: 'ok', label: msg('OK') }
}

interface Kit {
  items: KitItem[]
  use: (id: string) => void
  update: (id: string, patch: Partial<KitItem>) => void
  add: (item: Omit<KitItem, 'id'>) => void
  remove: (id: string) => void
  reset: () => void
}

export const useMedkit = create<Kit>()(
  persist(
    (set) => ({
      items: exampleKit(Date.now()),
      use: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, count: Math.max(0, i.count - 1) } : i)) })),
      update: (id, patch) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      add: (item) => set((s) => ({ items: [...s.items, { ...item, id: Math.random().toString(36).slice(2, 9) }] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      reset: () => set({ items: exampleKit(Date.now()) }),
    }),
    { name: 'tether-medkit' },
  ),
)
