import { resolveI18nConfig } from './config.js'

/**
 * Keep the active catalog in step with the locale in the route.
 *
 * Only needed under hash_mode. Everywhere else the locale lives in the router's
 * history base, which is fixed for the life of an app instance: the locale can
 * only change by loading a new document, and createI18n already receives the
 * right one. Under hash_mode the locale is a route param, so it changes through
 * an ordinary in-app navigation and nothing would otherwise tell vue-i18n.
 *
 * Registered as a guard rather than a watcher on the route so the catalog is
 * already in place when the incoming components render, instead of one tick
 * late.
 *
 * @param {import('vue-router').Router} router
 * @param {import('vue-i18n').I18n} i18n
 * @param {object} [configuration] - Loaded configuration (`__APP_ENV__`)
 */
export function syncLocaleWithRoute(router, i18n, configuration = {}) {
  const { defaultLocale, locales } = resolveI18nConfig(configuration)

  router.beforeEach((to) => {
    const requested = to.params.locale
    const next = locales.includes(requested) ? requested : defaultLocale

    if (i18n.global.locale.value !== next) {
      i18n.global.locale.value = next
    }
  })
}
