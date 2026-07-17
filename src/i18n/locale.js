/**
 * Locale <-> URL mapping.
 *
 * The URL is the single source of truth for which locale renders. Server and
 * client both derive it from the path with the same pure functions, so they
 * cannot disagree — which is what keeps hydration safe. Nothing here reads
 * Accept-Language or storage: negotiation may *suggest* a locale, it never
 * decides one (see i18n.detect in config).
 *
 * The locale is carried as the router's history base rather than by
 * duplicating the route table. vue-router strips the base when matching and
 * prepends it when generating hrefs, so every existing route and every
 * existing <RouterLink> keeps working and stays inside the active locale with
 * no changes. For the default locale the base is unchanged, which is why a
 * single-locale site is bit-for-bit what it was before.
 *
 * Free of Node built-ins: imported by build, server and browser code alike.
 */

import { resolveI18nConfig } from './config.js'

/**
 * Split a leading locale segment off a path.
 *
 * Only locales that carry a prefix are recognised, so with the default
 * `prefix_default_locale: false` a path like `/about` resolves to the default
 * locale and is returned untouched — published URLs keep working.
 *
 * Accepts a full request URL or a bare pathname: the query and hash are set
 * aside before the path is split and restored afterwards. This matters because
 * the server passes `req.originalUrl` (which carries `?query`) while the
 * browser passes `location.pathname` (which does not) — without this, `/es?x=1`
 * would resolve to a different locale on each side and break hydration.
 *
 * @param {string} path - Path with the app's base_url already stripped
 * @param {object} [configuration] - Loaded configuration (`__APP_ENV__`)
 * @returns {{ locale: string, path: string }} Locale, and the path without the
 *   locale segment (always starts with '/', keeps any query and hash)
 */
export function extractLocale(path = '/', configuration = {}) {
  const { defaultLocale } = resolveI18nConfig(configuration)
  const prefixed = prefixedLocales(configuration)

  const normalized = path.startsWith('/') ? path : `/${path}`
  const suffixAt = normalized.search(/[?#]/)
  const pathname = suffixAt === -1 ? normalized : normalized.slice(0, suffixAt)
  const suffix = suffixAt === -1 ? '' : normalized.slice(suffixAt)

  const [, first, ...rest] = pathname.split('/')

  if (prefixed.includes(first)) {
    return { locale: first, path: `/${rest.join('/')}${suffix}` }
  }

  return { locale: defaultLocale, path: normalized }
}

/**
 * Locales whose URLs carry a prefix.
 *
 * With `prefix_default_locale: false` (the default) this excludes the default
 * locale. With it true, every locale is prefixed and `/` is nobody's — the
 * server redirects it to the default locale.
 *
 * @param {object} [configuration]
 * @returns {string[]}
 */
export function prefixedLocales(configuration = {}) {
  const { locales, defaultLocale, prefixDefaultLocale } =
    resolveI18nConfig(configuration)

  return prefixDefaultLocale
    ? locales
    : locales.filter((code) => code !== defaultLocale)
}

/**
 * Whether a locale's URLs carry its prefix.
 *
 * @param {string} locale
 * @param {object} [configuration]
 * @returns {boolean}
 */
export function isPrefixed(locale, configuration = {}) {
  return prefixedLocales(configuration).includes(locale)
}

/**
 * The router history base for a locale: the app's base_url, plus the locale
 * segment when that locale is prefixed.
 *
 * @param {string} locale
 * @param {object} [configuration]
 * @returns {string} Base path, always with a trailing slash
 */
export function localeBase(locale, configuration = {}) {
  const base = withTrailingSlash(configuration.base_url || '/')

  return isPrefixed(locale, configuration) ? `${base}${locale}/` : base
}

/**
 * Build a path in a given locale, for links that cross locales (a locale
 * switcher) — those cannot use <RouterLink>, since the router only ever
 * generates URLs inside the active locale's base.
 *
 * @param {string} path - Path within the app, base- and locale-free
 * @param {string} locale
 * @param {object} [configuration]
 * @returns {string} Path including base_url and the locale prefix
 */
export function localePath(path, locale, configuration = {}) {
  const base = localeBase(locale, configuration)
  const suffix = path.startsWith('/') ? path.slice(1) : path

  return `${base}${suffix}`
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}
