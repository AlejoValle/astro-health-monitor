import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocationId } from '../data/locations'

interface Settings {
  locationId: LocationId
  setLocation: (id: LocationId) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      locationId: 'orbit',
      setLocation: (locationId) => set({ locationId }),
    }),
    { name: 'astrovitals-settings' },
  ),
)
