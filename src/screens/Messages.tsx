import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCheck, FileText, Radio, Send } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { SourceList } from '../components/SourceList'
import { locationById } from '../data/locations'
import { useLocale, useT } from '../i18n'
import { delayParts, MARS_MAX_DELAY_MIN, messageProgress, oneWayDelay } from '../lib/comms'
import { addMessage, db } from '../lib/db'
import { profileKey } from '../lib/profiles'
import { useSettings } from '../lib/store'

const subscribeSecond = (onChange: () => void) => {
  const id = window.setInterval(onChange, 1000)
  return () => window.clearInterval(id)
}
/** The time, to the second, so signals can be seen travelling. */
const useSecond = () => useSyncExternalStore(subscribeSecond, () => Math.floor(Date.now() / 1000) * 1000)

const DELAY_KEY = 'tether-delay-min'

function readDelay(): number {
  try {
    const v = Number(localStorage.getItem(profileKey(DELAY_KEY)))
    return v >= 1 && v <= MARS_MAX_DELAY_MIN ? v : MARS_MAX_DELAY_MIN
  } catch {
    return MARS_MAX_DELAY_MIN
  }
}

/** Messages to the ground team, shown travelling with the real signal delay for the location. */
export function Messages() {
  const t = useT()
  const locale = useLocale()
  const now = useSecond()
  const locationId = useSettings((s) => s.locationId)
  const location = locationById(locationId)
  const [farMinutes, setFarMinutes] = useState(readDelay)
  const [text, setText] = useState('')
  const [withReport, setWithReport] = useState(true)
  const messages = useLiveQuery(() => db.messages.orderBy('at').reverse().limit(20).toArray(), [])

  const far = locationId === 'transit' || locationId === 'mars'
  const delay = oneWayDelay(locationId, farMinutes)
  const parts = delayParts(delay)
  const delayText = delay === 0 ? t('Almost none') : parts.unit === 's' ? t('{n} s', { n: parts.n }) : t('{n} min', { n: parts.n })
  const time = (ts: number) => new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  const changeDelay = (v: number) => {
    setFarMinutes(v)
    try {
      localStorage.setItem(profileKey(DELAY_KEY), String(v))
    } catch {
      // Not saved: the delay resets on the next visit.
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Messages to the ground')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Talking to Earth takes time')}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          {t('Far from Earth, every message travels at the speed of light and still arrives minutes later. That is why Tether tells you what to do now instead of waiting for an answer.')}
        </p>
      </div>

      <section className="panel rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label">{t(location.name)}</p>
            <p className="mt-1 text-2xl font-semibold">{delayText}</p>
            <p className="text-xs text-ink-dim">{t('One way. A reply needs at least twice as long.')}</p>
          </div>
          <Radio size={32} className="text-accent" aria-hidden />
        </div>
        {far && (
          <div className="mt-4">
            <label htmlFor="delay" className="text-sm text-ink-dim">
              {t('Delay today, set by where the planets are (1 to {max} min)', { max: MARS_MAX_DELAY_MIN })}
            </label>
            <input
              id="delay"
              type="range"
              min={1}
              max={MARS_MAX_DELAY_MIN}
              value={farMinutes}
              onChange={(e) => changeDelay(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-accent)]"
            />
          </div>
        )}
        <SourceList sourceIds={['hrp-distance']} />
      </section>

      <section className="panel space-y-3 rounded-3xl p-5">
        <label htmlFor="msg" className="label">
          {t('New message to the flight surgeon')}
        </label>
        <textarea
          id="msg"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('How you feel, what you measured, what you need.')}
          className="w-full rounded-2xl border border-line bg-panel-2 p-3 text-sm outline-none focus:border-accent/60"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={withReport} onChange={(e) => setWithReport(e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
          {t('Attach my health report')}
        </label>
        <button
          type="button"
          disabled={!text.trim() && !withReport}
          onClick={async () => {
            await addMessage(text.trim(), delay, withReport)
            setText('')
          }}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink font-semibold text-space disabled:opacity-40"
        >
          <Send size={16} aria-hidden /> {t('Send')}
        </button>
        <p className="text-xs text-ink-faint">
          {t('A simulation of the link: messages stay on this device. To really send your report, use')}{' '}
          <Link to="/report" className="text-accent">
            {t('Report')}
          </Link>
          .
        </p>
      </section>

      {messages && messages.length > 0 && (
        <section className="space-y-2">
          <h2 className="label">{t('Outbox')}</h2>
          {messages.map((m) => {
            const p = messageProgress(m, now)
            const left = Math.max(0, Math.ceil((p.arrivesAt - now) / 1000))
            return (
              <article key={m.id} className="panel rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-ink-dim">
                  <span>{time(m.at)}</span>
                  {p.state === 'delivered' ? (
                    <span className="inline-flex items-center gap-1 text-ok">
                      <CheckCheck size={14} aria-hidden /> {t('Reached Earth')}
                    </span>
                  ) : (
                    <span className="text-watch">
                      {t('On its way, {n} left', {
                        n: left >= 120 ? t('{n} min', { n: Math.ceil(left / 60) }) : t('{n} s', { n: left }),
                      })}
                    </span>
                  )}
                </div>
                {m.text && <p className="mt-2 text-sm">{m.text}</p>}
                {m.withReport && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-dim">
                    <FileText size={12} aria-hidden /> {t('Health report attached')}
                  </p>
                )}
                <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${p.state === 'delivered' ? 'bg-ok' : 'bg-accent'}`}
                    style={{ width: `${p.progress * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-ink-faint">
                  <span>{t('Crew')}</span>
                  <span>{t('Earth')}</span>
                </div>
                {m.delayMs > 0 && (
                  <p className="mt-2 text-xs text-ink-dim">
                    {t('Earliest reply: {time}, if the ground answers at once.', { time: time(p.replyAt) })}
                  </p>
                )}
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
