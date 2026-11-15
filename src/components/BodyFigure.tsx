import { useId } from 'react'
import type { AreaId } from '../data/symptomTree'
import { BodySilhouette } from './BodySilhouette'
import { BODY_OUTLINE } from './bodyOutline'

/** Horizontal bands of the torso outline that make up each torso zone. */
const BANDS: { area: AreaId; y: number; h: number }[] = [
  { area: 'chest', y: 70, h: 78 },
  { area: 'stomach', y: 148, h: 70 },
]

const ZONE = 'cursor-pointer fill-transparent transition-colors duration-200 hover:fill-accent/25 active:fill-accent/40'

/** Tap target over the shared body figure; the labelled buttons next to it are the accessible control. */
export function BodyFigure({ onPick }: { onPick: (area: AreaId) => void }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="22 4 156 412" className="h-full w-full" aria-hidden>
      <defs>
        {BANDS.map((b) => (
          <clipPath key={b.area} id={`${id}-${b.area}`}>
            <rect x="0" y={b.y} width="200" height={b.h} />
          </clipPath>
        ))}
        <clipPath id={`${id}-legs`}>
          <rect x="0" y="218" width="200" height="210" />
        </clipPath>
      </defs>
      {/* Whole body and skin: a dashed aura around the figure. */}
      <ellipse
        cx="100"
        cy="212"
        rx="76"
        ry="204"
        onClick={() => onPick('body')}
        className="cursor-pointer fill-transparent stroke-accent/15 transition-colors hover:stroke-accent/50"
        strokeDasharray="3 6"
        strokeWidth="1.5"
      />
      <BodySilhouette
        interactive={
          <>
            <path d={BODY_OUTLINE.head} onClick={() => onPick('head')} className={ZONE} />
            {BANDS.map((b) => (
              <path
                key={b.area}
                d={BODY_OUTLINE.torso}
                clipPath={`url(#${id}-${b.area})`}
                onClick={() => onPick(b.area)}
                className={ZONE}
              />
            ))}
            <g onClick={() => onPick('muscles')} className={ZONE}>
              <path d={BODY_OUTLINE.leftArm} />
              <path d={BODY_OUTLINE.rightArm} />
              <path d={BODY_OUTLINE.torso} clipPath={`url(#${id}-legs)`} />
            </g>
          </>
        }
      />
    </svg>
  )
}
