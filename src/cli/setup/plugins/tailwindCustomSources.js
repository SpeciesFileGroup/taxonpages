import { resolve, relative, dirname } from 'node:path'
import { discoverNpmPackages } from '../../../plugins/vite/discoverPackages.js'
import { toForwardSlash } from '../../../utils/paths.js'

/**
 * Vite plugin that injects @source directives into styles.css
 * so Tailwind CSS scans custom editor components from all module sources.
 */
export function tailwindCustomSources(clientDir, packageRoot, projectRoot) {
  return {
    name: 'tailwind-custom-sources',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('styles.css')) return

      const cssDir = dirname(id)
      const sources = [
        resolve(packageRoot, 'src/modules/*/setup/**/*.vue'),
        resolve(projectRoot, 'modules/*/setup/**/*.vue')
      ]

      // Discover NPM modules (both scoped and unscoped) with setup schemas
      const npmPackages = discoverNpmPackages(projectRoot)
        .filter((p) => p.type === 'module' && p.configSchema)
      for (const pkg of npmPackages) {
        sources.push(resolve(pkg.path, 'setup/**/*.vue'))
      }

      const directives = sources
        .map((src) => `@source "${toForwardSlash(relative(cssDir, src))}";`)
        .join('\n')

      return { code: directives + '\n' + code, map: null }
    }
  }
}
