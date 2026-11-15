import { A } from './a'
import { B } from './b'
import { C } from './c'
import { D } from './d'
import { E } from './e'
import { F } from './f'
import { G } from './g'
import type { Row } from './types'

/** Every translated string, split alphabetically by its English text. */
export const CATALOG: readonly Row[] = [...A, ...B, ...C, ...D, ...E, ...F, ...G]
