import { toForwardSlash } from '../../../src/utils/paths.js'

const VIRTUAL_EDITOR_PREFIX = 'virtual:editor/'
const RESOLVED_PREFIX = '\0virtual:editor/'
const VIRTUAL_REGISTRY = 'virtual:editor-registry'
const RESOLVED_REGISTRY = '\0virtual:editor-registry'

/**
 * Vite plugin that resolves virtual:editor/<name> imports to actual
 * file paths on disk. Custom editor components are loaded as virtual
 * modules that re-export the real file, so they participate in Vite's
 * normal module graph and aliases like @setup/ resolve correctly.
 *
 * Also provides a `virtual:editor-registry` module that exports a map
 * of all discovered editors, so they can be looked up at runtime without
 * dynamic imports (which the browser can't resolve for virtual modules).
 *
 * @param {Map<string, string>} editorMap - Maps editor names to absolute file paths
 */
export function customEditorPlugin(editorMap) {
  return {
    name: 'taxonpages:custom-editors',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_REGISTRY) return RESOLVED_REGISTRY
      if (id.startsWith(VIRTUAL_EDITOR_PREFIX)) {
        const name = id.slice(VIRTUAL_EDITOR_PREFIX.length)
        if (editorMap.has(name)) return RESOLVED_PREFIX + name
      }
    },
    load(id) {
      if (id === RESOLVED_REGISTRY) {
        const entries = [...editorMap.keys()]
        const imports = entries
          .map((name, i) => `import editor_${i} from '${VIRTUAL_EDITOR_PREFIX}${name}'`)
          .join('\n')
        const map = entries
          .map((name, i) => `  '${VIRTUAL_EDITOR_PREFIX}${name}': editor_${i}`)
          .join(',\n')

        return `${imports}\nexport default {\n${map}\n}`
      }

      if (id.startsWith(RESOLVED_PREFIX)) {
        const name = id.slice(RESOLVED_PREFIX.length)
        const filePath = toForwardSlash(editorMap.get(name))

        return `export { default } from '${filePath}'`
      }
    }
  }
}

export { VIRTUAL_EDITOR_PREFIX }
