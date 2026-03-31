import { Router } from 'express'
import { resolve, join } from 'node:path'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { discoverNpmPackages } from '../../../src/plugins/vite/discoverPackages.js'

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

    const npmPanels = discoverNpmPackages(projectRoot)
      .filter((p) => p.type === 'panel')
      .map((p) => ({
        id: extractPanelId(p.entry),
        name: p.name,
        source: 'npm',
        configSchema: p.configSchema || null
      }))
      .filter((p) => p.id)

    res.json([...builtIn, ...local, ...npmPanels])
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
          const configSchema = loadPanelSchema(join(panelsDir, entry.name))

          panels.push({
            id: match[1],
            name: entry.name,
            source,
            configSchema
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

/**
 * Extract the panel ID from a main.js entry file.
 */
function extractPanelId(entryPath) {
  try {
    const content = readFileSync(entryPath, 'utf-8')
    const match = content.match(/id:\s*['"]([^'"]+)['"]/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Load a panel's setup schema from setup.schema.json if it exists.
 */
function loadPanelSchema(panelDir) {
  const schemaPath = join(panelDir, 'setup.schema.json')
  if (!existsSync(schemaPath)) return null

  try {
    return JSON.parse(readFileSync(schemaPath, 'utf-8'))
  } catch {
    return null
  }
}
