import { BellRing, ChevronRight, Flame, PartyPopper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SLOT_LABEL } from '../data/routine'
import { useT } from '../i18n'
import { nextUp } from '../lib/routine'
import { useRoutine } from '../lib/useRoutine'

/** Home reminder: the next routine task, plus streak and rank at a glance. */
export function NextUpCard() {
  const routine = useRoutine()
  const t = useT()
  if (!routine) return null
  const { statuses, progress } = routine
  const next = nextUp(statuses)
  const daily = statuses.filter((s) => s.task.everyDays === 1)
  const dailyDone = daily.filter((s) => s.state === 'done').length

  return (
    <section className="panel overflow-hidden rounded-3xl">
      {next ? (
        <Link to={next.task.to} className="flex min-h-20 items-center gap-4 p-4 active:bg-panel-2">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/12">
            {next.state === 'due' && (
              <span className="pulse-ring absolute inset-0 rounded-full border border-accent/60" aria-hidden />
            )}
            <BellRing size={20} className="text-accent" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-ink-dim">
              {t('Next up')} · {t(SLOT_LABEL[next.task.slot])}
              {next.state === 'upcoming' ? ` (${t('later today')})` : ''}
            </span>
            <span className="block font-semibold">{t(next.task.label)}</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent">
            +{next.task.xp} XP
          </span>
          <ChevronRight size={16} className="shrink-0 text-ink-faint" aria-hidden />
        </Link>
      ) : (
        <div className="flex min-h-20 items-center gap-4 p-4">
          <PartyPopper size={24} className="text-ok" aria-hidden />
          <p className="font-semibold">{t("Today's routine is complete")}</p>
        </div>
      )}
      <Link
        to="/routine"
        className="flex min-h-12 items-center gap-3 border-t border-line px-4 text-sm active:bg-panel-2"
      >
        <span className="flex items-center gap-1.5">
          <Flame
            size={16}
            className={progress.streak > 0 ? 'text-watch' : 'text-ink-faint'}
            fill={progress.streak > 0 ? 'currentColor' : 'none'}
            aria-hidden
          />
          <span className="font-medium">{progress.streak}</span>
          <span className="text-ink-dim">{t('day streak')}</span>
        </span>
        <span className="text-ink-faint">·</span>
        <span className="text-ink-dim">
          {t('{n}/{total} today', { n: dailyDone, total: daily.length })}
        </span>
        <span className="ml-auto truncate text-ink-dim">
          {t(progress.rank.name)} · {progress.xp} XP
        </span>
      </Link>
    </section>
  )
}
