// Where Tether's ideas help on Earth: places far from a doctor, with small isolated teams and
// unreliable internet. These are the team's own proposals, not NASA programmes.

export type EarthUseId = 'antarctica' | 'submarine' | 'offshore' | 'rural' | 'expedition' | 'home'

export interface EarthUse {
  id: EarthUseId
  title: string
  who: string
  body: string
  /** Tether features that carry over as they are. */
  uses: string[]
}

export const EARTH_USES: EarthUse[] = [
  {
    id: 'antarctica',
    title: 'Polar research stations',
    who: 'Winter-over crews in Antarctica',
    body: 'Months of darkness, a small team and no way out until spring: the same isolation and confinement crews face in space.',
    uses: ['Mood and stress trends', 'Crew goals', 'Works offline'],
  },
  {
    id: 'submarine',
    title: 'Submarines',
    who: 'Crews on long patrols',
    body: 'Shift work, no daylight and limited contact with shore make sleep and mood worth tracking day by day.',
    uses: ['Sleep debt warnings', 'Brain games', 'Works offline'],
  },
  {
    id: 'offshore',
    title: 'Offshore platforms and ships',
    who: 'Workers weeks away from a hospital',
    body: 'A medic on board can see the whole crew at a glance and send a clear report to a doctor on shore.',
    uses: ['Mission control', 'Report for the doctor', 'Symptom guide'],
  },
  {
    id: 'rural',
    title: 'Remote rural areas',
    who: 'Communities without a nearby doctor',
    body: 'People can follow their blood pressure, glucose and temperature, and know when a change needs a doctor.',
    uses: ['Early warnings', 'Personal baseline', 'Six languages'],
  },
  {
    id: 'expedition',
    title: 'Expeditions and high altitude',
    who: 'Mountaineers and field scientists',
    body: 'A quick daily check-in and clear steps for when to turn back, with no signal needed.',
    uses: ['Daily check-in', 'Symptom guide', 'Works offline'],
  },
  {
    id: 'home',
    title: 'Self-care at home',
    who: 'Anyone keeping an eye on their own health',
    body: 'A routine that rewards real measurements and explains every number in plain words.',
    uses: ['Routine and points', 'Trends', 'Sources for every number'],
  },
]
