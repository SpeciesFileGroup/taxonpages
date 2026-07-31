/**
 * Vite plugin that provides a virtual module `virtual:taxonpages-plugins`
 * exposing Vue setup functions from discovered TaxonPages plugins.
 *
 * Plugins that want to extend the Vue app (e.g., register global components,
 * add Vue plugins) return a `vueSetup` path in their descriptor pointing to
 * a file that exports a default function: (app, { router, store }) => void.
 *
 * This virtual module collects those paths at build time and generates
 * import/export code so the browser bundle can call them.
 */

import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { discoverAllPackages } from './discoverPackages.js'

const VIRTUAL_ID = 'virtual:taxonpages-plugins'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} options.packageRoot
 * @param {string[]} [options.disabled]
 */
export function pluginInjectionPlugin({ projectRoot, packageRoot, disabled }) {
  return {
    name: 'taxonpages:plugin-injection',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return

      const { plugins } = discoverAllPackages(projectRoot, { disabled })
      const vueSetupFiles = []

      for (const descriptor of plugins) {
        // NPM plugins: use manifest-declared vueSetup path (already resolved)
        // Local plugins: fall back to vueSetup.js at the plugin root
        const setupPath = descriptor.vueSetup ||
          (() => {
            const fallback = resolve(descriptor.path, 'vueSetup.js')
            return existsSync(fallback) ? fallback : null
          })()

        if (setupPath) {
          vueSetupFiles.push(setupPath.replace(/\\/g, '/'))
        }
      }

      if (vueSetupFiles.length === 0) {
        return 'export const vueSetupHooks = []\n'
      }

      const imports = vueSetupFiles
        .map((f, i) => `import setup${i} from '${f}'`)
        .join('\n')

      const exports = vueSetupFiles.map((_, i) => `setup${i}`).join(', ')

      return `${imports}\nexport const vueSetupHooks = [${exports}]\n`
    }
  }
}
