import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { discoverNpmPackages } from '../../../src/plugins/vite/discoverPackages.js'
import { toForwardSlash } from '../../../src/utils/paths.js'

/**
 * Write @source directives for the setup wizard to a real CSS file on disk.
 * This ensures @tailwindcss/vite detects changes via file watching when
 * new modules are installed, matching the approach used by the main dev server.
 *
 * @param {string} clientDir - Setup wizard client directory
 * @param {string} packageRoot - TaxonPages package root
 * @param {string} projectRoot - User's project root
 */
export function writeSetupTailwindSources(clientDir, packageRoot, projectRoot) {
  const sourcesFile = resolve(clientDir, 'sources.css')
  const sources = [
    `@source "${toForwardSlash(resolve(packageRoot, 'src/modules/*/setup/**/*.vue'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'modules/*/setup/**/*.vue'))}";`
  ]

  // Discover NPM modules (both scoped and unscoped) with setup schemas
  const npmPackages = discoverNpmPackages(projectRoot)
    .filter((p) => p.type === 'module' && p.configSchema)
  for (const pkg of npmPackages) {
    sources.push(`@source "${toForwardSlash(resolve(pkg.path, 'setup/**/*.vue'))}";`)
  }

  writeFileSync(sourcesFile, sources.join('\n') + '\n')
}
