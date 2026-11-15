import { useMemo } from 'react'
import { INDICATORS, type IndicatorId } from '../data/indicators'
import { personalBaseline, type Baseline } from './baseline'
import { useSettings } from './store'
import { useRecords } from './useRecords'

/** The crew member's baseline for each indicator that has enough readings. */
export function useBaselines(): Partial<Record<IndicatorId, Baseline>> {
  const records = useRecords()
  const missionStart = useSettings((s) => s.missionStart)
  return useMemo(() => {
    const out: Partial<Record<IndicatorId, Baseline>> = {}
    if (!records) return out
    for (const i of INDICATORS) {
      const b = personalBaseline(records.readings, i.id, missionStart)
      if (b) out[i.id] = b
    }
    return out
  }, [records, missionStart])
}
