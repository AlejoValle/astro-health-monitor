import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { INDICATORS, type IndicatorId } from '../data/indicators'
import { db, type Reading } from './db'

export type LatestByIndicator = Partial<Record<IndicatorId, Reading>>

/** Latest reading per indicator; `undefined` while the database is loading. */
export function useLatest(): LatestByIndicator | undefined {
  return useLiveQuery(async () => {
    const out: LatestByIndicator = {}
    await Promise.all(
      INDICATORS.map(async (i) => {
        const last = await db.readings
          .where('[indicatorId+at]')
          .between([i.id, Dexie.minKey], [i.id, Dexie.maxKey])
          .last()
        if (last) out[i.id] = last
      }),
    )
    return out
  }, [])
}
