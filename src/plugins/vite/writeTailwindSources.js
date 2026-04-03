import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { toForwardSlash } from '../../utils/paths.js'
import {
  discoverNpmPackages,
  discoverLocalPanels,
  discoverLocalModules,
  resolveConflicts
} from './discoverPackages.js'

/**
 * Write Tailwind v4 @source directives so it scans user project files
 * and discovered NPM packages for utility classes.
 *
 * @param {string} packageRoot
 * @param {string} projectRoot
 * @param {object} [options]
 * @param {string[]} [options.disabled] - Package names to skip
 */
export function writeTailwindSources(packageRoot, projectRoot, options = {}) {
  const sourcesFile = resolve(packageRoot, 'src/assets/css/sources.css')

  // User project directories
  const sources = [
    `@source "${toForwardSlash(resolve(projectRoot, 'pages/**/*.{vue,md,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'layouts/**/*.{vue,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'modules/**/*.{vue,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'panels/**/*.{vue,js}'))}";`,
    `@source "${toForwardSlash(resolve(projectRoot, 'components/**/*.{vue,js}'))}";`
  ]

  // Discover NPM packages and add their source directories
  const npmPackages = discoverNpmPackages(projectRoot, {
    disabled: options.disabled
  })
  const localPanels = discoverLocalPanels(projectRoot)
  const localModules = discoverLocalModules(projectRoot)

  const panels = resolveConflicts(
    localPanels,
    npmPackages.filter((p) => p.type === 'panel')
  ).filter((p) => p.source === 'npm')

  const modules = resolveConflicts(
    localModules,
    npmPackages.filter((p) => p.type === 'module')
  ).filter((p) => p.source === 'npm')

  for (const pkg of [...panels, ...modules]) {
    const pkgSource = toForwardSlash(resolve(pkg.path, '**/*.{vue,js}'))
    sources.push(`@source "${pkgSource}";`)
  }

  writeFileSync(sourcesFile, sources.join('\n') + '\n')
}
