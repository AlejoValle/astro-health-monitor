import type { IndicatorField } from '../data/indicators'

/** A typed value, or `undefined` when it is empty, not a number or outside the plausible range. */
export function parseField(field: IndicatorField, text: string): number | undefined {
  if (text.trim() === '') return undefined
  const n = Number(text.replace(',', '.'))
  return Number.isFinite(n) && n >= field.min && n <= field.max ? n : undefined
}
