import { describe, it, expect } from 'vitest'
import { collectTranslatable } from '../../../../cli/setup/client/composables/translationAudit.js'

const ctx = {
  locales: ['en', 'es'],
  defaultLocale: 'en',
  configuration: { i18n: { default_locale: 'en', locales: ['en', 'es'] } }
}

const schema = {
  layout: {
    label: 'Layout',
    sections: {
      header: {
        file: 'header.yml',
        label: 'Header',
        fields: {
          header_logo_text: { type: 'string', label: 'Logo Text', translatable: true },
          header_logo_url: { type: 'string', label: 'Logo URL' },
          header_links: {
            type: 'array',
            label: 'Links',
            items: { label: { type: 'string', label: 'Label', translatable: true } }
          }
        }
      }
    }
  },
  modules: {
    label: 'Modules',
    sections: {
      taxa: { file: 'taxa_page.yml', label: 'Taxa page', editor: 'custom' }
    }
  }
}

describe('collectTranslatable', () => {
  it('lists declared translatable fields even when not yet translated', () => {
    const entries = collectTranslatable(
      schema,
      { 'header.yml': { header_logo_text: 'Site', header_links: [{ label: 'Home' }] } },
      ctx
    )

    expect(entries.map((e) => [e.id, e.label, e.declared])).toEqual([
      ['header.yml:header_logo_text', 'Logo Text', true],
      ['header.yml:header_links.0.label', 'Links 1 › Label', true]
    ])
    expect(entries[0].sectionPath).toBe('layout.header')
  })

  it('finds translations in files no schema describes, with a readable label', () => {
    const entries = collectTranslatable(
      schema,
      {
        'taxa_page.yml': {
          taxa_page: {
            overview: {
              panels: [[[{ id: 'panel:map', bind: { title: { en: 'Map', es: 'Mapa' } } }]]]
            }
          }
        }
      },
      ctx
    )

    const found = entries.filter((e) => e.file === 'taxa_page.yml')

    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({
      declared: false,
      label: 'Taxa page › Overview › Panels 1.1.1 › Bind › Title',
      value: { en: 'Map', es: 'Mapa' }
    })
  })

  it('does not duplicate a declared field that is already translated', () => {
    const entries = collectTranslatable(
      schema,
      { 'header.yml': { header_logo_text: { en: 'Site', es: 'Sitio' } } },
      ctx
    )

    expect(entries.filter((e) => e.id === 'header.yml:header_logo_text')).toEqual([
      expect.objectContaining({ declared: true, label: 'Logo Text' })
    ])
  })

  it('ignores config files that no section edits', () => {
    const entries = collectTranslatable(schema, { 'other.yml': { a: { en: 'x' } } }, ctx)

    expect(entries.some((e) => e.file === 'other.yml')).toBe(false)
  })
})
