import { Router, json } from 'express'
import { loadConfiguration } from '../../../src/utils/loadConfiguration.js'
import {
  discoverNpmPackages,
  discoverLocalPanels,
  discoverLocalModules,
  resolveConflicts
} from '../../../src/plugins/vite/discoverPackages.js'
import { checkPackageUpdates } from '../../commands/packageOutdated.js'
import { packageAddCore } from '../../commands/packageAdd.js'
import { packageRemoveCore } from '../../commands/packageRemove.js'

const VALID_PKG_NAME = /^(@[\w.-]+\/)?[\w.-]+$/

/**
 * Create package API routes.
 *
 * @param {string} packageRoot
 * @param {string} projectRoot
 * @returns {Router}
 */
export function createPackageRoutes(packageRoot, projectRoot) {
  const router = Router()
  router.use(json())

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

  /**
   * POST /api/packages/install
   * Install a TaxonPages package.
   */
  router.post('/install', (req, res) => {
    const { name } = req.body || {}

    if (!name || !VALID_PKG_NAME.test(name)) {
      return res.status(400).json({ ok: false, error: 'Invalid package name.' })
    }

    try {
      const result = packageAddCore({ packageRoot, projectRoot, name })
      res.json({ ok: true, ...result })
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message })
    }
  })

  /**
   * POST /api/packages/uninstall
   * Uninstall a TaxonPages package.
   */
  router.post('/uninstall', (req, res) => {
    const { name } = req.body || {}

    if (!name || !VALID_PKG_NAME.test(name)) {
      return res.status(400).json({ ok: false, error: 'Invalid package name.' })
    }

    try {
      const result = packageRemoveCore({ projectRoot, name })
      res.json({ ok: true, ...result })
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message })
    }
  })

  /**
   * POST /api/packages/update
   * Update a TaxonPages package to latest version.
   */
  router.post('/update', (req, res) => {
    const { name } = req.body || {}

    if (!name || !VALID_PKG_NAME.test(name)) {
      return res.status(400).json({ ok: false, error: 'Invalid package name.' })
    }

    try {
      const result = packageAddCore({ packageRoot, projectRoot, name })
      res.json({ ok: true, ...result })
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message })
    }
  })

  return router
}
