import { loadConfiguration } from '../../utils/loadConfiguration.js'
import { discoverNpmPackages } from '../../plugins/vite/discoverPackages.js'

const REGISTRY_TIMEOUT = 5000

/**
 * Fetch the latest version of a package from the npm registry.
 *
 * @param {string} name - Package name (scoped names handled automatically)
 * @returns {Promise<string|null>} Latest version or null on failure
 */
async function fetchLatestVersion(name) {
  const url = `https://registry.npmjs.org/${name}/latest`

  try {
    const res = await fetch(url, {
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
 * Check for updates for all installed npm TaxonPages packages.
 *
 * @param {string} projectRoot
 * @returns {Promise<Array<{name: string, type: string, installed: string, latest: string|null, hasUpdate: boolean|null}>>}
 */
export async function checkPackageUpdates(projectRoot) {
  const configuration = loadConfiguration(projectRoot)
  const disabled = configuration.packages?.disabled || []
  const npmPackages = discoverNpmPackages(projectRoot, { disabled })

  const results = await Promise.allSettled(
    npmPackages.map(async (pkg) => {
      const latest = await fetchLatestVersion(pkg.name)

      return {
        name: pkg.name,
        type: pkg.type,
        installed: pkg.version,
        latest,
        hasUpdate: latest ? latest !== pkg.version : null
      }
    })
  )

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          name: npmPackages[i].name,
          type: npmPackages[i].type,
          installed: npmPackages[i].version,
          latest: null,
          hasUpdate: null
        }
  )
}

/**
 * CLI command: check for outdated TaxonPages packages.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 */
export async function packageOutdated({ projectRoot }) {
  console.log('')
  console.log('  TaxonPages — Package updates')
  console.log('')
  console.log('  Checking npm registry...')

  const updates = await checkPackageUpdates(projectRoot)

  if (updates.length === 0) {
    console.log('  No npm packages found.')
    console.log('')
    return
  }

  // Clear the "Checking..." line
  console.log('')

  // Column headers
  const nameWidth = Math.max(30, ...updates.map((u) => u.name.length + 2))
  const header =
    '  ' +
    'PACKAGE'.padEnd(nameWidth) +
    'TYPE'.padEnd(10) +
    'INSTALLED'.padEnd(12) +
    'LATEST'.padEnd(12) +
    'STATUS'

  console.log(header)

  for (const pkg of updates) {
    const status =
      pkg.hasUpdate === null
        ? 'Unknown'
        : pkg.hasUpdate
          ? 'Update available'
          : 'Up to date'

    const line =
      '  ' +
      pkg.name.padEnd(nameWidth) +
      pkg.type.padEnd(10) +
      pkg.installed.padEnd(12) +
      (pkg.latest || '?').padEnd(12) +
      status

    console.log(line)
  }

  const updateCount = updates.filter((u) => u.hasUpdate).length
  const unknownCount = updates.filter((u) => u.hasUpdate === null).length

  console.log('')

  if (updateCount > 0) {
    console.log(
      `  ${updateCount} update${updateCount > 1 ? 's' : ''} available. ` +
        'Run `taxonpages package add <name>` to update.'
    )
  } else if (unknownCount === 0) {
    console.log('  All packages are up to date.')
  }

  if (unknownCount > 0) {
    console.log(
      `  ${unknownCount} package${unknownCount > 1 ? 's' : ''} could not be checked (network error).`
    )
  }

  console.log('')
}
