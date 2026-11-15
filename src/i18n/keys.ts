/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { EXERCISE_PLANS } from '../data/exercise'
import { HAZARDS } from '../data/hazards'
import { INDICATORS } from '../data/indicators'
import { LOCATIONS } from '../data/locations'
import { SHIELDING, SOLAR_LABEL, STORM_DOSE, STORM_STEPS } from '../data/radiation'
import { PATCHES, RANKS, ROUTINE, SLOT_LABEL } from '../data/routine'
import { SOUNDS } from '../data/sounds'
import { STRESS_OPTIONS, STRESS_QUESTIONS } from '../data/stressCheck'
import { AREAS, NODES } from '../data/symptomTree'
import { BODY_SYSTEMS } from '../data/bodySystems'
import { SCENARIOS } from '../data/scenarios'
import { TRIVIA } from '../data/trivia'
import { TIMELINE } from '../data/timeline'
import { REAL_CASES } from '../data/realCrews'
import { MISSION_PLANS, STORM_ACTION, STORM_SCALE } from '../data/missionPlans'
import { EARTH_USES } from '../data/earthUses'

// Test-only helper: every English string the app shows, so each language can be checked for gaps.

const CALL = /\b(?:t|msg)\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\$])*)`)/g

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'i18n' ? [] : files(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

/** Strings passed to t() or msg() anywhere in the app's source. */
export function sourceKeys(srcDir: string): Set<string> {
  const out = new Set<string>()
  for (const file of files(srcDir)) {
    for (const m of readFileSync(file, 'utf8').matchAll(CALL)) {
      out.add((m[1] ?? m[2] ?? m[3]).replace(/\\(['"`\\])/g, '$1'))
    }
  }
  return out
}

const TEXT_KEYS = new Set([
  'label', 'hint', 'text', 'help', 'title', 'meaning', 'steps', 'name', 'short', 'why',
  'howTo', 'note', 'body', 'goal', 'gravity', 'contactLabel', 'does', 'space', 'watch', 'story', 'reactions', 'question', 'options', 'explain',
  'when', 'toLabel', 'crew', 'uses', 'who', 'mission', 'linkLabel', 'findings',
])

function collect(value: unknown, out: Set<string>, textKey = false) {
  if (typeof value === 'string') {
    if (textKey) out.add(value)
  } else if (Array.isArray(value)) {
    for (const v of value) collect(v, out, textKey)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collect(v, out, TEXT_KEYS.has(k))
  }
}

/** Text fields of the data files, which screens pass through t() when they show them. */
export function dataKeys(): Set<string> {
  const out = new Set<string>()
  for (const data of [REAL_CASES, TIMELINE, MISSION_PLANS, STORM_SCALE, EARTH_USES, TRIVIA, SCENARIOS, BODY_SYSTEMS, AREAS, NODES, INDICATORS, LOCATIONS, EXERCISE_PLANS, SOUNDS, HAZARDS, ROUTINE, PATCHES, RANKS, SOLAR_LABEL]) {
    collect(data, out)
  }
  for (const list of [STRESS_QUESTIONS, STRESS_OPTIONS, STORM_STEPS, Object.values(SLOT_LABEL), Object.values(SHIELDING), Object.values(STORM_DOSE), Object.values(STORM_ACTION)]) {
    for (const s of list) out.add(s)
  }
  return out
}
