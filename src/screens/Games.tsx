import { Brain, Check, ChevronLeft, ChevronRight, Grid3x3, HelpCircle, Timer, Wind, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SourceList } from '../components/SourceList'
import { StatusIcon, StatusPill } from '../components/status'
import { questionOfDay, TRIVIA } from '../data/trivia'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import {
  assessCognition,
  DSST_SECONDS,
  DSST_SYMBOLS,
  dsstKey,
  NBACK_N,
  nbackSequence,
  scoreNBack,
} from '../lib/cognition'
import { addCheck, type MindCheck } from '../lib/db'
import { useChecks } from '../lib/mindChecks'
import { startOfDay } from '../lib/routine'
import { STATUS_STYLE } from '../lib/statusStyle'
import { useNow } from '../lib/useRecords'

const SOURCE_IDS = ['hrp-risks', 'nasa-pvt']

export function Games() {
  const [params] = useSearchParams()
  const g = params.get('g')
  if (g === 'nback') return <NBack />
  if (g === 'dsst') return <SymbolDigit />
  if (g === 'quiz') return <Quiz />
  return <Hub />
}

function Hub() {
  const t = useT()
  const nback = useChecks('nback')
  const dsst = useChecks('dsst')
  const quiz = useChecks('quiz')
  const now = useNow()
  if (!nback || !dsst || !quiz) return null
  const answeredToday = quiz.some((q) => q.at >= startOfDay(now))
  const last = (list: MindCheck[]) => list.at(-1) && assessCognition(list.at(-1)!.score, list.slice(0, -1).map((c) => c.score))

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Games')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Train and check your brain')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Short games modelled on the Cognition tests NASA crews take on the space station. Each one is compared with your own earlier games and earns points.')}
        </p>
      </div>
      <ul className="reveal-list space-y-3">
        <GameCard to="/games?g=nback" icon={<Brain size={26} strokeWidth={1.5} />} title={msg('Memory 2-Back')} hint={msg('Tap when a letter matches the one 2 steps back. 1 minute.')} assessment={last(nback)} />
        <GameCard to="/games?g=dsst" icon={<Grid3x3 size={26} strokeWidth={1.5} />} title={msg('Symbol speed')} hint={msg('Match symbols to digits as fast as you can. 1 minute.')} assessment={last(dsst)} />
        <GameCard
          to="/games?g=quiz"
          icon={<HelpCircle size={26} strokeWidth={1.5} />}
          title={msg('Daily space quiz')}
          hint={answeredToday ? msg('Answered today. A new question tomorrow.') : msg('One question a day about health in space.')}
        />
        <GameCard to="/mind?v=reaction" icon={<Timer size={26} strokeWidth={1.5} />} title={msg('Reaction test')} hint={msg('A tap game that shows fatigue.')} />
        <GameCard to="/mind?v=breathe" icon={<Wind size={26} strokeWidth={1.5} />} title={msg('Breathing')} hint={msg('4-7-8 breathing to calm down. About 1 minute.')} />
      </ul>
    </div>
  )
}

function GameCard(props: { to: string; icon: ReactNode; title: string; hint: string; assessment?: ReturnType<typeof assessCognition> }) {
  const t = useT()
  return (
    <li>
      <Link to={props.to} className="panel flex min-h-24 items-center gap-4 rounded-3xl p-4 active:bg-panel-2">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">{props.icon}</span>
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

function Back() {
  const t = useT()
  return (
    <Link to="/games" className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim">
      <ChevronLeft size={18} aria-hidden />
      {t('Games')}
    </Link>
  )
}

/** Shows a saved game score against the crew member's earlier games. */
function GameResult({ name, value, unit, detail, earlier, onAgain }: { name: string; value: number; unit: string; detail: string; earlier: number[]; onAgain: () => void }) {
  const t = useT()
  const a = assessCognition(value, earlier)
  const style = STATUS_STYLE[a.status]
  return (
    <div className="space-y-4">
      <section className={`glass rounded-[32px] p-6 text-center ${style.glow}`}>
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}>
          <StatusIcon status={a.status} size={30} />
        </div>
        <p className="label mt-4">{t(name)}</p>
        <p className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">{value}</span>
          <span className="text-ink-dim">{t(unit)}</span>
        </p>
        <p className={`mt-2 text-lg font-semibold ${style.text}`}>{t(a.label)}</p>
        <p className="mt-1 text-sm text-ink-dim">{detail}</p>
      </section>
      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('What to do')}</h2>
        <p className="mt-2 text-lg leading-snug">{t(a.advice)}</p>
        <h2 className="label mt-4">{t('Based on')}</h2>
        <SourceList sourceIds={SOURCE_IDS} />
        <p className="mt-3 text-xs text-ink-faint">
          {t('Modelled on NASA Cognition tests, scored by this app and compared only with your own games. Not a clinical test.')}
        </p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onAgain} className="panel min-h-14 rounded-2xl font-medium">
          {t('Again')}
        </button>
        <Link to="/games" className="flex min-h-14 items-center justify-center rounded-2xl bg-ink font-semibold text-space">
          {t('Done')}
        </Link>
      </div>
    </div>
  )
}

/** A random symbol index different from the current one. */
function otherSymbol(current: number) {
  const next = Math.floor(Math.random() * DSST_SYMBOLS.length)
  return next === current ? (next + 1) % DSST_SYMBOLS.length : next
}

const SHOW_MS = 1500
const GAP_MS = 500

function NBack() {
  const t = useT()
  const history = useChecks('nback')
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready')
  const [seq, setSeq] = useState<string[]>([])
  const [i, setI] = useState(-1)
  const [visible, setVisible] = useState(false)
  const taps = useRef<boolean[]>([])
  const [flash, setFlash] = useState<null | 'tap'>(null)
  const [result, setResult] = useState<{ accuracy: number; hits: number; misses: number; falseAlarms: number } | null>(null)
  const [earlier, setEarlier] = useState<number[]>([])

  useEffect(() => {
    if (phase !== 'play') return
    if (i >= seq.length) {
      const s = scoreNBack(seq, taps.current)
      const before = (history ?? []).map((c) => c.score)
      void addCheck({ kind: 'nback', score: s.accuracy, responses: seq.length, lapses: s.misses, falseStarts: s.falseAlarms })
      const id = window.setTimeout(() => {
        setEarlier(before)
        setResult(s)
        setPhase('done')
      }, 0)
      return () => window.clearTimeout(id)
    }
    const show = window.setTimeout(() => setVisible(true), 0)
    const hide = window.setTimeout(() => setVisible(false), SHOW_MS)
    const next = window.setTimeout(() => setI((n) => n + 1), SHOW_MS + GAP_MS)
    return () => [show, hide, next].forEach((id) => window.clearTimeout(id))
  }, [phase, i, seq, history])

  const start = () => {
    taps.current = []
    setResult(null)
    setSeq(nbackSequence(Math.random))
    setI(0)
    setPhase('play')
  }
  const tap = () => {
    if (i < 0 || i >= seq.length || taps.current[i]) return
    taps.current[i] = true
    setFlash('tap')
    window.setTimeout(() => setFlash(null), 250)
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Back />
        <h1 className="text-3xl font-semibold tracking-tight">{t('Memory 2-Back')}</h1>
      </div>
      {phase === 'ready' && (
        <section className="panel space-y-4 rounded-3xl p-5">
          <p>{t('Letters appear one by one. Tap Match when the letter is the same as the one shown 2 steps before.')}</p>
          <p className="text-sm text-ink-dim">{t('Example: B, K, B → Match on the second B.')}</p>
          <button type="button" onClick={start} className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space">
            {t('Start')}
          </button>
        </section>
      )}
      {phase === 'play' && (
        <section className="flex flex-col items-center gap-6 py-4">
          <p className="label">{t('{n} of {total}', { n: Math.min(i + 1, seq.length), total: seq.length })}</p>
          <div className={`flex size-48 items-center justify-center rounded-[40px] border-2 text-7xl font-semibold transition-colors ${flash ? 'border-accent bg-accent/15' : 'border-line'}`}>
            {visible ? seq[i] : ''}
          </div>
          <button type="button" onPointerDown={tap} className="flex min-h-20 w-full max-w-xs items-center justify-center rounded-3xl bg-ink text-xl font-semibold text-space">
            {t('Match')}
          </button>
          <p className="text-xs text-ink-dim">{t('Same as {n} back? Tap Match. Otherwise do nothing.', { n: NBACK_N })}</p>
        </section>
      )}
      {phase === 'done' && result && (
        <GameResult
          name={msg('Memory 2-Back')}
          value={result.accuracy}
          unit={msg('% right')}
          detail={t('Matches found {hits}, missed {misses}, wrong taps {fa}.', { hits: result.hits, misses: result.misses, fa: result.falseAlarms })}
          earlier={earlier}
          onAgain={start}
        />
      )}
    </div>
  )
}

function SymbolDigit() {
  const t = useT()
  const history = useChecks('dsst')
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready')
  const [key, setKey] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const [target, setTarget] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [left, setLeft] = useState(DSST_SECONDS)
  const [last, setLast] = useState<null | 'ok' | 'bad'>(null)
  const [earlier, setEarlier] = useState<number[]>([])
  const score = useRef({ correct: 0, errors: 0 })

  const finish = useCallback(() => {
    setEarlier((history ?? []).map((c) => c.score))
    void addCheck({ kind: 'dsst', score: score.current.correct, lapses: score.current.errors })
    setPhase('done')
  }, [history])

  useEffect(() => {
    if (phase !== 'play') return
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id)
          window.setTimeout(finish, 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, finish])

  const start = () => {
    setKey(dsstKey(Math.random))
    setTarget(otherSymbol(-1))
    setCorrect(0)
    setErrors(0)
    score.current = { correct: 0, errors: 0 }
    setLeft(DSST_SECONDS)
    setPhase('play')
  }
  const answer = (digit: number) => {
    if (digit === key[target]) {
      score.current.correct++
      setCorrect(score.current.correct)
      setLast('ok')
    } else {
      score.current.errors++
      setErrors(score.current.errors)
      setLast('bad')
    }
    setTarget(otherSymbol(target))
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Back />
        <h1 className="text-3xl font-semibold tracking-tight">{t('Symbol speed')}</h1>
      </div>
      {phase === 'ready' && (
        <section className="panel space-y-4 rounded-3xl p-5">
          <p>{t('A key shows which digit goes with each symbol. Tap the digit for the symbol in the middle, as many as you can in 1 minute.')}</p>
          <button type="button" onClick={start} className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space">
            {t('Start')}
          </button>
        </section>
      )}
      {phase === 'play' && (
        <section className="space-y-5">
          <div className="grid grid-cols-9 gap-1 rounded-2xl border border-line p-2 text-center">
            {DSST_SYMBOLS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <span className="text-xl">{s}</span>
                <span className="text-sm font-semibold text-accent">{key[i]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-ink-dim">
            <span className="tabular-nums">{t('{s} s left', { s: left })}</span>
            <span className="flex items-center gap-3 tabular-nums">
              <span className="flex items-center gap-1 text-ok"><Check size={14} aria-hidden /> {correct}</span>
              <span className="flex items-center gap-1 text-alert"><X size={14} aria-hidden /> {errors}</span>
            </span>
          </div>
          <div className={`mx-auto flex size-36 items-center justify-center rounded-[32px] border-2 text-7xl transition-colors ${last === 'ok' ? 'border-ok/60' : last === 'bad' ? 'border-alert/60' : 'border-line'}`}>
            {DSST_SYMBOLS[target]}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button key={d} type="button" onPointerDown={() => answer(d)} className="panel min-h-14 rounded-2xl text-2xl font-semibold active:bg-panel-2">
                {d}
              </button>
            ))}
          </div>
        </section>
      )}
      {phase === 'done' && (
        <GameResult
          name={msg('Symbol speed')}
          value={correct}
          unit={msg('per minute')}
          detail={t('Right {n}, wrong {e}.', { n: correct, e: errors })}
          earlier={earlier}
          onAgain={start}
        />
      )}
    </div>
  )
}

function Quiz() {
  const t = useT()
  const answers = useChecks('quiz')
  const now = useNow()
  const index = questionOfDay(now)
  const q = TRIVIA[index]
  const today = answers?.find((a) => a.at >= startOfDay(now))
  const [picked, setPicked] = useState<number | null>(null)
  if (!answers) return null
  const chosen = picked ?? (today ? (today.score === 1 ? q.answer : -1) : null)
  const answered = chosen !== null
  const right = answers.filter((a) => a.score === 1).length

  const pick = (i: number) => {
    if (answered) return
    setPicked(i)
    void addCheck({ kind: 'quiz', score: i === q.answer ? 1 : 0, item: index })
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <Back />
        <p className="label">{t('Daily space quiz')}</p>
        <h1 className="mt-1 text-2xl font-semibold leading-snug tracking-tight">{t(q.question)}</h1>
      </div>
      <ul className="space-y-2">
        {q.options.map((o, i) => {
          const isAnswer = i === q.answer
          const state = !answered ? '' : isAnswer ? 'border-ok/60 bg-ok/10' : chosen === i ? 'border-alert/60 bg-alert/10' : 'opacity-60'
          return (
            <li key={o}>
              <button
                type="button"
                disabled={answered}
                onClick={() => pick(i)}
                className={`panel flex min-h-14 w-full items-center gap-3 rounded-2xl px-5 text-left text-lg font-medium ${state}`}
              >
                <span className="flex-1">{t(o)}</span>
                {answered && isAnswer && <Check size={20} className="text-ok" aria-hidden />}
                {answered && chosen === i && !isAnswer && <X size={20} className="text-alert" aria-hidden />}
              </button>
            </li>
          )
        })}
      </ul>
      {answered && (
        <section className="panel rounded-3xl p-5">
          <p className={`font-semibold ${chosen === q.answer ? 'text-ok' : 'text-watch'}`}>
            {chosen === q.answer ? t('Right! +5 XP') : t('Not this time. Here is why:')}
          </p>
          <p className="mt-2">{t(q.explain)}</p>
          <SourceList sourceIds={[q.sourceId]} />
          <p className="mt-3 text-xs text-ink-faint">{t('Right answers so far: {n}. A new question tomorrow.', { n: right })}</p>
        </section>
      )}
    </div>
  )
}
