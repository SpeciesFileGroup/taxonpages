import { resolve, join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

const DEFAULT_ENTRIES = {
  panel: './src/main.js',
  module: './src/router/index.js'
}

/**
 * Read a TaxonPages package's manifest from node_modules.
 *
 * Returns null if the package is not installed, has invalid JSON, or does not
 * declare a `taxonpages` manifest field with a valid `type`.
 *
 * @param {string} projectRoot - Path to the user's project
 * @param {string} pkgName - NPM package name (scoped names handled)
 * @returns {{type: string, entry: string, entryPath: string, pkgDir: string, version: string} | null}
 */
export function readPackageManifest(projectRoot, pkgName) {
  const pkgDir = resolve(projectRoot, 'node_modules', ...pkgName.split('/'))
  const pkgJsonPath = join(pkgDir, 'package.json')

  if (!existsSync(pkgJsonPath)) return null

  let pkgJson
  try {
    pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  } catch {
    return null
  }

  const manifest = pkgJson.taxonpages
  if (!manifest || typeof manifest !== 'object' || !manifest.type) return null

  const entry = manifest.entry || DEFAULT_ENTRIES[manifest.type]
  const entryPath = resolve(pkgDir, entry)

  return {
    type: manifest.type,
    entry,
    entryPath,
    pkgDir,
    version: pkgJson.version
  }
}
