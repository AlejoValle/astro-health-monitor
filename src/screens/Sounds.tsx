import { AudioLines, CloudRain, Orbit, Pause, Play, Volume1, Volume2, Waves, Wind } from 'lucide-react'
import { useT } from '../i18n'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SourceList } from '../components/SourceList'
import { SOUND_SOURCE_IDS, SOUNDS, TIMER_MINUTES, type SoundId } from '../data/sounds'
import { audioSupported } from '../lib/audio'
import { useSoundPlayer } from '../lib/soundPlayer'

const ICON: Record<SoundId, LucideIcon> = {
  rain: CloudRain,
  waves: Waves,
  wind: Wind,
  brown: Volume1,
  pink: AudioLines,
  drone: Orbit,
}

export function Sounds() {
  const t = useT()
  const { playing, volume, endsAt, timerMinutes, toggle, setVolume, setTimer } = useSoundPlayer()
  const minutesLeft = useMinutesLeft(endsAt)

  if (!audioSupported()) {
    return (
      <section className="panel mx-auto max-w-xl rounded-3xl p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('Sounds')}</h1>
        <p className="mt-2 text-sm text-ink-dim">{t('This browser cannot generate audio.')}</p>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <p className="label">{t('Sounds')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('Pick a sound')}</h1>
        <p className="mt-1 text-sm text-ink-dim">{t('It keeps playing while you use other screens.')}</p>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {SOUNDS.map((sound) => {
          const Icon = ICON[sound.id]
          const active = playing === sound.id
          return (
            <li key={sound.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(sound.id)}
                className={`flex min-h-36 w-full flex-col justify-between rounded-3xl border p-4 text-left ${
                  active ? 'border-accent/60 bg-accent/10' : 'panel active:bg-panel-2'
                }`}
              >
                <span className="flex items-center justify-between">
                  <Icon size={26} strokeWidth={1.5} className="text-accent" aria-hidden />
                  <span
                    className={`flex size-10 items-center justify-center rounded-full ${active ? 'bg-ink text-space' : 'bg-panel-2 text-ink'}`}
                  >
                    {active ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
                  </span>
                </span>
                <span>
                  <span className="block font-semibold">{t(sound.name)}</span>
                  <span className="block text-xs text-ink-dim">{active ? t('Playing') : t(sound.hint)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <section className="panel space-y-5 rounded-3xl p-5">
        <label className="block">
          <span className="label">{t('Volume')}</span>
          <span className="mt-2 flex items-center gap-3">
            <Volume1 size={18} className="text-ink-dim" aria-hidden />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-12 flex-1 accent-(--color-accent)"
            />
            <Volume2 size={18} className="text-ink-dim" aria-hidden />
          </span>
        </label>

        <div>
          <p className="label">{t('Stop after')}</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <TimerChip active={endsAt === null} disabled={!playing} onClick={() => setTimer(null)}>
              {t('Off')}
            </TimerChip>
            {TIMER_MINUTES.map((minutes) => (
              <TimerChip key={minutes} active={timerMinutes === minutes} disabled={!playing} onClick={() => setTimer(minutes)}>
                {t('{n} min', { n: minutes })}
              </TimerChip>
            ))}
          </div>
          <p className="mt-2 min-h-5 text-sm text-ink-dim">
            {minutesLeft !== null
              ? t('Stops in {n} min', { n: minutesLeft })
              : playing
                ? ''
                : t('Start a sound to set a timer.')}
          </p>
        </div>
      </section>

      <section className="panel rounded-3xl p-5">
        <h2 className="label">{t('Why it is here')}</h2>
        <p className="mt-2 text-sm text-ink-dim">
          {t(
            'Isolation, confinement and a noisy closed habitat make rest harder on a long mission. These sounds are for comfort and rest. They are not a treatment.',
          )}
        </p>
        <SourceList sourceIds={SOUND_SOURCE_IDS} />
        <p className="mt-3 text-xs text-ink-faint">
          {t('Generated on this device. Nothing is downloaded, so it works without a connection.')}
        </p>
      </section>
    </div>
  )
}

function TimerChip(props: { active: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      aria-pressed={props.active}
      onClick={props.onClick}
      className={`min-h-12 rounded-2xl border text-sm font-medium disabled:opacity-40 ${
        props.active ? 'border-accent/60 bg-accent/10' : 'border-line bg-panel'
      }`}
    >
      {props.children}
    </button>
  )
}

function useMinutesLeft(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt === null) return
    const update = () => setNow(Date.now())
    const first = window.setTimeout(update, 0)
    const tick = window.setInterval(update, 5_000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(tick)
    }
  }, [endsAt])
  return endsAt === null ? null : Math.max(1, Math.ceil((endsAt - now) / 60_000))
}
