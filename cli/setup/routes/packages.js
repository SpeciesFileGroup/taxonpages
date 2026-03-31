import { Router } from 'express'
import { loadConfiguration } from '../../../src/utils/loadConfiguration.js'
import {
  discoverNpmPackages,
  discoverLocalPanels,
  discoverLocalModules,
  resolveConflicts
} from '../../../src/plugins/vite/discoverPackages.js'
import { checkPackageUpdates } from '../../commands/packageOutdated.js'

/**
 * Create package API routes.
 *
 * @param {string} projectRoot
 * @returns {Router}
 */
export function createPackageRoutes(projectRoot) {
  const router = Router()

  /**
   * GET /api/packages
   * Returns all discovered panels and modules.
   */
  router.get('/', (req, res) => {
    const configuration = loadConfiguration(projectRoot)
    const disabled = configuration.packages?.disabled || []

    const npmPackages = discoverNpmPackages(projectRoot, { disabled })
    const npmPanels = npmPackages.filter((p) => p.type === 'panel')
    const npmModules = npmPackages.filter((p) => p.type === 'module')

    const localPanels = discoverLocalPanels(projectRoot)
    const localModules = discoverLocalModules(projectRoot)

    const panels = resolveConflicts(localPanels, npmPanels)
    const modules = resolveConflicts(localModules, npmModules)

    res.json({ panels, modules })
  })

  /**
   * GET /api/packages/outdated
   * Returns update info for installed npm packages.
   */
  router.get('/outdated', async (req, res) => {
    try {
      const updates = await checkPackageUpdates(projectRoot)
      res.json(updates)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
