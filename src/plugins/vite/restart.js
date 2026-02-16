import picomatch from 'picomatch'
import { loadConfiguration } from '../../utils/loadConfiguration.js'

export function ViteRestart({ dir, projectRoot }) {
  const patterns = Array.isArray(dir) ? dir : [dir]
  const isMatch = picomatch(patterns, { dot: true })

  return {
    name: 'vite-restart',

    config() {
      const configuration = loadConfiguration(projectRoot)

      return {
        define: {
          __APP_ENV__: configuration
        }
      }
    },

    configureServer(server) {
      server.watcher.add(dir)
      server.watcher.on('change', (filePath) => {
        if (isMatch(filePath)) {
          server.restart()
        }
      })
    }
  }
}
