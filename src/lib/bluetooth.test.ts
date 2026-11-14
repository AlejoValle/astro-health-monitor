import { describe, expect, it } from 'vitest'
import { median, parseHeartRate } from './bluetooth'

const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer)

describe('parseHeartRate', () => {
  it('reads an 8-bit value when flags bit 0 is clear', () => {
    expect(parseHeartRate(view(0x00, 72))).toBe(72)
  })

  it('reads a 16-bit little-endian value when flags bit 0 is set', () => {
    expect(parseHeartRate(view(0x01, 0x2c, 0x01))).toBe(300)
  })

  it('ignores the other flag bits and trailing fields', () => {
    expect(parseHeartRate(view(0x16, 65, 0x00, 0x04))).toBe(65)
  })
})

describe('median', () => {
  it('returns the middle value', () => {
    expect(median([80, 60, 70])).toBe(70)
  })

  it('rounds the mean of the two middle values', () => {
    expect(median([70, 73, 60, 90])).toBe(72)
  })
})
