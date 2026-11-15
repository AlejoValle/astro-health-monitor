import type { LocationId } from './locations'

// Example missions for the dose planner. The legs are this app's simplified examples; the dose
// rate for each leg comes from NASA (see DOSE_RATE in data/radiation.ts).

export type PlanId = 'iss' | 'moon' | 'mars'

export interface MissionPlan {
  id: PlanId
  name: string
  note: string
  legs: { location: LocationId; days: number }[]
}

export const MISSION_PLANS: MissionPlan[] = [
  {
    id: 'iss',
    name: 'Space station, 6 months',
    note: 'A typical station increment in low Earth orbit.',
    legs: [{ location: 'orbit', days: 180 }],
  },
  {
    id: 'moon',
    name: 'Lunar mission, 30 days',
    note: 'About 3 weeks in deep space around the Moon and 1 week on the surface.',
    legs: [
      { location: 'transit', days: 23 },
      { location: 'moon', days: 7 },
    ],
  },
  {
    id: 'mars',
    name: 'Mars mission, about 2.4 years',
    note: 'About 6 months each way and about 500 days on the surface.',
    legs: [
      { location: 'transit', days: 180 },
      { location: 'mars', days: 500 },
      { location: 'transit', days: 180 },
    ],
  },
]

/**
 * NOAA Space Weather Scale for solar radiation storms. Flux is protons of 10 MeV or more per
 * square centimetre, per second, per steradian. Source: NOAA SWPC.
 */
export const STORM_SCALE = [
  { level: 'S1', name: 'Minor', flux: '10', perCycle: '50', crew: 'No biological effect listed by NOAA.' },
  { level: 'S2', name: 'Moderate', flux: '100', perCycle: '25', crew: 'No direct effect listed for astronauts; high-latitude aircraft may see a small increase.' },
  { level: 'S3', name: 'Strong', flux: '1,000', perCycle: '10', crew: 'NOAA recommends that astronauts on a spacewalk avoid the radiation.' },
  { level: 'S4', name: 'Severe', flux: '10,000', perCycle: '3', crew: 'NOAA lists an unavoidable radiation hazard for astronauts on a spacewalk.' },
  { level: 'S5', name: 'Extreme', flux: '100,000', perCycle: '<1', crew: 'NOAA lists an unavoidable high radiation hazard for astronauts on a spacewalk.' },
] as const

/** What Tether tells the crew at each level. This app's choice, built on NOAA and NASA guidance. */
export const STORM_ACTION: Record<string, string> = {
  S1: 'Carry on. Keep your dosimeter on and check it after the event.',
  S2: 'Carry on inside. Keep your dosimeter on and avoid planning a spacewalk until it passes.',
  S3: 'Do not start a spacewalk. If you are outside, head back. Stay near the shelter.',
  S4: 'Stop any spacewalk now and go to the storm shelter until the alert is cleared.',
  S5: 'Stop any spacewalk now and go to the storm shelter until the alert is cleared.',
}
