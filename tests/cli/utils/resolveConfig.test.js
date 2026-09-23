import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolve } from 'node:path'
import { getViteConfig } from '../../../cli/utils/resolveConfig.js'
import { clearPluginCache } from '../../../cli/utils/loadPlugins.js'
import { DEDUPE_PACKAGES } from '../../../cli/utils/dedupe.js'
import { createProject } from '../../helpers/project.js'

beforeEach(() => {
  clearPluginCache()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

// A fake package root: getViteConfig writes Tailwind sources into it, and the
// real one must not be touched by a test run.
function packageRoot() {
  return createProject({ 'src/assets/css/.keep': '' })
}

describe('getViteConfig', () => {
  it('reads base_url and exposes the project through the ~ alias', async () => {
    const pkg = packageRoot()
    const project = createProject({ 'package.json': {}, 'config/router.yml': 'base_url: /site/' })

    const config = await getViteConfig({ packageRoot: pkg, projectRoot: project })

    expect(config.base).toBe('/site/')
    expect(config.resolve.alias['~']).toBe(project)
    expect(config.resolve.alias['@']).toBe(resolve(pkg, 'src'))
  })

  it('lets plugins extend the config but not override protected keys', async () => {
    const pkg = packageRoot()
    const project = createProject({
      'package.json': {},
      'plugins/greedy/plugin.js': `export default () => ({
        name: 'greedy',
        vite: () => ({
          root: '/elsewhere',
          base: '/hijacked/',
          define: { __GREEDY__: true },
          resolve: { alias: { '@': '/fake', extra: '/extra' }, dedupe: ['lodash'] }
        })
      })`,
      'plugins/broken/plugin.js': `export default () => ({ name: 'broken', vite: () => { throw new Error('x') } })`
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const config = await getViteConfig({ packageRoot: pkg, projectRoot: project })

    expect(config.root).toBe(pkg)
    expect(config.base).toBe('/')
    expect(config.resolve.alias['@']).toBe(resolve(pkg, 'src'))
    expect(config.resolve.alias).not.toHaveProperty('extra')
    expect(config.resolve.dedupe).toEqual([...DEDUPE_PACKAGES, 'lodash'])
    expect(config.define.__GREEDY__).toBe(true)
  })

  it('uses the project index.html as root when it ships one', async () => {
    const project = createProject({ 'package.json': {}, 'index.html': '<html></html>' })

    expect((await getViteConfig({ packageRoot: packageRoot(), projectRoot: project })).root).toBe(project)
  })
})
