/**
 * Vite plugin that restarts the dev server when a page file is removed
 * from any of the configured `routesFolder` directories.
 *
 * `unplugin-vue-router` handles add/change events correctly via HMR,
 * but does not invalidate the `vue-router/auto-routes` virtual module
 * on unlink, which leaves dangling imports to deleted files. A full
 * restart is the most reliable way to keep the route map in sync.
 */
import { resolve } from 'node:path'
import picomatch from 'picomatch'

const toForwardSlash = (p) => p.replace(/\\/g, '/')

export function ViteRestartOnRouteDelete({
  routesFolder,
  exclude = [],
  extensions = ['.vue']
}) {
  const folders = (Array.isArray(routesFolder) ? routesFolder : [routesFolder])
    .map((f) => toForwardSlash(resolve(f)))
  const isExcluded = picomatch(exclude, { dot: true })
  const extSet = new Set(extensions)

  return {
    name: 'taxonpages:restart-on-route-delete',

    configureServer(server) {
      server.watcher.on('unlink', (filePath) => {
        const file = toForwardSlash(filePath)
        const folder = folders.find((f) => file.startsWith(f + '/'))

        if (!folder) return

        const ext = file.slice(file.lastIndexOf('.'))
        if (!extSet.has(ext)) return

        const relative = file.slice(folder.length + 1)
        if (isExcluded(relative)) return

        server.config.logger.info(
          `[taxonpages] route file removed (${relative}) — restarting`
        )
        server.restart()
      })
    }
  }
}
