import { resolve, join, dirname, relative, basename as pathBasename } from 'node:path'
import {
  readFileSync,
  existsSync,
  mkdirSync,
  cpSync,
  readdirSync
} from 'node:fs'
import { createInterface } from 'node:readline'
import {
  discoverNpmPackages,
  discoverLocalPanels,
  discoverLocalModules,
  extractBaseName
} from '../../plugins/vite/discoverPackages.js'

/**
 * Unpack an NPM TaxonPages package into the local project directory
 * so it can be customized directly.
 *
 * @param {object} options
 * @param {string} options.projectRoot - Path to the user's project
 * @param {string} options.name - NPM package name to unpack
 */
export async function packageUnpack({ projectRoot, name }) {
  // 1. Find the package in node_modules
  const npmPackages = discoverNpmPackages(projectRoot)
  const pkg = npmPackages.find((p) => p.name === name)

  if (!pkg) {
    console.error(
      `Package "${name}" not found in node_modules or is not a TaxonPages package.`
    )
    process.exit(1)
  }

  // 2. Determine the source directory to copy
  const manifest = readManifest(pkg.path)
  const entry = manifest.entry || (pkg.type === 'panel' ? './src/main.js' : './src/router/index.js')
  const srcDir = resolve(pkg.path, dirname(entry))

  if (!existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`)
    process.exit(1)
  }

  // 3. Determine destination directory
  const baseName = extractBaseName(name, pkg.type)
  const destDir =
    pkg.type === 'panel'
      ? resolve(projectRoot, 'panels', baseName)
      : resolve(projectRoot, 'modules', baseName)

  // 4. Check for local conflict
  const localPanels = discoverLocalPanels(projectRoot)
  const localModules = discoverLocalModules(projectRoot)
  const localAll = [...localPanels, ...localModules]

  if (localAll.some((l) => l.path === destDir)) {
    console.error(
      `A local ${pkg.type} already exists at ${relative(projectRoot, destDir)}. ` +
        `Remove it first if you want to unpack again.`
    )
    process.exit(1)
  }

  if (existsSync(destDir)) {
    console.error(
      `Directory already exists: ${relative(projectRoot, destDir)}. ` +
        `Remove it first if you want to unpack.`
    )
    process.exit(1)
  }

  // 5. Copy files
  const parentDir = dirname(destDir)
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true })
  }

  cpSync(srcDir, destDir, {
    recursive: true,
    filter: (src) => {
      const name = pathBasename(src)
      return name !== 'node_modules' && name !== '.git'
    }
  })

  console.log(
    `\nUnpacked ${name} (${pkg.type}) to ${relative(projectRoot, destDir)}/`
  )

  // 6. Verify the expected entry point exists
  const expectedEntry =
    pkg.type === 'panel'
      ? join(destDir, 'main.js')
      : join(destDir, 'router', 'index.js')

  if (!existsSync(expectedEntry)) {
    console.warn(
      `Warning: Expected entry point not found at ${relative(projectRoot, expectedEntry)}. ` +
        `The package may use a non-standard structure. You may need to reorganize the files manually.`
    )
  }

  // 7. Check for npm dependencies the package might need
  const pkgJsonPath = join(pkg.path, 'package.json')
  if (existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    const deps = Object.keys(pkgJson.dependencies || {})

    if (deps.length > 0) {
      console.log(
        `\nNote: This package depends on: ${deps.join(', ')}. ` +
          `Make sure these are installed in your project.`
      )
    }
  }

  // 8. Offer to uninstall the npm package
  const shouldUninstall = await askYesNo(
    `\nUninstall the NPM package "${name}"? (The local copy will be used instead)`
  )

  if (shouldUninstall) {
    const { execSync } = await import('node:child_process')

    try {
      execSync(`npm uninstall ${name}`, { cwd: projectRoot, stdio: 'inherit' })
      console.log(`\nUninstalled ${name}.`)
    } catch {
      console.error(`Failed to uninstall ${name}. You can remove it manually.`)
    }
  } else {
    console.log(
      `\nKeeping ${name} installed. The local copy at ${relative(projectRoot, destDir)}/ ` +
        `will take priority over the NPM version.`
    )
  }
}

function readManifest(pkgDir) {
  const pkgJsonPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return {}

  try {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    return pkgJson.taxonpages || {}
  } catch {
    return {}
  }
}

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
