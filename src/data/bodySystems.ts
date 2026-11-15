import type { HazardId, Tracker } from './hazards'
import type { AreaId } from './symptomTree'

// Paraphrased from NASA HRP "Risks of Human Spaceflight" and the hazard pages. Which hazard
// touches which system, and how a system's status is derived, are this app's reading of them.

export type SystemId = 'brain' | 'eyes' | 'heart' | 'immune' | 'gut' | 'bones' | 'muscles'

export interface BodySystem {
  id: SystemId
  name: string
  /** What it does, in one line. */
  does: string
  /** What spaceflight does to it, in one line. */
  space: string
  /** Early signs worth noticing. */
  watch: string
  hazards: HazardId[]
  trackers: Tracker[]
  /** Symptom guide area to open from this system. */
  area: AreaId
  /** Hotspot position on the figure (viewBox 0 0 200 420). */
  spot: { x: number; y: number }
  sourceIds: string[]
}

export const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'brain',
    name: 'Brain and mind',
    does: 'Thinks, decides, sleeps and sets your mood.',
    space: 'Isolation, broken sleep and radiation can slow thinking and lower mood.',
    watch: 'Slower reactions, low mood, trouble focusing.',
    hazards: ['isolation', 'radiation'],
    trackers: [{ kind: 'reaction' }, { kind: 'indicator', id: 'mood' }, { kind: 'indicator', id: 'sleep' }, { kind: 'stress' }],
    area: 'head',
    spot: { x: 100, y: 30 },
    sourceIds: ['hrp-isolation', 'hrp-radiation'],
  },
  {
    id: 'eyes',
    name: 'Eyes',
    does: 'Focus light so you see sharply.',
    space: 'In weightlessness, fluid shifts toward the head and can change the shape of the eye. NASA calls this SANS.',
    watch: 'Blurry vision or trouble reading.',
    hazards: ['gravity'],
    trackers: [{ kind: 'link', to: '/symptoms', label: 'Vision changes' }],
    area: 'head',
    spot: { x: 118, y: 52 },
    sourceIds: ['nasa-sans'],
  },
  {
    id: 'heart',
    name: 'Heart and blood vessels',
    does: 'Pump blood and oxygen to every part of the body.',
    space: 'Fluid shifts and less gravity change how the heart works. Radiation may add long-term risk.',
    watch: 'Chest pressure, a fast or irregular pulse, dizziness when you stand.',
    hazards: ['gravity', 'radiation'],
    trackers: [{ kind: 'indicator', id: 'hr' }, { kind: 'indicator', id: 'bp' }],
    area: 'chest',
    spot: { x: 112, y: 118 },
    sourceIds: ['hrp-risks', 'aha-hr'],
  },
  {
    id: 'immune',
    name: 'Immune system',
    does: 'Fights infection.',
    space: 'Stress, closed air and radiation can weaken it and wake up dormant viruses.',
    watch: 'Fever, a new rash, wounds that heal slowly.',
    hazards: ['environment', 'radiation', 'isolation'],
    trackers: [{ kind: 'indicator', id: 'temp' }],
    area: 'body',
    spot: { x: 84, y: 128 },
    sourceIds: ['hrp-environment', 'hrp-risks'],
  },
  {
    id: 'gut',
    name: 'Digestion and metabolism',
    does: 'Turns food into energy and keeps blood sugar steady.',
    space: 'A limited food system and less activity can change appetite and blood sugar.',
    watch: 'Nausea, low appetite, loose stools.',
    hazards: ['environment', 'distance'],
    trackers: [{ kind: 'indicator', id: 'glucose' }],
    area: 'stomach',
    spot: { x: 100, y: 178 },
    sourceIds: ['hrp-risks', 'ada-diagnosis'],
  },
  {
    id: 'bones',
    name: 'Bones',
    does: 'Hold you up and store calcium.',
    space: 'Without gravity, weight-bearing bones lose about 1% of their density each month unless you load them.',
    watch: 'Pain after a small knock, back pain.',
    hazards: ['gravity'],
    trackers: [{ kind: 'exercise' }],
    area: 'muscles',
    spot: { x: 84, y: 330 },
    sourceIds: ['nasa-bone-muscle'],
  },
  {
    id: 'muscles',
    name: 'Muscles',
    does: 'Move you and protect your joints.',
    space: 'Low gravity unloads muscles, so they shrink and weaken without daily exercise.',
    watch: 'Weakness, soreness, strains.',
    hazards: ['gravity'],
    trackers: [{ kind: 'exercise' }],
    area: 'muscles',
    spot: { x: 118, y: 270 },
    sourceIds: ['nasa-bone-muscle', 'nasa-exercise'],
  },
]
