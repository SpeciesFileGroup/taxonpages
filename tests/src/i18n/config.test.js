import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveI18nConfig } from '@/i18n/config.js'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('resolveI18nConfig', () => {
  it('defaults to a single English locale', () => {
    expect(resolveI18nConfig({})).toEqual({
      defaultLocale: 'en',
      locales: ['en'],
      fallbackLocale: 'en',
      prefixDefaultLocale: false,
      detect: 'suggest',
      isMultiLocale: false
    })
  })

  it('always includes the default locale, first and once', () => {
    const { locales, isMultiLocale } = resolveI18nConfig({
      i18n: { default_locale: 'es', locales: ['en', 'es', 'en', '', null] }
    })

    expect(locales).toEqual(['es', 'en'])
    expect(isMultiLocale).toBe(true)
  })

  it('falls back to the default locale for an unknown fallback, with a warning', () => {
    const { fallbackLocale } = resolveI18nConfig({
      i18n: { locales: ['en', 'es'], fallback: 'fr' }
    })

    expect(fallbackLocale).toBe('en')
    expect(console.warn).toHaveBeenCalled()
  })

  it('rejects an invalid detect value instead of throwing', () => {
    expect(resolveI18nConfig({ i18n: { detect: 'auto' } }).detect).toBe('suggest')
    expect(resolveI18nConfig({ i18n: { detect: 'off' } }).detect).toBe('off')
  })

  it('only enables prefix_default_locale when strictly true', () => {
    expect(resolveI18nConfig({ i18n: { prefix_default_locale: 'yes' } }).prefixDefaultLocale).toBe(false)
    expect(resolveI18nConfig({ i18n: { prefix_default_locale: true } }).prefixDefaultLocale).toBe(true)
  })

  it('ignores a malformed i18n block', () => {
    expect(resolveI18nConfig({ i18n: ['es'] }).locales).toEqual(['en'])
  })
})
