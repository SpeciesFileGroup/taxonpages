import { Router } from 'express'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { checkPackageUpdates } from '../../commands/packageOutdated.js'

/**
 * Check if a version satisfies an engine requirement string.
 * Supports ranges like "^20.19.0 || >=22.12.0".
 */
function satisfiesEngine(version, range) {
  if (!range) return true

  const ver = version.replace(/^v/, '').split('.').map(Number)

  return range.split('||').some((part) => {
    part = part.trim()
    if (part.startsWith('>=')) {
      return compareVersions(ver, parseVersion(part.slice(2))) >= 0
    }
    if (part.startsWith('^')) {
      const base = parseVersion(part.slice(1))
      return ver[0] === base[0] && compareVersions(ver, base) >= 0
    }
    return false
  })
}

function parseVersion(str) {
  return str.trim().split('.').map(Number)
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0)
  }
  return 0
}

const REGISTRY_TIMEOUT = 5000

/**
 * Fetch the latest version of a package from the npm registry.
 */
async function fetchLatestVersion(name) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}/latest`, {
      signal: AbortSignal.timeout(REGISTRY_TIMEOUT),
      headers: { Accept: 'application/json' }
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.version || null
  } catch {
    return null
  }
}

/**
 * Create status API routes.
 *
 * @param {string} packageRoot - Path to the TaxonPages package
 * @param {string} projectRoot - Path to the user's project
 * @returns {Router}
 */
export function createStatusRoutes(packageRoot, projectRoot) {
  const router = Router()

  /**
   * GET /api/status
   * Returns version info, environment details, and package counts.
   */
  router.get('/', async (_req, res) => {
    const pkg = JSON.parse(
      readFileSync(resolve(packageRoot, 'package.json'), 'utf-8')
    )
    const currentVersion = pkg.version
    const engineRequirement = pkg.engines?.node || ''

    // Fetch latest version from npm (non-blocking for the rest)
    const latestVersion = await fetchLatestVersion(pkg.name)

    // Node.js check
    const nodeVersion = process.version
    const nodeSatisfies = satisfiesEngine(nodeVersion, engineRequirement)

    // Package counts
    let packageInfo = { installed: 0, withUpdates: 0 }
    try {
      const updates = await checkPackageUpdates(projectRoot)
      packageInfo = {
        installed: updates.length,
        withUpdates: updates.filter((u) => u.hasUpdate).length
      }
    } catch {
      // Non-critical, leave defaults
    }

    res.json({
      taxonpages: {
        current: currentVersion,
        latest: latestVersion,
        hasUpdate: latestVersion ? latestVersion !== currentVersion : null
      },
      node: {
        current: nodeVersion,
        required: engineRequirement,
        satisfies: nodeSatisfies
      },
      environment: {
        platform: process.platform,
        projectRoot
      },
      packages: packageInfo
    })
  })

  /**
   * POST /api/status/test-connection
   * Tests connectivity to a TaxonWorks API URL.
   * Body: { url: string, project_token?: string }
   */
  router.post('/test-connection', async (req, res) => {
    const { url, project_token } = req.body

    if (!url) {
      return res.status(400).json({ error: 'Missing "url" in request body' })
    }

    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return res.status(400).json({ error: 'URL must use HTTP or HTTPS' })
      }
      if (!parsed.pathname.includes('/api/v1')) {
        return res.status(400).json({ error: 'URL must be a TaxonWorks API endpoint (/api/v1)' })
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    try {
      // Build the authenticated endpoint URL
      const baseUrl = url.replace(/\/+$/, '')
      const testUrl = project_token
        ? `${baseUrl}/project_authenticated?project_token=${encodeURIComponent(project_token)}`
        : baseUrl

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(testUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return res.json({
          success: false,
          message: `Server returned ${response.status}${response.status === 401 ? ' — invalid project token' : ''}`
        })
      }

      const data = await response.json()
      const projectName = data.open_projects.find(
        (p) => p.project_token == project_token
      )

      res.json({
        success: true,
        message: project_token
          ? `Authenticated — project "${projectName?.name || 'unknown'}" is accessible`
          : 'Server is reachable',
        projectName: data.name || null
      })
    } catch (err) {
      if (err.name === 'AbortError') {
        return res.json({ success: false, message: 'Connection timed out' })
      }

      res.json({
        success: false,
        message: `Connection failed: ${err.message}`
      })
    }
  })

  return router
}
