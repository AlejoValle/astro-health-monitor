import { Dumbbell, Feather, LayoutGrid, Lock, Moon, Radiation, Radio, Sunrise, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import type { Patch, PatchId } from '../data/routine'

const PATCH_ICON: Record<PatchId, typeof Radio> = {
  'first-contact': Radio,
  'full-panel': LayoutGrid,
  'week-streak': Sunrise,
  'iron-crew': Dumbbell,
  'sharp-mind': Zap,
  'dose-keeper': Radiation,
  'well-rested': Moon,
  'steady-nerves': Feather,
}

/** A round mission patch. Locked patches are grey with a ring showing progress. */
export function MissionPatch({
  patch,
  progress,
  unlocked,
  size = 72,
}: {
  patch: Patch
  progress: number
  unlocked: boolean
  size?: number
}) {
  const Icon = PATCH_ICON[patch.id]
  const r = 30
  const circumference = 2 * Math.PI * r
  const share = progress / patch.target

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id={`patch-${patch.id}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor={patch.color} stopOpacity={unlocked ? 0.55 : 0.08} />
            <stop offset="100%" stopColor={patch.color} stopOpacity={unlocked ? 0.12 : 0.02} />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill={`url(#patch-${patch.id})`} />
        <circle
          cx="32"
          cy="32"
          r="25"
          fill="none"
          stroke={unlocked ? patch.color : 'rgb(255 255 255 / 0.12)'}
          strokeOpacity={unlocked ? 0.45 : 1}
          strokeDasharray="2 3"
        />
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="2.5" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={unlocked ? patch.color : 'rgb(255 255 255 / 0.45)'}
          strokeWidth="2.5"
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - share) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {unlocked ? (
          <Icon size={size * 0.36} strokeWidth={1.75} style={{ color: patch.color }} aria-hidden />
        ) : (
          <Lock size={size * 0.26} strokeWidth={1.75} className="text-ink-faint" aria-hidden />
        )}
      </span>
    </div>
  )
}
