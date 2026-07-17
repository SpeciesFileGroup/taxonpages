import picomatch from 'picomatch'
import { loadConfiguration } from '../../utils/loadConfiguration.js'
import { resolveI18nConfig } from '../../i18n/config.js'

const toForwardSlash = (p) => p.replace(/\\/g, '/')

const GLOB_CHARS = /[*?[\]{}()!+]/

function getWatchTarget(pattern) {
  const normalizedPattern = toForwardSlash(pattern)
  const isAbsolute = normalizedPattern.startsWith('/')
  const segments = normalizedPattern.split('/')
  const staticSegments = []

  for (const segment of segments) {
    if (GLOB_CHARS.test(segment)) {
      break
    }

    staticSegments.push(segment)
  }

  if (staticSegments.length === 0 || (staticSegments.length === 1 && staticSegments[0] === '')) {
    return '.'
  }

  const result = staticSegments.join('/')

  return isAbsolute && !result.startsWith('/') ? '/' + result : result
}

export function ViteRestart({ dir, projectRoot, ssr = false }) {
  const patterns = (Array.isArray(dir) ? dir : [dir]).map(toForwardSlash)
  const isMatch = picomatch(patterns, { dot: true })
  const watchTargets = [...new Set(patterns.map(getWatchTarget))]

  return {
    name: 'vite-restart',

    config() {
      const configuration = loadConfiguration(projectRoot)

      if (ssr && configuration.hash_mode) {
        console.warn(
          '[taxonpages] hash_mode is not compatible with SSR (the URL fragment is never sent to the server). Forcing hash_mode=false for this run.'
        )
        configuration.hash_mode = false
      }

      // The locale prefix lives in the path, ahead of the fragment, so with
      // hash_mode a Spanish page is served at /es/#/about — which only works if
      // the host serves the app at /es/ too. Nothing here can arrange that.
      if (configuration.hash_mode && resolveI18nConfig(configuration).isMultiLocale) {
        console.warn(
          '[taxonpages] hash_mode with multiple locales requires your host to serve the app at every locale prefix (e.g. /es/). If it only serves the root, non-default locales will 404.'
        )
      }

      return {
        define: {
          __APP_ENV__: configuration
        }
      }
    },

    configureServer(server) {
      const restart = (filePath) => {
        if (isMatch(toForwardSlash(filePath))) {
          server.restart()
        }
      }

      server.watcher.add(watchTargets)
      server.watcher.on('change', restart)
      server.watcher.on('add', restart)
      server.watcher.on('unlink', restart)
    }
  }
}
