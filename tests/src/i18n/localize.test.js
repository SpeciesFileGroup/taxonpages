import { describe, it, expect } from 'vitest'
import { localize, localizeDeep, isLocaleMap } from '@/i18n/localize.js'

const config = {
  i18n: {
    default_locale: 'en',
    locales: ['en', 'es', 'id'],
    fallback: 'es'
  }
}

describe('isLocaleMap', () => {
  it('requires every key to be a configured locale', () => {
    expect(isLocaleMap({ en: 'Home', es: 'Inicio' }, config)).toBe(true)
    expect(isLocaleMap({ en: 'Home', fr: 'Accueil' }, config)).toBe(false)
    expect(isLocaleMap({}, config)).toBe(false)
    expect(isLocaleMap(['en'], config)).toBe(false)
    expect(isLocaleMap('en', config)).toBe(false)
  })

  it('does not mistake ordinary objects for translations', () => {
    expect(isLocaleMap({ id: 5 }, {})).toBe(false)
  })
})

describe('localize', () => {
  it('returns plain values untouched', () => {
    expect(localize('Home', 'es', config)).toBe('Home')
    expect(localize(null, 'es', config)).toBe(null)
  })

  it('picks the active locale, then the fallback, then the default, then anything', () => {
    expect(localize({ en: 'Home', es: 'Inicio' }, 'es', config)).toBe('Inicio')
    expect(localize({ en: 'Home', es: 'Inicio' }, 'id', config)).toBe('Inicio')
    expect(localize({ en: 'Home' }, 'id', config)).toBe('Home')
    expect(localize({ id: 'Beranda' }, 'es', config)).toBe('Beranda')
  })
})

describe('localizeDeep', () => {
  it('resolves locale maps anywhere in a tree, keeping its shape', () => {
    const bind = {
      title: { en: 'Map', es: 'Mapa' },
      count: 5,
      tabs: [{ label: { en: 'One', es: 'Uno' } }, 'raw'],
      nested: { size: 3 }
    }

    expect(localizeDeep(bind, 'es', config)).toEqual({
      title: 'Mapa',
      count: 5,
      tabs: [{ label: 'Uno' }, 'raw'],
      nested: { size: 3 }
    })
  })
})
