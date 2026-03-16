import { Router } from 'express'
import { resolve, join } from 'node:path'
import { readdirSync, readFileSync, existsSync } from 'node:fs'

/**
 * Create panels API routes.
 * Returns all available panel IDs from built-in and local panels.
 *
 * @param {string} packageRoot - Path to the TaxonPages framework
 * @param {string} projectRoot - Path to the user's project
 * @returns {Router}
 */
export function createPanelRoutes(packageRoot, projectRoot) {
  const router = Router()

  router.get('/', (req, res) => {
    const builtIn = scanPanelIds(
      resolve(packageRoot, 'src/modules/otus/components/Panel'),
      'built-in'
    )

    const local = scanPanelIds(
      resolve(projectRoot, 'panels'),
      'local'
    )

    res.json([...builtIn, ...local])
  })

  return router
}

/**
 * Scan a directory of panel folders for panel IDs.
 * Each panel folder must contain a main.js with an `id: 'panel:...'` export.
 */
function scanPanelIds(panelsDir, source) {
  if (!existsSync(panelsDir)) return []

  const panels = []

  try {
    const entries = readdirSync(panelsDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const mainPath = join(panelsDir, entry.name, 'main.js')
      if (!existsSync(mainPath)) continue

      try {
        const content = readFileSync(mainPath, 'utf-8')
        const match = content.match(/id:\s*['"]([^'"]+)['"]/)

        if (match) {
          panels.push({
            id: match[1],
            name: entry.name,
            source
          })
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Directory not readable
  }

  return panels
}
