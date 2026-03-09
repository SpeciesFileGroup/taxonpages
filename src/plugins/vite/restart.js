import picomatch from 'picomatch'
import { loadConfiguration } from '../../utils/loadConfiguration.js'

const toForwardSlash = (p) => p.replace(/\\/g, '/')

const GLOB_CHARS = /[*?[\]{}()!+]/

function getWatchTarget(pattern) {
  const normalizedPattern = toForwardSlash(pattern)
  const segments = normalizedPattern.split('/')
  const staticSegments = []

  for (const segment of segments) {
    if (!segment || GLOB_CHARS.test(segment)) {
      break
    }

    staticSegments.push(segment)
  }

  if (staticSegments.length === 0) {
    return '.'
  }

  return staticSegments.join('/')
}

export function ViteRestart({ dir, projectRoot }) {
  const patterns = (Array.isArray(dir) ? dir : [dir]).map(toForwardSlash)
  const isMatch = picomatch(patterns, { dot: true })
  const watchTargets = [...new Set(patterns.map(getWatchTarget))]

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
      server.watcher.add(watchTargets)
      server.watcher.on('change', (filePath) => {
        if (isMatch(toForwardSlash(filePath))) {
          server.restart()
        }
      })
    }
  }
}
