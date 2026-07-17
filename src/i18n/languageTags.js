/**
 * Language metadata: mapping TaxonWorks language names to BCP-47 tags, and
 * naming a locale for a reader.
 *
 * The API reports a common name's language as an ISO 639-2 *English name*, not
 * a code: "English", "Japanese", "Spanish; Castilian", or null when unset. That
 * is unusable as-is — BCP-47 tags are what `<html lang>`, JSON-LD `@language`
 * and locale comparison all require — so it is translated here.
 *
 * Only languages with an ISO 639-1 two-letter code are listed, because those
 * are the ones a site can configure as a locale, and matching is the only thing
 * this is for. An unmapped language is not an error: its name still labels the
 * value for a reader, it simply never matches a locale.
 *
 * Names come from the ISO 639-2 registry, where several languages carry
 * alternatives separated by "; " ("Spanish; Castilian", "Dutch; Flemish").
 * Every alternative is indexed, so any of them resolves.
 *
 * Free of Node built-ins: imported by build, server and browser code alike.
 */

const ISO_639_2_NAMES = {
  ar: ['Arabic'],
  bg: ['Bulgarian'],
  bn: ['Bengali'],
  ca: ['Catalan', 'Valencian'],
  cs: ['Czech'],
  da: ['Danish'],
  de: ['German'],
  el: ['Greek, Modern (1453-)', 'Greek'],
  en: ['English'],
  es: ['Spanish', 'Castilian'],
  et: ['Estonian'],
  eu: ['Basque'],
  fa: ['Persian'],
  fi: ['Finnish'],
  fr: ['French'],
  gl: ['Galician'],
  he: ['Hebrew'],
  hi: ['Hindi'],
  hr: ['Croatian'],
  hu: ['Hungarian'],
  hy: ['Armenian'],
  id: ['Indonesian'],
  is: ['Icelandic'],
  it: ['Italian'],
  ja: ['Japanese'],
  ko: ['Korean'],
  lt: ['Lithuanian'],
  lv: ['Latvian'],
  mk: ['Macedonian'],
  ms: ['Malay'],
  nl: ['Dutch', 'Flemish'],
  no: ['Norwegian'],
  pl: ['Polish'],
  pt: ['Portuguese'],
  ro: ['Romanian', 'Moldavian', 'Moldovan'],
  ru: ['Russian'],
  sk: ['Slovak'],
  sl: ['Slovenian'],
  sq: ['Albanian'],
  sr: ['Serbian'],
  sv: ['Swedish'],
  sw: ['Swahili'],
  th: ['Thai'],
  tr: ['Turkish'],
  uk: ['Ukrainian'],
  vi: ['Vietnamese'],
  zh: ['Chinese']
}

const NAME_TO_TAG = new Map()

for (const [tag, names] of Object.entries(ISO_639_2_NAMES)) {
  for (const name of names) {
    NAME_TO_TAG.set(normalize(name), tag)
  }
}

/**
 * BCP-47 tag for a TaxonWorks language name.
 *
 * @param {string|null|undefined} languageName - e.g. "Spanish; Castilian"
 * @returns {string|undefined} The tag, or undefined when the language is unset
 *   or has no ISO 639-1 code
 */
export function toLanguageTag(languageName) {
  if (typeof languageName !== 'string') return undefined

  for (const part of languageName.split(';')) {
    const tag = NAME_TO_TAG.get(normalize(part))

    if (tag) return tag
  }

  return undefined
}

/**
 * Whether a TaxonWorks language name is the given locale.
 *
 * Compares on the base language, so a site running `pt-BR` still matches a
 * name recorded as Portuguese.
 *
 * @param {string|null|undefined} languageName
 * @param {string} locale
 * @returns {boolean}
 */
export function matchesLocale(languageName, locale) {
  const tag = toLanguageTag(languageName)

  return tag !== undefined && tag === baseLanguage(locale)
}

/**
 * The language part of a locale: `pt-BR` -> `pt`.
 *
 * @param {string} locale
 * @returns {string}
 */
export function baseLanguage(locale) {
  return typeof locale === 'string' ? locale.split('-')[0].toLowerCase() : ''
}

/**
 * A locale's name, in its own language: `es` -> "Español".
 *
 * Endonyms, not names in the current UI language: someone looking for their
 * language in a list they cannot read scans for "Español", not "Spanish".
 *
 * Intl capitalizes according to each language's own rules — Spanish writes
 * "español" in running text — but a menu entry is a label, not prose, so the
 * first letter is raised. Falls back to the code itself where Intl has no name
 * or is unavailable.
 *
 * @param {string} locale - BCP-47 tag
 * @returns {string}
 */
export function languageLabel(locale) {
  try {
    const name = new Intl.DisplayNames([locale], {
      type: 'language',
      fallback: 'none'
    }).of(locale)

    if (!name) return locale

    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    return locale
  }
}

function normalize(name) {
  return name.trim().toLowerCase()
}
