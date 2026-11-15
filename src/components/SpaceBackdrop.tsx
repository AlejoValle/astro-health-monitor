import { useEffect, useRef } from 'react'
import type { LocationId } from '../data/locations'
import { useSettings } from '../lib/store'
import { WARP_EVENT } from '../lib/warp'

/** Colour of the body the crew is on or orbiting. Null in deep space: no planet, only stars. */
const BODY_COLOR: Record<LocationId, [number, number, number] | null> = {
  orbit: [59, 130, 246],
  transit: null,
  moon: [203, 213, 225],
  mars: [234, 104, 52],
}

interface Star {
  x: number
  y: number
  /** Depth: 0.15 far and dim, 1 near and bright. */
  z: number
  phase: number
}

const ACCENT = '125, 211, 252'

/**
 * Full-screen canvas behind the app: drifting stars, faint orbit rings around the current
 * body and a short warp effect on demand. With reduced motion it draws one still frame.
 */
export function SpaceBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const locationId = useSettings((s) => s.locationId)
  const targetRef = useRef(BODY_COLOR[locationId])
  const redrawRef = useRef<() => void>(() => {})

  useEffect(() => {
    targetRef.current = BODY_COLOR[locationId]
    redrawRef.current()
  }, [locationId])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let w = 0
    let h = 0
    let stars: Star[] = []
    let warpLevel = 0
    let time = 0
    let last = performance.now()
    let raf = 0
    // Planet colour and opacity ease toward the target when the location changes.
    const target0 = targetRef.current
    const body = { r: target0?.[0] ?? 0, g: target0?.[1] ?? 0, b: target0?.[2] ?? 0, a: target0 ? 1 : 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(320, Math.max(120, (w * h) / 6000)))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.15 + Math.random() * 0.85,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h)
      const wide = w >= 768
      // Desktop: the empty corner under the left column. Phone: behind the header, top right.
      const cx = w * (wide ? 0.2 : 0.88)
      const cy = h * (wide ? 0.82 : 0.1)
      const base = Math.min(w, h) * (wide ? 0.16 : 0.2)

      // Ease the body colour toward the current location.
      const target = targetRef.current
      const k = 1 - Math.exp(-dt / 400)
      if (target) {
        body.r += (target[0] - body.r) * k
        body.g += (target[1] - body.g) * k
        body.b += (target[2] - body.b) * k
      }
      body.a += ((target ? 1 : 0) - body.a) * k

      // Body glow.
      if (body.a > 0.01) {
        const rgb = `${Math.round(body.r)}, ${Math.round(body.g)}, ${Math.round(body.b)}`
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.6)
        glow.addColorStop(0, `rgba(${rgb}, ${0.32 * body.a})`)
        glow.addColorStop(0.35, `rgba(${rgb}, ${0.14 * body.a})`)
        glow.addColorStop(1, `rgba(${rgb}, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(cx, cy, base * 1.6, 0, Math.PI * 2)
        ctx.fill()
        const disc = ctx.createRadialGradient(cx - base * 0.15, cy - base * 0.15, 0, cx, cy, base * 0.45)
        disc.addColorStop(0, `rgba(${rgb}, ${0.55 * body.a})`)
        disc.addColorStop(1, `rgba(${rgb}, ${0.12 * body.a})`)
        ctx.fillStyle = disc
        ctx.beginPath()
        ctx.arc(cx, cy, base * 0.45, 0, Math.PI * 2)
        ctx.fill()
      }

      // Orbit rings with one satellite each; inner rings turn faster.
      const rings = [1, 1.65, 2.4, 3.3]
      rings.forEach((m, i) => {
        const r = base * m
        ctx.strokeStyle = `rgba(${ACCENT}, ${0.09 - i * 0.015})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
        const angle = time * (0.00018 / m) + i * 1.9
        const sx = cx + Math.cos(angle) * r
        const sy = cy + Math.sin(angle) * r
        ctx.fillStyle = `rgba(${ACCENT}, ${0.7 - i * 0.12})`
        ctx.beginPath()
        ctx.arc(sx, sy, i === 0 ? 2.2 : 1.6, 0, Math.PI * 2)
        ctx.fill()
      })

      // Stars: slow parallax drift; during warp they stream away from the centre.
      const wx = w / 2
      const wy = h / 2
      for (const s of stars) {
        const twinkle = 0.65 + 0.35 * Math.sin(time * 0.0015 * (0.4 + s.z) + s.phase)
        const alpha = (0.18 + s.z * 0.6) * twinkle
        if (warpLevel > 0.02) {
          const dx = s.x - wx
          const dy = s.y - wy
          const len = Math.hypot(dx, dy) || 1
          const ux = dx / len
          const uy = dy / len
          const push = warpLevel * s.z * dt * 1.4
          s.x += ux * push
          s.y += uy * push
          const tail = warpLevel * s.z * 90
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + warpLevel * 0.4)})`
          ctx.lineWidth = s.z * 1.4
          ctx.beginPath()
          ctx.moveTo(s.x, s.y)
          ctx.lineTo(s.x - ux * tail, s.y - uy * tail)
          ctx.stroke()
        } else {
          s.x -= s.z * dt * 0.006
          s.y += s.z * dt * 0.0025
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.fillRect(s.x, s.y, s.z * 1.6, s.z * 1.6)
        }
        // Wrap around, and respawn near the centre after leaving during warp.
        if (s.x < -100 || s.x > w + 100 || s.y < -100 || s.y > h + 100) {
          if (warpLevel > 0.02) {
            s.x = wx + (Math.random() - 0.5) * w * 0.3
            s.y = wy + (Math.random() - 0.5) * h * 0.3
          } else {
            s.x = s.x < -100 ? w + 50 : s.x > w + 100 ? -50 : s.x
            s.y = s.y > h + 100 ? -50 : s.y < -100 ? h + 50 : s.y
          }
        }
      }
    }

    const frame = (now: number) => {
      // Movement uses a capped step so a slow frame does not teleport stars;
      // the warp fades by real elapsed time so it never lingers on a throttled device.
      const elapsed = now - last
      const dt = Math.min(64, elapsed)
      last = now
      time += dt
      warpLevel *= Math.exp(-elapsed / 320)
      draw(dt)
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      if (reduce.matches) {
        draw(1000)
      } else {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    const onWarp = () => {
      if (!reduce.matches) warpLevel = 1
    }
    const onResize = () => {
      resize()
      if (reduce.matches) draw(1000)
    }

    redrawRef.current = () => {
      if (reduce.matches) draw(1000)
    }
    resize()
    start()
    window.addEventListener('resize', onResize)
    window.addEventListener(WARP_EVENT, onWarp)
    reduce.addEventListener('change', start)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(WARP_EVENT, onWarp)
      reduce.removeEventListener('change', start)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
}
