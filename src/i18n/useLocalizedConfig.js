import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { localize, localizeDeep } from './localize.js'

/**
 * Resolve translated config values against the active locale.
 *
 * Config lives in `__APP_ENV__`, which Vite inlines at build time and so knows
 * nothing about the locale. This binds the two: every locale's text is in the
 * bundle, and this picks the right one where the value renders.
 *
 * @returns {{ c: Function, cDeep: Function }} `c` resolves one value, `cDeep`
 *   resolves every translated value inside a config tree. Both accept refs and
 *   return computeds, so they stay reactive if the locale ever changes.
 */
export function useLocalizedConfig() {
  const { locale } = useI18n()

  const c = (value) =>
    computed(() => localize(unref(value), locale.value, __APP_ENV__))

  const cDeep = (value) =>
    computed(() => localizeDeep(unref(value), locale.value, __APP_ENV__))

  return { c, cDeep }
}
