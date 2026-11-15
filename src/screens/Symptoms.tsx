import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BodyFigure } from '../components/BodyFigure'
import { ContactBanner } from '../components/ContactBanner'
import { INDICATOR_ICON } from '../components/IndicatorCard'
import { SourceList } from '../components/SourceList'
import { StatusIcon } from '../components/status'
import { indicatorById } from '../data/indicators'
import { AREAS, NODES, type Area, type OutcomeNode, type QuestionNode } from '../data/symptomTree'
import { useT } from '../i18n'
import { STATUS_STYLE } from '../lib/statusStyle'
import { walk, type Answer } from '../lib/triage'

export function Symptoms() {
  const [params] = useSearchParams()
  // ?a=chest opens that area directly, for links from the body map.
  const [area, setArea] = useState<Area | null>(() => AREAS.find((x) => x.id === params.get('a')) ?? null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const t = useT()

  const restart = () => {
    setArea(null)
    setAnswers([])
  }

  if (!area) {
    return <AreaPicker onPick={(id) => setArea(AREAS.find((a) => a.id === id)!)} />
  }

  const path = walk(NODES, area.start, answers)
  const nodeId = path[path.length - 1]
  const node = NODES[nodeId]
  const back = () => (answers.length === 0 ? restart() : setAnswers((a) => a.slice(0, -1)))

  return (
    <div className="mx-auto max-w-xl">
      <button type="button" onClick={back} className="-ml-2 inline-flex min-h-12 items-center gap-1 pr-3 text-sm text-ink-dim">
        <ChevronLeft size={18} aria-hidden />
        {t('Back')}
      </button>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={nodeId}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.16 }}
        >
          {node.kind === 'question' ? (
            <Question
              node={node}
              area={area}
              number={answers.length + 1}
              onAnswer={(answer) => setAnswers((a) => [...a, answer])}
            />
          ) : (
            <Outcome node={node} onRestart={restart} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function AreaPicker({ onPick }: { onPick: (id: Area['id']) => void }) {
  const t = useT()
  return (
    <div className="mx-auto max-w-xl">
      <p className="label">{t('Symptoms')}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Where does it bother you?')}</h1>
      <div className="mt-5 flex gap-4">
        <div className="w-28 shrink-0 self-center sm:w-36">
          <BodyFigure onPick={onPick} />
        </div>
        <ul className="flex-1 space-y-2">
          {AREAS.map((area) => (
            <li key={area.id}>
              <button
                type="button"
                onClick={() => onPick(area.id)}
                className="panel flex min-h-16 w-full items-center gap-2 rounded-2xl px-4 py-2 text-left active:bg-panel-2"
              >
                <span className="flex-1">
                  <span className="block font-medium">{t(area.label)}</span>
                  <span className="block text-xs text-ink-dim">{t(area.hint)}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-5 text-xs text-ink-faint">
        {t(
          'Answer a few yes or no questions. You get a likely explanation and what to do. It is guidance, not a medical diagnosis.',
        )}
      </p>
    </div>
  )
}

function Question({
  node,
  area,
  number,
  onAnswer,
}: {
  node: QuestionNode
  area: Area
  number: number
  onAnswer: (answer: Answer) => void
}) {
  const measure = node.measure && indicatorById(node.measure)
  const t = useT()
  return (
    <div>
      <p className="label">
        {t(area.label)} · {t('Question {n}', { n: number })}
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight">{t(node.text)}</h1>
      {node.help && <p className="mt-3 text-ink-dim">{t(node.help)}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAnswer('yes')}
          className="flex min-h-20 items-center justify-center rounded-3xl bg-ink text-xl font-semibold text-space"
        >
          {t('Yes')}
        </button>
        <button
          type="button"
          onClick={() => onAnswer('no')}
          className="panel flex min-h-20 items-center justify-center rounded-3xl text-xl font-semibold active:bg-panel-2"
        >
          {t('No')}
        </button>
      </div>
      {measure && (
        <Link
          to={`/measure?i=${measure.id}`}
          className="mt-4 flex min-h-12 items-center justify-center text-sm text-accent underline underline-offset-4"
        >
          {t('Not sure? Measure {name} first', { name: t(measure.short).toLowerCase() })}
        </Link>
      )}
    </div>
  )
}

function Outcome({ node, onRestart }: { node: OutcomeNode; onRestart: () => void }) {
  const style = STATUS_STYLE[node.status]
  const t = useT()
  return (
    <div className="space-y-4">
      <section className={`glass rounded-[32px] p-6 text-center ${style.glow}`}>
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full border-2 ${style.ring} ${style.bg}`}>
          <StatusIcon status={node.status} size={30} />
        </div>
        <p className={`label mt-4 ${style.text}`}>{t(style.word)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t(node.title)}</h1>
        <p className="mt-2 text-sm text-ink-dim">{t(node.meaning)}</p>
      </section>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('What to do')}</h2>
        <ol className="mt-3 space-y-3">
          {node.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5 text-lg leading-snug">{t(step)}</span>
            </li>
          ))}
        </ol>
      </section>

      {node.escalate && <ContactBanner />}

      {node.measure && (
        <div className="grid grid-cols-2 gap-3">
          {node.measure.map((id) => {
            const indicator = indicatorById(id)
            const Icon = INDICATOR_ICON[id]
            return (
              <Link
                key={id}
                to={`/measure?i=${id}`}
                className="panel flex min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-medium"
              >
                <Icon size={20} strokeWidth={1.75} className="text-accent" aria-hidden />
                {t('Measure {name}', { name: t(indicator.short).toLowerCase() })}
              </Link>
            )
          })}
        </div>
      )}

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('Based on')}</h2>
        <SourceList sourceIds={node.sourceIds} />
        <p className="mt-3 text-xs text-ink-faint">{t('Guidance for self-care, not a medical diagnosis.')}</p>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="panel flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-medium"
      >
        <RotateCcw size={18} aria-hidden />
        {t('Check another symptom')}
      </button>
    </div>
  )
}
