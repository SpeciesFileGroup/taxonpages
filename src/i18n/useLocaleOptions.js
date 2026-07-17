import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { localePath } from './locale.js'
import { languageLabel } from './languageTags.js'
import { resolveI18nConfig } from './config.js'

/**
 * The configured locales, as links to the current page in each.
 *
 * Every href is a plain URL, not a route: the locale lives in the router's
 * history base, so the router can only build URLs inside the active locale.
 * Crossing to another one is a document navigation — which is what we want, as
 * it rebuilds the app with the other locale's catalog, and leaves a real href
 * for crawlers following the hreflang alternates.
 *
 * @returns {{
 *   options: import('vue').ComputedRef<Array<{
 *     code: string, label: string, href: string, isCurrent: boolean
 *   }>>,
 *   isMultiLocale: boolean
 * }}
 */
export function useLocaleOptions() {
  const route = useRoute()
  const { locale } = useI18n()
  const { locales, isMultiLocale } = resolveI18nConfig(__APP_ENV__)

  const options = computed(() =>
    locales.map((code) => ({
      code,
      label: languageLabel(code),
      // fullPath keeps any query and hash, so switching language stays on the
      // same view rather than dropping the reader back at the bare path.
      href: localePath(route.fullPath, code, __APP_ENV__),
      isCurrent: code === locale.value
    }))
  )

  return { options, isMultiLocale }
}
