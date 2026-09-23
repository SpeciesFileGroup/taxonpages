import { describe, it, expect, vi, beforeEach } from 'vitest'
import { join } from 'node:path'
import {
  discoverNpmPackages,
  discoverAllPackages,
  extractBaseName,
  resolveConflicts
} from '@/plugins/vite/discoverPackages.js'
import { createProject, npmPackage, panelEntry } from '../../../helpers/project.js'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function projectWithDeps(deps, files = {}) {
  return createProject({
    'package.json': { dependencies: Object.fromEntries(deps.map((d) => [d, '*'])) },
    ...files
  })
}

describe('discoverNpmPackages', () => {
  it('finds a direct dependency declaring a panel, with its default entry', () => {
    const root = projectWithDeps(['taxonpages-panel-foo'], {
      'node_modules/taxonpages-panel-foo/package.json': npmPackage(
        'taxonpages-panel-foo',
        { type: 'panel' }
      ),
      'node_modules/taxonpages-panel-foo/src/main.js': panelEntry('panel:foo')
    })

    const [pkg] = discoverNpmPackages(root)

    expect(pkg).toMatchObject({
      name: 'taxonpages-panel-foo',
      type: 'panel',
      source: 'npm',
      version: '1.0.0',
      entry: join(root, 'node_modules/taxonpages-panel-foo/src/main.js')
    })
  })

  it('handles scoped packages and a declared entry', () => {
    const root = projectWithDeps(['@acme/taxonpages-module-bar'], {
      'node_modules/@acme/taxonpages-module-bar/package.json': npmPackage(
        '@acme/taxonpages-module-bar',
        { type: 'module', entry: './lib/routes.js' }
      ),
      'node_modules/@acme/taxonpages-module-bar/lib/routes.js': 'export default []'
    })

    const [pkg] = discoverNpmPackages(root)

    expect(pkg.type).toBe('module')
    expect(pkg.entry).toBe(
      join(root, 'node_modules/@acme/taxonpages-module-bar/lib/routes.js')
    )
  })

  it('ignores transitive dependencies even when they declare a manifest', () => {
    const root = projectWithDeps([], {
      'node_modules/taxonpages-panel-sneaky/package.json': npmPackage(
        'taxonpages-panel-sneaky',
        { type: 'panel' }
      ),
      'node_modules/taxonpages-panel-sneaky/src/main.js': panelEntry('panel:x')
    })

    expect(discoverNpmPackages(root)).toEqual([])
  })

  it('reads devDependencies and optionalDependencies as direct dependencies', () => {
    const root = createProject({
      'package.json': {
        devDependencies: { 'taxonpages-panel-a': '*' },
        optionalDependencies: { 'taxonpages-panel-b': '*' }
      },
      'node_modules/taxonpages-panel-a/package.json': npmPackage('taxonpages-panel-a', { type: 'panel' }),
      'node_modules/taxonpages-panel-a/src/main.js': panelEntry('panel:a'),
      'node_modules/taxonpages-panel-b/package.json': npmPackage('taxonpages-panel-b', { type: 'panel' }),
      'node_modules/taxonpages-panel-b/src/main.js': panelEntry('panel:b')
    })

    expect(discoverNpmPackages(root).map((p) => p.name).sort()).toEqual([
      'taxonpages-panel-a',
      'taxonpages-panel-b'
    ])
  })

  it('skips disabled packages', () => {
    const root = projectWithDeps(['taxonpages-panel-foo'], {
      'node_modules/taxonpages-panel-foo/package.json': npmPackage('taxonpages-panel-foo', { type: 'panel' }),
      'node_modules/taxonpages-panel-foo/src/main.js': panelEntry('panel:foo')
    })

    expect(
      discoverNpmPackages(root, { disabled: ['taxonpages-panel-foo'] })
    ).toEqual([])
  })

  it.each([
    ['no manifest', npmPackage('pkg')],
    ['a manifest without type', npmPackage('pkg', { entry: './x.js' })],
    ['an invalid type', npmPackage('pkg', { type: 'theme' })],
    ['a missing entry file', npmPackage('pkg', { type: 'panel', entry: './nope.js' })],
    ['an entry escaping the package', npmPackage('pkg', { type: 'panel', entry: '../other/main.js' })],
    // Shares the package name as a prefix: must not pass as inside `pkg`
    ['an entry in a sibling package', npmPackage('pkg', { type: 'panel', entry: '../pkg-evil/main.js' })]
  ])('skips a package with %s', (_, pkgJson) => {
    const root = projectWithDeps(['pkg'], {
      'node_modules/pkg/package.json': pkgJson,
      'node_modules/other/main.js': panelEntry('panel:other'),
      'node_modules/pkg-evil/main.js': panelEntry('panel:evil')
    })

    expect(discoverNpmPackages(root)).toEqual([])
  })

  it('returns nothing without a project package.json or node_modules', () => {
    expect(discoverNpmPackages(createProject({ 'node_modules/.keep': '' }))).toEqual([])
    expect(discoverNpmPackages(createProject({ 'package.json': {} }))).toEqual([])
  })

  it('ignores a setup schema or vueSetup outside the package', () => {
    const root = projectWithDeps(['taxonpages-plugin-x'], {
      'node_modules/taxonpages-plugin-x/package.json': npmPackage('taxonpages-plugin-x', {
        type: 'plugin',
        setupSchema: '../taxonpages-plugin-x-evil/setup.schema.json',
        vueSetup: '../taxonpages-plugin-x-evil/vueSetup.js'
      }),
      'node_modules/taxonpages-plugin-x/src/plugin.js': 'export default () => ({ name: "x" })',
      'node_modules/taxonpages-plugin-x-evil/setup.schema.json': { label: 'Evil' },
      'node_modules/taxonpages-plugin-x-evil/vueSetup.js': 'export default () => {}'
    })

    const [pkg] = discoverNpmPackages(root)

    expect(pkg.configSchema).toBe(null)
    expect(pkg.vueSetup).toBe(null)
  })

  it('loads the setup schema and a plugin vueSetup file', () => {
    const root = projectWithDeps(['taxonpages-plugin-x'], {
      'node_modules/taxonpages-plugin-x/package.json': npmPackage('taxonpages-plugin-x', { type: 'plugin' }),
      'node_modules/taxonpages-plugin-x/src/plugin.js': 'export default () => ({ name: "x" })',
      'node_modules/taxonpages-plugin-x/vueSetup.js': 'export default () => {}',
      'node_modules/taxonpages-plugin-x/setup.schema.json': { label: 'X' }
    })

    const [pkg] = discoverNpmPackages(root)

    expect(pkg.configSchema).toEqual({ label: 'X' })
    expect(pkg.vueSetup).toBe(join(root, 'node_modules/taxonpages-plugin-x/vueSetup.js'))
  })
})

describe('discoverAllPackages', () => {
  it('discovers local panels, modules and plugins by their entry files', () => {
    const root = createProject({
      'package.json': {},
      'panels/Local/main.js': panelEntry('panel:local'),
      'panels/NoEntry/readme.md': '',
      'modules/blog/router/index.js': 'export default []',
      'modules/notAModule/views/x.vue': '',
      'plugins/tracker/plugin.js': 'export default () => ({ name: "t" })'
    })

    const { panels, modules, plugins, all } = discoverAllPackages(root)

    expect(panels.map((p) => p.name)).toEqual(['Local'])
    expect(modules.map((p) => p.name)).toEqual(['blog'])
    expect(plugins.map((p) => p.name)).toEqual(['tracker'])
    expect(all).toHaveLength(3)
    expect(all.every((p) => p.source === 'local')).toBe(true)
  })

  it('lets a local package override the NPM package with the same base name', () => {
    const root = projectWithDeps(['@acme/taxonpages-panel-gallery'], {
      'node_modules/@acme/taxonpages-panel-gallery/package.json': npmPackage(
        '@acme/taxonpages-panel-gallery',
        { type: 'panel' }
      ),
      'node_modules/@acme/taxonpages-panel-gallery/src/main.js': panelEntry('panel:gallery'),
      'panels/Gallery/main.js': panelEntry('panel:gallery')
    })

    const { panels } = discoverAllPackages(root)

    expect(panels).toHaveLength(1)
    expect(panels[0].source).toBe('local')
  })
})

describe('extractBaseName', () => {
  it.each([
    ['@acme/taxonpages-panel-foo', 'panel', 'foo'],
    ['taxonpages-module-bar', 'module', 'bar'],
    ['@acme/my-panel', 'panel', 'my-panel'],
    ['taxonpages-panel-foo', 'module', 'taxonpages-panel-foo']
  ])('%s (%s) → %s', (name, type, expected) => {
    expect(extractBaseName(name, type)).toBe(expected)
  })
})

describe('resolveConflicts', () => {
  it('matches names case-insensitively and keeps non-conflicting NPM packages', () => {
    const local = [{ name: 'Foo', type: 'panel', source: 'local' }]
    const npm = [
      { name: 'taxonpages-panel-foo', type: 'panel', source: 'npm' },
      { name: 'taxonpages-panel-bar', type: 'panel', source: 'npm' }
    ]

    expect(resolveConflicts(local, npm).map((p) => p.name)).toEqual([
      'Foo',
      'taxonpages-panel-bar'
    ])
  })
})
