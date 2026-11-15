import { BatteryFull, Monitor, RotateCw, Signal, Smartphone, Tablet, Wifi } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useT } from '../i18n'
import { msg } from '../i18n/msg'
import { DEVICES, useWindowSize, type PreviewMode, type PreviewState } from '../lib/devicePreview'
import { SpaceBackdrop } from './SpaceBackdrop'

const OPTIONS: { mode: PreviewMode; label: string; icon: typeof Monitor }[] = [
  { mode: 'web', label: msg('Web'), icon: Monitor },
  { mode: 'tablet', label: msg('Tablet'), icon: Tablet },
  { mode: 'phone', label: msg('Phone'), icon: Smartphone },
]

/** Segmented control to switch between the web layout and a phone or tablet preview. */
export function DeviceSwitcher({
  state,
  onChange,
  className = '',
}: {
  state: PreviewState
  onChange: (patch: Partial<PreviewState>) => void
  className?: string
}) {
  const t = useT()
  return (
    <div className={`glass flex items-center gap-1 rounded-full p-1 ${className}`}>
      <div role="radiogroup" aria-label={t('Preview the app as')} className="flex gap-1">
        {OPTIONS.map(({ mode, label, icon: Icon }) => {
          const active = state.mode === mode
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ mode })}
              className="relative flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium"
            >
              {active && (
                <motion.span
                  layoutId="device-active"
                  className="absolute inset-0 rounded-full bg-white/14"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={16} strokeWidth={1.75} className={`relative ${active ? 'text-ink' : 'text-ink-dim'}`} aria-hidden />
              <span className={`relative ${active ? 'text-ink' : 'text-ink-dim'}`}>{t(label)}</span>
            </button>
          )
        })}
      </div>
      {state.mode !== 'web' && (
        <button
          type="button"
          onClick={() => onChange({ orientation: state.orientation === 'portrait' ? 'landscape' : 'portrait' })}
          aria-label={t('Rotate')}
          title={t('Rotate')}
          className="flex size-10 items-center justify-center rounded-full border-l border-line text-ink-dim hover:text-ink"
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden />
        </button>
      )}
    </div>
  )
}

/** Full-screen stage that shows the app inside a phone or tablet frame at real size, scaled to fit. */
export function DeviceStage({
  state,
  onChange,
}: {
  state: PreviewState & { mode: 'phone' | 'tablet' }
  onChange: (patch: Partial<PreviewState>) => void
}) {
  const device = DEVICES[state.mode]
  const landscape = state.orientation === 'landscape'
  const screenW = landscape ? device.h : device.w
  const screenH = landscape ? device.w : device.h
  const frameW = screenW + device.bezel * 2
  const frameH = screenH + device.bezel * 2
  const { w, h } = useWindowSize()
  const scale = Math.min(1, (h - 136) / frameH, (w - 96) / frameW)
  const t = useT()

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-hidden">
      <SpaceBackdrop />
      <div className="relative z-10 flex flex-col items-center gap-2 pb-5 pt-5">
        <DeviceSwitcher state={state} onChange={onChange} />
        <p className="text-xs text-ink-dim tabular-nums">
          {t(device.name)} · {screenW} × {screenH} · {Math.round(scale * 100)}%
        </p>
      </div>

      <div className="relative z-10" style={{ width: frameW * scale, height: frameH * scale }}>
        <motion.div
          key={`${state.mode}-${state.orientation}`}
          initial={{ opacity: 0, y: 24, scale: scale * 0.96 }}
          animate={{ opacity: 1, y: 0, scale }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 top-0 origin-top-left bg-[#1b2029] shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1.5px_rgb(255_255_255/0.14)]"
          style={{ width: frameW, height: frameH, borderRadius: device.radius, padding: device.bezel }}
        >
          <div
            className="relative flex h-full w-full flex-col overflow-hidden bg-space"
            style={{ borderRadius: device.radius - device.bezel }}
          >
            {!landscape && <StatusBar mode={state.mode} height={device.statusBar} />}
            <EmbeddedApp />
            {state.mode === 'phone' && (
              <span
                className="pointer-events-none absolute bottom-2 left-1/2 h-1.5 w-32 -translate-x-1/2 rounded-full bg-white/70"
                aria-hidden
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatusBar({ mode, height }: { mode: 'phone' | 'tablet'; height: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-between px-7 text-[13px] font-semibold"
      style={{ height }}
      aria-hidden
    >
      <span className="w-14">9:41</span>
      {mode === 'phone' && <span className="absolute left-1/2 top-3 h-8 w-28 -translate-x-1/2 rounded-full bg-black" />}
      <span className="flex w-14 items-center justify-end gap-1">
        <Signal size={14} strokeWidth={2.25} />
        <Wifi size={14} strokeWidth={2.25} />
        <BatteryFull size={18} strokeWidth={1.75} />
      </span>
    </div>
  )
}

/**
 * The real app in an iframe, so its layout responds to the device width. It opens on the
 * current screen, and screen changes inside are mirrored to the address bar.
 */
function EmbeddedApp() {
  const [src] = useState(() => `${window.location.pathname}?embed=1${window.location.hash || '#/'}`)
  return (
    <iframe
      src={src}
      title="AstroVitals preview"
      className="w-full flex-1 border-0 bg-space"
      onLoad={(e) => {
        const inner = e.currentTarget.contentWindow
        if (!inner) return
        try {
          inner.addEventListener('hashchange', () => {
            window.history.replaceState(null, '', inner.location.hash)
          })
        } catch {
          // Cross-origin frames cannot be read; same origin here, so this should not happen.
        }
      }}
    />
  )
}
