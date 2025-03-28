import path from 'node:path'
import anymatch from 'anymatch'

export default function ViteRestart({ dir }) {
  const root = process.cwd()

  return {
    name: 'vite-restart',

    configureServer(server) {
      function handleChange(filePath) {
        const relativePath = path.relative(root, filePath)
        const isWatched = anymatch(dir, relativePath)

        if (isWatched) {
          server.restart()
        }
      }

      server.watcher.add(dir)
      server.watcher.on('change', handleChange)
    }
  }
}
