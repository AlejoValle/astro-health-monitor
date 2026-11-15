import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { assessStress } from '../data/stressCheck'
import { median } from './bluetooth'
import { db, type MindCheck } from './db'
import { assessReaction, type ReactionSummary } from './reaction'
import type { Assessment, Status } from './rules'
import { assessCognition } from './cognition'

const RANK: Record<Status, number> = { ok: 0, watch: 1, alert: 2 }

export function useChecks(kind: MindCheck['kind']) {
  return useLiveQuery(
    () => db.checks.where('[kind+at]').between([kind, Dexie.minKey], [kind, Dexie.maxKey]).toArray(),
    [kind],
  )
}

export const toSummary = (c: MindCheck): ReactionSummary => ({
  responses: c.responses ?? 0,
  medianMs: c.score,
  lapses: c.lapses ?? 0,
  falseStarts: c.falseStarts ?? 0,
})

/** Personal baseline: the median of the earlier tests' median reaction times. */
export const baselineOf = (earlier: MindCheck[]) =>
  earlier.length ? median(earlier.map((c) => c.score)) : undefined

/** Assessments of the latest stress check and reaction test; `undefined` while loading. */
export function useMindStatus(): { stress?: Assessment; reaction?: Assessment; cognition?: Assessment } | undefined {
  const stress = useChecks('stress')
  const reaction = useChecks('reaction')
  const nback = useChecks('nback')
  const dsst = useChecks('dsst')
  if (!stress || !reaction || !nback || !dsst) return undefined
  // The latest brain game of each kind, against that game's earlier scores; the worse one counts.
  const games = [nback, dsst].flatMap((list) =>
    list.length ? [assessCognition(list.at(-1)!.score, list.slice(0, -1).map((c) => c.score))] : [],
  )
  const cognition = games.length ? games.reduce((a, b) => (RANK[b.status] > RANK[a.status] ? b : a)) : undefined
  const lastStress = stress.at(-1)
  const lastReaction = reaction.at(-1)
  return {
    stress: lastStress && assessStress(lastStress.score),
    reaction: lastReaction && assessReaction(toSummary(lastReaction), baselineOf(reaction.slice(0, -1))),
    cognition,
  }
}
