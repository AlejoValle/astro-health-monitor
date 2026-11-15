import { sourceById } from './sources'

// Daily space quiz. Every answer comes from a source the app already cites.

export interface TriviaQuestion {
  question: string
  options: string[]
  answer: number
  explain: string
  sourceId: string
}

export const TRIVIA: TriviaQuestion[] = [
  {
    question: 'Without exercise, about how much density can weight-bearing bones lose each month in weightlessness?',
    options: ['About 1%', 'About 10%', 'None'],
    answer: 0,
    explain: 'Without load, bones such as the hips and spine lose about 1% a month. Daily resistance exercise is the countermeasure.',
    sourceId: 'nasa-bone-muscle',
  },
  {
    question: "What is NASA's limit on radiation dose for an astronaut's whole career?",
    options: ['60 mSv', '600 mSv', '6,000 mSv'],
    answer: 1,
    explain: 'NASA-STD-3001 caps the career effective dose at 600 mSv, the same for all ages and sexes.',
    sourceId: 'nasa-radiation-std',
  },
  {
    question: 'On average, how long do space station crews exercise each day?',
    options: ['About 15 minutes', 'About 2 hours', 'About 6 hours'],
    answer: 1,
    explain: 'Crews average about two hours a day on a resistance device, a treadmill and a cycle.',
    sourceId: 'nasa-exercise',
  },
  {
    question: 'What is SANS?',
    options: ['Eye changes from fluid shifting toward the head', 'A sleep disorder caused by noise', 'Sickness from a solar storm'],
    answer: 0,
    explain: 'Spaceflight Associated Neuro-ocular Syndrome: in weightlessness, fluid moves toward the head and can change the eyes.',
    sourceId: 'nasa-sans',
  },
  {
    question: 'Space motion sickness usually lasts for…',
    options: ['The first 2 to 3 days', 'The whole mission', 'Only the landing'],
    answer: 0,
    explain: 'Most crew members feel nausea or low appetite in the first 2 to 3 days while the body adapts.',
    sourceId: 'nasa-sas',
  },
  {
    question: "About how much radiation per day did NASA's Curiosity rover measure on its way to Mars?",
    options: ['About 0.01 mSv', 'About 1.8 mSv', 'About 50 mSv'],
    answer: 1,
    explain: "Curiosity's RAD instrument measured about 1.8 mSv per day inside its cruise stage.",
    sourceId: 'jpl-msl-rad',
  },
  {
    question: 'Which of the five hazards is about spending months with the same few people in a small space?',
    options: ['Gravity fields', 'Isolation and confinement', 'Hostile and closed environment'],
    answer: 1,
    explain: 'Isolation and confinement can change mood, sleep, focus and how the crew works together.',
    sourceId: 'hrp-isolation',
  },
  {
    question: 'On the ISS, about what share of the radiation dose comes from neutrons?',
    options: ['About 30%', 'Almost none', 'Almost all'],
    answer: 0,
    explain: 'Neutrons give about 30% of the dose on the station and are hard to shield, so Canada builds detectors to measure them.',
    sourceId: 'csa-radiation',
  },
  {
    question: 'What does the reaction test used on the space station help spot?',
    options: ['Fatigue', 'Bone loss', 'Low blood sugar'],
    answer: 0,
    explain: 'Slow reactions are an early sign of fatigue. Crews take a short reaction self-test like the one in Mind.',
    sourceId: 'nasa-pvt',
  },
  {
    question: 'How strong is gravity on Mars compared with Earth?',
    options: ['About 1/6', 'About 3/8', 'The same'],
    answer: 1,
    explain: 'Mars has about three eighths of Earth gravity; the Moon about one sixth.',
    sourceId: 'hrp-gravity',
  },
  {
    question: 'From what temperature does the CDC count a fever?',
    options: ['37.0 °C', '38.0 °C', '40.0 °C'],
    answer: 1,
    explain: 'A measured temperature of 38 °C (100.4 °F) or more is a fever.',
    sourceId: 'cdc-fever',
  },
  {
    question: 'What fresh food has NASA grown aboard the space station with Veggie?',
    options: ['Lettuce and other leafy greens', 'Apples', 'Rice'],
    answer: 0,
    explain: 'Veggie has grown red romaine lettuce and other greens that the crew could eat. Tending them also brings a bit of Earth on board.',
    sourceId: 'nasa-veggie',
  },
]

/** The question for a given day: the same all day, a new one tomorrow. */
export function questionOfDay(ts: number): number {
  const d = new Date(ts)
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
  return day % TRIVIA.length
}

/** Every question cites a source the app knows. Used by a test. */
export const triviaSourcesExist = () => TRIVIA.every((q) => !!sourceById(q.sourceId))
