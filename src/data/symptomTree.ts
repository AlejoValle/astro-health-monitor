import type { IndicatorId } from './indicators'
import type { Status } from '../lib/rules'

// The tree is plain data walked by lib/triage.ts, so branches can be added without touching code.
// Every outcome cites where its reasoning comes from (see data/sources.ts). It is triage guidance:
// a likely explanation, what to do now and when to contact the flight surgeon. It is not a diagnosis.

export type AreaId = 'head' | 'chest' | 'stomach' | 'muscles' | 'body'

export interface Area {
  id: AreaId
  label: string
  hint: string
  start: string
}

export interface QuestionNode {
  kind: 'question'
  text: string
  help?: string
  /** Offers a shortcut to measure this indicator when the crew member is unsure. */
  measure?: IndicatorId
  yes: string
  no: string
}

export interface OutcomeNode {
  kind: 'outcome'
  status: Status
  title: string
  meaning: string
  steps: string[]
  escalate: boolean
  measure?: IndicatorId[]
  sourceIds: string[]
}

export type TreeNode = QuestionNode | OutcomeNode

export const AREAS: Area[] = [
  { id: 'head', label: 'Head and eyes', hint: 'Headache, vision, dizziness', start: 'head-vision' },
  { id: 'chest', label: 'Chest and breathing', hint: 'Pain, pressure, short of breath', start: 'chest-pressure' },
  { id: 'stomach', label: 'Stomach', hint: 'Nausea, vomiting, loose stools', start: 'stomach-fever' },
  { id: 'muscles', label: 'Back, muscles and bones', hint: 'Pain, strain, injury', start: 'muscles-injury' },
  { id: 'body', label: 'Whole body and skin', hint: 'Fever, rash, tiredness', start: 'body-fever' },
]

const RECENT_GRAVITY_CHANGE = 'Did you reach weightlessness, or land on a new surface, in the last few days?'

export const NODES: Record<string, TreeNode> = {
  // Head and eyes
  'head-vision': {
    kind: 'question',
    text: 'Is your vision blurry, or is it harder to read than before?',
    yes: 'out-vision',
    no: 'head-stiff-neck',
  },
  'head-stiff-neck': {
    kind: 'question',
    text: 'Do you have a headache with a stiff neck and a fever?',
    help: 'Fever means 38 °C or more.',
    measure: 'temp',
    yes: 'out-serious-infection',
    no: 'head-adapting',
  },
  'head-adapting': {
    kind: 'question',
    text: RECENT_GRAVITY_CHANGE,
    yes: 'out-adaptation-head',
    no: 'head-dizzy',
  },
  'head-dizzy': {
    kind: 'question',
    text: 'Do you feel dizzy or off balance?',
    yes: 'out-balance',
    no: 'out-headache',
  },

  // Chest and breathing
  'chest-pressure': {
    kind: 'question',
    text: 'Do you feel pressure, squeezing, fullness or pain in the center of your chest?',
    help: 'It may last more than a few minutes, or go away and come back.',
    yes: 'out-heart',
    no: 'chest-breath',
  },
  'chest-breath': {
    kind: 'question',
    text: 'Are you short of breath while resting?',
    yes: 'out-heart',
    no: 'chest-spread',
  },
  'chest-spread': {
    kind: 'question',
    text: 'Do you have pain in an arm, your back, neck or jaw, together with a cold sweat, nausea or lightheadedness?',
    yes: 'out-heart',
    no: 'chest-cough',
  },
  'chest-cough': {
    kind: 'question',
    text: 'Do you have a fever with a cough that does not stop?',
    help: 'Fever means 38 °C or more.',
    measure: 'temp',
    yes: 'out-serious-infection',
    no: 'out-chest-clear',
  },

  // Stomach
  'stomach-fever': {
    kind: 'question',
    text: 'Do you have a fever together with vomiting or loose stools?',
    help: 'Fever means 38 °C or more.',
    measure: 'temp',
    yes: 'out-gut-infection',
    no: 'stomach-stools',
  },
  'stomach-stools': {
    kind: 'question',
    text: 'Have you had loose stools 3 or more times in the last 24 hours?',
    yes: 'out-gut-infection',
    no: 'stomach-adapting',
  },
  'stomach-adapting': {
    kind: 'question',
    text: RECENT_GRAVITY_CHANGE,
    yes: 'out-motion-sickness',
    no: 'out-stomach-clear',
  },

  // Back, muscles and bones
  'muscles-injury': {
    kind: 'question',
    text: 'Did the pain start after a hit, a fall or a sudden strain?',
    yes: 'muscles-use',
    no: 'muscles-back',
  },
  'muscles-use': {
    kind: 'question',
    text: 'Is the area swollen or out of shape, or are you unable to use it?',
    yes: 'out-fracture',
    no: 'out-strain',
  },
  'muscles-back': {
    kind: 'question',
    text: 'Is it tightness or pain in your lower back?',
    yes: 'muscles-back-early',
    no: 'out-soreness',
  },
  'muscles-back-early': {
    kind: 'question',
    text: 'Did it start during your first days in weightlessness?',
    yes: 'out-back-adaptation',
    no: 'out-back-late',
  },

  // Whole body and skin
  'body-fever': {
    kind: 'question',
    text: 'Do you have a fever?',
    help: 'Fever means 38 °C or more. Measure it if you are not sure.',
    measure: 'temp',
    yes: 'body-fever-signs',
    no: 'body-rash',
  },
  'body-fever-signs': {
    kind: 'question',
    text: 'With the fever, do you have any of these?',
    help: 'Skin rash. Trouble breathing. A cough that does not stop. Confusion. Bruising or bleeding with no injury. Vomiting that does not stop. Headache with a stiff neck.',
    yes: 'out-serious-infection',
    no: 'body-fever-long',
  },
  'body-fever-long': {
    kind: 'question',
    text: 'Has the fever lasted more than 48 hours?',
    yes: 'out-serious-infection',
    no: 'out-fever',
  },
  'body-rash': {
    kind: 'question',
    text: 'Do you have a new skin rash?',
    yes: 'out-rash',
    no: 'body-tired',
  },
  'body-tired': {
    kind: 'question',
    text: 'Do you feel unusually tired or slow?',
    yes: 'out-tired',
    no: 'out-body-clear',
  },

  // Outcomes
  'out-vision': {
    kind: 'outcome',
    status: 'watch',
    title: 'Vision change',
    meaning:
      'In weightlessness, body fluids move toward the head and can change the eyes. NASA calls this SANS. It is more likely on longer missions.',
    steps: [
      'Report the change to the flight surgeon today.',
      'Note when it started and whether it affects one eye or both.',
      'Check your vision again tomorrow and report if it gets worse.',
    ],
    escalate: true,
    sourceIds: ['nasa-sans', 'hrp-risks'],
  },
  'out-serious-infection': {
    kind: 'outcome',
    status: 'alert',
    title: 'Possible serious infection',
    meaning:
      'Fever together with these signs, or fever that lasts more than 48 hours, is treated as a serious illness that must be reported.',
    steps: [
      'Contact the flight surgeon now.',
      'Tell a crewmate and rest away from shared areas if you can.',
      'Measure your temperature again in 2 hours.',
    ],
    escalate: true,
    measure: ['temp'],
    sourceIds: ['cdc-fever', 'hrp-risks'],
  },
  'out-adaptation-head': {
    kind: 'outcome',
    status: 'ok',
    title: 'Likely space adaptation',
    meaning:
      'Headache, a stuffy face and feeling sluggish are common in the first days. Most crew members have some of these symptoms while the body adapts.',
    steps: [
      'Move your head slowly and take it easy today.',
      'Keep drinking fluids.',
      'Ask the flight surgeon which medicine from the kit can help.',
      'Report it if it lasts longer than a few days.',
    ],
    escalate: false,
    sourceIds: ['nasa-sas', 'nasa-medcare'],
  },
  'out-balance': {
    kind: 'outcome',
    status: 'watch',
    title: 'Balance change',
    meaning:
      'Dizziness and trouble with coordination can happen when gravity changes. It can make it hard to walk or operate a vehicle.',
    steps: [
      'Move slowly and keep a hand on a rail.',
      'Do not drive or do risky tasks until it passes.',
      'Report it if it does not improve.',
    ],
    escalate: false,
    sourceIds: ['hrp-risks'],
  },
  'out-headache': {
    kind: 'outcome',
    status: 'watch',
    title: 'Headache without warning signs',
    meaning: 'None of the warning signs we asked about are present.',
    steps: [
      'Rest and drink fluids.',
      'Measure your blood pressure and temperature.',
      'Report it if it gets worse or does not go away.',
    ],
    escalate: false,
    measure: ['bp', 'temp'],
    sourceIds: ['nasa-sans', 'cdc-fever'],
  },
  'out-heart': {
    kind: 'outcome',
    status: 'alert',
    title: 'Possible heart emergency',
    meaning:
      'These are warning signs of a heart attack. Do not wait to see if they pass, even if you are not sure.',
    steps: [
      'Stop what you are doing and call a crewmate now.',
      'Contact the flight surgeon immediately.',
      'Stay still and do not stay alone.',
    ],
    escalate: true,
    sourceIds: ['aha-heart-attack', 'hrp-risks'],
  },
  'out-chest-clear': {
    kind: 'outcome',
    status: 'watch',
    title: 'No warning signs found',
    meaning: 'None of the heart attack or infection warning signs we asked about are present.',
    steps: [
      'Rest and measure your heart rate and blood pressure.',
      'Repeat this check if the discomfort comes back.',
      'If any warning sign appears, treat it as an emergency.',
    ],
    escalate: false,
    measure: ['hr', 'bp'],
    sourceIds: ['aha-heart-attack'],
  },
  'out-gut-infection': {
    kind: 'outcome',
    status: 'alert',
    title: 'Possible stomach infection',
    meaning:
      'Frequent loose stools, or vomiting or loose stools with fever, can be a stomach infection that may spread to the crew.',
    steps: [
      'Report it to the flight surgeon.',
      'Take small sips of fluid often.',
      'Tell your crewmates and clean your hands well.',
    ],
    escalate: true,
    measure: ['temp'],
    sourceIds: ['cdc-fever', 'hrp-risks'],
  },
  'out-motion-sickness': {
    kind: 'outcome',
    status: 'ok',
    title: 'Likely space motion sickness',
    meaning:
      'Nausea, vomiting and low appetite affect most crew members in the first 2 to 3 days while the body adapts.',
    steps: [
      'Move your head slowly and avoid fast turns.',
      'Take small sips of fluid so you do not dehydrate.',
      'Ask the flight surgeon about motion sickness medicine from the kit.',
      'Report it if it lasts longer than 3 days.',
    ],
    escalate: false,
    sourceIds: ['nasa-sas', 'hrp-risks'],
  },
  'out-stomach-clear': {
    kind: 'outcome',
    status: 'watch',
    title: 'Upset stomach without warning signs',
    meaning: 'None of the infection signs we asked about are present.',
    steps: [
      'Take small sips of fluid and eat light.',
      'Check again tomorrow.',
      'Report it if you get a fever or it gets worse.',
    ],
    escalate: false,
    sourceIds: ['cdc-fever'],
  },
  'out-fracture': {
    kind: 'outcome',
    status: 'alert',
    title: 'Possible broken bone',
    meaning: 'Without gravity, bones lose strength and become more brittle, so breaks are more likely.',
    steps: [
      'Do not use or put weight on that part.',
      'Keep it still and supported.',
      'Contact the flight surgeon now.',
    ],
    escalate: true,
    sourceIds: ['hrp-risks'],
  },
  'out-strain': {
    kind: 'outcome',
    status: 'watch',
    title: 'Likely a strain',
    meaning: 'There are no signs of a broken bone right now.',
    steps: [
      'Rest that part and skip exercises that load it today.',
      'Check it again tomorrow.',
      'Report it if it swells or does not improve.',
    ],
    escalate: false,
    sourceIds: ['hrp-risks'],
  },
  'out-back-adaptation': {
    kind: 'outcome',
    status: 'ok',
    title: 'Space adaptation back pain',
    meaning:
      'About half of crew members get lower back tightness or pain in the first days in weightlessness. Changing position, exercises and medicine all work well.',
    steps: [
      'Change position and stretch gently.',
      'Keep up your exercise routine if the pain allows.',
      'Ask the flight surgeon about pain medicine from the kit.',
    ],
    escalate: false,
    sourceIds: ['nasa-medcare', 'nasa-sas'],
  },
  'out-back-late': {
    kind: 'outcome',
    status: 'watch',
    title: 'Back pain',
    meaning: 'Back pain that starts later in the mission is not the usual adaptation pain, so it should be looked at.',
    steps: [
      'Skip exercises that load your back today.',
      'Report it to the flight surgeon at your next contact.',
    ],
    escalate: true,
    sourceIds: ['nasa-medcare'],
  },
  'out-soreness': {
    kind: 'outcome',
    status: 'ok',
    title: 'Muscle soreness',
    meaning:
      'Soreness without an injury is usually from exercise. Crew members exercise every day to protect muscle and bone.',
    steps: [
      'Go easier on that muscle group today.',
      'Keep the rest of your routine.',
      'Report it if it does not improve.',
    ],
    escalate: false,
    sourceIds: ['hrp-risks'],
  },
  'out-fever': {
    kind: 'outcome',
    status: 'alert',
    title: 'Fever',
    meaning: 'Spaceflight can change how the immune system responds, so a fever deserves early attention.',
    steps: [
      'Rest and drink fluids.',
      'Report it to the flight surgeon.',
      'Measure your temperature again in 2 hours.',
    ],
    escalate: true,
    measure: ['temp'],
    sourceIds: ['cdc-fever', 'hrp-risks'],
  },
  'out-rash': {
    kind: 'outcome',
    status: 'watch',
    title: 'Skin rash',
    meaning:
      'The stress of spaceflight can wake up inactive viruses in the body and cause rashes. Skin microbes can also change in space.',
    steps: [
      'Keep the area clean and dry and avoid scratching.',
      'Take a photo to send with your report.',
      'Report it to the flight surgeon.',
    ],
    escalate: true,
    sourceIds: ['hrp-risks'],
  },
  'out-tired': {
    kind: 'outcome',
    status: 'watch',
    title: 'Fatigue',
    meaning: 'Short sleep and irregular schedules are a known risk on missions and slow your reactions.',
    steps: [
      'Log your sleep and take the reaction test in Mind.',
      'Avoid critical tasks if you can.',
      'Plan an earlier sleep period tonight.',
    ],
    escalate: false,
    measure: ['sleep'],
    sourceIds: ['hrp-risks', 'cdc-sleep', 'nasa-pvt'],
  },
  'out-body-clear': {
    kind: 'outcome',
    status: 'ok',
    title: 'No warning signs found',
    meaning: 'None of the signs we asked about are present.',
    steps: ['Take your regular measurements.', 'Come back if something changes.'],
    escalate: false,
    sourceIds: ['hrp-risks'],
  },
}
