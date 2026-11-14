import { Bike, Check, ChevronLeft, ChevronRight, Dumbbell, Footprints, Pause, PersonStanding, Play, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SourceList } from '../components/SourceList'
import {
  EXERCISE_PLANS,
  minutesByBlock,
  planMinutes,
  startOfDay,
  type BlockKind,
  type ExerciseBlock,
} from '../data/exercise'
import { INDICATORS } from '../data/indicators'
import { locationById } from '../data/locations'
import { addWorkout, db } from '../lib/db'
import { assess } from '../lib/rules'
import { useSettings } from '../lib/store'
import { useLatest } from '../lib/useLatest'

const ICON: Record<BlockKind, LucideIcon> = {
  resistance: Dumbbell,
  run: Footprints,
  cycle: Bike,
  intervals: Zap,
  balance: PersonStanding,
}

export function Exercise() {
  const locationId = useSettings((s) => s.locationId)
  const [params] = useSearchParams()
  const plan = EXERCISE_PLANS[locationId]
  const block = plan.blocks.find((b) => b.id === params.get('b'))
  return block ? <BlockSession key={block.id} block={block} /> : <Plan />
}

function Plan() {
  const locationId = useSettings((s) => s.locationId)
  const location = locationById(locationId)
  const plan = EXERCISE_PLANS[locationId]
  const latest = useLatest()
  const today = useLiveQuery(() => db.workouts.where('at').aboveOrEqual(startOfDay(Date.now())).toArray(), [])
  if (!today || !latest) return null

  const done = minutesByBlock(today)
  const target = planMinutes(plan)
  const total = today.reduce((sum, w) => sum + w.minutes, 0)
  const needsAction = INDICATORS.some((i) => {
    const reading = latest[i.id]
    return reading && assess(i.id, reading.values).status === 'alert'
  })

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">Exercise · {location.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today's plan</h1>
        <p className="mt-1 text-sm text-ink-dim">{location.gravity}</p>
      </div>

      {needsAction && (
        <Link to="/" className="block rounded-3xl border border-alert/40 bg-alert/10 p-4">
          <span className="font-semibold text-alert">One of your checks needs action</span>
          <span className="mt-1 block text-sm text-ink-dim">Review it on Home before you exercise.</span>
        </Link>
      )}

      <section className="panel rounded-3xl p-5">
        <p className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">{total}</span>
          <span className="text-ink-dim">of {target} min today</span>
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-panel-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={Math.min(total, target)}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (total / target) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-ink-dim">{plan.note}</p>
      </section>

      <ul className="space-y-3">
        {plan.blocks.map((block) => {
          const Icon = ICON[block.kind]
          const minutes = done[block.id] ?? 0
          const complete = minutes >= block.minutes
          return (
            <li key={block.id}>
              <Link
                to={`/exercise?b=${block.id}`}
                className="panel flex min-h-20 items-center gap-4 rounded-3xl p-4 active:bg-panel-2"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon size={26} strokeWidth={1.5} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-semibold">{block.name}</span>
                  <span className="block text-sm text-ink-dim">
                    {minutes > 0 ? `${minutes} of ${block.minutes} min` : `${block.minutes} min`}
                  </span>
                </span>
                {complete ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-ok">
                    <Check size={18} aria-hidden />
                    Done
                  </span>
                ) : (
                  <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">Based on</h2>
        <SourceList sourceIds={plan.sourceIds} />
        <p className="mt-3 text-xs text-ink-faint">
          The session lengths are a suggestion written for this app. Your mission exercise prescription comes first.
        </p>
      </section>
    </div>
  )
}

const clock = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function BlockSession({ block }: { block: ExerciseBlock }) {
  const locationId = useSettings((s) => s.locationId)
  const navigate = useNavigate()
  const Icon = ICON[block.kind]
  // Elapsed time is kept as banked ms plus the start of the current run, so it stays right
  // if the browser throttles the timer while the screen is off.
  const [bankedMs, setBankedMs] = useState(0)
  const [runningSince, setRunningSince] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const saving = useRef(false)

  useEffect(() => {
    if (runningSince === null) return
    const tick = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(tick)
  }, [runningSince])

  const elapsedMs = bankedMs + (runningSince === null ? 0 : Math.max(0, now - runningSince))
  const elapsedMin = Math.round(elapsedMs / 60_000)

  const toggle = () => {
    const at = Date.now()
    if (runningSince === null) {
      setNow(at)
      setRunningSince(at)
    } else {
      setBankedMs(bankedMs + (at - runningSince))
      setRunningSince(null)
    }
  }

  const log = async (minutes: number) => {
    if (saving.current) return
    saving.current = true
    await addWorkout({ locationId, blockId: block.id, minutes })
    navigate('/exercise')
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Link to="/exercise" className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim">
          <ChevronLeft size={18} aria-hidden />
          Plan
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Icon size={24} strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{block.name}</h1>
            <p className="text-sm text-ink-dim">{block.minutes} min</p>
          </div>
        </div>
      </div>

      <section className="panel rounded-3xl p-5 text-center">
        <p className="text-6xl font-semibold tabular-nums tracking-tight" aria-live="off">
          {clock(elapsedMs)}
        </p>
        <p className="mt-1 text-sm text-ink-dim">of {block.minutes}:00</p>
        <button
          type="button"
          onClick={toggle}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink font-semibold text-space"
        >
          {runningSince === null ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
          {runningSince !== null ? 'Pause' : elapsedMs > 0 ? 'Resume' : 'Start'}
        </button>
      </section>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">What to do</h2>
        <ol className="mt-3 space-y-3">
          {block.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5 text-lg leading-snug">{step}</span>
            </li>
          ))}
        </ol>
        <h2 className="label mt-5">Why it matters here</h2>
        <p className="mt-2 text-sm text-ink-dim">{block.why}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={elapsedMin < 1}
          onClick={() => void log(elapsedMin)}
          className="panel min-h-14 rounded-2xl px-3 font-medium disabled:opacity-40"
        >
          {elapsedMin < 1 ? 'Save timed session' : `Save ${elapsedMin} min`}
        </button>
        <button type="button" onClick={() => void log(block.minutes)} className="panel min-h-14 rounded-2xl px-3 font-medium">
          I did all {block.minutes} min
        </button>
      </div>
    </div>
  )
}
