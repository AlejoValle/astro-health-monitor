// What the body goes through over a mission, in plain words, with the NASA source for each step.
// Day ranges are approximate and only place each change on the timeline.

export interface Milestone {
  id: string
  /** First and last mission day it applies to. `to` null means it lasts the whole mission. */
  from: number
  to: number | null
  when: string
  title: string
  body: string
  /** Where Tether helps with it. */
  link: string
  toLabel: string
  sourceIds: string[]
}

export const TIMELINE: Milestone[] = [
  {
    id: 'sas',
    from: 1,
    to: 3,
    when: 'Days 1 to 3',
    title: 'Space motion sickness',
    body: 'Most crew members feel nausea or low appetite while the inner ear adapts. It usually passes in 2 to 3 days.',
    link: '/symptoms',
    toLabel: 'Symptom guide',
    sourceIds: ['nasa-sas'],
  },
  {
    id: 'fluid',
    from: 1,
    to: 14,
    when: 'First weeks',
    title: 'Fluids move toward the head',
    body: 'Without gravity pulling them down, body fluids shift up: a puffy face, a stuffy nose and sometimes a headache. The heart and blood vessels adapt to it.',
    link: '/measure?i=bp',
    toLabel: 'Blood pressure',
    sourceIds: ['hrp-gravity', 'nasa-sans'],
  },
  {
    id: 'radiation',
    from: 1,
    to: null,
    when: 'Every day',
    title: 'Radiation adds up',
    body: 'You cannot feel it, but every day in space adds to your dose. Deep space adds more than Earth orbit.',
    link: '/radiation',
    toLabel: 'Radiation',
    sourceIds: ['nasa-m2m-radiation'],
  },
  {
    id: 'bone',
    from: 30,
    to: null,
    when: 'From the first month',
    title: 'Bone and muscle loss',
    body: 'Without load, bones such as the hips and spine lose about 1% a month and muscles weaken. Daily exercise is the countermeasure.',
    link: '/exercise',
    toLabel: 'Exercise',
    sourceIds: ['nasa-bone-muscle', 'nasa-exercise'],
  },
  {
    id: 'sans',
    from: 30,
    to: null,
    when: 'Long missions',
    title: 'Changes to the eyes (SANS)',
    body: 'On long missions, the fluid shift can change the back of the eye and blur near vision. Report any change in how you see.',
    link: '/symptoms',
    toLabel: 'Symptom guide',
    sourceIds: ['nasa-sans'],
  },
  {
    id: 'isolation',
    from: 60,
    to: null,
    when: 'Months into the mission',
    title: 'Isolation and confinement',
    body: 'Months with the same few people in a small space can wear down mood, sleep and focus. Watch the trend, not one bad day.',
    link: '/mind',
    toLabel: 'Mind',
    sourceIds: ['hrp-isolation'],
  },
  {
    id: 'return',
    from: -1,
    to: null,
    when: 'Back in gravity',
    title: 'Readapting to gravity',
    body: 'After landing on a planet or coming home, balance, coordination and standing up can be hard for a while. Move slowly at first.',
    link: '/hazards',
    toLabel: 'Hazards',
    sourceIds: ['hrp-gravity'],
  },
]

/** Whether a milestone applies on a mission day. The return to gravity is shown at the end. */
export const isActive = (m: Milestone, day: number) => m.from > 0 && day >= m.from && (m.to === null || day <= m.to)
