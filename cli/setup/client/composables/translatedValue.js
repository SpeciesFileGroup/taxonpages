import { isLocaleMap } from '../../../../src/i18n/localize.js'

/**
 * Reading and writing a config value that may carry one text per locale.
 *
 * Pure and free of Vue, because this is where a mistake destroys a site's
 * translations: everything here is about not losing text that is already in
 * the file. `useI18nConfig` binds these to the loaded i18n settings.
 *
 * @typedef {object} LocaleContext
 * @property {string[]} locales - Configured locales, in configured order
 * @property {string} defaultLocale
 * @property {object} configuration - Shaped for isLocaleMap: `{ i18n: {...} }`
 */

/**
 * Whether a value should be edited as a translation.
 *
 * For a field the schema marks `translatable`, any plain object is one: the
 * flag says this slot holds text, so an object in it can only be text keyed by
 * locale. That covers the case a stricter test misses — a map left behind for
 * a locale since removed from `config/i18n.yml`, whose keys are no longer all
 * configured.
 *
 * For an unmarked field the strict runtime rule applies instead, imported
 * rather than restated. It is the safety net that keeps a hand-written
 * translation on a field nobody remembered to mark from being silently
 * flattened — while still refusing to read `bind: { id: 5 }` as Indonesian.
 *
 * @param {*} value
 * @param {boolean} translatable - The field's schema flag
 * @param {LocaleContext} ctx
 * @returns {boolean}
 */
export function isTranslation(value, translatable, ctx) {
  if (translatable) return isPlainObject(value)

  return isLocaleMap(value, ctx.configuration)
}

/**
 * One locale's text out of a config value.
 *
 * A plain string is the default locale's text — that is what an untranslated
 * config means — so the default locale's input is populated and the others
 * start empty.
 *
 * @param {*} value
 * @param {string} locale
 * @param {boolean} translatable
 * @param {LocaleContext} ctx
 * @returns {string}
 */
export function readLocale(value, locale, translatable, ctx) {
  if (isTranslation(value, translatable, ctx)) return value[locale] ?? ''
  if (isPlainObject(value)) return ''

  return locale === ctx.defaultLocale ? (value ?? '') : ''
}

/**
 * A config value with one locale's text replaced.
 *
 * Clearing a locale removes its key rather than storing an empty string, so an
 * untranslated locale falls back at runtime instead of rendering blank.
 *
 * @param {*} value
 * @param {string} locale
 * @param {string} next
 * @param {boolean} translatable
 * @param {LocaleContext} ctx
 * @returns {string|object}
 */
export function writeLocale(value, locale, next, translatable, ctx) {
  const map = isTranslation(value, translatable, ctx)
    ? { ...value }
    : isEmpty(value) || isPlainObject(value)
      ? {}
      : { [ctx.defaultLocale]: value }

  if (isEmpty(next)) {
    delete map[locale]
  } else {
    map[locale] = next
  }

  return collapse(map, ctx)
}

/**
 * Reduce a locale map to the smallest value meaning the same thing.
 *
 * Nothing filled is an empty string, and only the default locale filled is a
 * plain string — never a one-key map. That is what lets a single-locale site
 * open the wizard, save, and get its config file back unchanged.
 *
 * @param {object} map
 * @param {LocaleContext} ctx
 * @returns {string|object}
 */
export function collapse(map, ctx) {
  const keys = orderedKeys(map, ctx)

  if (keys.length === 0) return ''
  if (keys.length === 1 && keys[0] === ctx.defaultLocale) return map[keys[0]]

  return Object.fromEntries(keys.map((key) => [key, map[key]]))
}

/**
 * Keys in configured-locale order, with unconfigured ones kept at the end.
 *
 * Ordering keeps the YAML diff stable across saves. Keeping the unconfigured
 * ones matters more: they are translations for a locale that was removed from
 * `config/i18n.yml`, and dropping them would destroy work that adding the
 * locale back would have restored.
 *
 * @param {object} map
 * @param {LocaleContext} ctx
 * @returns {string[]}
 */
export function orderedKeys(map, ctx) {
  const present = Object.keys(map)

  return [
    ...ctx.locales.filter((code) => present.includes(code)),
    ...present.filter((code) => !ctx.locales.includes(code))
  ]
}

/**
 * Locales present in a value that are not configured for the site.
 *
 * @param {*} value
 * @param {boolean} translatable
 * @param {LocaleContext} ctx
 * @returns {string[]}
 */
export function orphanLocales(value, translatable, ctx) {
  if (!isTranslation(value, translatable, ctx)) return []

  return Object.keys(value).filter((code) => !ctx.locales.includes(code))
}

/**
 * How many configured locales a value has text for.
 *
 * @param {*} value
 * @param {boolean} translatable
 * @param {LocaleContext} ctx
 * @returns {number}
 */
export function filledCount(value, translatable, ctx) {
  return ctx.locales.filter(
    (code) => !isEmpty(readLocale(value, code, translatable, ctx))
  ).length
}

/**
 * How many values in a config tree carry text for a locale.
 *
 * For warning before a locale is removed: that text stops rendering the moment
 * the locale leaves `config/i18n.yml`, and nothing else reports it.
 *
 * Uses the strict rule deliberately, matching what the site does at runtime. A
 * map that the strict rule already rejects is text that is already not being
 * rendered, so removing the locale does not strand anything new.
 *
 * @param {*} tree - Any config value, walked recursively
 * @param {string} locale
 * @param {LocaleContext} ctx
 * @returns {number}
 */
export function countLocaleValues(tree, locale, ctx) {
  if (isLocaleMap(tree, ctx.configuration)) {
    return tree[locale] === undefined ? 0 : 1
  }

  if (Array.isArray(tree)) {
    return tree.reduce(
      (total, item) => total + countLocaleValues(item, locale, ctx),
      0
    )
  }

  if (isPlainObject(tree)) {
    return Object.values(tree).reduce(
      (total, item) => total + countLocaleValues(item, locale, ctx),
      0
    )
  }

  return 0
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEmpty(value) {
  return value === undefined || value === null || value === ''
}
