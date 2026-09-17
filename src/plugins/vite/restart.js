import picomatch from 'picomatch'
import { loadConfiguration } from '../../utils/loadConfiguration.js'
import { toForwardSlash } from '../../utils/paths.js'
import { watchTargetsFor } from './watchTargets.js'

export function ViteRestart({ dir, projectRoot, ssr = false }) {
  const patterns = (Array.isArray(dir) ? dir : [dir]).map(toForwardSlash)
  const isMatch = picomatch(patterns, { dot: true })
  const watchTargets = watchTargetsFor(patterns)

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
