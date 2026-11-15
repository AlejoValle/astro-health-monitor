import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Tracker } from '../data/hazards'
import { indicatorById } from '../data/indicators'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { trackerAssessment, type TrackerStatus } from '../lib/hazards'
import { INDICATOR_ICON } from './IndicatorCard'
import { StatusIcon } from './status'


function trackerTarget(t: Tracker): { to: string; label: string } {
  switch (t.kind) {
    case 'indicator':
      return { to: `/measure?i=${t.id}`, label: indicatorById(t.id).short }
    case 'radiation':
      return { to: '/radiation', label: msg('Radiation dose') }
    case 'stress':
      return { to: '/mind?v=stress', label: msg('Stress check') }
    case 'reaction':
      return { to: '/mind?v=reaction', label: msg('Reaction test') }
    case 'exercise':
      return { to: '/exercise', label: msg('Exercise') }
    case 'link':
      return { to: t.to, label: t.label }
  }
}

export function TrackerChip({ tracker, status }: { tracker: Tracker; status: TrackerStatus }) {
  const { to, label } = trackerTarget(tracker)
  const assessment = trackerAssessment(tracker, status)
  const Icon = tracker.kind === 'indicator' ? INDICATOR_ICON[tracker.id] : undefined
  const t = useT()
  return (
    <Link
      to={to}
      className="flex min-h-11 items-center gap-1.5 rounded-full border border-line px-3 text-sm active:bg-panel-2"
    >
      {assessment ? (
        <StatusIcon status={assessment.status} size={14} />
      ) : Icon ? (
        <Icon size={14} className="text-ink-dim" aria-hidden />
      ) : null}
      {t(label)}
      {tracker.kind !== 'indicator' && tracker.kind !== 'radiation' && !assessment && (
        <ChevronRight size={14} className="text-ink-faint" aria-hidden />
      )}
      {assessment && <span className="sr-only">: {t(assessment.label)}</span>}
    </Link>
  )
}
