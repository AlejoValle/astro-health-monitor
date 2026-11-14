import type { Assessment } from '../lib/rules'

// App-authored check-in, not a validated clinical scale. The questions follow the behavioral
// risks NASA HRP tracks (isolation and confinement, workload, teamwork). The bands below are
// this app's triage choice.

export const STRESS_QUESTIONS = [
  'Today, how tense or on edge have you felt?',
  'Today, how overloaded by your tasks have you felt?',
  'Today, how irritated with the people around you have you felt?',
  'Today, how alone or cut off have you felt?',
]

export const STRESS_OPTIONS = ['Not at all', 'A little', 'Somewhat', 'A lot', 'Extremely']

export const STRESS_MAX = STRESS_QUESTIONS.length * (STRESS_OPTIONS.length - 1)

export const STRESS_SOURCE_IDS = ['hrp-hazards', 'hrp-risks']

export const stressScore = (answers: number[]) => answers.reduce((sum, a) => sum + a, 0)

export function assessStress(score: number): Assessment {
  if (score >= 10)
    return {
      status: 'alert',
      label: 'High strain',
      advice: 'Pause if you can, talk with a crewmate and ask for a private conference with the ground team.',
      escalate: false,
    }
  if (score >= 5)
    return {
      status: 'watch',
      label: 'Building up',
      advice: 'Take a short break, play a calming sound and check in again tomorrow.',
      escalate: false,
    }
  return { status: 'ok', label: 'Low strain', advice: 'Keep doing what works for you.', escalate: false }
}
