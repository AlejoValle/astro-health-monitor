import { describe, expect, it } from 'vitest'
import { assessStress, STRESS_MAX, stressScore } from '../data/stressCheck'
import { assessReaction, summarize } from './reaction'

describe('summarize', () => {
  it('counts lapses at 355 ms or more', () => {
    const s = summarize([250, 354, 355, 600, 240], 0)
    expect(s).toEqual({ responses: 5, medianMs: 354, lapses: 2, falseStarts: 0 })
  })

  it('treats taps under 100 ms as false starts, not responses', () => {
    const s = summarize([40, 250, 260, 270], 2)
    expect(s).toEqual({ responses: 3, medianMs: 260, lapses: 0, falseStarts: 3 })
  })

  it('handles a test with no responses', () => {
    expect(summarize([], 0)).toEqual({ responses: 0, medianMs: 0, lapses: 0, falseStarts: 0 })
  })
})

describe('assessReaction', () => {
  const clean = { responses: 20, medianMs: 250, lapses: 0, falseStarts: 0 }

  it('asks for a repeat when there are too few responses', () => {
    expect(assessReaction({ ...clean, responses: 4 }).label).toBe('Not enough taps')
  })

  it('saves a baseline on a clean first test', () => {
    expect(assessReaction(clean)).toMatchObject({ status: 'ok', label: 'Baseline saved' })
  })

  it('compares against the personal baseline', () => {
    expect(assessReaction(clean, 250).status).toBe('ok')
    expect(assessReaction({ ...clean, medianMs: 275 }, 250).status).toBe('watch')
    expect(assessReaction({ ...clean, medianMs: 300 }, 250).status).toBe('alert')
  })

  it('flags lapses even without a baseline', () => {
    expect(assessReaction({ ...clean, lapses: 2 }).status).toBe('watch')
    expect(assessReaction({ ...clean, lapses: 5 }).status).toBe('alert')
  })

  it('never escalates to the flight surgeon on its own', () => {
    expect(assessReaction({ ...clean, lapses: 20 }).escalate).toBe(false)
  })
})

describe('stress check', () => {
  it('sums the answers', () => {
    expect(stressScore([0, 1, 2, 4])).toBe(7)
    expect(STRESS_MAX).toBe(16)
  })

  it('maps the total to bands', () => {
    expect(assessStress(4).status).toBe('ok')
    expect(assessStress(5).status).toBe('watch')
    expect(assessStress(9).status).toBe('watch')
    expect(assessStress(10).status).toBe('alert')
  })
})
