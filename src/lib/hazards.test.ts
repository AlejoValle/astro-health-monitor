import { describe, expect, it } from 'vitest'
import { HAZARDS } from '../data/hazards'
import { LOCATIONS } from '../data/locations'
import { sourceById } from '../data/sources'
import { hazardStatus } from './hazards'
import { assess } from './rules'

const byId = (id: string) => HAZARDS.find((h) => h.id === id)!

describe('the five hazards', () => {
  it('covers all five NASA HRP hazards', () => {
    expect(HAZARDS.map((h) => h.id).sort()).toEqual(['distance', 'environment', 'gravity', 'isolation', 'radiation'])
  })

  it('rates every hazard at every location and cites existing sources', () => {
    for (const h of HAZARDS) {
      for (const l of LOCATIONS) expect(h.level[l.id].why.length).toBeGreaterThan(0)
      expect(h.sourceIds.length).toBeGreaterThan(0)
      for (const id of h.sourceIds) expect(sourceById(id), id).toBeDefined()
      expect(h.trackers.length).toBeGreaterThan(0)
    }
  })
})

describe('hazardStatus', () => {
  it('is null when no tracker has data', () => {
    expect(hazardStatus(byId('isolation'), { indicators: {} })).toBeNull()
    expect(hazardStatus(byId('distance'), { indicators: { mood: assess('mood', [1]) } })).toBeNull()
  })

  it('takes the worst status among trackers with data', () => {
    const status = {
      indicators: { mood: assess('mood', [4]), sleep: assess('sleep', [6.5]) },
    }
    expect(hazardStatus(byId('isolation'), status)).toBe('watch')
  })

  it('uses the radiation assessment for the radiation hazard', () => {
    const radiation = { status: 'alert' as const, label: '', advice: '', escalate: true }
    expect(hazardStatus(byId('radiation'), { indicators: {}, radiation })).toBe('alert')
  })
})
