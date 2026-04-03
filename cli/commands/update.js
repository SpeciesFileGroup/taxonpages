import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REGISTRY_TIMEOUT = 5000

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
 * Update the TaxonPages framework to the latest version.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Path to the TaxonPages framework
 * @param {string} options.projectRoot - Path to the user's project
 */
export async function update({ packageRoot, projectRoot }) {
  const pkg = JSON.parse(
    readFileSync(resolve(packageRoot, 'package.json'), 'utf-8')
  )
  const currentVersion = pkg.version
  const name = pkg.name

  console.log('')
  console.log('  TaxonPages — Update')
  console.log('')
  console.log(`  Current version: ${currentVersion}`)
  console.log('  Checking for updates...')

  const latestVersion = await fetchLatestVersion(name)

  if (!latestVersion) {
    console.error('  Could not reach the npm registry. Check your internet connection.')
    console.log('')
    process.exit(1)
  }

  if (latestVersion === currentVersion) {
    console.log(`  Already up to date (v${currentVersion}).`)
    console.log('')
    return
  }

  console.log(`  New version available: ${currentVersion} → ${latestVersion}`)
  console.log('')
  console.log(`  Updating...`)

  try {
    execFileSync('npm', ['install', `${name}@${latestVersion}`], {
      cwd: projectRoot,
      stdio: 'inherit'
    })
  } catch {
    console.error(`  Failed to update. You can try manually: npm install ${name}@latest`)
    console.log('')
    process.exit(1)
  }

  console.log('')
  console.log(`  Updated to v${latestVersion}.`)
  console.log('')
}
