import { useCallback } from 'react'
import { useSettings } from '../lib/store'
import { CATALOG } from './catalog'

/**
 * Languages of the crews that fly today: English and Russian are the ISS working languages,
 * Chinese for Tiangong, Japanese for JAXA, French for ESA, CNES and the CSA, and Spanish.
 */
export const LANGUAGES = [
  { id: 'en', native: 'English', english: 'English', locale: 'en-US' },
  { id: 'es', native: 'Español', english: 'Spanish', locale: 'es' },
  { id: 'ru', native: 'Русский', english: 'Russian', locale: 'ru' },
  { id: 'zh', native: '中文', english: 'Chinese (Simplified)', locale: 'zh-CN' },
  { id: 'ja', native: '日本語', english: 'Japanese', locale: 'ja' },
  { id: 'fr', native: 'Français', english: 'French', locale: 'fr' },
] as const

export type Lang = (typeof LANGUAGES)[number]['id']

export type Dictionary = Record<string, string>

const COLUMNS = ['es', 'ru', 'zh', 'ja', 'fr'] as const

/** Translations keyed by the English text, built from the catalog. A missing key falls back to English. */
export const DICTIONARIES = Object.fromEntries(
  COLUMNS.map((lang, i) => [lang, Object.fromEntries(CATALOG.map((row) => [row[0], row[i + 1]]))]),
) as Record<Exclude<Lang, 'en'>, Dictionary>

export type Vars = Record<string, string | number>

const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole)) : text

export function translate(lang: Lang, text: string, vars?: Vars) {
  const translated = lang === 'en' ? text : (DICTIONARIES[lang][text] ?? text)
  return fill(translated, vars)
}

export const localeOf = (lang: Lang) => LANGUAGES.find((l) => l.id === lang)!.locale

/** `t('English text', { vars })` in the crew member's language. */
export function useT() {
  const lang = useSettings((s) => s.language)
  return useCallback((text: string, vars?: Vars) => translate(lang, text, vars), [lang])
}

/** BCP 47 locale for dates and numbers. */
export function useLocale() {
  return localeOf(useSettings((s) => s.language))
}
