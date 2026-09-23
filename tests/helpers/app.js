import { vi } from 'vitest'

/**
 * Load the real router module for a given configuration, with the browser at
 * `url`.
 *
 * src/router reads __APP_ENV__ and builds the route table when first
 * imported, so every configuration needs a fresh copy of the module graph.
 * Needs a DOM environment: the router's history reads window.location.
 *
 * @param {object} config - The __APP_ENV__ to run with
 * @param {string} [url] - Path (and hash) the browser is at
 * @returns {Promise<typeof import('../../src/router/index.js')>}
 */
export async function loadRouter(config, url = '/') {
  vi.stubGlobal('__APP_ENV__', config)
  vi.resetModules()
  window.history.replaceState(null, '', url)

  return import('@/router/index.js')
}
