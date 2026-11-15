import { Bell, BellOff, Check, ChevronRight, Clock, FlaskConical, Flame } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { CountUp } from '../components/CountUp'
import { MissionPatch } from '../components/MissionPatch'
import { PATCHES, RANKS, SLOT_HOURS, SLOT_LABEL, type Slot } from '../data/routine'
import { useLocale, useT, type Vars } from '../i18n'
import { missionDay, type TaskStatus } from '../lib/routine'
import { notificationsAvailable } from '../lib/reminders'
import { useSettings } from '../lib/store'
import { useRoutine } from '../lib/useRoutine'

const SLOTS: Slot[] = ['morning', 'midday', 'evening']

const time = (ts: number, locale: string) => new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

export function Routine() {
  const routine = useRoutine()
  const { locationId, missionStart } = useSettings()
  const t = useT()
  if (!routine) return null
  const { statuses, progress, now, simulated } = routine

  const day = missionDay(missionStart, now)
  const daily = statuses.filter((s) => s.task.everyDays === 1)
  const dailyDone = daily.filter((s) => s.state === 'done').length
  const rankIndex = RANKS.findIndex((r) => r.name === progress.rank.name)
  const next = progress.rank.next
  const toNext = next ? next.xp - progress.xp : 0
  const rankShare = next ? (progress.xp - progress.rank.xp) / (next.xp - progress.rank.xp) : 1
  const unlocked = progress.patches.filter((p) => p.unlocked).length

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">
          {t('Mission routine')}
          {day !== null && ` · ${locationId === 'mars' ? t('Sol {n}', { n: day }) : t('Day {n}', { n: day })}`}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("Today's routine")}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Tasks tick themselves off when you actually measure. Keep the routine and earn rank and mission patches.')}
        </p>
      </div>

      <section className="glass rounded-[32px] p-6">
        <div className="flex items-center gap-5">
          <DayRing done={dailyDone} total={daily.length} t={t} />
          <div className="min-w-0 flex-1">
            <p className="label">{t('Rank')}</p>
            <p className="text-2xl font-semibold tracking-tight">{t(progress.rank.name)}</p>
            <p className="mt-0.5 flex items-center gap-1" aria-label={t('Rank {n} of {total}', { n: rankIndex + 1, total: RANKS.length })}>
              {RANKS.map((r, i) => (
                <span key={r.name} className={`h-1.5 w-5 rounded-full ${i <= rankIndex ? 'bg-accent' : 'bg-white/10'}`} />
              ))}
            </p>
          </div>
          <div className="text-center">
            <Flame
              size={26}
              className={progress.streak > 0 ? 'mx-auto text-watch' : 'mx-auto text-ink-faint'}
              fill={progress.streak > 0 ? 'currentColor' : 'none'}
              aria-hidden
            />
            <p className="text-xl font-semibold leading-tight">
              <CountUp value={progress.streak} />
            </p>
            <p className="text-[11px] text-ink-dim">{t('day streak')}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between text-sm">
            <span>
              <span className="text-lg font-semibold">
                <CountUp value={progress.xp} />
              </span>{' '}
              <span className="text-ink-dim">XP</span>
            </span>
            <span className="text-xs text-ink-dim">
              {next ? t('{n} XP to {rank}', { n: toNext, rank: t(next.name) }) : t('Top rank reached')}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.max(2, rankShare * 100)}%` }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
            {t('Best streak {n} days', { n: progress.bestStreak })}
            {simulated && (
              <>
                {' · '}
                <FlaskConical size={11} aria-hidden /> {t('includes simulated data')}
              </>
            )}
          </p>
        </div>
      </section>

      {SLOTS.map((slot) => {
        const items = statuses.filter((s) => s.task.slot === slot)
        const [from, to] = SLOT_HOURS[slot]
        return (
          <section key={slot} className="panel rounded-3xl p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="label">{t(SLOT_LABEL[slot])}</h2>
              <span className="text-xs text-ink-faint">
                {String(from).padStart(2, '0')}:00 – {String(to % 24).padStart(2, '0')}:00
              </span>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {items.map((s) => (
                <li key={s.task.id}>
                  <TaskRow status={s} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section className="panel rounded-3xl p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="label">{t('Mission patches')}</h2>
          <span className="text-xs text-ink-dim">
            {t('{n} of {total}', { n: unlocked, total: PATCHES.length })}
          </span>
        </div>
        <ul className="reveal-list mt-4 grid grid-cols-4 gap-x-2 gap-y-4">
          {PATCHES.map((patch) => {
            const p = progress.patches.find((x) => x.id === patch.id)!
            return (
              <li key={patch.id} className="flex flex-col items-center text-center">
                <MissionPatch patch={patch} progress={p.progress} unlocked={p.unlocked} size={64} />
                <p className={`mt-2 text-xs font-medium ${p.unlocked ? '' : 'text-ink-dim'}`}>{t(patch.name)}</p>
                <p className="text-[11px] leading-tight text-ink-faint">
                  {p.unlocked ? t(patch.goal) : `${p.progress} / ${patch.target} · ${t(patch.goal)}`}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <ReminderToggle />

      <p className="px-1 text-xs text-ink-faint">
        {t(
          "The routine, points, ranks and patches are this app's design to make healthy habits stick. They are not a NASA schedule. A full day is 80% of the daily tasks and earns a bonus.",
        )}
      </p>
    </div>
  )
}

function DayRing({ done, total, t }: { done: number; total: number; t: (text: string, vars?: Vars) => string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const share = total ? done / total : 0
  return (
    <div className="relative size-20 shrink-0" role="img" aria-label={t('{n} of {total} daily tasks done', { n: done, total })}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="6" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={share >= 1 ? 'var(--color-ok)' : 'var(--color-accent)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - share) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold leading-none tabular-nums">
          {done}/{total}
        </span>
        <span className="mt-0.5 text-[10px] text-ink-dim">{t('today')}</span>
      </span>
    </div>
  )
}

const STATE_STYLE: Record<TaskStatus['state'], string> = {
  done: 'border-ok/50 bg-ok/15 text-ok',
  due: 'border-accent/60 bg-accent/10 text-accent',
  missed: 'border-watch/50 bg-watch/10 text-watch',
  upcoming: 'border-line text-ink-faint',
}

function TaskRow({ status }: { status: TaskStatus }) {
  const { task, state, doneAt, nextInDays } = status
  const t = useT()
  const locale = useLocale()
  const right =
    state === 'done'
      ? nextInDays !== undefined && nextInDays > 0
        ? t('Again in {n} d', { n: nextInDays })
        : doneAt !== undefined
          ? time(doneAt, locale)
          : ''
      : state === 'due'
        ? t('Due now')
        : state === 'missed'
          ? t('Still time')
          : ''

  return (
    <Link to={task.to} className="flex min-h-16 items-center gap-3 py-2">
      <span
        className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border ${STATE_STYLE[state]}`}
      >
        {state === 'done' ? (
          <Check size={16} strokeWidth={2.5} aria-hidden />
        ) : state === 'due' ? (
          <>
            <span className="pulse-ring absolute -inset-0.5 rounded-full border border-accent/60" aria-hidden />
            <span className="size-2 rounded-full bg-accent" aria-hidden />
          </>
        ) : (
          <Clock size={14} aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-medium ${state === 'done' ? 'text-ink-dim line-through decoration-ink-faint' : ''}`}>
          {t(task.label)}
        </span>
        <span className="block text-xs text-ink-dim">{t(task.why)}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-xs ${state === 'done' ? 'text-ok' : 'text-accent'}`}>
          {state === 'done' ? `+${task.xp} XP` : `${task.xp} XP`}
        </span>
        {right && <span className="block text-[11px] text-ink-dim">{right}</span>}
      </span>
      <ChevronRight size={16} className="shrink-0 text-ink-faint" aria-hidden />
    </Link>
  )
}

function ReminderToggle() {
  const { reminders, setReminders } = useSettings()
  const available = notificationsAvailable()
  const t = useT()

  const toggle = async () => {
    if (reminders) return setReminders(false)
    const permission = await Notification.requestPermission()
    setReminders(permission === 'granted')
  }

  return (
    <section className="panel rounded-3xl p-5">
      <div className="flex items-center gap-3">
        {reminders ? (
          <Bell size={22} className="text-accent" aria-hidden />
        ) : (
          <BellOff size={22} className="text-ink-dim" aria-hidden />
        )}
        <div className="flex-1">
          <h2 className="font-medium">{t('Routine reminders')}</h2>
          <p className="text-xs text-ink-dim">
            {available
              ? t('A notification when the morning, midday or evening routine has tasks due.')
              : t('Notifications need a secure (https) connection. The Next up card on Home still reminds you.')}
          </p>
        </div>
        {available && (
          <button
            type="button"
            role="switch"
            aria-checked={reminders}
            aria-label={t('Routine reminders')}
            onClick={() => void toggle()}
            className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors ${
              reminders ? 'border-accent/60 bg-accent/30' : 'border-line bg-white/5'
            }`}
          >
            <motion.span
              className="absolute top-1 size-6 rounded-full bg-ink"
              animate={{ left: reminders ? 26 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            />
          </button>
        )}
      </div>
      {available && reminders && (
        <p className="mt-3 text-xs text-ink-faint">
          {t(
            'Reminders come while AstroVitals is open or installed on this device. There is no server, so nothing is sent when it is closed.',
          )}
        </p>
      )}
    </section>
  )
}
