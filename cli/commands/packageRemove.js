import { execSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import yaml from 'js-yaml'

/**
 * Uninstall a TaxonPages package and clean up its configuration.
 *
 * @param {object} options
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to remove
 */
export function packageRemove({ projectRoot, name }) {
  // 1. Read manifest before uninstalling (need it for panel ID)
  const manifest = readManifest(projectRoot, name)
  let panelId = null

  if (manifest?.type === 'panel') {
    panelId = extractPanelId(manifest.entryPath)
  }

  // 2. Clean up YAML config if it's a panel
  if (panelId) {
    const configPath = resolve(projectRoot, 'config', 'taxa_page.yml')

    if (existsSync(configPath)) {
      const removed = removePanelFromConfig(configPath, panelId)

      if (removed) {
        console.log(`Removed ${panelId} from taxa_page.yml.`)
      }
    }
  }

  // 3. Uninstall the package
  console.log(`Uninstalling ${name}...`)
  try {
    execSync(`npm uninstall ${name}`, { cwd: projectRoot, stdio: 'inherit' })
  } catch {
    console.error(`Failed to uninstall ${name}.`)
    process.exit(1)
  }

  console.log(`\nUninstalled ${name}.`)
}

/**
 * Read the taxonpages manifest from an installed package.
 */
function readManifest(projectRoot, pkgName) {
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

  const DEFAULT_ENTRIES = {
    panel: './src/main.js',
    module: './src/router/index.js'
  }

  const entry = manifest.entry || DEFAULT_ENTRIES[manifest.type]
  const entryPath = resolve(pkgDir, entry)

  return {
    type: manifest.type,
    entry,
    entryPath,
    pkgDir
  }
}

/**
 * Extract the panel ID from the entry file using a regex.
 */
function extractPanelId(entryPath) {
  if (!existsSync(entryPath)) return null

  const content = readFileSync(entryPath, 'utf-8')
  const match = content.match(/id:\s*['"]([^'"]+)['"]/)

  return match ? match[1] : null
}

/**
 * Remove all occurrences of a panel ID from taxa_page.yml.
 * Handles both string entries and objects with an `id` field.
 *
 * @returns {boolean} Whether any entries were removed
 */
function removePanelFromConfig(configPath, panelId) {
  const content = readFileSync(configPath, 'utf-8')
  const config = yaml.load(content)

  if (!config?.taxa_page) return false

  let removed = false

  for (const tab of Object.values(config.taxa_page)) {
    if (!tab?.panels) continue

    for (const row of tab.panels) {
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const column = row[colIdx]

        const filtered = column.filter((item) => {
          if (typeof item === 'string' && item === panelId) return false
          if (typeof item === 'object' && item?.id === panelId) return false
          return true
        })

        if (filtered.length !== column.length) {
          row[colIdx] = filtered
          removed = true
        }
      }
    }
  }

  if (removed) {
    writeFileSync(
      configPath,
      yaml.dump(config, { flowLevel: -1, lineWidth: -1 }),
      'utf-8'
    )
  }

  return removed
}
