/**
 * Resolving translated values out of YAML configuration.
 *
 * Config strings are translated by opting in per value: a plain string stays a
 * plain string, and a map of locale codes marks a translated one.
 *
 *   header_links:
 *     - label: Home                        # untouched, still valid
 *       link: /
 *     - label: { en: News, es: Noticias }  # translated
 *       link: /news
 *
 * Every existing config file therefore keeps working with no migration, and a
 * site only pays for translation where it wants it. The translation sits next
 * to the thing it describes, which is what a maintainer editing header.yml
 * wants — the alternative, a parallel header.es.yml, drifts out of sync the
 * first time someone adds a link.
 *
 * A map is recognised only when *every* key is a configured locale. That rule
 * is what keeps `bind: { id: 5 }` from being mistaken for a translation of
 * Indonesian — a real hazard, since many two-letter words are language tags.
 *
 * Free of Node built-ins: imported by build, server and browser code alike.
 */

import { resolveI18nConfig } from './config.js'

/**
 * Resolve one config value for a locale.
 *
 * @param {*} value - Config value: a plain value, or a map of locale -> value
 * @param {string} locale - Active locale
 * @param {object} [configuration] - Loaded configuration (`__APP_ENV__`)
 * @returns {*} The value for this locale. Falls back to the configured
 *   fallback, then the default locale, then whatever translation exists —
 *   anything but rendering a raw object at the reader.
 */
export function localize(value, locale, configuration = {}) {
  if (!isLocaleMap(value, configuration)) return value

  const { fallbackLocale, defaultLocale } = resolveI18nConfig(configuration)

  for (const code of [locale, fallbackLocale, defaultLocale]) {
    if (value[code] !== undefined) return value[code]
  }

  return Object.values(value)[0]
}

/**
 * Resolve every translated value inside a config tree, leaving the shape
 * intact. For config whose values are arbitrary — panel `bind` props, where a
 * title may be translated while a count is not.
 *
 * @param {*} value
 * @param {string} locale
 * @param {object} [configuration]
 * @returns {*} A structurally identical value with locale maps resolved
 */
export function localizeDeep(value, locale, configuration = {}) {
  if (isLocaleMap(value, configuration)) {
    return localize(value, locale, configuration)
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeDeep(item, locale, configuration))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        localizeDeep(item, locale, configuration)
      ])
    )
  }

  return value
}

/**
 * Whether a value is a map of locale -> translation.
 *
 * Requires a non-empty plain object whose keys are *all* configured locales.
 * Deliberately strict: a looser test (any key shaped like a language tag)
 * would swallow ordinary config objects.
 *
 * @param {*} value
 * @param {object} [configuration]
 * @returns {boolean}
 */
export function isLocaleMap(value, configuration = {}) {
  if (!isPlainObject(value)) return false

  const keys = Object.keys(value)
  if (keys.length === 0) return false

  const { locales } = resolveI18nConfig(configuration)

  return keys.every((key) => locales.includes(key))
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
