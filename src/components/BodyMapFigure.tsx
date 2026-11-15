import { BODY_SYSTEMS, type SystemId } from '../data/bodySystems'
import { useT } from '../i18n'
import { BodySilhouette } from './BodySilhouette'
import { msg } from '../i18n/msg'
import type { Status } from '../lib/rules'

const COLOR: Record<Status | 'none', string> = {
  ok: 'var(--color-ok)',
  watch: 'var(--color-watch)',
  alert: 'var(--color-alert)',
  none: 'var(--color-accent)',
}

/** Short labels next to each hotspot, and which side of the body they sit on. */
const LABEL: Record<SystemId, { text: string; side: 'left' | 'right' }> = {
  brain: { text: msg('Brain'), side: 'left' },
  eyes: { text: msg('Eyes'), side: 'right' },
  heart: { text: msg('Heart'), side: 'right' },
  immune: { text: msg('Immune'), side: 'left' },
  gut: { text: msg('Gut'), side: 'right' },
  bones: { text: msg('Bones'), side: 'left' },
  muscles: { text: msg('Muscles'), side: 'right' },
}

/**
 * Body outline with one hotspot per system, coloured by status. Systems outside the selected
 * hazard fade out. The list of buttons beside it is the accessible control; this is a shortcut.
 */
export function BodyMapFigure({
  statuses,
  selected,
  highlighted,
  onSelect,
}: {
  statuses: Record<SystemId, Status | null>
  selected: SystemId
  highlighted: Set<SystemId>
  onSelect: (id: SystemId) => void
}) {
  const t = useT()
  return (
    <svg viewBox="-70 0 340 420" className="mx-auto h-auto w-full max-w-sm" aria-hidden>
      <BodySilhouette />

      {BODY_SYSTEMS.map((system) => {
        const status = statuses[system.id]
        const color = COLOR[status ?? 'none']
        const { x, y } = system.spot
        const label = LABEL[system.id]
        const lx = label.side === 'left' ? -8 : 208
        const active = highlighted.has(system.id)
        const isSelected = selected === system.id
        return (
          <g
            key={system.id}
            onClick={() => onSelect(system.id)}
            className="cursor-pointer transition-opacity duration-300"
            opacity={active ? 1 : 0.22}
          >
            <line x1={x} y1={y} x2={label.side === 'left' ? lx + 4 : lx - 4} y2={y} stroke={color} strokeOpacity="0.4" strokeDasharray="2 3" />
            <text
              x={lx}
              y={y + 4}
              textAnchor={label.side === 'left' ? 'end' : 'start'}
              className="fill-ink-dim text-[11px] font-medium"
            >
              {t(label.text)}
            </text>
            {status && status !== 'ok' && active && (
              <circle
                cx={x}
                cy={y}
                r="11"
                fill="none"
                stroke={color}
                strokeWidth="2"
                className="pulse-ring"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
            {isSelected && <circle cx={x} cy={y} r="16" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />}
            <circle cx={x} cy={y} r="11" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2" />
            <circle cx={x} cy={y} r="3.5" fill={color} />
            {/* Larger invisible target, easier to tap. */}
            <circle cx={x} cy={y} r="22" fill="transparent" />
          </g>
        )
      })}
    </svg>
  )
}
