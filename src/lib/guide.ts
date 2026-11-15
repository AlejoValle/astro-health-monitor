import { create } from 'zustand'
import { profileKey } from './profiles'

const KEY = 'tether-guide-done'

const seen = () => {
  try {
    return localStorage.getItem(profileKey(KEY)) === '1'
  } catch {
    return true
  }
}

/** The welcome guide: opens once per crew member, and again on request. */
export const useGuide = create<{ open: boolean; step: number }>(() => ({ open: !seen(), step: 0 }))

export const openGuide = () => useGuide.setState({ open: true, step: 0 })

export function closeGuide() {
  try {
    localStorage.setItem(profileKey(KEY), '1')
  } catch {
    // Shown again next time.
  }
  useGuide.setState({ open: false, step: 0 })
}
