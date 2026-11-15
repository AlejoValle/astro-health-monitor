/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DICTIONARIES, LANGUAGES, translate } from '.'
import { dataKeys, sourceKeys } from './keys'

const SRC = fileURLToPath(new URL('..', import.meta.url))
const keys = [...new Set([...sourceKeys(SRC), ...dataKeys()])].sort()
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

// `I18N_DUMP=path npx vitest run src/i18n` writes the keys a language is missing, to translate them.
if (process.env.I18N_DUMP) {
  const missing = Object.fromEntries(
    Object.entries(DICTIONARIES).map(([lang, dict]) => [lang, keys.filter((k) => !(k in dict))]),
  )
  writeFileSync(process.env.I18N_DUMP, JSON.stringify({ keys, missing }, null, 2))
}

describe('translations', () => {
  it('finds the app strings', () => {
    expect(keys.length).toBeGreaterThan(300)
  })

  it('defaults to English and fills placeholders', () => {
    expect(translate('en', '{n} of {total} done', { n: 2, total: 5 })).toBe('2 of 5 done')
    expect(translate('es', 'A string nobody translated')).toBe('A string nobody translated')
  })

  it('lists English first and every other language has a dictionary', () => {
    expect(LANGUAGES[0].id).toBe('en')
    expect(Object.keys(DICTIONARIES).sort()).toEqual(LANGUAGES.slice(1).map((l) => l.id).sort())
  })

  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    it(`${lang}: translates every string`, () => {
      expect(keys.filter((k) => !(k in dict))).toEqual([])
    })

    it(`${lang}: keeps the same placeholders`, () => {
      const wrong = Object.entries(dict).filter(([en, tr]) => placeholders(en).join() !== placeholders(tr).join())
      expect(wrong).toEqual([])
    })
  }
})
