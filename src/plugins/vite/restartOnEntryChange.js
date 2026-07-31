/**
 * Vite plugin that touches the `.taxonpages-refresh` sentinel when a
 * local module or panel entry point appears or disappears in the user
 * project. The sentinel watcher in `componentRegistrationPlugin` then
 * clears its package caches, regenerates Tailwind sources, and restarts
 * the dev server.
 *
 * Edits inside an existing module/panel are intentionally ignored —
 * those are handled by normal Vite HMR. Only the addition or removal
 * of the entry point itself changes the registry.
 */
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import picomatch from 'picomatch'

const toForwardSlash = (p) => p.replace(/\\/g, '/')

export function ViteRestartOnEntryChange({ entries, projectRoot }) {
  const patterns = (Array.isArray(entries) ? entries : [entries]).map(
    toForwardSlash
  )
  const isMatch = picomatch(patterns, { dot: true })
  const sentinelPath = resolve(
    projectRoot,
    'node_modules',
    '.taxonpages-refresh'
  )

  return {
    name: 'taxonpages:restart-on-entry-change',

    configureServer(server) {
      const handler = (event) => (filePath) => {
        const file = toForwardSlash(filePath)
        if (!isMatch(file)) return

        server.config.logger.info(
          `[taxonpages] entry ${event} (${file}) — refreshing`
        )
        writeFileSync(sentinelPath, Date.now().toString(), 'utf-8')
      }

      server.watcher.on('add', handler('added'))
      server.watcher.on('unlink', handler('removed'))
    }
  }
}
