import { describe, it, expect } from 'vitest'
import { pluginInjectionPlugin } from '@/plugins/vite/pluginInjection.js'
import { createProject, npmPackage } from '../../../helpers/project.js'

const RESOLVED_ID = '\0virtual:taxonpages-plugins'

function load(projectRoot) {
  const plugin = pluginInjectionPlugin({ projectRoot, packageRoot: projectRoot })
  expect(plugin.resolveId('virtual:taxonpages-plugins')).toBe(RESOLVED_ID)
  return plugin.load(RESOLVED_ID)
}

describe('virtual:taxonpages-plugins', () => {
  it('exports an empty hook list when no plugin has a vueSetup', () => {
    const root = createProject({
      'package.json': {},
      'plugins/bare/plugin.js': 'export default () => ({ name: "bare" })'
    })

    expect(load(root)).toBe('export const vueSetupHooks = []\n')
  })

  it('imports vueSetup from local plugins and NPM plugins', () => {
    const root = createProject({
      'package.json': { dependencies: { 'taxonpages-plugin-npm': '*' } },
      'plugins/local/plugin.js': 'export default () => ({ name: "local" })',
      'plugins/local/vueSetup.js': 'export default () => {}',
      'node_modules/taxonpages-plugin-npm/package.json': npmPackage('taxonpages-plugin-npm', {
        type: 'plugin',
        vueSetup: './src/setup.js'
      }),
      'node_modules/taxonpages-plugin-npm/src/plugin.js': 'export default () => ({ name: "npm" })',
      'node_modules/taxonpages-plugin-npm/src/setup.js': 'export default () => {}'
    })

    const code = load(root)

    expect(code).toContain(`from '${root}/plugins/local/vueSetup.js'`)
    expect(code).toContain(`from '${root}/node_modules/taxonpages-plugin-npm/src/setup.js'`)
    expect(code).toContain('export const vueSetupHooks = [setup0, setup1]')
  })

  it('ignores ids it does not own', () => {
    const plugin = pluginInjectionPlugin({ projectRoot: '/', packageRoot: '/' })

    expect(plugin.resolveId('virtual:other')).toBeUndefined()
    expect(plugin.load('\0virtual:other')).toBeUndefined()
  })
})
