import { msg } from '../i18n/msg'
import type { IndicatorId } from './indicators'
import type { LocationId } from './locations'

export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment'

/** Something in the app the crew member can check or use for a hazard. */
export type Tracker =
  | { kind: 'indicator'; id: IndicatorId }
  | { kind: 'radiation' }
  | { kind: 'stress' }
  | { kind: 'reaction' }
  | { kind: 'link'; to: string; label: string }

/** How strongly the hazard weighs at a location: 1 lower, 2 moderate, 3 higher. App's own synthesis. */
export type Level = 1 | 2 | 3

export interface Hazard {
  id: HazardId
  name: string
  short: string
  /** What the hazard does to the body, in one plain sentence. */
  body: string
  level: Record<LocationId, { level: Level; why: string }>
  trackers: Tracker[]
  sourceIds: string[]
}

// Paraphrased from NASA HRP "5 Hazards of Human Spaceflight" and each hazard's page.
// The level at each location is this app's reading of those sources, not a NASA rating.
export const HAZARDS: Hazard[] = [
  {
    id: 'radiation',
    short: 'Radiation',
    name: 'Space radiation',
    body: 'Invisible and silent. Over time it raises cancer risk and can affect the brain, heart and immune system.',
    level: {
      orbit: { level: 1, why: "Earth's magnetic field still blocks part of it." },
      transit: { level: 3, why: 'No planet and no magnetic field around you.' },
      moon: { level: 2, why: 'No atmosphere, but the Moon blocks half the sky.' },
      mars: { level: 2, why: 'Thin atmosphere; the planet blocks half the sky.' },
    },
    trackers: [{ kind: 'radiation' }],
    sourceIds: ['hrp-radiation', 'nasa-m2m-radiation', 'csa-radiation'],
  },
  {
    id: 'isolation',
    short: 'Isolation',
    name: 'Isolation and confinement',
    body: 'Months in a small space with the same few people can change mood, sleep, focus and how the crew works together.',
    level: {
      orbit: { level: 1, why: 'Frequent calls home and Earth in the window.' },
      transit: { level: 3, why: 'Months away with delayed messages home.' },
      moon: { level: 2, why: 'Far away, but calls home still work.' },
      mars: { level: 3, why: 'Years away with delayed messages home.' },
    },
    trackers: [
      { kind: 'indicator', id: 'mood' },
      { kind: 'indicator', id: 'sleep' },
      { kind: 'stress' },
      { kind: 'reaction' },
    ],
    sourceIds: ['hrp-isolation', 'hrp-hazards'],
  },
  {
    id: 'distance',
    short: 'Distance',
    name: 'Distance from Earth',
    body: 'The farther away, the longer help, supplies and answers take. The crew has to spot and handle problems itself.',
    level: {
      orbit: { level: 1, why: 'Real-time contact and a return within hours.' },
      transit: { level: 3, why: 'Delayed contact and no quick way home.' },
      moon: { level: 2, why: 'Contact within seconds, return takes days.' },
      mars: { level: 3, why: 'Messages take minutes each way.' },
    },
    trackers: [
      { kind: 'link', to: '/symptoms', label: 'Symptom guide' },
      { kind: 'link', to: '/trends', label: 'Trends' },
    ],
    sourceIds: ['hrp-distance', 'nasa-medcare'],
  },
  {
    id: 'gravity',
    short: 'Gravity',
    name: 'Gravity fields',
    body: 'Less gravity shifts fluids to the head and weakens bones, muscles and the heart. Each change of gravity takes adjusting.',
    level: {
      orbit: { level: 3, why: 'Microgravity all the time.' },
      transit: { level: 3, why: 'Microgravity for months.' },
      moon: { level: 2, why: 'One sixth of Earth gravity.' },
      mars: { level: 2, why: 'Three eighths of Earth gravity.' },
    },
    trackers: [
      { kind: 'indicator', id: 'hr' },
      { kind: 'indicator', id: 'bp' },
      { kind: 'link', to: '/exercise', label: 'Exercise plan' },
      { kind: 'link', to: '/symptoms', label: 'Vision changes' },
    ],
    sourceIds: ['hrp-gravity', 'nasa-bone-muscle', 'nasa-sans'],
  },
  {
    id: 'environment',
    short: 'Habitat',
    name: 'Hostile and closed environment',
    body: 'The air, temperature, noise, light and microbes all come from the vehicle. They affect sleep and the immune system.',
    level: {
      orbit: { level: 2, why: 'Closed air and constant fan noise.' },
      transit: { level: 2, why: 'Closed air with no resupply.' },
      moon: { level: 3, why: 'Closed habitat plus fine, sharp dust.' },
      mars: { level: 3, why: 'Closed habitat plus dust.' },
    },
    trackers: [
      { kind: 'indicator', id: 'temp' },
      { kind: 'indicator', id: 'glucose' },
      { kind: 'link', to: '/sounds', label: 'Sleep sounds' },
    ],
    sourceIds: ['hrp-environment', 'hrp-risks'],
  },
]

export const LEVEL_WORD: Record<Level, string> = { 1: msg('Lower'), 2: msg('Moderate'), 3: msg('Higher') }
