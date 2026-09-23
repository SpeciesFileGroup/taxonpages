import { describe, it, expect } from 'vitest'
import {
  injectModuleSchemas,
  moduleSchemaToSection,
  withTranslationsSection
} from '../../../cli/setup/server.js'
import schema from '../../../cli/setup/schema.js'
import { createProject, npmPackage } from '../../helpers/project.js'

describe('moduleSchemaToSection', () => {
  it('builds a fields section with sensible defaults', () => {
    expect(moduleSchemaToSection('news', { fields: { a: { type: 'string' } } })).toEqual({
      file: 'news.yml',
      label: 'news',
      description: '',
      configKey: null,
      fields: { a: { type: 'string' } }
    })
  })

  it('points custom editors at their virtual module', () => {
    const section = moduleSchemaToSection(
      'otus',
      { editor: 'custom', component: './setup/LayoutEditor.vue', file: 'taxa_page.yml', configKey: 'taxa_page' },
      '/pkg/src/modules/otus'
    )

    expect(section).toMatchObject({
      file: 'taxa_page.yml',
      editor: 'custom',
      component: 'virtual:editor/otus',
      configKey: 'taxa_page'
    })
  })
})

describe('injectModuleSchemas', () => {
  it('adds core, local and NPM module sections without overriding existing ones', () => {
    const packageRoot = createProject({
      'src/modules/news/setup.schema.json': { label: 'News (core)' },
      'src/modules/plain/router/index.js': ''
    })
    const projectRoot = createProject({
      'package.json': { dependencies: { '@acme/taxonpages-module-shop': '*' } },
      'modules/news/setup.schema.json': { label: 'News (local)' },
      'modules/blog/router/index.js': 'export default []',
      'modules/blog/setup.schema.json': { label: 'Blog' },
      'node_modules/@acme/taxonpages-module-shop/package.json': npmPackage(
        '@acme/taxonpages-module-shop',
        { type: 'module' }
      ),
      'node_modules/@acme/taxonpages-module-shop/src/router/index.js': 'export default []',
      'node_modules/@acme/taxonpages-module-shop/setup.schema.json': { label: 'Shop' }
    })

    const base = { modules: { sections: { existing: { label: 'Kept' } } } }
    const merged = injectModuleSchemas(base, packageRoot, projectRoot)

    expect(Object.keys(merged.modules.sections)).toEqual(['existing', 'news', 'blog', 'shop'])
    // Core wins over a local module of the same name
    expect(merged.modules.sections.news.label).toBe('News (core)')
    // The base schema is not mutated
    expect(Object.keys(base.modules.sections)).toEqual(['existing'])
  })
})

describe('withTranslationsSection', () => {
  it('is absent on a single-locale site', () => {
    const root = createProject({})

    expect(withTranslationsSection(schema, root)).toBe(schema)
  })

  it('is placed right after Languages on a multi-locale site', () => {
    const root = createProject({ 'config/i18n.yml': 'i18n:\n  locales: [en, es]' })
    const keys = Object.keys(withTranslationsSection(schema, root).core.sections)

    expect(keys.indexOf('translations')).toBe(keys.indexOf('i18n') + 1)
    expect(Object.keys(schema.core.sections)).not.toContain('translations')
  })
})
