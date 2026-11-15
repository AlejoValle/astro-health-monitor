import { describe, expect, it } from 'vitest'
import { fitForQr, isBackup, newRecords, QR_MAX_BYTES } from './backup'

describe('QR and backup', () => {
  it('keeps a short text as it is and cuts a long one line by line', () => {
    expect(fitForQr('hello')).toEqual({ text: 'hello', truncated: false })
    const long = Array.from({ length: 200 }, (_, i) => `Line ${i} with some health text`).join('\n')
    const fit = fitForQr(long)
    expect(fit.truncated).toBe(true)
    expect(new TextEncoder().encode(fit.text).length).toBeLessThanOrEqual(QR_MAX_BYTES)
    expect(fit.text.endsWith('Ask for the full report.]')).toBe(true)
  })

  it('imports only records that are not there yet, without their ids', () => {
    const existing = [{ id: 1, at: 10, indicatorId: 'hr', values: [60] }]
    const incoming = [
      { id: 7, at: 10, indicatorId: 'hr', values: [60] },
      { id: 8, at: 20, indicatorId: 'hr', values: [62] },
    ]
    expect(newRecords('readings', existing, incoming)).toEqual([{ at: 20, indicatorId: 'hr', values: [62] }])
  })

  it('recognises a Tether backup', () => {
    const empty = { readings: [], checks: [], workouts: [], doses: [], intake: [], messages: [] }
    expect(isBackup({ app: 'tether', version: 1, ...empty })).toBe(true)
    expect(isBackup({ app: 'other', version: 1, ...empty })).toBe(false)
    expect(isBackup({ app: 'tether', version: 1 })).toBe(false)
  })
})
