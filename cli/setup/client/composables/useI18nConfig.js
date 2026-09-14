import { ref, computed } from 'vue'
import { apiFetch } from './useApi.js'
import { languageLabel } from '../../../../src/i18n/languageTags.js'
import * as translated from './translatedValue.js'

/**
 * The site's i18n settings, and the reading/writing of translated config
 * values against them.
 *
 * A translated config value is a map of locale -> text sitting where a plain
 * string would otherwise be (`label: { en: News, es: Noticias }`). The wizard
 * has to round-trip those without damage, which needs to know which locales
 * exist — the rule telling a translation apart from an ordinary config object
 * is "every key is a configured locale", so without the list a value cannot be
 * classified at all.
 *
 * The value model itself lives in `translatedValue.js`; this binds it to the
 * loaded settings so callers do not pass them on every call.
 */

const state = ref(null)
let inFlight = null

export function useI18nConfig() {
  async function loadI18nConfig(force = false) {
    if (state.value && !force) return state.value
    if (inFlight && !force) return inFlight

    inFlight = (async () => {
      try {
        const res = await apiFetch('/api/i18n')
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        state.value = await res.json()
      } catch {
        // A site that cannot report its i18n settings is treated as
        // single-locale: the wizard then behaves as it did before i18n
        // existed, which is the safe direction to fail in.
        state.value = null
      } finally {
        inFlight = null
      }

      return state.value
    })()

    return inFlight
  }

  const defaultLocale = computed(() => state.value?.defaultLocale ?? 'en')
  const locales = computed(() => state.value?.locales ?? [defaultLocale.value])
  const isMultiLocale = computed(() => state.value?.isMultiLocale === true)
  const configuration = computed(() => state.value?.configuration ?? {})

  const localeOptions = computed(() =>
    locales.value.map((code) => ({
      code,
      label: languageLabel(code),
      isDefault: code === defaultLocale.value
    }))
  )

  const context = computed(() => ({
    locales: locales.value,
    defaultLocale: defaultLocale.value,
    configuration: configuration.value
  }))

  return {
    state,
    loadI18nConfig,
    defaultLocale,
    locales,
    localeOptions,
    isMultiLocale,
    configuration,

    isTranslation: (value, translatable = false) =>
      translated.isTranslation(value, translatable, context.value),

    readLocale: (value, locale, translatable = false) =>
      translated.readLocale(value, locale, translatable, context.value),

    writeLocale: (value, locale, next, translatable = false) =>
      translated.writeLocale(value, locale, next, translatable, context.value),

    orphanLocales: (value, translatable = false) =>
      translated.orphanLocales(value, translatable, context.value),

    filledCount: (value, translatable = false) =>
      translated.filledCount(value, translatable, context.value),

    countLocaleValues: (tree, locale) =>
      translated.countLocaleValues(tree, locale, context.value)
  }
}
