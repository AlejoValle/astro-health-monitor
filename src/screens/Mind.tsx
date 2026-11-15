import { ChevronLeft, ChevronRight, ListChecks, Smile, Timer, Wind, Gamepad2 } from 'lucide-react'
import { Breathing } from '../components/Breathing'
import { useCallback, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ReactionTest } from '../components/ReactionTest'
import { SourceList } from '../components/SourceList'
import { StatusIcon, StatusPill } from '../components/status'
import {
  assessStress,
  STRESS_MAX,
  STRESS_OPTIONS,
  STRESS_QUESTIONS,
  STRESS_SOURCE_IDS,
  stressScore,
} from '../data/stressCheck'
import { useLocale, useT } from '../i18n'
import { msg } from '../i18n/msg'
import { addCheck, type MindCheck } from '../lib/db'
import { baselineOf, toSummary, useChecks, useMindStatus } from '../lib/mindChecks'
import { assessReaction, FULL_TEST_MS, LAPSE_MS, QUICK_TEST_MS, type ReactionSummary } from '../lib/reaction'
import { assess, type Assessment } from '../lib/rules'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useLatest } from '../lib/useLatest'

const REACTION_SOURCE_IDS = ['nasa-pvt', 'pvt-b', 'hrp-risks']

export function Mind() {
  const [params] = useSearchParams()
  const view = params.get('v')
  if (view === 'stress') return <StressCheck />
  if (view === 'reaction') return <Reaction />
  if (view === 'breathe') return <Breathe />
  return <MindHub />
}

function MindHub() {
  const latest = useLatest()
  const stress = useChecks('stress')
  const reaction = useChecks('reaction')
  const mind = useMindStatus()
  const t = useT()
  if (!latest || !stress || !reaction) return null

  const mood = latest.mood && assess('mood', latest.mood.values)
  const lastStress = stress.at(-1)
  const lastReaction = reaction.at(-1)

  return (
    <div className="mx-auto max-w-xl">
      <p className="label">{t('Mind')}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('How is your mind today?')}</h1>
      <ul className="mt-5 space-y-3">
        <HubCard
          to="/measure?i=mood"
          icon={<Smile size={26} strokeWidth={1.5} />}
          title={msg('Mood')}
          hint={msg('Pick a face. 5 seconds.')}
          assessment={mood}
        />
        <HubCard
          to="/mind?v=stress"
          icon={<ListChecks size={26} strokeWidth={1.5} />}
          title={msg('Stress check')}
          hint={msg('4 questions, one tap each.')}
          assessment={lastStress && assessStress(lastStress.score)}
        />
        <HubCard
          to="/mind?v=reaction"
          icon={<Timer size={26} strokeWidth={1.5} />}
          title={msg('Reaction test')}
          hint={msg('A tap game that shows fatigue.')}
          assessment={lastReaction && assessReaction(toSummary(lastReaction), baselineOf(reaction.slice(0, -1)))}
        />
        <HubCard
          to="/games"
          icon={<Gamepad2 size={26} strokeWidth={1.5} />}
          title={msg('Brain games')}
          hint={msg('Memory and speed games modelled on NASA Cognition tests.')}
          assessment={mind?.cognition}
        />
        <HubCard
          to="/mind?v=breathe"
          icon={<Wind size={26} strokeWidth={1.5} />}
          title={msg('Breathing')}
          hint={msg('4-7-8 breathing to calm down. About 1 minute.')}
        />
      </ul>
      <History stress={stress} reaction={reaction} />
    </div>
  )
}

const HISTORY_LENGTH = 6
const when = (at: number, locale: string) =>
  new Date(at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function History({ stress, reaction }: { stress: MindCheck[]; reaction: MindCheck[] }) {
  const t = useT()
  const locale = useLocale()
  const entries = [
    ...stress.map((c) => ({
      at: c.at,
      name: msg('Stress check'),
      value: `${c.score} / ${STRESS_MAX}`,
      assessment: assessStress(c.score),
    })),
    // Each reaction test is rated against the tests taken before it.
    ...reaction.map((c, i) => ({
      at: c.at,
      name: msg('Reaction test'),
      value: `${c.score} ms`,
      assessment: assessReaction(toSummary(c), baselineOf(reaction.slice(0, i))),
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, HISTORY_LENGTH)
  if (entries.length === 0) return null

  return (
    <section className="panel mt-4 rounded-3xl p-5">
      <h2 className="label">{t('Earlier results')}</h2>
      <ul className="mt-2 divide-y divide-line">
        {entries.map((e) => (
          <li key={`${e.name}-${e.at}`} className="flex min-h-14 items-center gap-3 py-2">
            <span className="flex-1">
              <span className="block font-medium">
                {t(e.name)} <span className="whitespace-nowrap font-semibold tabular-nums">{e.value}</span>
              </span>
              <span className="block text-xs text-ink-dim">{when(e.at, locale)}</span>
            </span>
            <StatusPill status={e.assessment.status} label={e.assessment.label} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function HubCard(props: { to: string; icon: ReactNode; title: string; hint: string; assessment?: Assessment }) {
  const t = useT()
  return (
    <li>
      <Link to={props.to} className="panel flex min-h-24 items-center gap-4 rounded-3xl p-4 active:bg-panel-2">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          {props.icon}
        </span>
        <span className="flex-1">
          <span className="block text-lg font-semibold">{t(props.title)}</span>
          <span className="block text-sm text-ink-dim">{t(props.hint)}</span>
          {props.assessment && (
            <span className="mt-2 block">
              <StatusPill status={props.assessment.status} label={props.assessment.label} />
            </span>
          )}
        </span>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
      </Link>
    </li>
  )
}

function BackToMind() {
  const t = useT()
  return (
    <Link to="/mind" className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim">
      <ChevronLeft size={18} aria-hidden />
      {t('Mind')}
    </Link>
  )
}

function MindResult(props: {
  name: string
  value: string
  unit: string
  assessment: Assessment
  sourceIds: string[]
  note: string
  children?: ReactNode
}) {
  const style = STATUS_STYLE[props.assessment.status]
  const t = useT()
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <section className={`glass rounded-[32px] p-6 text-center ${style.glow}`}>
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}>
          <StatusIcon status={props.assessment.status} size={30} />
        </div>
        <p className="label mt-4">{t(props.name)}</p>
        <p className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">{props.value}</span>
          <span className="text-ink-dim">{props.unit}</span>
        </p>
        <p className={`mt-2 text-lg font-semibold ${style.text}`}>{t(props.assessment.label)}</p>
      </section>
      {props.children}
      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('What to do')}</h2>
        <p className="mt-2 text-lg leading-snug">{t(props.assessment.advice)}</p>
      </section>
      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('Based on')}</h2>
        <SourceList sourceIds={props.sourceIds} />
        <p className="mt-3 text-xs text-ink-faint">{t(props.note)}</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/sounds" className="panel flex min-h-14 items-center justify-center rounded-2xl font-medium">
          {t('Calming sounds')}
        </Link>
        <Link to="/mind" className="flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space">
          {t('Done')}
        </Link>
      </div>
    </div>
  )
}

function StressCheck() {
  const [answers, setAnswers] = useState<number[]>([])
  const t = useT()
  const finished = answers.length === STRESS_QUESTIONS.length

  if (finished) {
    const score = stressScore(answers)
    return (
      <MindResult
        name={msg('Stress check')}
        value={String(score)}
        unit={`/ ${STRESS_MAX}`}
        assessment={assessStress(score)}
        sourceIds={STRESS_SOURCE_IDS}
        note={msg('A simple self check-in written for this app. It is not a validated clinical scale or a diagnosis.')}
      />
    )
  }

  const answer = (value: number) => {
    const next = [...answers, value]
    setAnswers(next)
    if (next.length === STRESS_QUESTIONS.length) void addCheck({ kind: 'stress', score: stressScore(next) })
  }

  return (
    <div className="mx-auto max-w-xl">
      {answers.length === 0 ? (
        <BackToMind />
      ) : (
        <button
          type="button"
          onClick={() => setAnswers((a) => a.slice(0, -1))}
          className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim"
        >
          <ChevronLeft size={18} aria-hidden />
          {t('Back')}
        </button>
      )}
      <p className="label">
        {t('Stress check')} · {t('{n} of {total}', { n: answers.length + 1, total: STRESS_QUESTIONS.length })}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight">{t(STRESS_QUESTIONS[answers.length])}</h1>
      <ul className="mt-6 space-y-2">
        {STRESS_OPTIONS.map((option, value) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => answer(value)}
              className="panel flex min-h-14 w-full items-center rounded-2xl px-5 text-left text-lg font-medium active:bg-panel-2"
            >
              {t(option)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Reaction() {
  const history = useChecks('reaction')
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [result, setResult] = useState<{ summary: ReactionSummary; baselineMs?: number } | null>(null)
  const t = useT()
  if (!history) return null

  if (result) {
    const { summary, baselineMs } = result
    return (
      <MindResult
        name={msg('Median reaction time')}
        value={String(summary.medianMs)}
        unit="ms"
        assessment={assessReaction(summary, baselineMs)}
        sourceIds={REACTION_SOURCE_IDS}
        note={msg('Compared with your own earlier tests, not with a clinical threshold. Only the 3-minute version follows the validated test length.')}
      >
        <section className="grid grid-cols-3 gap-3 text-center">
          <Stat label={msg('Taps')} value={summary.responses} />
          <Stat label={msg('Slow taps')} value={summary.lapses} />
          <Stat label={msg('Too soon')} value={summary.falseStarts} />
        </section>
        <p className="text-center text-xs text-ink-dim">
          {baselineMs ? `${t('Your baseline is {ms} ms.', { ms: baselineMs })} ` : ''}
          {t('A slow tap is {ms} ms or more.', { ms: LAPSE_MS })}
        </p>
      </MindResult>
    )
  }

  if (durationMs) {
    return (
      <ReactionTest
        durationMs={durationMs}
        onDone={(summary) => {
          setResult({ summary, baselineMs: baselineOf(history) })
          setDurationMs(null)
          if (summary.responses > 0)
            void addCheck({
              kind: 'reaction',
              score: summary.medianMs,
              lapses: summary.lapses,
              falseStarts: summary.falseStarts,
              responses: summary.responses,
            })
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <BackToMind />
        <h1 className="text-3xl font-semibold tracking-tight">{t('Reaction test')}</h1>
      </div>
      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('How it works')}</h2>
        <ol className="mt-3 space-y-3">
          {[
            msg('Hold the phone still and watch the circle.'),
            msg('When a counter starts, tap anywhere as fast as you can.'),
            msg('Do not tap before it starts.'),
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5">{t(step)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-dim">
          {t(
            'Slow reactions are an early sign of fatigue. Astronauts on the space station use a 3-minute test like this one.',
          )}
        </p>
      </section>
      <button
        type="button"
        onClick={() => setDurationMs(FULL_TEST_MS)}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space"
      >
        {t('Start 3-minute test')}
      </button>
      <button
        type="button"
        onClick={() => setDurationMs(QUICK_TEST_MS)}
        className="panel flex min-h-14 w-full items-center justify-center rounded-2xl font-medium"
      >
        {t('Quick 1-minute check')}
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  const t = useT()
  return (
    <div className="panel rounded-2xl p-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-ink-dim">{t(label)}</p>
    </div>
  )
}

function Breathe() {
  const t = useT()
  const [state, setState] = useState<'ready' | 'running' | 'done'>('ready')
  const finish = useCallback(() => setState('done'), [])

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <BackToMind />
        <h1 className="text-3xl font-semibold tracking-tight">{t('Breathing')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Breathe in for 4 seconds, hold for 7, breathe out for 8. Four rounds. Slow breathing can help you settle after stress or before sleep.')}
        </p>
      </div>
      {state === 'running' ? (
        <Breathing onDone={finish} />
      ) : (
        <section className="panel rounded-3xl p-6 text-center">
          <p className="text-lg font-semibold">{state === 'done' ? t('Well done. Notice how you feel now.') : t('Find a steady position and relax your shoulders.')}</p>
          <button
            type="button"
            onClick={() => setState('running')}
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space"
          >
            {state === 'done' ? t('Again') : t('Start')}
          </button>
        </section>
      )}
      <p className="px-1 text-xs text-ink-faint">
        {t('A common relaxation technique. Offering it here is this app’s choice, not a NASA protocol. Stop if you feel lightheaded.')}
      </p>
    </div>
  )
}
