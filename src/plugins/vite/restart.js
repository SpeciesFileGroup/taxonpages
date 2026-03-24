import picomatch from 'picomatch'
import { loadConfiguration } from '../../utils/loadConfiguration.js'

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
