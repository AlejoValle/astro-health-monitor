import { useEffect, useState } from 'react'
import { fetchSpaceWeather, MAX_AGE_MS, readCache, type SpaceWeather } from './spaceWeather'

export interface SpaceWeatherState {
  data: SpaceWeather | null
  /** True while a refresh is running. */
  syncing: boolean
  /** The last refresh failed, or there is no link: the cached data is shown. */
  offline: boolean
}

/** Cached NASA space weather, refreshed in the background when it is older than an hour. */
export function useSpaceWeather(): SpaceWeatherState {
  const [data, setData] = useState<SpaceWeather | null>(readCache)
  const [syncing, setSyncing] = useState(false)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return
    let cancelled = false
    const run = async () => {
      if (!navigator.onLine) {
        if (!cancelled) setOffline(true)
        return
      }
      setSyncing(true)
      try {
        const fresh = await fetchSpaceWeather()
        if (!cancelled) {
          setData(fresh)
          setOffline(false)
        }
      } catch {
        if (!cancelled) setOffline(true)
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }
    // Deferred so the screen paints first; the request runs in the background.
    const id = window.setTimeout(() => void run(), 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [])

  return { data, syncing, offline }
}
