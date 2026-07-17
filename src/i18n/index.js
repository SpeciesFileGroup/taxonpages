import { createI18n as _createI18n } from 'vue-i18n'
import { messages } from 'virtual:taxonpages-locales'
import { resolveI18nConfig } from './config.js'

export { resolveI18nConfig, I18N_DEFAULTS } from './config.js'

/**
 * Date/time formats, shared by every configured locale.
 *
 * These are Intl option bags, which are locale-agnostic: Intl renders
 * "April 25, 2023" for `en` and "25 de abril de 2023" for `es` from the same
 * definition. A new locale therefore gets dates for free — no per-locale
 * format file to write and keep in sync.
 *
 * `timeZone` is deliberately not set, so dates render in the viewer's zone.
 * See the note in the i18n docs about SSR and time zones.
 */
const DATETIME_FORMATS = {
  long: { year: 'numeric', month: 'long', day: 'numeric' }
}

/**
 * Create the i18n instance for one app instance.
 *
 * A fresh instance is created per createApp() call, which under SSR means
 * per request — locale state is never shared across requests.
 *
 * Catalogs come from the `virtual:taxonpages-locales` module, already merged
 * across core, packages and site overrides at build time.
 *
 * @param {object} [options]
 * @param {string} [options.locale] - Active locale. Defaults to the
 *   configured default locale. Unknown locales fall back to the default.
 * @returns {import('vue-i18n').I18n}
 */
export function createI18n({ locale } = {}) {
  const { defaultLocale, fallbackLocale, locales } = resolveI18nConfig(
    __APP_ENV__
  )

  const isDev = import.meta.env.DEV

  if (locale && !locales.includes(locale)) {
    if (isDev) {
      console.warn(
        `[taxonpages] Unknown locale "${locale}" — falling back to "${defaultLocale}".`
      )
    }
    locale = undefined
  }

  return _createI18n({
    legacy: false,
    globalInjection: true,
    locale: locale || defaultLocale,
    fallbackLocale,
    messages,
    datetimeFormats: Object.fromEntries(
      locales.map((code) => [code, DATETIME_FORMATS])
    ),
    // A missing translation renders the fallback (and ultimately the key) in
    // production rather than warning: an untranslated string must never be
    // able to break a page. In dev it is surfaced so it gets fixed.
    missingWarn: isDev,
    fallbackWarn: isDev
  })
}
