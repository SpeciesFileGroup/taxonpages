import path from 'node:path'
import picomatch from 'picomatch'

const GLOB_CHARS = /[*?[\]{}()!+]/

function getWatchTarget(pattern) {
  const normalizedPattern = pattern.replace(/\\/g, '/')
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

export default function ViteRestart({ dir }) {
  const root = process.cwd()
  const patterns = Array.isArray(dir) ? dir : [dir]
  const isMatch = picomatch(patterns, { dot: true })
  const watchTargets = [...new Set(patterns.map(getWatchTarget))]

  return {
    name: 'vite-restart',

    configureServer(server) {
      function handleChange(filePath) {
        const relativePath = path.relative(root, filePath)

        if (isMatch(relativePath)) {
          server.restart()
        }
      }
      server.watcher.add(watchTargets)
      server.watcher.on('change', handleChange)
    }
  }
}
