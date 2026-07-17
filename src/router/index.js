import {
  createRouter as _createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory
} from 'vue-router'

import { routes as dynamicRoutes } from 'vue-router/auto-routes'
import { localeBase } from '@/i18n/locale.js'
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

export const routes = [...dynamicRoutes, ...moduleRoutes]

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
  const base = localeBase(locale || resolveI18nConfig(__APP_ENV__).defaultLocale, __APP_ENV__)

  return _createRouter({
    history: getHistory(base),
    routes,
    scrollBehavior(to, from, savedPosition) {
      return to.hash ? { el: to.hash } : { top: 0 }
    }
  })
}
