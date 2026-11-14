import { create } from 'zustand'
import type { SoundId } from '../data/sounds'
import { playSound, setSoundVolume, stopSound } from './audio'

interface SoundPlayer {
  playing: SoundId | null
  volume: number
  /** When the sleep timer stops the sound, or null when it is off. */
  endsAt: number | null
  toggle: (id: SoundId) => void
  stop: () => void
  setVolume: (volume: number) => void
  setTimer: (minutes: number | null) => void
}

let timer: number | undefined

// Lives outside React so a sound keeps playing while the crew member uses other screens.
export const useSoundPlayer = create<SoundPlayer>()((set, get) => ({
  playing: null,
  volume: 0.6,
  endsAt: null,
  toggle: (id) => {
    if (get().playing === id) return get().stop()
    playSound(id, get().volume)
    set({ playing: id })
  },
  stop: () => {
    window.clearTimeout(timer)
    stopSound()
    set({ playing: null, endsAt: null })
  },
  setVolume: (volume) => {
    setSoundVolume(volume)
    set({ volume })
  },
  setTimer: (minutes) => {
    window.clearTimeout(timer)
    if (minutes === null) return set({ endsAt: null })
    timer = window.setTimeout(() => get().stop(), minutes * 60_000)
    set({ endsAt: Date.now() + minutes * 60_000 })
  },
}))
