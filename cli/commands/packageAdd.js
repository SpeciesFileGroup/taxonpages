import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import yaml from 'js-yaml'

const NPM_OPTIONS = process.platform === 'win32' ? { shell: true } : {}

/**
 * Touch a sentinel file so ViteRestart triggers a dev server reload.
 */
function notifyViteRestart(projectRoot) {
  const sentinel = resolve(projectRoot, 'node_modules', '.taxonpages-refresh')
  writeFileSync(sentinel, Date.now().toString(), 'utf-8')
}

/**
 * Install a TaxonPages package and auto-configure it.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Path to the TaxonPages framework
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to install
 */
export async function packageAdd({ packageRoot, projectRoot, name }) {
  // 1. Check if already installed
  const alreadyInstalled = isPackageInstalled(projectRoot, name)

  if (alreadyInstalled) {
    if (readManifest(projectRoot, name)) {
      console.error(`Package "${name}" is already installed.`)
    } else {
      console.error(`Package "${name}" is installed but is not a TaxonPages package.`)
    }
    process.exit(1)
  }

  // 2. Warn about community packages
  if (!name.startsWith('@sfgrp/')) {
    console.warn(`\nNote: "${name}" is a community package.`)
    console.warn('This package was not published by the SpeciesFileGroup organization (@sfgrp).')
    console.warn('Make sure you trust the author before installing.\n')
    const proceed = await askYesNo('Do you want to continue?')
    if (!proceed) {
      console.log('Installation cancelled.')
      process.exit(0)
    }
  }

  // 3. Install the package (--ignore-scripts prevents postinstall RCE)
  console.log(`Installing ${name}...`)
  try {
    execFileSync('npm', ['install', '--ignore-scripts', name], { ...NPM_OPTIONS, cwd: projectRoot, stdio: 'inherit' })
  } catch {
    console.error(`Failed to install ${name}.`)
    process.exit(1)
  }

  // 4. Verify it's a TaxonPages package
  const manifest = readManifest(projectRoot, name)

  if (!manifest) {
    console.error(
      `Package "${name}" does not have a taxonpages manifest. Uninstalling...`
    )
    try {
      execFileSync('npm', ['uninstall', name], { ...NPM_OPTIONS, cwd: projectRoot, stdio: 'inherit' })
    } catch { /* best effort */ }
    process.exit(1)
  }

  notifyViteRestart(projectRoot)

  // 5. Module: no YAML changes needed
  if (manifest.type === 'module') {
    console.log(`\nInstalled ${name}. Routes registered automatically.`)
    return
  }

  // 6. Panel: extract ID and update taxa_page.yml
  const panelId = extractPanelId(manifest.entryPath)

  if (!panelId) {
    console.error(
      `Could not extract panel ID from ${manifest.entry}. ` +
        `Make sure it exports an object with an \`id\` string field.`
    )
    process.exit(1)
  }

  const configPath = resolve(projectRoot, 'config', 'taxa_page.yml')
  const shouldAdd = await askYesNo(`Add ${panelId} to taxa_page.yml?`)

  if (!shouldAdd) {
    console.log(`\nInstalled ${name}. You can add ${panelId} to your taxa_page.yml config later.`)
    return
  }

  if (existsSync(configPath)) {
    addPanelToConfig(configPath, panelId)
    console.log(`\nInstalled ${name} and added ${panelId} to taxa_page.yml (overview tab).`)
  } else {
    const shouldCreate = await askYesNo(
      'config/taxa_page.yml not found. Create it from the default template?'
    )

    if (shouldCreate) {
      const templatePath = resolve(
        packageRoot,
        'templates',
        'config',
        'taxa_page.yml.example'
      )

      if (!existsSync(templatePath)) {
        console.error('Default template not found at', templatePath)
        process.exit(1)
      }

      copyFileSync(templatePath, configPath)
      addPanelToConfig(configPath, panelId)
      console.log(`\nCreated config/taxa_page.yml and added ${panelId} (overview tab).`)
    } else {
      console.log(`\nInstalled ${name}. Add ${panelId} manually to your taxa_page.yml config.`)
    }
  }
}

/**
 * Check if a package exists in node_modules.
 */
function isPackageInstalled(projectRoot, pkgName) {
  const pkgJsonPath = resolve(projectRoot, 'node_modules', ...pkgName.split('/'), 'package.json')
  return existsSync(pkgJsonPath)
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
 * Looks for `id: 'panel:foo'` or `id: "panel:foo"`.
 */
function extractPanelId(entryPath) {
  if (!existsSync(entryPath)) return null

  const content = readFileSync(entryPath, 'utf-8')
  const match = content.match(/id:\s*['"]([^'"]+)['"]/)

  return match ? match[1] : null
}

/**
 * Append a panel ID to the first tab's first row/column in taxa_page.yml.
 */
function addPanelToConfig(configPath, panelId) {
  const content = readFileSync(configPath, 'utf-8')
  const config = yaml.load(content)

  if (!config?.taxa_page) return

  const firstTab = Object.values(config.taxa_page)[0]

  if (!firstTab?.panels?.[0]?.[0]) return

  const firstColumn = firstTab.panels[0][0]

  // Avoid duplicates
  if (firstColumn.includes(panelId)) return

  firstColumn.push(panelId)

  writeFileSync(
    configPath,
    yaml.dump(config, { flowLevel: -1, lineWidth: -1 }),
    'utf-8'
  )
}

/**
 * Ask a yes/no question in the terminal.
 */
function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(`${question} (y/N) `, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

/**
 * Non-interactive core for installing a TaxonPages package.
 * Designed for API/programmatic use — throws on failure, no interactive prompts.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Path to the TaxonPages framework
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to install
 * @returns {{ type: string, panelId: string|null, message: string }}
 */
export function packageAddCore({ packageRoot, projectRoot, name }) {
  const alreadyInstalled = isPackageInstalled(projectRoot, name)

  if (alreadyInstalled) {
    if (readManifest(projectRoot, name)) {
      throw new Error(`Package "${name}" is already installed.`)
    } else {
      throw new Error(`Package "${name}" is installed but is not a TaxonPages package.`)
    }
  }

  const isCommunity = !name.startsWith('@sfgrp/')

  try {
    execFileSync('npm', ['install', '--ignore-scripts', name], { ...NPM_OPTIONS, cwd: projectRoot, stdio: 'pipe' })
  } catch (err) {
    const stderr = err.stderr?.toString().trim()
    const firstLine = stderr?.split('\n').find((l) => l && !l.startsWith('npm warn')) || ''
    throw new Error(firstLine || `Failed to install "${name}".`)
  }

  const manifest = readManifest(projectRoot, name)

  if (!manifest) {
    try {
      execFileSync('npm', ['uninstall', name], { ...NPM_OPTIONS, cwd: projectRoot, stdio: 'pipe' })
    } catch { /* best effort */ }
    throw new Error(
      `Package "${name}" does not have a taxonpages manifest. Is this a TaxonPages package?`
    )
  }

  notifyViteRestart(projectRoot)

  if (manifest.type === 'module') {
    return { type: 'module', panelId: null, isCommunity, message: `Installed ${name}. Routes registered automatically.` }
  }

  const panelId = extractPanelId(manifest.entryPath)

  if (!panelId) {
    throw new Error(
      `Could not extract panel ID from ${manifest.entry}. Make sure it exports an object with an \`id\` string field.`
    )
  }

  return { type: 'panel', panelId, isCommunity, message: `Installed ${name}.` }
}
