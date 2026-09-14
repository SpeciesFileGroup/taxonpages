import {
  createRouter as _createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory
} from 'vue-router'

import { routes as dynamicRoutes } from 'vue-router/auto-routes'
import { localeBase, prefixedLocales } from '@/i18n/locale.js'
import { resolveI18nConfig } from '@/i18n/config.js'

const coreModuleRoutes = import.meta.glob('@/modules/**/router/*.js', {
  import: 'default',
  eager: true
})
const userModuleRoutes = import.meta.glob('~/modules/**/router/*.js', {
  import: 'default',
  eager: true
})

const { hash_mode } = __APP_ENV__

const moduleRoutes = [].concat(
  ...Object.values(coreModuleRoutes),
  ...Object.values(userModuleRoutes)
)

const flatRoutes = [...dynamicRoutes, ...moduleRoutes]

/**
 * Nest the whole route table under an optional locale segment.
 *
 * Only under hash_mode, and only with more than one locale. Everywhere else the
 * locale is the router's history base, which keeps the route table free of it
 * (see src/i18n/locale.js).
 *
 * Hash mode cannot do that: the base is the path the host serves, and the
 * fragment below it is the router's own. A locale written into the fragment
 * from outside is rewritten back by the router on the next navigation, so
 * crossing locales has to be something the router itself can perform — which
 * means the locale has to be a route it owns.
 *
 * Two details make the nesting invisible to everything else:
 *
 * - The param is restricted to the configured locales, so it cannot swallow the
 *   first segment of an ordinary path (`/otus/123` keeps matching `/otus/:id`).
 * - It is optional, so the default locale's URLs keep the shape they have now.
 *
 * Children must be relative: an absolute child path ignores its parent.
 *
 * @param {Array} routes
 * @returns {Array}
 */
function withLocaleSegment(routes) {
  const prefixed = prefixedLocales(__APP_ENV__)

  if (!hash_mode || !prefixed.length) return routes

  const relative = (path) => (path.startsWith('/') ? path.slice(1) : path)
  const relativeAlias = (alias) =>
    Array.isArray(alias) ? alias.map(relative) : relative(alias)

  return [
    {
      // No component: a record with children and none of its own is a pure
      // matcher, so children keep rendering at the depth they render at today.
      path: `/:locale(${prefixed.join('|')})?`,
      children: routes.map((route) => ({
        ...route,
        path: relative(route.path),
        ...(route.alias ? { alias: relativeAlias(route.alias) } : {})
      }))
    }
  ]
}

export const routes = withLocaleSegment(flatRoutes)

function getHistory(base) {
  if (import.meta.env.SSR) {
    return createMemoryHistory(base)
  } else if (hash_mode) {
    return createWebHashHistory(base)
  } else {
    return createWebHistory(base)
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.locale] - Active locale. Its prefix (if any) becomes
 *   part of the history base, so the route table itself is locale-agnostic and
 *   every RouterLink stays inside the active locale.
 */
export function createRouter({ locale } = {}) {
  // Under hash_mode localeBase returns base_url for every locale: there the
  // locale is a route param, not part of the base.
  const base = localeBase(
    locale || resolveI18nConfig(__APP_ENV__).defaultLocale,
    __APP_ENV__
  )

  return _createRouter({
    history: getHistory(base),
    routes,
    scrollBehavior(to, from, savedPosition) {
      return to.hash ? { el: to.hash } : { top: 0 }
    }
  })
}
