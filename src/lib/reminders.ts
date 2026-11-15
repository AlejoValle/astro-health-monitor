import { useEffect } from 'react'
import { SLOT_LABEL } from '../data/routine'
import { translate } from '../i18n'
import { useSettings } from './store'
import { slotOf, startOfDay, type TaskStatus } from './routine'

/** Browser notifications need the API and a secure context (https or localhost). */
export const notificationsAvailable = () => typeof Notification !== 'undefined' && window.isSecureContext

const KEY = 'astrovitals-reminded'

/**
 * Sends one notification per routine slot and day when that slot has tasks due.
 * Runs only while the app is open; there is no push server.
 */
export function useReminders(enabled: boolean, statuses: TaskStatus[] | undefined, now: number | undefined) {
  useEffect(() => {
    if (!enabled || !statuses || now === undefined) return
    if (!notificationsAvailable() || Notification.permission !== 'granted') return
    const slot = slotOf(now)
    if (!slot) return
    const due = statuses.filter((s) => s.task.slot === slot && s.state === 'due')
    if (due.length === 0) return

    const id = `${startOfDay(now)}-${slot}`
    try {
      if (localStorage.getItem(KEY) === id) return
      localStorage.setItem(KEY, id)
    } catch {
      // Without storage we may remind twice; better than not at all.
    }
    const lang = useSettings.getState().language
    new Notification(`Tether · ${translate(lang, SLOT_LABEL[slot])}`, {
      body: due.map((s) => translate(lang, s.task.label)).join(' · '),
      icon: 'icon-192.png',
      tag: id,
    })
  }, [enabled, statuses, now])
}
