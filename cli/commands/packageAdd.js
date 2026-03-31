import { execSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import yaml from 'js-yaml'

/**
 * Install a TaxonPages package and auto-configure it.
 *
 * @param {object} options
 * @param {string} options.packageRoot - Path to the TaxonPages framework
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to install
 */
export async function packageAdd({ packageRoot, projectRoot, name }) {
  // 1. Install the package
  console.log(`Installing ${name}...`)
  try {
    execSync(`npm install ${name}`, { cwd: projectRoot, stdio: 'inherit' })
  } catch {
    console.error(`Failed to install ${name}.`)
    process.exit(1)
  }

  // 2. Read the installed package's manifest
  const manifest = readManifest(projectRoot, name)

  if (!manifest) {
    console.error(
      `Package "${name}" does not have a taxonpages manifest. Is this a TaxonPages package?`
    )
    process.exit(1)
  }

  // 3. Module: no YAML changes needed
  if (manifest.type === 'module') {
    console.log(`\nInstalled ${name}. Routes registered automatically.`)
    return
  }

  // 4. Panel: extract ID and update taxa_page.yml
  const panelId = extractPanelId(manifest.entryPath)

  if (!panelId) {
    console.error(
      `Could not extract panel ID from ${manifest.entry}. ` +
        `Make sure it exports an object with an \`id\` string field.`
    )
    process.exit(1)
  }

  const configPath = resolve(projectRoot, 'config', 'taxa_page.yml')

  if (existsSync(configPath)) {
    addPanelToConfig(configPath, panelId)
    console.log(
      `\nInstalled ${name} and added ${panelId} to taxa_page.yml (overview tab).`
    )
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
      console.log(
        `\nCreated config/taxa_page.yml and added ${panelId} (overview tab).`
      )
    } else {
      console.log(
        `\nInstalled ${name}. Add ${panelId} manually to your taxa_page.yml config.`
      )
    }
  }
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
