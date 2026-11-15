import { Sprout } from 'lucide-react'
import { useT } from '../i18n'
import { PLANT_STAGES, type Plant } from '../lib/garden'
import { SourceList } from './SourceList'

/** Leaves for each stage: [x, y, angle, size]. */
const LEAVES: [number, number, number, number][][] = [
  [],
  [[60, 92, -40, 0.6], [60, 92, 40, 0.6]],
  [[60, 84, -45, 0.8], [60, 84, 45, 0.8], [60, 72, -30, 0.7], [60, 72, 30, 0.7]],
  [[60, 84, -55, 1], [60, 84, 55, 1], [60, 70, -40, 0.95], [60, 70, 40, 0.95], [60, 58, -20, 0.85], [60, 58, 20, 0.85]],
  [[60, 86, -60, 1.1], [60, 86, 60, 1.1], [60, 72, -45, 1.1], [60, 72, 45, 1.1], [60, 58, -30, 1], [60, 58, 30, 1], [60, 46, 0, 0.95]],
]

/** A lettuce plant that grows with full routine days, inspired by NASA's Veggie on the ISS. */
export function VeggieGarden({ plant }: { plant: Plant }) {
  const t = useT()
  const leaf = plant.wilting ? 'var(--color-watch)' : 'var(--color-ok)'
  const stemTop = [104, 92, 72, 56, 44][plant.stage]

  return (
    <section className="panel rounded-3xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="label flex items-center gap-2">
          <Sprout size={14} aria-hidden /> {t('Space garden')}
        </h2>
        <span className={`text-xs font-medium ${plant.wilting ? 'text-watch' : 'text-ok'}`}>
          {plant.wilting ? t('Needs care') : t(PLANT_STAGES[plant.stage])}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <svg viewBox="0 0 120 130" className="h-32 w-28 shrink-0" role="img" aria-label={t(PLANT_STAGES[plant.stage])}>
          <defs>
            <linearGradient id="veggie-light" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(244 114 182 / 0.35)" />
              <stop offset="100%" stopColor="rgb(244 114 182 / 0)" />
            </linearGradient>
          </defs>
          {/* The pink LED light Veggie uses. */}
          <rect x="10" y="4" width="100" height="6" rx="3" fill="rgb(244 114 182 / 0.8)" />
          <rect x="14" y="10" width="92" height="90" fill="url(#veggie-light)" />
          <g className={plant.wilting ? '' : 'plant-sway'} style={{ transformOrigin: '60px 104px', transformBox: 'view-box' }}>
            {plant.stage > 0 && <path d={`M60 104 L60 ${stemTop}`} stroke={leaf} strokeWidth="3" strokeLinecap="round" />}
            {LEAVES[plant.stage].map(([x, y, a, s], i) => (
              <ellipse
                key={i}
                cx={x}
                cy={y - 10 * s}
                rx={7 * s}
                ry={13 * s}
                fill={leaf}
                fillOpacity={plant.wilting ? 0.55 : 0.85}
                transform={`rotate(${plant.wilting ? a * 1.6 : a} ${x} ${y})`}
              />
            ))}
            {plant.stage === 0 && <ellipse cx="60" cy="102" rx="5" ry="3.5" fill="rgb(180 140 90)" />}
          </g>
          {/* Grow pouch. */}
          <path d="M34 104 H86 L80 124 H40 Z" fill="rgb(255 255 255 / 0.08)" stroke="rgb(255 255 255 / 0.2)" />
        </svg>
        <div className="min-w-0 text-sm">
          <p>{t('Every full day of your routine helps your lettuce grow. Skip two days and it starts to wilt.')}</p>
          <p className="mt-1 text-xs text-ink-dim">{t('Full days in the last 10: {n}', { n: plant.growth })}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">{t('Inspired by Veggie, the plant chamber where NASA crews grow lettuce on the space station.')}</p>
      <SourceList sourceIds={['nasa-veggie']} />
    </section>
  )
}
