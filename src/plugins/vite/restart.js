import picomatch from 'picomatch'
import { loadConfiguration } from '../../utils/loadConfiguration.js'

const toForwardSlash = (p) => p.replace(/\\/g, '/')

export function ViteRestart({ dir, projectRoot }) {
  const patterns = (Array.isArray(dir) ? dir : [dir]).map(toForwardSlash)
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
        if (isMatch(toForwardSlash(filePath))) {
          server.restart()
        }
      })
    }
  }
}
