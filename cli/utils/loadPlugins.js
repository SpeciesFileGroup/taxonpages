// @ts-check
import { pathToFileURL } from 'node:url'
import { discoverAllPackages } from '../../src/plugins/vite/discoverPackages.js'

/** @type {Array|null} */
let _cache = null

/**
 * Discover, import, and initialize all TaxonPages plugins.
 *
 * Each plugin entry file must export a default function (the factory)
 * that receives a context object and returns a plugin descriptor
 * with optional hooks: vite, server, vue, cli, buildEnd, setupSchema.
 *
 * Results are cached per process — subsequent calls return the same array.
 *
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {string} options.packageRoot
 * @param {object} [options.configuration] - Loaded YAML configuration
 * @returns {Promise<Array<{name: string, vite?: Function, server?: Function, vue?: Function, cli?: Function, buildEnd?: Function, setupSchema?: Function}>>}
 */
export async function loadPlugins({ projectRoot, packageRoot, configuration }) {
  if (_cache) return _cache

  const { plugins: descriptors } = discoverAllPackages(projectRoot, {
    disabled: configuration?.packages?.disabled
  })

  const resolved = []

  for (const descriptor of descriptors) {
    try {
      const entryUrl = pathToFileURL(descriptor.entry).href
      const mod = await import(entryUrl)
      const factory = mod.default

      if (typeof factory !== 'function') {
        console.warn(
          `[taxonpages] Plugin "${descriptor.name}" does not export a default function. Skipping.`
        )
        continue
      }

      const context = {
        projectRoot,
        packageRoot,
        configuration: configuration || {},
        logger: createPluginLogger(descriptor.name)
      }

      const plugin = factory(context)

      if (!plugin || typeof plugin !== 'object' || !plugin.name) {
        console.warn(
          `[taxonpages] Plugin "${descriptor.name}" factory did not return a valid descriptor (must have a "name" property). Skipping.`
        )
        continue
      }

      resolved.push(plugin)
    } catch (err) {
      console.error(
        `[taxonpages] Failed to load plugin "${descriptor.name}":`,
        err.message
      )
    }
  }

  if (resolved.length > 0) {
    console.log(
      `[taxonpages] Loaded ${resolved.length} plugin(s): ${resolved.map((p) => p.name).join(', ')}`
    )
  }

  _cache = resolved
  return resolved
}

/**
 * Clear the plugin cache. Useful for dev server restarts.
 */
export function clearPluginCache() {
  _cache = null
}

/**
 * Create a namespaced logger for a plugin.
 *
 * @param {string} pluginName
 */
function createPluginLogger(pluginName) {
  const prefix = `[taxonpages:${pluginName}]`
  return {
    info: (...args) => console.log(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args)
  }
}
