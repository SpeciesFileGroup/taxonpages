// @ts-check
import { join, resolve } from 'node:path'
import { readdirSync, readFileSync, existsSync, realpathSync } from 'node:fs'

/**
 * Packages that must resolve to a single copy across the whole application.
 *
 * Each one keeps module-scoped state that breaks silently when two copies are
 * loaded: Vue's current instance and injection keys, vue-router's and pinia's
 * injection symbols plus pinia's `activePinia`, and unhead's head symbol.
 * TaxonPages creates all of these instances and shares them through
 * provide/inject, so a second copy is never the intended behaviour.
 *
 * A duplicate reaches the tree whenever an ecosystem package declares one of
 * these as a regular dependency with a range that conflicts with the one
 * TaxonPages declares — npm then nests a second copy instead of hoisting.
 */
export const DEDUPE_PACKAGES = [
  'vue',
  'vue-router',
  'pinia',
  '@unhead/vue',
  'unhead'
]

const MAX_DEPTH = 6

/**
 * Find packages from `names` that are installed more than once in the
 * project's dependency tree.
 *
 * @param {string} projectRoot
 * @param {string[]} [names]
 * @returns {Array<{name: string, copies: Array<{version: string, path: string}>}>}
 */
export function findDuplicatePackages(projectRoot, names = DEDUPE_PACKAGES) {
  const nodeModulesDir = resolve(projectRoot, 'node_modules')
  if (!existsSync(nodeModulesDir)) return []

  const targets = new Set(names)
  /** @type {Map<string, Map<string, {version: string, path: string}>>} */
  const found = new Map()

  scanNodeModules(nodeModulesDir, targets, found, 0)

  const duplicates = []

  for (const [name, byPath] of found) {
    if (byPath.size < 2) continue
    duplicates.push({ name, copies: [...byPath.values()] })
  }

  return duplicates
}

// --- Internal helpers ---

function scanNodeModules(dir, targets, found, depth) {
  if (depth > MAX_DEPTH) return

  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue

    if (entry.name.startsWith('@')) {
      const scopeDir = join(dir, entry.name)
      let scoped
      try {
        scoped = readdirSync(scopeDir, { withFileTypes: true })
      } catch {
        continue
      }
      for (const s of scoped) {
        if (s.name.startsWith('.')) continue
        visitPackage(join(scopeDir, s.name), `${entry.name}/${s.name}`, targets, found, depth)
      }
    } else {
      visitPackage(join(dir, entry.name), entry.name, targets, found, depth)
    }
  }
}

function visitPackage(pkgDir, pkgName, targets, found, depth) {
  if (targets.has(pkgName)) {
    const version = readVersion(pkgDir)

    if (version) {
      // Key by real path so symlinked stores (pnpm, npm link) count once
      let realPath
      try {
        realPath = realpathSync(pkgDir)
      } catch {
        realPath = pkgDir
      }

      if (!found.has(pkgName)) found.set(pkgName, new Map())
      found.get(pkgName).set(realPath, { version, path: pkgDir })
    }
  }

  const nested = join(pkgDir, 'node_modules')
  if (existsSync(nested)) {
    scanNodeModules(nested, targets, found, depth + 1)
  }
}

function readVersion(pkgDir) {
  const pkgJsonPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return null

  try {
    return JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version || null
  } catch {
    return null
  }
}
