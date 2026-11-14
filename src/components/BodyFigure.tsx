import type { AreaId } from '../data/symptomTree'

const ZONES: { area: AreaId; shapes: React.ReactNode }[] = [
  { area: 'head', shapes: <circle cx="60" cy="26" r="19" /> },
  { area: 'chest', shapes: <path d="M36 54h48a8 8 0 0 1 8 8v40H28V62a8 8 0 0 1 8-8z" /> },
  { area: 'stomach', shapes: <path d="M28 106h64v36a10 10 0 0 1-10 10H38a10 10 0 0 1-10-10z" /> },
  {
    area: 'muscles',
    shapes: (
      <>
        <rect x="6" y="56" width="16" height="92" rx="8" />
        <rect x="98" y="56" width="16" height="92" rx="8" />
        <rect x="32" y="156" width="25" height="96" rx="11" />
        <rect x="63" y="156" width="25" height="96" rx="11" />
      </>
    ),
  },
]

/** Decorative tap target; the labelled buttons next to it are the accessible control. */
export function BodyFigure({ onPick }: { onPick: (area: AreaId) => void }) {
  return (
    <svg viewBox="0 0 120 258" className="h-full w-full" aria-hidden>
      {ZONES.map(({ area, shapes }) => (
        <g
          key={area}
          onClick={() => onPick(area)}
          className="cursor-pointer fill-white/8 stroke-accent/60 transition-colors hover:fill-accent/25 active:fill-accent/40"
          strokeWidth="1.5"
        >
          {shapes}
        </g>
      ))}
    </svg>
  )
}
