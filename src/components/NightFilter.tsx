import { useEffect } from 'react'
import { isNight } from '../lib/night'
import { useSettings } from '../lib/store'
import { useNow } from '../lib/useRecords'

/**
 * Turns the whole screen dim red during the sleep period. Red light disturbs night vision and
 * sleep less than white or blue light. The filter sits on the root element, so it covers
 * everything, fixed panels included.
 */
export function NightFilter() {
  const mode = useSettings((s) => s.nightMode)
  const now = useNow()
  const on = isNight(mode, now)
  useEffect(() => {
    document.documentElement.classList.toggle('night', on)
  }, [on])
  return null
}
