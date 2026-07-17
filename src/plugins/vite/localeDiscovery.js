/**
 * Vite plugin that provides a virtual module `virtual:taxonpages-locales`
 * exposing merged message catalogs for every configured locale.
 *
 * Catalogs are YAML files named after their locale, collected from four
 * sources and deep-merged in ascending priority:
 *
 *   1. Core            framework catalog, then per-module catalogs
 *   2. NPM packages    a `locales` dir inside each discovered package
 *   3. Local packages  a `locales` dir inside ~/panels and ~/modules entries
 *   4. Site overrides  ~/locales
 *
 * In every case the file is named after the locale, e.g. `locales/en.yml`.
 *
 * This mirrors the local > npm > core precedence used for components and
 * panels, so a site can override any string a package ships by redefining
 * the same key in ~/locales/<locale>.yml.
 *
 * Catalogs are authored pre-namespaced (`panel.scrutiny.title: ...`), so the
 * merge is a plain deep merge — no namespace injection happens here.
 *
 * YAML is parsed at build time and emitted as JS, so js-yaml never reaches
 * the browser bundle.
 */

import { resolve, join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { globSync } from 'glob'
import { loadYaml } from '../../utils/loadYaml.js'
import { toForwardSlash } from '../../utils/paths.js'
import { discoverAllPackages } from './discoverPackages.js'

const VIRTUAL_ID = 'virtual:taxonpages-locales'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * @param {object} options
 * @param {string} options.packageRoot
 * @param {string} options.projectRoot
 * @param {string[]} options.locales - Locales to build catalogs for
 * @param {string[]} [options.disabled] - Package names to skip
 */
export function localeDiscoveryPlugin({
  packageRoot,
  projectRoot,
  locales,
  disabled
}) {
  return {
    name: 'taxonpages:locale-discovery',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return

      const messages = {}

      for (const locale of locales) {
        messages[locale] = collectLocaleMessages({
          packageRoot,
          projectRoot,
          locale,
          disabled
        })
      }

      return `export const messages = ${JSON.stringify(messages)}\n`
    },

    configureServer(server) {
      const patterns = localeGlobPatterns({ packageRoot, projectRoot })

      const invalidate = (filePath) => {
        if (!/\.ya?ml$/.test(filePath)) return
        if (!toForwardSlash(filePath).includes('/locales/')) return

        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (!mod) return

        server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.add(patterns)
      server.watcher.on('change', invalidate)
      server.watcher.on('add', invalidate)
      server.watcher.on('unlink', invalidate)
    }
  }
}

/**
 * Collect and merge every catalog for a single locale, in ascending priority.
 *
 * @param {object} options
 * @param {string} options.packageRoot
 * @param {string} options.projectRoot
 * @param {string} options.locale
 * @param {string[]} [options.disabled]
 * @returns {object} Merged messages for the locale
 */
function collectLocaleMessages({
  packageRoot,
  projectRoot,
  locale,
  disabled
}) {
  const sources = []

  // 1. Core: framework-wide catalog, then per-module catalogs
  sources.push(resolve(packageRoot, 'src', 'locales', `${locale}.yml`))
  sources.push(
    ...globSync(toForwardSlash(`src/modules/*/locales/${locale}.yml`), {
      cwd: packageRoot,
      absolute: true
    }).sort()
  )

  // 2 & 3. Discovered packages. discoverAllPackages already resolves
  // local-over-npm conflicts, so ordering npm before local here only
  // affects packages that coexist rather than shadow each other.
  const { all } = discoverAllPackages(projectRoot, { disabled })
  const byPriority = [
    ...all.filter((pkg) => pkg.source === 'npm'),
    ...all.filter((pkg) => pkg.source === 'local')
  ]

  for (const pkg of byPriority) {
    sources.push(join(pkg.path, 'locales', `${locale}.yml`))
  }

  // 4. Site-level overrides win over everything
  sources.push(resolve(projectRoot, 'locales', `${locale}.yml`))

  return sources.reduce((acc, filePath) => {
    const catalog = readCatalog(filePath)
    return catalog ? deepMerge(acc, catalog) : acc
  }, {})
}

/**
 * Glob patterns covering every location a catalog may live in. Used to tell
 * the dev-server watcher which files should invalidate the virtual module.
 *
 * @param {object} options
 * @param {string} options.packageRoot
 * @param {string} options.projectRoot
 * @returns {string[]}
 */
function localeGlobPatterns({ packageRoot, projectRoot }) {
  return [
    resolve(packageRoot, 'src/locales/*.yml'),
    resolve(packageRoot, 'src/modules/*/locales/*.yml'),
    resolve(projectRoot, 'locales/*.yml'),
    resolve(projectRoot, 'panels/*/locales/*.yml'),
    resolve(projectRoot, 'modules/*/locales/*.yml')
  ].map(toForwardSlash)
}

/**
 * Read a catalog file, tolerating absence. A malformed catalog warns and is
 * skipped rather than failing the build: a broken translation should never
 * take a site down, it should fall back to the next source.
 *
 * @param {string} filePath
 * @returns {object|null}
 */
function readCatalog(filePath) {
  if (!existsSync(filePath)) return null

  try {
    const parsed = loadYaml(readFileSync(filePath, 'utf-8'), {})
    return isPlainObject(parsed) ? parsed : null
  } catch (err) {
    console.warn(
      `[taxonpages] Skipping malformed locale catalog "${filePath}": ${err.message}`
    )
    return null
  }
}

/**
 * Deep-merge `source` into `target`, returning a new object. Plain objects
 * merge recursively; every other value (including arrays) is replaced, so a
 * higher-priority catalog fully owns the keys it defines.
 *
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  const result = { ...target }

  for (const [key, value] of Object.entries(source)) {
    result[key] =
      isPlainObject(value) && isPlainObject(result[key])
        ? deepMerge(result[key], value)
        : value
  }

  return result
}

function isPlainObject(value) {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value)
  )
}
