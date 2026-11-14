import { Bluetooth, BluetoothConnected, BluetoothOff, HeartPulse } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { bluetoothSupported, connectHeartRate, median, type HeartRateLink } from '../lib/bluetooth'

const MIN_SAMPLES = 5
const WINDOW = 15

type Phase = 'idle' | 'connecting' | 'live' | 'failed'

export function HeartRateSensor({ onSave }: { onSave: (bpm: number) => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [deviceName, setDeviceName] = useState('')
  const [samples, setSamples] = useState<number[]>([])
  const link = useRef<HeartRateLink | null>(null)

  useEffect(() => () => link.current?.disconnect(), [])

  if (!bluetoothSupported()) {
    return (
      <div className="panel flex items-center gap-3 rounded-2xl p-4 text-sm text-ink-dim">
        <BluetoothOff size={20} className="shrink-0" aria-hidden />
        Bluetooth sensors are not available in this browser. Enter your pulse by hand below.
      </div>
    )
  }

  const connect = async () => {
    setPhase('connecting')
    setSamples([])
    try {
      link.current = await connectHeartRate(
        // Straps report 0 while they have no skin contact.
        (bpm) => bpm > 0 && setSamples((s) => [...s, bpm].slice(-WINDOW)),
        () => setPhase('idle'),
      )
      setDeviceName(link.current.deviceName)
      setPhase('live')
    } catch (error) {
      // NotFoundError means the crew member closed the device picker.
      setPhase(error instanceof DOMException && error.name === 'NotFoundError' ? 'idle' : 'failed')
    }
  }

  if (phase === 'live') {
    const ready = samples.length >= MIN_SAMPLES
    const current = samples.at(-1)
    return (
      <div className="panel rounded-3xl p-4">
        <div className="flex items-center gap-2 text-sm text-accent">
          <BluetoothConnected size={18} aria-hidden />
          <span className="truncate">{deviceName}</span>
        </div>
        <p className="mt-3 flex items-baseline justify-center gap-2" aria-live="polite">
          <HeartPulse size={28} className="self-center text-alert" aria-hidden />
          <span className="text-6xl font-semibold tabular-nums tracking-tight">{current ?? '--'}</span>
          <span className="text-ink-dim">bpm</span>
        </p>
        <p className="mt-1 text-center text-xs text-ink-dim">
          {ready ? 'Steady. Saves the middle value of the last readings.' : 'Stay still. Reading your pulse…'}
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={() => onSave(median(samples))}
          className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-space disabled:opacity-40"
        >
          {ready ? `Save ${median(samples)} bpm` : 'Reading…'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void connect()}
        disabled={phase === 'connecting'}
        className="glass flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold disabled:opacity-60"
      >
        <Bluetooth size={20} className="text-accent" aria-hidden />
        {phase === 'connecting' ? 'Connecting…' : 'Connect a heart rate sensor'}
      </button>
      {phase === 'failed' && (
        <p className="mt-2 text-sm text-alert" role="alert">
          Could not connect. Check that the sensor is on and worn, then try again or enter your pulse by hand.
        </p>
      )}
    </div>
  )
}
