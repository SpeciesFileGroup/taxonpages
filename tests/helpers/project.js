import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach } from 'vitest'

const created = []

afterEach(() => {
  while (created.length) {
    rmSync(created.pop(), { recursive: true, force: true })
  }
})

/**
 * Create a throwaway TaxonPages project on disk, removed after the test.
 *
 * Keys are paths relative to the project root. A string value is written as
 * is; any other value is written as JSON, so package.json files read naturally:
 *
 *   createProject({
 *     'package.json': { dependencies: { 'taxonpages-panel-foo': '1.0.0' } },
 *     'node_modules/taxonpages-panel-foo/package.json': npmPackage('panel'),
 *     'node_modules/taxonpages-panel-foo/src/main.js': panelEntry('panel:foo'),
 *     'panels/Local/main.js': panelEntry('panel:local')
 *   })
 *
 * Fixtures live in the OS temp dir rather than the repo: node_modules is
 * gitignored at any depth, and a test must never read the developer's own
 * config/ or panels/.
 *
 * @param {Record<string, string|object>} files
 * @returns {string} Absolute project root
 */
export function createProject(files = {}) {
  // realpath: macOS tmpdir is a symlink, and discovery compares real paths.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'taxonpages-test-')))
  created.push(root)

  writeFiles(root, files)

  return root
}

/**
 * Add files to an existing project.
 *
 * @param {string} root
 * @param {Record<string, string|object>} files
 */
export function writeFiles(root, files) {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(
      target,
      typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    )
  }
}

/**
 * package.json content for an NPM package declaring a TaxonPages manifest.
 *
 * @param {string} name
 * @param {object} [manifest] - The `taxonpages` field
 * @param {object} [extra] - Other package.json fields
 */
export function npmPackage(name, manifest, extra = {}) {
  return { name, version: '1.0.0', ...extra, ...(manifest && { taxonpages: manifest }) }
}

/**
 * Source of a minimal panel entry file.
 *
 * @param {string} id - e.g. 'panel:foo'
 */
export function panelEntry(id) {
  return `export default { id: '${id}', component: {} }\n`
}
