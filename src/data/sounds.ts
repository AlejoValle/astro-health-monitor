export type SoundId = 'rain' | 'waves' | 'wind' | 'brown' | 'pink' | 'drone'

export interface Sound {
  id: SoundId
  name: string
  hint: string
}

export const SOUNDS: Sound[] = [
  { id: 'rain', name: 'Rain', hint: 'Steady rainfall' },
  { id: 'waves', name: 'Ocean waves', hint: 'Slow swell, in and out' },
  { id: 'wind', name: 'Wind', hint: 'Soft gusts' },
  { id: 'brown', name: 'Deep noise', hint: 'Low rumble that masks cabin noise' },
  { id: 'pink', name: 'Soft noise', hint: 'Even hiss for focus or sleep' },
  { id: 'drone', name: 'Calm tone', hint: 'A slow, warm hum' },
]

export const SOUND_SOURCE_IDS = ['hrp-hazards', 'hrp-risks']

export const TIMER_MINUTES = [15, 30, 60]
