/**
 * Normalization for the `i18n` configuration block.
 *
 * loadConfiguration merges YAML files with a shallow Object.assign, so a
 * user file declaring only `i18n: { locales: [en, es] }` replaces the whole
 * default block rather than merging into it. Defaults are therefore applied
 * here, at read time, instead of being relied on from defaultConfig.
 *
 * This module is imported by both build-time (Vite) and runtime (browser,
 * SSR) code, so it must stay free of Node built-ins.
 */

export const I18N_DEFAULTS = Object.freeze({
  default_locale: 'en',
  locales: ['en'],
  prefix_default_locale: false,
  detect: 'suggest'
})

const VALID_DETECT = ['suggest', 'off']

/**
 * Resolve the effective i18n settings from a loaded configuration object.
 *
 * Invalid values warn and fall back to the default rather than throwing: a
 * typo in a config file should not take a site down.
 *
 * @param {object} [configuration] - Loaded configuration (`__APP_ENV__`)
 * @returns {{
 *   defaultLocale: string,
 *   locales: string[],
 *   fallbackLocale: string,
 *   prefixDefaultLocale: boolean,
 *   detect: string,
 *   isMultiLocale: boolean
 * }}
 */
export function resolveI18nConfig(configuration = {}) {
  const raw = isPlainObject(configuration.i18n) ? configuration.i18n : {}

  const defaultLocale =
    isNonEmptyString(raw.default_locale)
      ? raw.default_locale
      : I18N_DEFAULTS.default_locale

  const declared = Array.isArray(raw.locales)
    ? raw.locales.filter(isNonEmptyString)
    : []

  // The default locale is always available, even if omitted from `locales`.
  const locales = [...new Set([defaultLocale, ...declared])]

  const fallbackLocale = isNonEmptyString(raw.fallback)
    ? raw.fallback
    : defaultLocale

  if (!locales.includes(fallbackLocale)) {
    warn(
      `i18n.fallback "${fallbackLocale}" is not in i18n.locales — falling back to "${defaultLocale}".`
    )
  }

  const detect = VALID_DETECT.includes(raw.detect)
    ? raw.detect
    : I18N_DEFAULTS.detect

  if (raw.detect !== undefined && !VALID_DETECT.includes(raw.detect)) {
    warn(
      `i18n.detect "${raw.detect}" is not one of ${VALID_DETECT.join(', ')} — using "${detect}".`
    )
  }

  return {
    defaultLocale,
    locales,
    fallbackLocale: locales.includes(fallbackLocale)
      ? fallbackLocale
      : defaultLocale,
    prefixDefaultLocale: raw.prefix_default_locale === true,
    detect,
    isMultiLocale: locales.length > 1
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function warn(message) {
  console.warn(`[taxonpages] ${message}`)
}
