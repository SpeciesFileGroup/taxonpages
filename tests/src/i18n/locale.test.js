import { describe, it, expect } from 'vitest'
import {
  extractLocale,
  localeFromLocation,
  localeBase,
  localePath,
  stripLocale,
  localeRoutePath,
  prefixedLocales
} from '@/i18n/locale.js'

const multi = {
  i18n: {
    default_locale: 'en',
    locales: ['en', 'es']
  }
}

const prefixAll = {
  i18n: {
    ...multi.i18n,
    prefix_default_locale: true
  }
}

const hash = {
  ...multi,
  hash_mode: true,
  base_url: '/site/'
}

describe('extractLocale', () => {
  it('resolves a single-locale site to the default locale, path untouched', () => {
    expect(extractLocale('/es/about', {})).toEqual({
      locale: 'en',
      path: '/es/about'
    })
  })

  it('splits a prefixed locale off the path', () => {
    expect(extractLocale('/es/otus/1', multi)).toEqual({
      locale: 'es',
      path: '/otus/1'
    })
    expect(extractLocale('/es', multi)).toEqual({ locale: 'es', path: '/' })
  })

  it('keeps unprefixed default-locale URLs working', () => {
    expect(extractLocale('/about', multi)).toEqual({
      locale: 'en',
      path: '/about'
    })
    expect(extractLocale('/en/about', multi)).toEqual({
      locale: 'en',
      path: '/en/about'
    })
  })

  it('does not match a locale that is only a prefix of the segment', () => {
    expect(extractLocale('/espanol', multi).locale).toBe('en')
  })

  it('resolves the same locale with or without a query and hash', () => {
    expect(extractLocale('/es?x=1#top', multi)).toEqual({
      locale: 'es',
      path: '/?x=1#top'
    })
    expect(extractLocale('/es/a?x=1', multi)).toEqual({
      locale: 'es',
      path: '/a?x=1'
    })
  })

  it('prefixes the default locale when configured', () => {
    expect(prefixedLocales(prefixAll)).toEqual(['en', 'es'])
    expect(extractLocale('/en/about', prefixAll)).toEqual({
      locale: 'en',
      path: '/about'
    })
  })
})

describe('localeFromLocation', () => {
  it('reads the path, minus base_url, in history mode', () => {
    const config = {
      ...multi,
      base_url: '/site/'
    }

    expect(
      localeFromLocation({ pathname: '/site/es/about', hash: '' }, config)
    ).toBe('es')
    expect(
      localeFromLocation({ pathname: '/site/about', hash: '' }, config)
    ).toBe('en')
  })

  it('reads the fragment in hash mode', () => {
    expect(
      localeFromLocation({ pathname: '/site/', hash: '#/es/about' }, hash)
    ).toBe('es')
    expect(localeFromLocation({ pathname: '/site/', hash: '' }, hash)).toBe(
      'en'
    )
  })
})

describe('localeBase and localePath', () => {
  it('builds the router base for each locale', () => {
    expect(localeBase('en', multi)).toBe('/')
    expect(localeBase('es', { ...multi, base_url: '/site' })).toBe('/site/es/')
    expect(localeBase('es', hash)).toBe('/site/')
  })

  it('builds cross-locale links in history mode', () => {
    expect(localePath('/about', 'es', multi)).toBe('/es/about')
    expect(localePath('/about', 'en', multi)).toBe('/about')
  })

  it('puts the locale inside the fragment in hash mode', () => {
    expect(localePath('/about', 'es', hash)).toBe('/site/#/es/about')
    expect(localePath('/about', 'en', hash)).toBe('/site/#/about')
  })

  // Feeding a hash-mode route.path back into localePath must not double the locale.
  it('round-trips a hash-mode route path through stripLocale', () => {
    expect(localePath(stripLocale('/es/about', hash), 'en', hash)).toBe(
      '/site/#/about'
    )
    expect(stripLocale('/es/about', multi)).toBe('/es/about')
  })

  it('prefixes plain config paths only in hash mode', () => {
    expect(localeRoutePath('/news', 'es', hash)).toBe('/es/news')
    expect(localeRoutePath('/', 'es', hash)).toBe('/es')
    expect(localeRoutePath('/news', 'en', hash)).toBe('/news')
    expect(localeRoutePath('/news', 'es', multi)).toBe('/news')
  })
})
