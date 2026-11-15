import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getActiveProfileId, settingsKeyFor } from './profiles'
import type { LocationId } from '../data/locations'
import type { SolarActivity } from '../data/radiation'
import type { Lang } from '../i18n'

export interface Mission {
  /** When the current mission started, as a timestamp. Null until set. */
  missionStart: number | null
  /** Effective dose from earlier missions, in mSv. */
  priorDoseMSv: number
  solar: SolarActivity
}

interface Settings extends Mission {
  locationId: LocationId
  setLocation: (id: LocationId) => void
  setMission: (patch: Partial<Mission>) => void
  /** Browser notifications when a routine slot starts with tasks due. */
  reminders: boolean
  setReminders: (on: boolean) => void
  /** Interface language. English unless the crew member picks another. */
  language: Lang
  setLanguage: (lang: Lang) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      locationId: 'orbit',
      missionStart: null,
      priorDoseMSv: 0,
      solar: 'max',
      setLocation: (locationId) => set({ locationId }),
      setMission: (patch) => set(patch),
      reminders: false,
      setReminders: (reminders) => set({ reminders }),
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    // Each crew profile keeps its own settings: language, location and mission.
    { name: settingsKeyFor(getActiveProfileId()) },
  ),
)
