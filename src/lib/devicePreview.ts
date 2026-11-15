import { useCallback, useState, useSyncExternalStore } from 'react'

export type PreviewMode = 'web' | 'tablet' | 'phone'
export type Orientation = 'portrait' | 'landscape'

export interface PreviewState {
  mode: PreviewMode
  orientation: Orientation
}

/** Screen sizes in CSS pixels, portrait. Close to a current iPhone and iPad Air. */
export const DEVICES = {
  phone: { name: 'Phone' as string, w: 390, h: 844, radius: 56, bezel: 12, statusBar: 47 },
  tablet: { name: 'Tablet' as string, w: 820, h: 1180, radius: 38, bezel: 18, statusBar: 24 },
} as const

/** True inside the device preview's iframe, where the menu must not show again. */
export const isEmbedded = (() => {
  try {
    return window.self !== window.top || new URLSearchParams(window.location.search).has('embed')
  } catch {
    return true
  }
})()

// A desktop browser: wide screen with a mouse or trackpad. Phones and tablets never match.
const DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

const subscribeDesktop = (onChange: () => void) => {
  const media = window.matchMedia(DESKTOP_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** Whether the app runs in a desktop web browser, outside the preview iframe. */
export function useDesktopWeb() {
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  )
  return desktop && !isEmbedded
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

export function useWindowSize() {
  const w = useSyncExternalStore(subscribeResize, () => window.innerWidth)
  const h = useSyncExternalStore(subscribeResize, () => window.innerHeight)
  return { w, h }
}

const KEY = 'astrovitals-preview'
const DEFAULT: PreviewState = { mode: 'web', orientation: 'portrait' }

function read(): PreviewState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<PreviewState> | null
    return {
      mode: saved?.mode === 'phone' || saved?.mode === 'tablet' ? saved.mode : 'web',
      orientation: saved?.orientation === 'landscape' ? 'landscape' : 'portrait',
    }
  } catch {
    return DEFAULT
  }
}

/** The chosen preview, remembered in this browser only. */
export function usePreview() {
  const [state, setState] = useState(read)
  const update = useCallback((patch: Partial<PreviewState>) => {
    setState((current) => {
      const next = { ...current, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Storage can be blocked; the choice then lasts for this visit only.
      }
      return next
    })
  }, [])
  return [state, update] as const
}
