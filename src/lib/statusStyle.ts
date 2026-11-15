import { msg } from '../i18n/msg'
import type { Status } from './rules'

export const STATUS_STYLE: Record<Status, { text: string; bg: string; ring: string; glow: string; word: string }> = {
  ok: {
    text: 'text-ok',
    bg: 'bg-ok/12',
    ring: 'border-ok/50',
    glow: 'shadow-[0_0_60px_-10px_var(--color-ok)]',
    word: msg('OK'),
  },
  watch: {
    text: 'text-watch',
    bg: 'bg-watch/12',
    ring: 'border-watch/50',
    glow: 'shadow-[0_0_60px_-10px_var(--color-watch)]',
    word: msg('Watch'),
  },
  alert: {
    text: 'text-alert',
    bg: 'bg-alert/12',
    ring: 'border-alert/50',
    glow: 'shadow-[0_0_60px_-10px_var(--color-alert)]',
    word: msg('Act'),
  },
}
