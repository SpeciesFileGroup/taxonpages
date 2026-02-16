/**
 * Discovers TaxonPages modules and panels from node_modules and local directories.
 *
 * NPM packages declare themselves via a `taxonpages` field in package.json:
 *   { "taxonpages": { "type": "panel", "entry": "./src/main.js" } }
 *
 * Local packages are discovered from ~/panels/* and ~/modules/* as before.
 *
 * Conflict resolution: local always wins over npm.
 */

import { resolve, join } from 'node:path'
import { readdirSync, readFileSync, existsSync } from 'node:fs'

const VALID_TYPES = ['module', 'panel']

const DEFAULT_ENTRIES = {
  panel: './src/main.js',
  module: './src/router/index.js'
}

/**
 * Scan node_modules for packages with a `taxonpages` manifest field.
 *
 * @param {string} projectRoot - Absolute path to the user's project
 * @param {object} [options]
 * @param {string[]} [options.disabled] - Package names to skip
 * @returns {Array<{name: string, type: string, path: string, entry: string, source: 'npm', version: string}>}
 */
export function discoverNpmPackages(projectRoot, options = {}) {
  const nodeModulesDir = resolve(projectRoot, 'node_modules')
  if (!existsSync(nodeModulesDir)) return []

  const disabled = new Set(options.disabled || [])
  const packages = []
  let entries

  try {
    entries = readdirSync(nodeModulesDir)
  } catch {
    return []
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue

    if (entry.startsWith('@')) {
      // Scoped packages: scan @scope/*
      const scopeDir = join(nodeModulesDir, entry)
      let scopedEntries

      try {
        scopedEntries = readdirSync(scopeDir)
      } catch {
        continue
      }

      for (const scopedPkg of scopedEntries) {
        const fullName = `${entry}/${scopedPkg}`
        if (disabled.has(fullName)) continue

        const descriptor = tryReadDescriptor(
          join(scopeDir, scopedPkg),
          fullName
        )
        if (descriptor) packages.push(descriptor)
      }
    } else {
      if (disabled.has(entry)) continue

      const descriptor = tryReadDescriptor(
        join(nodeModulesDir, entry),
        entry
      )
      if (descriptor) packages.push(descriptor)
    }
  }

  return packages
}

/**
 * Scan ~/panels/* for local panel packages.
 *
 * @param {string} projectRoot
 * @returns {Array<{name: string, type: string, path: string, entry: string, source: 'local'}>}
 */
export function discoverLocalPanels(projectRoot) {
  const panelsDir = resolve(projectRoot, 'panels')
  if (!existsSync(panelsDir)) return []

  return safeReaddir(panelsDir)
    .filter((d) => d.isDirectory())
    .filter((d) => existsSync(join(panelsDir, d.name, 'main.js')))
    .map((d) => ({
      name: d.name,
      type: 'panel',
      path: join(panelsDir, d.name),
      entry: join(panelsDir, d.name, 'main.js'),
      source: 'local'
    }))
}

/**
 * Scan ~/modules/* for local module packages.
 *
 * @param {string} projectRoot
 * @returns {Array<{name: string, type: string, path: string, entry: string, source: 'local'}>}
 */
export function discoverLocalModules(projectRoot) {
  const modulesDir = resolve(projectRoot, 'modules')
  if (!existsSync(modulesDir)) return []

  return safeReaddir(modulesDir)
    .filter((d) => d.isDirectory())
    .filter((d) => {
      // Module must have at least a router/index.js or router/*.js
      const routerDir = join(modulesDir, d.name, 'router')
      return existsSync(routerDir)
    })
    .map((d) => ({
      name: d.name,
      type: 'module',
      path: join(modulesDir, d.name),
      entry: join(modulesDir, d.name, 'router', 'index.js'),
      source: 'local'
    }))
}

/**
 * Extract a readable base name from an NPM package name.
 * "@acme/taxonpages-panel-foo" → "foo"
 * "taxonpages-module-bar"      → "bar"
 * "@acme/my-panel"             → "my-panel"
 *
 * @param {string} pkgName
 * @param {string} type
 * @returns {string}
 */
export function extractBaseName(pkgName, type) {
  const base = pkgName.includes('/') ? pkgName.split('/').pop() : pkgName
  const prefix = `taxonpages-${type}-`

  return base.startsWith(prefix) ? base.slice(prefix.length) : base
}

/**
 * Resolve conflicts between local and npm packages.
 * Local always wins over npm for the same panel id or module name.
 *
 * @param {Array} localDescriptors
 * @param {Array} npmDescriptors
 * @returns {Array} Merged list with conflicts resolved
 */
export function resolveConflicts(localDescriptors, npmDescriptors) {
  const localNames = new Set(
    localDescriptors.map((d) => d.name.toLowerCase())
  )
  const resolved = [...localDescriptors]

  for (const npm of npmDescriptors) {
    const baseName = extractBaseName(npm.name, npm.type)

    if (localNames.has(baseName.toLowerCase())) {
      console.warn(
        `[taxonpages] Local ${npm.type} "${baseName}" overrides ` +
          `NPM package "${npm.name}". Remove the local folder to use the NPM version.`
      )
      continue
    }

    resolved.push(npm)
  }

  return resolved
}

/**
 * Full discovery: find all packages from both local and npm sources,
 * resolve conflicts, and return a unified list.
 *
 * @param {string} projectRoot
 * @param {object} [options]
 * @param {string[]} [options.disabled] - Package names to skip
 * @returns {{ panels: Array, modules: Array }}
 */
export function discoverAllPackages(projectRoot, options = {}) {
  const npmPackages = discoverNpmPackages(projectRoot, options)
  const npmPanels = npmPackages.filter((p) => p.type === 'panel')
  const npmModules = npmPackages.filter((p) => p.type === 'module')

  const localPanels = discoverLocalPanels(projectRoot)
  const localModules = discoverLocalModules(projectRoot)

  const panels = resolveConflicts(localPanels, npmPanels)
  const modules = resolveConflicts(localModules, npmModules)

  return { panels, modules, all: [...panels, ...modules] }
}

/**
 * Log discovered packages to console.
 *
 * @param {{ panels: Array, modules: Array }} discovered
 */
export function logDiscoveredPackages({ panels, modules }) {
  const npmPanels = panels.filter((p) => p.source === 'npm')
  const npmModules = modules.filter((p) => p.source === 'npm')
  const total = npmPanels.length + npmModules.length

  if (total === 0) return

  const lines = []
  for (const p of npmPanels) {
    lines.push(`  ${p.name}@${p.version} (panel)`)
  }
  for (const m of npmModules) {
    lines.push(`  ${m.name}@${m.version} (module)`)
  }

  console.log(`[taxonpages] Discovered ${total} NPM package(s):`)
  for (const line of lines) {
    console.log(line)
  }
}

// --- Internal helpers ---

function tryReadDescriptor(pkgDir, pkgName) {
  const pkgJsonPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return null

  let pkgJson
  try {
    pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  } catch {
    return null
  }

  const manifest = pkgJson.taxonpages
  if (!manifest || typeof manifest !== 'object') return null
  if (!manifest.type) return null

  // Validate type
  if (!VALID_TYPES.includes(manifest.type)) {
    console.warn(
      `[taxonpages] Package "${pkgName}" has invalid type "${manifest.type}". ` +
        `Valid types: ${VALID_TYPES.join(', ')}. Skipping.`
    )
    return null
  }

  // Resolve entry point
  const entry = manifest.entry || DEFAULT_ENTRIES[manifest.type]
  const entryPath = resolve(pkgDir, entry)

  // Path traversal protection
  if (!entryPath.startsWith(pkgDir)) {
    console.error(
      `[taxonpages] Package "${pkgName}": entry "${entry}" escapes package boundary. Skipping.`
    )
    return null
  }

  if (!existsSync(entryPath)) {
    console.error(
      `[taxonpages] Package "${pkgName}": entry "${entry}" not found at ${entryPath}. Skipping.`
    )
    return null
  }

  // Naming convention warning (non-blocking)
  const baseName = pkgName.includes('/') ? pkgName.split('/').pop() : pkgName
  const validPrefix = `taxonpages-${manifest.type}-`
  if (!baseName.startsWith(validPrefix)) {
    console.warn(
      `[taxonpages] Package "${pkgName}" doesn't follow naming convention "${validPrefix}*". Loading anyway.`
    )
  }

  return {
    name: pkgName,
    type: manifest.type,
    path: pkgDir,
    entry: entryPath,
    source: 'npm',
    version: pkgJson.version || '0.0.0'
  }
}

function safeReaddir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}
