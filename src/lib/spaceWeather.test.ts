import { describe, expect, it } from 'vitest'
import { assessSpaceWeather, parseNotifications, type SpaceEvent } from './spaceWeather'

const NOW = Date.UTC(2026, 10, 15, 12)
const H = 60 * 60 * 1000
const ev = (type: SpaceEvent['type'], hoursAgo: number): SpaceEvent => ({ id: `${type}-${hoursAgo}`, type, at: NOW - hoursAgo * H, url: '' })

describe('parseNotifications', () => {
  it('keeps known types, newest first, and reads DONKI times as UTC', () => {
    const events = parseNotifications([
      { messageType: 'CME', messageID: 'a', messageIssueTime: '2026-11-14T08:00Z', messageURL: 'u1' },
      { messageType: 'Report', messageID: 'b', messageIssueTime: '2026-11-15T08:00Z' },
      { messageType: 'SEP', messageID: 'c', messageIssueTime: '2026-11-15T09:30Z', messageURL: 'u2' },
      { messageType: 'GST', messageID: 'd', messageIssueTime: 'not a date' },
    ])
    expect(events.map((e) => e.id)).toEqual(['c', 'a'])
    expect(events[0].at).toBe(Date.UTC(2026, 10, 15, 9, 30))
  })

  it('returns nothing for an error body', () => {
    expect(parseNotifications({ error: 'rate limit' })).toEqual([])
  })
})

describe('assessSpaceWeather', () => {
  it('acts on solar particles from the last 3 days', () => {
    const a = assessSpaceWeather([ev('SEP', 30), ev('CME', 5)], NOW, 'transit')
    expect(a.status).toBe('alert')
    expect(a.drivers.map((e) => e.type)).toEqual(['SEP'])
  })

  it('watches recent flares and geomagnetic storms', () => {
    expect(assessSpaceWeather([ev('FLR', 10)], NOW, 'mars').status).toBe('watch')
    expect(assessSpaceWeather([ev('GST', 60)], NOW, 'moon').status).toBe('watch')
  })

  it('counts radiation belt enhancements only in Earth orbit', () => {
    expect(assessSpaceWeather([ev('RBE', 5)], NOW, 'orbit').status).toBe('watch')
    expect(assessSpaceWeather([ev('RBE', 5)], NOW, 'mars').status).toBe('ok')
  })

  it('is quiet with only old events or coronal mass ejections', () => {
    expect(assessSpaceWeather([ev('SEP', 24 * 5), ev('CME', 2)], NOW, 'orbit').status).toBe('ok')
  })
})
