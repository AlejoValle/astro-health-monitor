import { describe, expect, it } from 'vitest'
import { assess, worst } from './rules'

describe('blood pressure (AHA categories)', () => {
  it.each([
    [[118, 76], 'ok', 'Normal'],
    [[125, 78], 'watch', 'Elevated'],
    [[132, 78], 'watch', 'High (stage 1)'],
    [[118, 84], 'watch', 'High (stage 1)'],
    [[142, 80], 'alert', 'High (stage 2)'],
    [[120, 92], 'alert', 'High (stage 2)'],
    [[185, 100], 'alert', 'Severe'],
    [[150, 125], 'alert', 'Severe'],
  ])('%j -> %s %s', (values, status, label) => {
    const a = assess('bp', values as number[])
    expect(a.status).toBe(status)
    expect(a.label).toBe(label)
  })

  it('escalates severe readings', () => {
    expect(assess('bp', [185, 100]).escalate).toBe(true)
  })
})

describe('heart rate (AHA 60 to 100 bpm)', () => {
  it.each([
    [59, 'watch'],
    [60, 'ok'],
    [100, 'ok'],
    [101, 'watch'],
  ])('%d -> %s', (bpm, status) => {
    expect(assess('hr', [bpm]).status).toBe(status)
  })
})

describe('fasting glucose (ADA)', () => {
  it.each([
    [69, 'alert', 'Low'],
    [70, 'ok', 'Normal'],
    [99, 'ok', 'Normal'],
    [100, 'watch', 'Above normal'],
    [125, 'watch', 'Above normal'],
    [126, 'alert', 'High'],
  ])('%d -> %s %s', (mgdl, status, label) => {
    const a = assess('glucose', [mgdl])
    expect(a.status).toBe(status)
    expect(a.label).toBe(label)
  })
})

describe('temperature (CDC fever at 38 C)', () => {
  it('flags 38.0 and above', () => {
    expect(assess('temp', [37.9]).status).toBe('ok')
    expect(assess('temp', [38]).status).toBe('alert')
  })
})

describe('sleep (CDC 7 or more hours)', () => {
  it.each([
    [7, 'ok'],
    [6.5, 'watch'],
    [5.5, 'alert'],
  ])('%d h -> %s', (h, status) => {
    expect(assess('sleep', [h]).status).toBe(status)
  })
})

describe('worst', () => {
  it('returns the most severe status', () => {
    expect(worst(['ok', 'watch', 'ok'])).toBe('watch')
    expect(worst(['watch', 'alert'])).toBe('alert')
    expect(worst([])).toBe('ok')
  })
})
