import { median } from './bluetooth'
import type { Assessment } from './rules'

// Timing follows the brief psychomotor vigilance test (PVT-B) used for the Reaction Self-Test
// on the ISS: 3 minutes, 1 to 4 s between stimuli, and a lapse is a response of 355 ms or more.
export const FULL_TEST_MS = 180_000
export const QUICK_TEST_MS = 60_000
export const LAPSE_MS = 355
export const FEEDBACK_MS = 1_000
/** Extra random wait after the feedback, so stimuli are 1 to 4 s apart. */
export const MAX_EXTRA_WAIT_MS = 3_000
/** Faster than a person can react to a light, so it is counted as a false start. */
export const ANTICIPATION_MS = 100
const MIN_RESPONSES = 5

export interface ReactionSummary {
  responses: number
  medianMs: number
  lapses: number
  falseStarts: number
}

export function summarize(reactionTimes: number[], earlyTaps: number): ReactionSummary {
  const valid = reactionTimes.filter((rt) => rt >= ANTICIPATION_MS)
  return {
    responses: valid.length,
    medianMs: valid.length ? median(valid) : 0,
    lapses: valid.filter((rt) => rt >= LAPSE_MS).length,
    falseStarts: earlyTaps + (reactionTimes.length - valid.length),
  }
}

/**
 * There are no universal cut-offs for reaction time, so a result is compared with the crew
 * member's own baseline (median of earlier tests). The bands are this app's triage choice.
 */
export function assessReaction(summary: ReactionSummary, baselineMs?: number): Assessment {
  if (summary.responses < MIN_RESPONSES)
    return { status: 'watch', label: 'Not enough taps', advice: 'Repeat the test and tap each time the counter starts.', escalate: false }

  const lapseRate = summary.lapses / summary.responses
  const slowdown = baselineMs ? summary.medianMs / baselineMs : 1

  if (lapseRate >= 0.25 || slowdown >= 1.2)
    return {
      status: 'alert',
      label: baselineMs ? 'Much slower than usual' : 'Many slow responses',
      advice: 'You may be fatigued. Avoid critical tasks if you can and plan a sleep period.',
      escalate: false,
    }
  if (lapseRate >= 0.1 || slowdown >= 1.1)
    return {
      status: 'watch',
      label: baselineMs ? 'Slower than usual' : 'Some slow responses',
      advice: 'Take a break before demanding tasks and test again after resting.',
      escalate: false,
    }
  return {
    status: 'ok',
    label: baselineMs ? 'As sharp as usual' : 'Baseline saved',
    advice: baselineMs ? 'Keep your sleep schedule.' : 'Repeat the test on other days to build your own baseline.',
    escalate: false,
  }
}
