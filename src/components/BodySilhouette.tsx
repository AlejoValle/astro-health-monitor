import { useId, type ReactNode } from 'react'
import { BODY_OUTLINE } from './bodyOutline'

/**
 * Front-view human figure (viewBox 0 0 200 420) shared by the symptom guide and the body map:
 * a soft volume gradient, a glowing rim and faint anatomical lines.
 * `children` draws on top, inside the same coordinate system.
 */
export function BodySilhouette({ children, interactive }: { children?: ReactNode; interactive?: ReactNode }) {
  const id = useId().replace(/:/g, '')
  return (
    <>
      <defs>
        <radialGradient id={`vol-${id}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgb(125 211 252 / 0.16)" />
          <stop offset="60%" stopColor="rgb(125 211 252 / 0.06)" />
          <stop offset="100%" stopColor="rgb(125 211 252 / 0.02)" />
        </radialGradient>
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Soft halo behind the figure. */}
      <g filter={`url(#glow-${id})`} opacity="0.5" className="stroke-accent" fill="none" strokeWidth="2">
        <path d={BODY_OUTLINE.head} />
        <path d={BODY_OUTLINE.torso} />
        <path d={BODY_OUTLINE.leftArm} />
        <path d={BODY_OUTLINE.rightArm} />
      </g>

      <g fill={`url(#vol-${id})`} className="stroke-accent/60" strokeWidth="1.4" strokeLinejoin="round">
        <path d={BODY_OUTLINE.leftArm} />
        <path d={BODY_OUTLINE.rightArm} />
        <path d={BODY_OUTLINE.torso} />
        <path d={BODY_OUTLINE.head} />
      </g>

      {interactive}

      <path d={BODY_OUTLINE.details} fill="none" className="pointer-events-none stroke-accent/25" strokeWidth="1" strokeLinecap="round" />
      {children}
    </>
  )
}
