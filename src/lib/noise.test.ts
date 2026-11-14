import { describe, expect, it } from 'vitest'
import { fillBrown, fillPink, fillWhite, seamlessLoop } from './noise'

function seeded(seed = 1) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

describe('noise generators', () => {
  for (const [name, fill] of [
    ['white', fillWhite],
    ['pink', fillPink],
    ['brown', fillBrown],
  ] as const) {
    it(`${name} noise stays within -1..1 and is not silent`, () => {
      const out = fill(new Float32Array(48_000 * 4), seeded())
      let peak = 0
      for (const v of out) peak = Math.max(peak, Math.abs(v))
      expect(peak).toBeLessThanOrEqual(1)
      expect(peak).toBeGreaterThan(0.1)
    })
  }
})

describe('seamlessLoop', () => {
  it('shortens the buffer by the fade length', () => {
    expect(seamlessLoop(new Float32Array(1000), 100).length).toBe(900)
  })

  it('starts where the original continued after the loop end', () => {
    const samples = Float32Array.from({ length: 1000 }, (_, i) => i / 1000)
    const loop = seamlessLoop(samples, 100)
    expect(loop[0]).toBeCloseTo(samples[900])
    expect(loop[899]).toBeCloseTo(samples[899])
    expect(loop[500]).toBeCloseTo(samples[500])
  })
})
