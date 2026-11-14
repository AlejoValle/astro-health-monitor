import type { SoundId } from '../data/sounds'
import { fillBrown, fillPink, fillWhite, seamlessLoop } from './noise'

const FADE_S = 0.5
const LOOP_S = 8

let ctx: AudioContext | null = null
let master: GainNode | null = null
let voice: { out: GainNode; nodes: AudioScheduledSourceNode[] } | null = null
const buffers: Partial<Record<'white' | 'pink' | 'brown', AudioBuffer>> = {}

export const audioSupported = () => typeof window !== 'undefined' && 'AudioContext' in window

function noise(ac: AudioContext, color: 'white' | 'pink' | 'brown') {
  if (!buffers[color]) {
    const fade = Math.floor(ac.sampleRate * 0.5)
    const raw = new Float32Array(ac.sampleRate * LOOP_S + fade)
    const fill = { white: fillWhite, pink: fillPink, brown: fillBrown }[color]
    const loop = seamlessLoop(fill(raw), fade)
    const buffer = ac.createBuffer(1, loop.length, ac.sampleRate)
    buffer.getChannelData(0).set(loop)
    buffers[color] = buffer
  }
  const source = ac.createBufferSource()
  source.buffer = buffers[color]!
  source.loop = true
  return source
}

function filter(ac: AudioContext, type: BiquadFilterType, frequency: number, q = 0.7) {
  const node = ac.createBiquadFilter()
  node.type = type
  node.frequency.value = frequency
  node.Q.value = q
  return node
}

/** A slow sine that moves `target` up and down by `depth` around its current value. */
function lfo(ac: AudioContext, hz: number, depth: number, target: AudioParam) {
  const osc = ac.createOscillator()
  osc.frequency.value = hz
  const amount = ac.createGain()
  amount.gain.value = depth
  osc.connect(amount).connect(target)
  return osc
}

function build(ac: AudioContext, id: SoundId, out: GainNode): AudioScheduledSourceNode[] {
  const level = ac.createGain()
  level.connect(out)

  switch (id) {
    case 'rain': {
      const source = noise(ac, 'white')
      level.gain.value = 0.35
      source.connect(filter(ac, 'highpass', 900)).connect(filter(ac, 'lowpass', 7000)).connect(level)
      return [source]
    }
    case 'waves': {
      const source = noise(ac, 'brown')
      level.gain.value = 0.55
      source.connect(filter(ac, 'lowpass', 700)).connect(level)
      return [source, lfo(ac, 0.1, 0.4, level.gain)]
    }
    case 'wind': {
      const source = noise(ac, 'pink')
      const band = filter(ac, 'bandpass', 450, 1.2)
      level.gain.value = 0.9
      source.connect(band).connect(level)
      return [source, lfo(ac, 0.07, 250, band.frequency), lfo(ac, 0.11, 0.3, level.gain)]
    }
    case 'brown': {
      const source = noise(ac, 'brown')
      level.gain.value = 0.7
      source.connect(level)
      return [source]
    }
    case 'pink': {
      const source = noise(ac, 'pink')
      level.gain.value = 0.6
      source.connect(level)
      return [source]
    }
    case 'drone': {
      level.gain.value = 0.16
      const tones = [110, 165, 220].map((hz) => {
        const osc = ac.createOscillator()
        osc.frequency.value = hz
        osc.connect(level)
        return osc
      })
      return [...tones, lfo(ac, 0.08, 0.06, level.gain)]
    }
  }
}

function fadeOut(ac: AudioContext, old: NonNullable<typeof voice>) {
  const t = ac.currentTime
  old.out.gain.cancelScheduledValues(t)
  old.out.gain.setValueAtTime(old.out.gain.value, t)
  old.out.gain.linearRampToValueAtTime(0, t + FADE_S)
  for (const node of old.nodes) node.stop(t + FADE_S + 0.05)
  window.setTimeout(() => old.out.disconnect(), (FADE_S + 0.1) * 1000)
}

/** Must be called from a tap: browsers only start audio after a user gesture. */
export function playSound(id: SoundId, volume: number) {
  ctx ??= new AudioContext()
  if (!master) {
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  void ctx.resume()
  master.gain.value = volume
  if (voice) fadeOut(ctx, voice)

  const out = ctx.createGain()
  out.gain.setValueAtTime(0, ctx.currentTime)
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_S)
  out.connect(master)
  const nodes = build(ctx, id, out)
  for (const node of nodes) node.start()
  voice = { out, nodes }
}

export function stopSound() {
  if (ctx && voice) fadeOut(ctx, voice)
  voice = null
}

export function setSoundVolume(volume: number) {
  if (ctx && master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05)
}
