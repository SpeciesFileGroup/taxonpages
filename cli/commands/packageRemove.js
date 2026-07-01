import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import * as yaml from 'js-yaml'
import { readPackageManifest } from '../utils/readPackageManifest.js'
import { loadYaml } from '../../src/utils/loadYaml.js'

const NPM_OPTIONS = process.platform === 'win32' ? { shell: true } : {}

function notifyViteRestart(projectRoot) {
  const sentinel = resolve(projectRoot, 'node_modules', '.taxonpages-refresh')
  writeFileSync(sentinel, Date.now().toString(), 'utf-8')
}

/**
 * Uninstall a TaxonPages package and clean up its configuration.
 *
 * @param {object} options
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to remove
 */
export function packageRemove({ projectRoot, name }) {
  // 1. Read manifest before uninstalling (need it for panel ID)
  const manifest = readPackageManifest(projectRoot, name)
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
    execFileSync('npm', ['uninstall', name], { ...NPM_OPTIONS, cwd: projectRoot, stdio: 'inherit' })
  } catch {
    console.error(`Failed to uninstall ${name}.`)
    process.exit(1)
  }

  notifyViteRestart(projectRoot)
  console.log(`\nUninstalled ${name}.`)
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
 * Non-interactive core for uninstalling a TaxonPages package.
 * Designed for API/programmatic use — throws on failure.
 *
 * @param {object} options
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to remove
 * @returns {{ message: string }}
 */
export function packageRemoveCore({ projectRoot, name }) {
  const manifest = readPackageManifest(projectRoot, name)
  let panelId = null

  if (manifest?.type === 'panel') {
    panelId = extractPanelId(manifest.entryPath)
  }

  if (panelId) {
    const configPath = resolve(projectRoot, 'config', 'taxa_page.yml')

    if (existsSync(configPath)) {
      removePanelFromConfig(configPath, panelId)
    }
  }

  try {
    execFileSync('npm', ['uninstall', name], { ...NPM_OPTIONS, cwd: projectRoot, stdio: 'pipe' })
  } catch (err) {
    const stderr = err.stderr?.toString().trim()
    const firstLine = stderr?.split('\n').find((l) => l && !l.startsWith('npm warn')) || ''
    throw new Error(firstLine || `Failed to uninstall "${name}".`)
  }

  notifyViteRestart(projectRoot)
  return { message: `Uninstalled ${name}.` }
}

/**
 * Remove all occurrences of a panel ID from taxa_page.yml.
 * Handles both string entries and objects with an `id` field.
 *
 * @returns {boolean} Whether any entries were removed
 */
function removePanelFromConfig(configPath, panelId) {
  const content = readFileSync(configPath, 'utf-8')
  const config = loadYaml(content, null)

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
