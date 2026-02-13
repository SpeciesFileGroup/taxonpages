import path from 'node:path'
import picomatch from 'picomatch'

export default function ViteRestart({ dir }) {
  const root = process.cwd()
  const patterns = Array.isArray(dir) ? dir : [dir]
  const isMatch = picomatch(patterns, { dot: true })

  return {
    name: 'vite-restart',

    configureServer(server) {
      function handleChange(filePath) {
        const relativePath = path.relative(root, filePath)

        if (isMatch(relativePath)) {
          server.restart()
        }
      }

      server.watcher.add(dir)
      server.watcher.on('change', handleChange)
    }
  }
}
