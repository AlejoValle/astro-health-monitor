import { describe, expect, it } from 'vitest'
import { delayParts, messageProgress, oneWayDelay } from './comms'

describe('delayed contact', () => {
  it('uses real time in orbit, light time to the Moon and the chosen delay farther out', () => {
    expect(oneWayDelay('orbit', 20)).toBe(0)
    expect(oneWayDelay('moon', 20)).toBe(1300)
    expect(oneWayDelay('mars', 20)).toBe(20 * 60_000)
    expect(oneWayDelay('transit', 7.5)).toBe(450_000)
  })

  it('tracks a message while it travels and when a reply can come back', () => {
    const m = { at: 0, delayMs: 600_000 }
    expect(messageProgress(m, 300_000)).toMatchObject({ state: 'sending', progress: 0.5 })
    const done = messageProgress(m, 600_000)
    expect(done.state).toBe('delivered')
    expect(done.replyAt).toBe(1_200_000)
  })

  it('delivers at once with no delay', () => {
    expect(messageProgress({ at: 10, delayMs: 0 }, 10)).toMatchObject({ state: 'delivered', progress: 1 })
  })

  it('words a delay in seconds or minutes', () => {
    expect(delayParts(1300)).toEqual({ n: 1.3, unit: 's' })
    expect(delayParts(20 * 60_000)).toEqual({ n: 20, unit: 'min' })
  })
})
