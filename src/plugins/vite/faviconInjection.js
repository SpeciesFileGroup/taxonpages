import { discoverFavicons } from '../../utils/discoverFavicons.js'
import { loadConfiguration } from '../../utils/loadConfiguration.js'

const VIRTUAL_ID = 'virtual:taxonpages-favicons'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * @param {object} options
 * @param {string} options.projectRoot
 */
export function faviconInjectionPlugin({ projectRoot }) {
  return {
    name: 'taxonpages:favicon-injection',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return

      const { base_url } = loadConfiguration(projectRoot)
      const favicons = discoverFavicons(projectRoot, base_url)

      return `export default ${JSON.stringify(favicons)}`
    }
  }
}
