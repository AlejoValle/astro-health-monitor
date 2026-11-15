import { describe, expect, it } from 'vitest'
import { itemStatus } from './medkit'

const DAY = 86_400_000
const NOW = 1_000 * DAY

describe('medical kit', () => {
  it('flags expired and empty items first', () => {
    expect(itemStatus({ count: 10, expires: NOW - 1 }, NOW).status).toBe('alert')
    expect(itemStatus({ count: 0, expires: NOW + 400 * DAY }, NOW).status).toBe('alert')
  })

  it('warns when an item expires within 60 days or is running low', () => {
    expect(itemStatus({ count: 10, expires: NOW + 30 * DAY }, NOW)).toMatchObject({ status: 'watch', label: 'Expires soon' })
    expect(itemStatus({ count: 2, expires: NOW + 400 * DAY }, NOW)).toMatchObject({ status: 'watch', label: 'Running low' })
    expect(itemStatus({ count: 3, expires: NOW + 400 * DAY }, NOW).status).toBe('ok')
  })
})
