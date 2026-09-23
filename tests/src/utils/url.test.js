import { describe, it, expect } from 'vitest'
import {
  stripBase,
  isExternalLink,
  resolveAssetUrl,
  sanitizeAndLinkifyHtml
} from '@/utils/url.js'

describe('stripBase', () => {
  it.each([
    ['/site/about', '/site/', '/about'],
    ['/site/about', '/site', '/about'],
    ['/site', '/site/', '/'],
    ['/sitemap', '/site/', '/sitemap'],
    ['/about', '/', '/about'],
    ['/about', undefined, '/about']
  ])('stripBase(%s, %s) → %s', (url, base, expected) => {
    expect(stripBase(url, base)).toBe(expected)
  })
})

describe('isExternalLink', () => {
  it('detects schemes and protocol-relative URLs', () => {
    expect(isExternalLink('https://x.org')).toBe(true)
    expect(isExternalLink('mailto:a@b.c')).toBe(true)
    expect(isExternalLink('//cdn.x.org/a.js')).toBe(true)
    expect(isExternalLink('/about')).toBe(false)
    expect(isExternalLink(undefined)).toBe(false)
  })
})

describe('resolveAssetUrl', () => {
  it('prefixes relative paths with the base and leaves absolute URLs alone', () => {
    expect(resolveAssetUrl('/logo.png', '/site/')).toBe('/site/logo.png')
    expect(resolveAssetUrl('/logo.png')).toBe('/logo.png')
    expect(resolveAssetUrl('https://x.org/logo.png', '/site/')).toBe('https://x.org/logo.png')
    expect(resolveAssetUrl('')).toBe('')
  })
})

// Output is rendered with v-html.
describe('sanitizeAndLinkifyHtml', () => {
  it('keeps formatting tags and strips their attributes', () => {
    expect(sanitizeAndLinkifyHtml('<i onclick="x()">Aus</i> <b>bus</b>')).toBe('<i>Aus</i> <b>bus</b>')
  })

  it('removes script, links, images and other tags', () => {
    const html = sanitizeAndLinkifyHtml(
      '<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:x">y</a>'
    )

    expect(html).not.toMatch(/<script|<img|<a href="javascript/)
  })

  it('links bare http(s) URLs without swallowing trailing punctuation', () => {
    expect(sanitizeAndLinkifyHtml('See https://x.org/a?b=1&c=2.')).toBe(
      'See <a href="https://x.org/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer" class="text-secondary">https://x.org/a?b=1&c=2</a>.'
    )
  })
})
