import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { checkPackageUpdates } from './packageOutdated.js'
import { readPackageManifest } from '../utils/readPackageManifest.js'

const NPM_OPTIONS = process.platform === 'win32' ? { shell: true } : {}

function notifyViteRestart(projectRoot) {
  const sentinel = resolve(projectRoot, 'node_modules', '.taxonpages-refresh')
  writeFileSync(sentinel, Date.now().toString(), 'utf-8')
}

function runNpmInstallLatest(projectRoot, name) {
  try {
    execFileSync('npm', ['install', '--ignore-scripts', `${name}@latest`], {
      ...NPM_OPTIONS,
      cwd: projectRoot,
      stdio: 'pipe'
    })
  } catch (err) {
    const stderr = err.stderr?.toString().trim()
    const firstLine =
      stderr?.split('\n').find((l) => l && !l.startsWith('npm warn')) || ''
    throw new Error(firstLine || `Failed to update "${name}".`)
  }
}

/**
 * Non-interactive core for updating a single TaxonPages package to its latest version.
 * Throws on failure. Designed for API/programmatic use.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} options.name
 * @returns {{ name: string, type: string, from: string, to: string, message: string }}
 */
export function packageUpdateCore({ projectRoot, name }) {
  const before = readPackageManifest(projectRoot, name)

  if (!before) {
    throw new Error(
      `Package "${name}" is not installed or is not a TaxonPages package.`
    )
  }

  runNpmInstallLatest(projectRoot, name)

  const after = readPackageManifest(projectRoot, name)
  const toVersion = after?.version || before.version

  notifyViteRestart(projectRoot)

  return {
    name,
    type: before.type,
    from: before.version,
    to: toVersion,
    message:
      before.version === toVersion
        ? `${name} is already at the latest version (v${toVersion}).`
        : `Updated ${name} from v${before.version} to v${toVersion}.`
  }
}

/**
 * CLI command: update a single TaxonPages package, or all outdated packages
 * when no name is provided.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} [options.name]
 */
export async function packageUpdate({ projectRoot, name }) {
  console.log('')
  console.log('  TaxonPages — Package update')
  console.log('')

  if (name) {
    await updateSingle(projectRoot, name)
    return
  }

  console.log('  Checking npm registry for outdated packages...')
  const updates = await checkPackageUpdates(projectRoot)
  const targets = updates.filter((u) => u.hasUpdate)

  if (targets.length === 0) {
    const unknown = updates.filter((u) => u.hasUpdate === null).length
    if (unknown > 0) {
      console.log(
        `  Could not reach the npm registry for ${unknown} package${unknown > 1 ? 's' : ''}.`
      )
    } else {
      console.log('  All packages are up to date.')
    }
    console.log('')
    return
  }

  console.log(
    `  ${targets.length} package${targets.length > 1 ? 's' : ''} to update:`
  )
  for (const u of targets) {
    console.log(`    - ${u.name} (${u.installed} → ${u.latest})`)
  }
  console.log('')

  let failures = 0
  for (const target of targets) {
    process.stdout.write(`  Updating ${target.name}... `)
    try {
      const result = packageUpdateCore({ projectRoot, name: target.name })
      console.log(`v${result.from} → v${result.to}`)
    } catch (err) {
      failures++
      console.log('failed')
      console.error(`    ${err.message}`)
    }
  }

  console.log('')
  if (failures === 0) {
    console.log(`  Updated ${targets.length} package${targets.length > 1 ? 's' : ''}.`)
  } else {
    console.log(
      `  Updated ${targets.length - failures} of ${targets.length}. ` +
        `${failures} failed.`
    )
  }
  console.log('')
}

async function updateSingle(projectRoot, name) {
  console.log(`  Updating ${name}...`)

  try {
    const result = packageUpdateCore({ projectRoot, name })
    console.log('')
    console.log(`  ${result.message}`)
    console.log('')
  } catch (err) {
    console.error('')
    console.error(`  ${err.message}`)
    console.log('')
    process.exit(1)
  }
}
