import { describe, it, expect } from 'vitest'
import {
  readLocale,
  writeLocale,
  orphanLocales,
  filledCount,
  countLocaleValues
} from '../../../../cli/setup/client/composables/translatedValue.js'

const ctx = {
  locales: ['en', 'es'],
  defaultLocale: 'en',
  configuration: { i18n: { default_locale: 'en', locales: ['en', 'es'] } }
}

describe('readLocale', () => {
  it('reads a plain string as the default locale text', () => {
    expect(readLocale('Home', 'en', true, ctx)).toBe('Home')
    expect(readLocale('Home', 'es', true, ctx)).toBe('')
  })

  it('reads one locale out of a map', () => {
    expect(readLocale({ en: 'Home', es: 'Inicio' }, 'es', true, ctx)).toBe('Inicio')
  })
})

describe('writeLocale', () => {
  // A single-locale site that opens the wizard and saves must get its file back unchanged.
  it('keeps default-only text a plain string', () => {
    expect(writeLocale('Home', 'en', 'House', true, ctx)).toBe('House')
    expect(writeLocale(undefined, 'en', 'Home', true, ctx)).toBe('Home')
  })

  it('turns a plain string into a map when another locale is added', () => {
    expect(writeLocale('Home', 'es', 'Inicio', true, ctx)).toEqual({ en: 'Home', es: 'Inicio' })
  })

  it('removes a cleared locale and collapses back to a string', () => {
    expect(writeLocale({ en: 'Home', es: 'Inicio' }, 'es', '', true, ctx)).toBe('Home')
    expect(writeLocale({ es: 'Inicio' }, 'es', '', true, ctx)).toBe('')
  })

  it('never drops translations for a locale no longer configured', () => {
    const value = { en: 'Home', fr: 'Accueil' }

    expect(writeLocale(value, 'es', 'Inicio', true, ctx)).toEqual({
      en: 'Home',
      es: 'Inicio',
      fr: 'Accueil'
    })
  })

  it('orders keys by configured locale for stable YAML diffs', () => {
    const result = writeLocale({ es: 'Inicio' }, 'en', 'Home', true, ctx)

    expect(Object.keys(result)).toEqual(['en', 'es'])
  })

  it('does not treat an unmarked object as a translation', () => {
    expect(readLocale({ id: 5 }, 'en', false, ctx)).toBe('')
  })
})

describe('orphanLocales and filledCount', () => {
  it('reports unconfigured locales and counts configured ones with text', () => {
    const value = { en: 'Home', fr: 'Accueil' }

    expect(orphanLocales(value, true, ctx)).toEqual(['fr'])
    expect(filledCount(value, true, ctx)).toBe(1)
    expect(filledCount('Home', true, ctx)).toBe(1)
  })
})

describe('countLocaleValues', () => {
  it('counts values carrying a locale anywhere in a config tree', () => {
    const tree = {
      project_name: { en: 'Site', es: 'Sitio' },
      header_links: [{ label: { en: 'A', es: 'B' } }, { label: { en: 'C' } }, { label: 'D' }]
    }

    expect(countLocaleValues(tree, 'es', ctx)).toBe(2)
    expect(countLocaleValues(tree, 'en', ctx)).toBe(3)
  })
})
