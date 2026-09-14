import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isPrefixed, localePath } from './locale.js'
import { languageLabel } from './languageTags.js'
import { resolveI18nConfig } from './config.js'

/**
 * The configured locales, as links to the current page in each.
 *
 * How crossing locales works depends on where the locale lives.
 *
 * With the locale in the router's history base, the router can only build URLs
 * inside the active locale, so the href is a plain URL and following it is a
 * document navigation — which is what we want there, since the rebuild is what
 * swaps the catalog.
 *
 * Under hash_mode the locale is a route param, so the router can build the
 * other locale's URL itself and following it is an ordinary in-app navigation:
 * no reload, and the catalog follows from the route (see syncLocaleWithRoute).
 *
 * Either way an <a href> is what renders, so the link stays real for crawlers
 * following the hreflang alternates and for opening in a new tab.
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
  const router = useRouter()
  const { locale } = useI18n()
  const { locales, isMultiLocale } = resolveI18nConfig(__APP_ENV__)

  function hrefFor(code) {
    if (!__APP_ENV__.hash_mode) {
      // fullPath keeps any query and hash, so switching language stays on the
      // same view rather than dropping the reader back at the bare path.
      return localePath(route.fullPath, code, __APP_ENV__)
    }

    // Same route, other locale. Resolving by name is what carries the rest of
    // the params over; '' clears the optional locale segment, where undefined
    // would inherit the current one and change nothing.
    return router.resolve({
      name: route.name,
      params: {
        ...route.params,
        locale: isPrefixed(code, __APP_ENV__) ? code : ''
      },
      query: route.query,
      hash: route.hash
    }).href
  }

  const options = computed(() =>
    locales.map((code) => ({
      code,
      label: languageLabel(code),
      href: hrefFor(code),
      isCurrent: code === locale.value
    }))
  )

  return { options, isMultiLocale }
}
