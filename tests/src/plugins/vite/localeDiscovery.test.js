import { describe, it, expect, vi } from 'vitest'
import { localeDiscoveryPlugin } from '@/plugins/vite/localeDiscovery.js'
import { createProject, npmPackage, panelEntry } from '../../../helpers/project.js'

const RESOLVED_ID = '\0virtual:taxonpages-locales'

function loadMessages({ packageRoot, projectRoot, locales = ['en'] }) {
  const plugin = localeDiscoveryPlugin({ packageRoot, projectRoot, locales })
  const code = plugin.load(RESOLVED_ID)

  return JSON.parse(code.replace(/^export const messages = /, ''))
}

describe('virtual:taxonpages-locales', () => {
  it('deep-merges catalogs in order core < module < npm < local < site', () => {
    const packageRoot = createProject({
      'src/locales/en.yml': 'a: core\nb: core\nc: core\nd: core\ne: core\nkeep: core',
      'src/modules/news/locales/en.yml': 'b: module'
    })
    const projectRoot = createProject({
      'package.json': { dependencies: { 'taxonpages-panel-npm': '*' } },
      'node_modules/taxonpages-panel-npm/package.json': npmPackage('taxonpages-panel-npm', { type: 'panel' }),
      'node_modules/taxonpages-panel-npm/src/main.js': panelEntry('panel:npm'),
      'node_modules/taxonpages-panel-npm/locales/en.yml': 'b: npm\nc: npm',
      'panels/Local/main.js': panelEntry('panel:local'),
      'panels/Local/locales/en.yml': 'c: local\nd: local',
      'locales/en.yml': 'd: site'
    })

    expect(loadMessages({ packageRoot, projectRoot }).en).toEqual({
      a: 'core',
      b: 'npm',
      c: 'local',
      d: 'site',
      e: 'core',
      keep: 'core'
    })
  })

  it('merges nested keys instead of replacing whole namespaces', () => {
    const packageRoot = createProject({ 'src/locales/en.yml': 'panel:\n  map:\n    title: Map\n    empty: None' })
    const projectRoot = createProject({ 'package.json': {}, 'locales/en.yml': 'panel:\n  map:\n    title: Where' })

    expect(loadMessages({ packageRoot, projectRoot }).en.panel.map).toEqual({ title: 'Where', empty: 'None' })
  })

  it('builds one catalog per configured locale, empty when none exists', () => {
    const packageRoot = createProject({ 'src/locales/en.yml': 'a: A' })
    const projectRoot = createProject({ 'package.json': {}, 'locales/es.yml': 'a: Á' })

    expect(loadMessages({ packageRoot, projectRoot, locales: ['en', 'es', 'fr'] })).toEqual({
      en: { a: 'A' },
      es: { a: 'Á' },
      fr: {}
    })
  })

  it('skips a malformed catalog and keeps the lower-priority value', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const packageRoot = createProject({ 'src/locales/en.yml': 'a: core' })
    const projectRoot = createProject({ 'package.json': {}, 'locales/en.yml': 'a: [broken' })

    expect(loadMessages({ packageRoot, projectRoot }).en).toEqual({ a: 'core' })
    expect(console.warn).toHaveBeenCalled()
  })
})
