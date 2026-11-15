import type { AreaId } from '../data/symptomTree'

/** Body zones, drawn with the same outline as the body map so both screens look alike. */
const ZONES: { area: AreaId; shapes: React.ReactNode }[] = [
  {
    area: 'head',
    shapes: (
      <>
        <ellipse cx="100" cy="40" rx="26" ry="30" />
        <rect x="90" y="68" width="20" height="14" rx="4" />
      </>
    ),
  },
  { area: 'chest', shapes: <path d="M58 92 Q60 82 76 80 L124 80 Q140 82 142 92 L144 146 L56 146 Z" /> },
  { area: 'stomach', shapes: <path d="M56 150 L144 150 L146 200 Q146 214 132 214 L68 214 Q54 214 54 200 Z" /> },
  {
    area: 'muscles',
    shapes: (
      <>
        <rect x="30" y="94" width="18" height="128" rx="9" />
        <rect x="152" y="94" width="18" height="128" rx="9" />
        <rect x="66" y="218" width="30" height="188" rx="14" />
        <rect x="104" y="218" width="30" height="188" rx="14" />
      </>
    ),
  },
]

/** Decorative tap target; the labelled buttons next to it are the accessible control. */
export function BodyFigure({ onPick }: { onPick: (area: AreaId) => void }) {
  return (
    <svg viewBox="22 4 156 410" className="h-full w-full drop-shadow-[0_0_24px_rgb(125_211_252/0.15)]" aria-hidden>
      {/* Whole body and skin: a soft halo around the figure. */}
      <g onClick={() => onPick('body')} className="cursor-pointer">
        <ellipse cx="100" cy="210" rx="78" ry="204" className="fill-transparent stroke-accent/15 hover:stroke-accent/40" strokeDasharray="3 6" strokeWidth="1.5" />
      </g>
      {ZONES.map(({ area, shapes }) => (
        <g
          key={area}
          onClick={() => onPick(area)}
          className="cursor-pointer fill-white/[0.05] stroke-accent/50 transition-colors duration-200 hover:fill-accent/25 active:fill-accent/40"
          strokeWidth="1.5"
        >
          {shapes}
        </g>
      ))}
    </svg>
  )
}
