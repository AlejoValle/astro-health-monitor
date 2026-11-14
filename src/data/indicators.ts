export type IndicatorId = 'bp' | 'hr' | 'glucose' | 'temp' | 'sleep' | 'mood'

export type BodySystem = 'cardiovascular' | 'metabolic' | 'immune' | 'behavioral'

export interface IndicatorField {
  key: string
  label: string
  min: number
  max: number
  step: number
  /** Where the +/- buttons start when the field is empty. Not a default reading. */
  start: number
}

export interface Indicator {
  id: IndicatorId
  name: string
  short: string
  unit: string
  system: BodySystem
  fields: IndicatorField[]
  howTo: string[]
  why: string
  sourceIds: string[]
}

export const INDICATORS: Indicator[] = [
  {
    id: 'hr',
    name: 'Resting heart rate',
    short: 'Heart rate',
    unit: 'bpm',
    system: 'cardiovascular',
    fields: [{ key: 'bpm', label: 'Beats per minute', min: 20, max: 250, step: 1, start: 70 }],
    howTo: [
      'Stay still and calm for 5 minutes.',
      'Read your sensor, or count your pulse for 30 seconds and double it.',
    ],
    why: 'Spaceflight changes how the heart and blood vessels work.',
    sourceIds: ['aha-hr', 'hrp-risks'],
  },
  {
    id: 'bp',
    name: 'Blood pressure',
    short: 'Blood pressure',
    unit: 'mmHg',
    system: 'cardiovascular',
    fields: [
      { key: 'sys', label: 'Top number (systolic)', min: 50, max: 260, step: 1, start: 120 },
      { key: 'dia', label: 'Bottom number (diastolic)', min: 30, max: 180, step: 1, start: 80 },
    ],
    howTo: [
      'Rest for 5 minutes with your arm supported.',
      'Place the cuff on your bare upper arm and start the monitor.',
      'Enter the top and bottom numbers.',
    ],
    why: 'Fluid shifts toward the head in microgravity and the cardiovascular system adapts.',
    sourceIds: ['aha-bp', 'hrp-risks'],
  },
  {
    id: 'glucose',
    name: 'Fasting blood glucose',
    short: 'Glucose',
    unit: 'mg/dL',
    system: 'metabolic',
    fields: [{ key: 'mgdl', label: 'Glucose', min: 20, max: 600, step: 1, start: 90 }],
    howTo: [
      'Measure before eating, at least 8 hours after your last meal.',
      'Clean your fingertip, use the lancet and apply the drop to the strip.',
    ],
    why: 'Nutrition is a tracked risk on long missions with a limited food system.',
    sourceIds: ['ada-diagnosis', 'ada-low', 'hrp-risks'],
  },
  {
    id: 'temp',
    name: 'Body temperature',
    short: 'Temperature',
    unit: '°C',
    system: 'immune',
    fields: [{ key: 'c', label: 'Temperature', min: 30, max: 43, step: 0.1, start: 36.5 }],
    howTo: ['Use the thermometer as instructed and wait for the beep.'],
    why: 'Spaceflight can alter immune responses, so a fever deserves early attention.',
    sourceIds: ['cdc-fever', 'hrp-risks'],
  },
  {
    id: 'sleep',
    name: 'Sleep last night',
    short: 'Sleep',
    unit: 'h',
    system: 'behavioral',
    fields: [{ key: 'h', label: 'Hours slept', min: 0, max: 16, step: 0.5, start: 7 }],
    howTo: ['Count the hours you actually slept, not the time in your sleep station.'],
    why: 'Irregular schedules and a noisy closed habitat make sleep loss a tracked risk.',
    sourceIds: ['cdc-sleep', 'hrp-risks'],
  },
  {
    id: 'mood',
    name: 'Mood today',
    short: 'Mood',
    unit: '/ 5',
    system: 'behavioral',
    fields: [{ key: 'score', label: 'Mood', min: 1, max: 5, step: 1, start: 3 }],
    howTo: ['Pick the face that matches how you feel right now.'],
    why: 'Isolation and confinement can change behavior and mood over a long mission.',
    sourceIds: ['hrp-hazards', 'hrp-risks'],
  },
]

export const indicatorById = (id: IndicatorId) => INDICATORS.find((i) => i.id === id)!
