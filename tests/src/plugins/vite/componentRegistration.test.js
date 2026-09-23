import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolve } from 'node:path'
import { componentRegistrationPlugin } from '@/plugins/vite/componentRegistration.js'
import { createProject, npmPackage, panelEntry } from '../../../helpers/project.js'

const packageRoot = resolve(import.meta.dirname, '../../../..')

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

/**
 * A project with one local panel and one NPM panel, module and global
 * component — enough to see every kind of injection.
 */
function makeProject() {
  return createProject({
    'package.json': {
      dependencies: {
        'taxonpages-panel-npm': '*',
        'taxonpages-module-shop': '*'
      }
    },
    'panels/Local/main.js': panelEntry('panel:local'),
    'node_modules/taxonpages-panel-npm/package.json': npmPackage('taxonpages-panel-npm', { type: 'panel' }),
    'node_modules/taxonpages-panel-npm/src/main.js': panelEntry('panel:npm'),
    'node_modules/taxonpages-panel-npm/src/Widget.global.vue': '<template><i /></template>',
    'node_modules/taxonpages-panel-npm/src/Chart.client.vue': '<template><i /></template>',
    'node_modules/taxonpages-panel-npm/layout.js': 'export default {}',
    'node_modules/taxonpages-module-shop/package.json': npmPackage('taxonpages-module-shop', { type: 'module' }),
    'node_modules/taxonpages-module-shop/src/router/index.js': 'export default []'
  })
}

function transform(projectRoot, code, id = resolve(packageRoot, 'src/fake.js')) {
  const plugin = componentRegistrationPlugin({ packageRoot, projectRoot })
  return plugin.transform(code, id)?.code
}

describe('componentRegistrationPlugin transform', () => {
  it('leaves code without an aliased glob untouched', () => {
    const root = makeProject()

    expect(transform(root, 'const a = 1')).toBeUndefined()
    expect(transform(root, "import.meta.glob('./x/*.js')")).toBeUndefined()
  })

  it('resolves ~/ panel globs to local panels plus NPM panels', () => {
    const root = makeProject()
    const code = transform(
      root,
      "const p = import.meta.glob('~/panels/*/main.js', { eager: true, import: 'default' })"
    )

    expect(code).not.toContain('import.meta.glob')
    expect(code).toContain(`${root}/panels/Local/main.js`)
    expect(code).toContain(`${root}/node_modules/taxonpages-panel-npm/src/main.js`)
    // Eager + default import: static default imports bound to variables
    expect(code).toMatch(/import \{ default as __glob_\d+ \} from '.*panels\/Local\/main\.js'/)
  })

  it('injects NPM module routers into module router globs', () => {
    const root = makeProject()
    const code = transform(root, "import.meta.glob('~/modules/**/router/*.js')")

    expect(code).toContain(
      `() => import('${root}/node_modules/taxonpages-module-shop/src/router/index.js')`
    )
  })

  it('injects global, client-only components and layout contributions from packages', () => {
    const root = makeProject()

    expect(transform(root, "import.meta.glob('~/components/**/*.global.vue')")).toContain(
      'Widget.global.vue'
    )
    expect(transform(root, "import.meta.glob('~/components/**/*.client.vue')")).toContain(
      'Chart.client.vue'
    )
    expect(transform(root, "import.meta.glob('~/panels/*/layout.js')")).toContain(
      'taxonpages-panel-npm/layout.js'
    )
  })

  it('does not inject NPM panels into unrelated globs', () => {
    const root = makeProject()
    const code = transform(root, "import.meta.glob('~/layouts/*.vue')")

    expect(code).not.toContain('taxonpages-panel-npm')
    expect(code).toContain('{}')
  })

  it('skips NPM packages shadowed by a local one', () => {
    const shadowed = createProject({
      'package.json': { dependencies: { 'taxonpages-panel-local': '*' } },
      'panels/Local/main.js': panelEntry('panel:local'),
      'node_modules/taxonpages-panel-local/package.json': npmPackage('taxonpages-panel-local', { type: 'panel' }),
      'node_modules/taxonpages-panel-local/src/main.js': panelEntry('panel:local')
    })

    expect(transform(shadowed, "import.meta.glob('~/panels/*/main.js')")).not.toContain(
      'node_modules'
    )
  })

  it('turns eager style globs into side-effect imports', () => {
    const root = createProject({
      'package.json': {},
      'config/style/theme.css': ':root {}'
    })
    const code = transform(root, "import.meta.glob('~/config/style/*.{scss,css}', { eager: true })")

    expect(code).toContain(`import '${root}/config/style/theme.css';`)
  })

  it('merges several patterns, including @/ ones, into one object', () => {
    const root = makeProject()
    const code = transform(
      root,
      "import.meta.glob(['@/modules/home/router/*.js', '~/panels/*/main.js'])"
    )

    expect(code).toContain(`${packageRoot}/src/modules/home/router/index.js`)
    expect(code).toContain(`${root}/panels/Local/main.js`)
  })
})
