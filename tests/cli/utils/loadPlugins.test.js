import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPlugins, clearPluginCache } from '../../../cli/utils/loadPlugins.js'
import { createProject } from '../../helpers/project.js'

beforeEach(() => {
  clearPluginCache()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function project(plugins) {
  const files = { 'package.json': {} }

  for (const [name, source] of Object.entries(plugins)) {
    files[`plugins/${name}/plugin.js`] = source
  }

  return createProject(files)
}

describe('loadPlugins', () => {
  it('calls each factory with a context and returns the descriptors', async () => {
    const root = project({
      good: `export default (ctx) => ({
        name: 'good',
        seen: { projectRoot: ctx.projectRoot, title: ctx.configuration.title, hasLogger: typeof ctx.logger.info === 'function' }
      })`
    })

    const plugins = await loadPlugins({
      projectRoot: root,
      packageRoot: root,
      configuration: { title: 'Site' }
    })

    expect(plugins).toHaveLength(1)
    expect(plugins[0].seen).toEqual({ projectRoot: root, title: 'Site', hasLogger: true })
  })

  it('skips invalid plugins without affecting the others', async () => {
    const root = project({
      a_notAFunction: 'export default { name: "x" }',
      b_noName: 'export default () => ({})',
      c_throws: 'export default () => { throw new Error("boom") }',
      d_syntaxError: 'export default (',
      e_good: 'export default () => ({ name: "good" })'
    })

    const plugins = await loadPlugins({ projectRoot: root, packageRoot: root })

    expect(plugins.map((p) => p.name)).toEqual(['good'])
  })

  it('skips plugins disabled in the configuration', async () => {
    const root = createProject({
      'package.json': { dependencies: { 'taxonpages-plugin-off': '*' } },
      'node_modules/taxonpages-plugin-off/package.json': {
        name: 'taxonpages-plugin-off',
        taxonpages: { type: 'plugin' }
      },
      'node_modules/taxonpages-plugin-off/src/plugin.js': 'export default () => ({ name: "off" })'
    })

    const plugins = await loadPlugins({
      projectRoot: root,
      packageRoot: root,
      configuration: { packages: { disabled: ['taxonpages-plugin-off'] } }
    })

    expect(plugins).toEqual([])
  })

  it('caches results until the cache is cleared', async () => {
    const first = project({ one: 'export default () => ({ name: "one" })' })
    const second = project({ two: 'export default () => ({ name: "two" })' })

    const a = await loadPlugins({ projectRoot: first, packageRoot: first })
    const b = await loadPlugins({ projectRoot: second, packageRoot: second })

    expect(b).toBe(a)

    clearPluginCache()
    const c = await loadPlugins({ projectRoot: second, packageRoot: second })

    expect(c.map((p) => p.name)).toEqual(['two'])
  })
})
