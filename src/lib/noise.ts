// Noise generators for the ambient sounds. Everything is synthesized on the device,
// so there are no audio files to license or download.

type Random = () => number

export function fillWhite(out: Float32Array, rnd: Random = Math.random) {
  for (let i = 0; i < out.length; i++) out[i] = rnd() * 2 - 1
  return out
}

/** Pink noise (equal energy per octave), Paul Kellet's filter approximation. */
export function fillPink(out: Float32Array, rnd: Random = Math.random) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < out.length; i++) {
    const white = rnd() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
  return out
}

/** Brown noise (deeper rumble): a leaky running sum of white noise. */
export function fillBrown(out: Float32Array, rnd: Random = Math.random) {
  let last = 0
  for (let i = 0; i < out.length; i++) {
    last = (last + 0.02 * (rnd() * 2 - 1)) / 1.02
    out[i] = last * 3.5
  }
  return out
}

/**
 * Turns `samples` into a loop of `samples.length - fade` samples with no click at the seam:
 * the extra tail is cross-faded into the head, so the last sample flows into the first.
 */
export function seamlessLoop(samples: Float32Array, fade: number) {
  const length = samples.length - fade
  const out = samples.slice(0, length)
  for (let i = 0; i < fade; i++) {
    const t = i / fade
    out[i] = samples[i] * Math.sqrt(t) + samples[length + i] * Math.sqrt(1 - t)
  }
  return out
}
