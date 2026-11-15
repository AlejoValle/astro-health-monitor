import type { Hazard, Tracker } from '../data/hazards'
import type { IndicatorId } from '../data/indicators'
import { worst, type Assessment, type Status } from './rules'

/** The latest assessment for everything a hazard can be tracked by. Missing keys have no data yet. */
export interface TrackerStatus {
  indicators: Partial<Record<IndicatorId, Assessment>>
  radiation?: Assessment
  stress?: Assessment
  reaction?: Assessment
  exercise?: Assessment
  cognition?: Assessment
}

export function trackerAssessment(tracker: Tracker, s: TrackerStatus): Assessment | undefined {
  switch (tracker.kind) {
    case 'indicator':
      return s.indicators[tracker.id]
    case 'radiation':
      return s.radiation
    case 'stress':
      return s.stress
    case 'reaction':
      return s.reaction
    case 'exercise':
      return s.exercise
    case 'cognition':
      return s.cognition
    case 'link':
      return undefined
  }
}

/** Worst status among the trackers that have data, or null when none has. */
export function trackersStatus(trackers: Tracker[], s: TrackerStatus): Status | null {
  const statuses = trackers.flatMap((t) => trackerAssessment(t, s)?.status ?? [])
  return statuses.length ? worst(statuses) : null
}

/** Worst status among the hazard's trackers that have data, or null when none has. */
export const hazardStatus = (hazard: Hazard, s: TrackerStatus) => trackersStatus(hazard.trackers, s)

/** Stable React key for a tracker. */
export const trackerKey = (t: Tracker) => (t.kind === 'indicator' ? t.id : t.kind === 'link' ? t.label : t.kind)
