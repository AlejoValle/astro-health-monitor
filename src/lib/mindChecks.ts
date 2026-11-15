import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { assessStress } from '../data/stressCheck'
import { median } from './bluetooth'
import { db, type MindCheck } from './db'
import { assessReaction, type ReactionSummary } from './reaction'
import type { Assessment } from './rules'

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
export function useMindStatus(): { stress?: Assessment; reaction?: Assessment } | undefined {
  const stress = useChecks('stress')
  const reaction = useChecks('reaction')
  if (!stress || !reaction) return undefined
  const lastStress = stress.at(-1)
  const lastReaction = reaction.at(-1)
  return {
    stress: lastStress && assessStress(lastStress.score),
    reaction: lastReaction && assessReaction(toSummary(lastReaction), baselineOf(reaction.slice(0, -1))),
  }
}
