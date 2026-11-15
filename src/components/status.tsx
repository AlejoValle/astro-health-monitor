import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react'
import type { Status } from '../lib/rules'
import { useT } from '../i18n'
import { STATUS_STYLE } from '../lib/statusStyle'

const ICON = { ok: CircleCheck, watch: TriangleAlert, alert: OctagonAlert }

export function StatusIcon({ status, size = 16 }: { status: Status; size?: number }) {
  const Icon = ICON[status]
  return <Icon size={size} strokeWidth={2} className={STATUS_STYLE[status].text} aria-hidden />
}

/** Status is always icon plus word, never colour alone. */
export function StatusPill({ status, label }: { status: Status; label: string }) {
  const s = STATUS_STYLE[status]
  const t = useT()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <StatusIcon status={status} size={14} />
      {t(label)}
    </span>
  )
}
