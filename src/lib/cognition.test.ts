import { describe, expect, it } from 'vitest'
import { assessCognition, dsstKey, nbackSequence, scoreNBack, seededRandom } from './cognition'

describe('2-back', () => {
  it('has targets and never repeats a non-target from 2 back', () => {
    const seq = nbackSequence(seededRandom(7))
    const targets = seq.filter((l, i) => i >= 2 && l === seq[i - 2]).length
    expect(seq).toHaveLength(24)
    expect(targets).toBeGreaterThan(3)
  })

  it('scores hits, misses and false alarms', () => {
    const seq = ['B', 'F', 'B', 'K', 'B', 'M']
    // trial 2 is a target (B..B), trial 4 is a target (B..B), others are not
    const s = scoreNBack(seq, [false, false, true, true, false, false])
    expect(s).toEqual({ hits: 1, misses: 1, falseAlarms: 1, accuracy: 50 })
  })
})

describe('symbol-digit key', () => {
  it('maps the 9 symbols to each digit once', () => {
    expect([...dsstKey(seededRandom(3))].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('assessCognition', () => {
  it('saves a baseline on the first game', () => {
    expect(assessCognition(40, []).label).toBe('Baseline saved')
  })

  it('compares with the median of earlier games', () => {
    expect(assessCognition(40, [40, 42, 38]).status).toBe('ok')
    expect(assessCognition(33, [40, 42, 38]).status).toBe('watch')
    expect(assessCognition(25, [40, 42, 38]).status).toBe('alert')
  })
})
