import picomatch from 'picomatch'

export default function ViteRestart({ dir }) {
  const patterns = Array.isArray(dir) ? dir : [dir]
  const isMatch = picomatch(patterns, { dot: true })

  return {
    name: 'vite-restart',

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
