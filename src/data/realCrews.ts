// What happened to real crews, as published by NASA, and what Tether tracks because of it.

export interface Finding {
  text: string
  /** The Tether screen that keeps an eye on it. */
  link: string
  linkLabel: string
}

export interface RealCase {
  id: string
  title: string
  mission: string
  findings: Finding[]
  sourceIds: string[]
}

export const REAL_CASES: RealCase[] = [
  {
    id: 'twins',
    title: 'NASA Twins Study',
    mission: 'Scott Kelly spent 340 days on the space station while his identical twin Mark stayed on Earth.',
    findings: [
      { text: 'About 91.3% of the changes in his gene expression went back to normal after returning to Earth.', link: '/timeline', linkLabel: 'Mission timeline' },
      { text: 'He lost 7% of his body mass and ate about 30% fewer calories than expected.', link: '/nutrition', linkLabel: 'Nutrition' },
      { text: 'Speed and accuracy on cognitive tests dropped after landing and stayed lower for six months.', link: '/games', linkLabel: 'Brain games' },
      { text: 'The wall of his carotid artery thickened and signs of inflammation rose during and right after the mission.', link: '/measure?i=bp', linkLabel: 'Blood pressure' },
      { text: 'Bone turned over faster in the first six months, and slowed in the second half when he exercised less.', link: '/exercise', linkLabel: 'Exercise' },
    ],
    sourceIds: ['nasa-twins'],
  },
  {
    id: 'apollo',
    title: 'Apollo crews',
    mission: 'Apollo missions to the Moon, 1968 to 1972.',
    findings: [
      { text: 'Two cases of irregular heartbeat in flight, cause undetermined, possibly linked with low potassium.', link: '/scenarios', linkLabel: 'Apollo 15 case' },
    ],
    sourceIds: ['nasa-apollo-medical'],
  },
  {
    id: 'station',
    title: 'Space station crews',
    mission: 'Crews living on the station for six months at a time.',
    findings: [
      { text: 'Without exercise, weight-bearing bones lose about 1% of their density a month.', link: '/exercise', linkLabel: 'Exercise' },
      { text: 'Most crew members feel nausea or low appetite in the first 2 to 3 days while the body adapts.', link: '/symptoms', linkLabel: 'Symptom guide' },
      { text: 'Medicines stored in space for longer fell short of their strength more often, regardless of the expiry date.', link: '/medkit', linkLabel: 'Medical kit' },
    ],
    sourceIds: ['nasa-bone-muscle', 'nasa-sas', 'nasa-pharma'],
  },
  {
    id: 'curiosity',
    title: 'Curiosity on the way to Mars',
    mission: 'NASA’s rover measured radiation inside its spacecraft during the 8-month cruise, as a stand-in for a crew.',
    findings: [
      { text: 'About 1.8 mSv a day. At that rate, about a year of travel to Mars and back would add about 650 mSv, more than NASA’s 600 mSv career limit.', link: '/radiation', linkLabel: 'Radiation planner' },
    ],
    sourceIds: ['jpl-msl-rad'],
  },
]
