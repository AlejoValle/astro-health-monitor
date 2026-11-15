import type { Hazard, Tracker } from '../data/hazards'
import type { IndicatorId } from '../data/indicators'
import { worst, type Assessment, type Status } from './rules'

/** The latest assessment for everything a hazard can be tracked by. Missing keys have no data yet. */
export interface TrackerStatus {
  indicators: Partial<Record<IndicatorId, Assessment>>
  radiation?: Assessment
  stress?: Assessment
  reaction?: Assessment
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
    case 'link':
      return undefined
  }
}

/** Worst status among the hazard's trackers that have data, or null when none has. */
export function hazardStatus(hazard: Hazard, s: TrackerStatus): Status | null {
  const statuses = hazard.trackers.flatMap((t) => trackerAssessment(t, s)?.status ?? [])
  return statuses.length ? worst(statuses) : null
}
