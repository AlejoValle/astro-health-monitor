export type LocationId = 'orbit' | 'transit' | 'moon' | 'mars'

export interface MissionLocation {
  id: LocationId
  name: string
  gravity: string
  /** Whether the ground team can answer in real time. */
  contact: 'real-time' | 'delayed'
  contactLabel: string
  sourceIds: string[]
}

export const LOCATIONS: MissionLocation[] = [
  {
    id: 'orbit',
    name: 'Earth orbit',
    gravity: 'Microgravity',
    contact: 'real-time',
    contactLabel: 'Ground team in real time',
    sourceIds: ['hrp-hazards'],
  },
  {
    id: 'transit',
    name: 'Deep space transit',
    gravity: 'Microgravity',
    contact: 'delayed',
    contactLabel: 'Delayed contact with ground',
    sourceIds: ['hrp-hazards'],
  },
  {
    id: 'moon',
    name: 'Lunar surface',
    gravity: '1/6 of Earth gravity',
    contact: 'real-time',
    contactLabel: 'Ground team within seconds',
    sourceIds: ['hrp-hazards'],
  },
  {
    id: 'mars',
    name: 'Mars surface',
    gravity: '3/8 of Earth gravity',
    contact: 'delayed',
    contactLabel: 'Delayed contact with ground',
    sourceIds: ['hrp-hazards'],
  },
]

export const locationById = (id: LocationId) => LOCATIONS.find((l) => l.id === id)!
