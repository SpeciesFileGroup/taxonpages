import { describe, it, expect, vi } from 'vitest'
import { join } from 'node:path'
import {
  findTranslations,
  warnOrphanTranslations,
  pageVirtualId,
  pageTranslationsPlugin,
  translatedPagePatterns
} from '@/plugins/vite/pageTranslations.js'
import { createProject } from '../../../helpers/project.js'

describe('findTranslations', () => {
  it('finds variants by base name, across extensions', () => {
    const root = createProject({
      'pages/about.md': '',
      'pages/about.es.md': '',
      'pages/home.vue': '',
      'pages/home.pt.md': ''
    })

    expect(findTranslations(join(root, 'pages/about.md'), ['es', 'pt'])).toEqual({
      es: join(root, 'pages/about.es.md')
    })
    expect(findTranslations(join(root, 'pages/home.vue'), ['es', 'pt'])).toEqual({
      pt: join(root, 'pages/home.pt.md')
    })
  })

  it('prefers the page own extension when a locale has two variants', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const root = createProject({ 'pages/a.md': '', 'pages/a.es.md': '', 'pages/a.es.vue': '' })

    expect(findTranslations(join(root, 'pages/a.md'), ['es']).es).toBe(join(root, 'pages/a.es.md'))
    expect(console.warn).toHaveBeenCalled()
  })
})

describe('warnOrphanTranslations', () => {
  it('warns only about translations whose base page is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const root = createProject({
      'pages/about.md': '',
      'pages/about.es.md': '',
      'pages/nested/abuot.es.md': ''
    })

    warnOrphanTranslations(join(root, 'pages'), ['es'])

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('nested/abuot.es.md')
  })
})

describe('translatedPagePatterns', () => {
  it('emits one pattern per locale', () => {
    expect(translatedPagePatterns(['es'])).toEqual(['**/*.es.{vue,md}'])
  })
})

describe('page wrapper virtual module', () => {
  it('generates a wrapper importing the default page and each translation', () => {
    const plugin = pageTranslationsPlugin()
    const id = pageVirtualId('/p/about.md', { es: '/p/about.es.md' })
    const code = plugin.load(plugin.resolveId(id))

    expect(code).toContain("import __default from '/p/about.md'")
    expect(code).toContain("import __t0 from '/p/about.es.md'")
    expect(code).toContain("'es': __t0")
  })

  it('normalizes Windows paths in the generated imports', () => {
    const plugin = pageTranslationsPlugin()
    const id = pageVirtualId('C:\\site\\pages\\a.md', { es: 'C:\\site\\pages\\a.es.md' })

    expect(plugin.load(plugin.resolveId(id))).toContain("from 'C:/site/pages/a.es.md'")
  })

  // The id becomes the chunk file name in a build: absolute paths in it broke
  // the build of any site in a moderately deep directory (ENAMETOOLONG).
  it('keeps the id short and path-free however deep the site is', () => {
    const page = `/home/ana/${'very-long-directory-name/'.repeat(10)}pages/about.md`
    const id = pageVirtualId(page, {
      es: page.replace('.md', '.es.md'),
      pt: page.replace('.md', '.pt.md')
    })

    expect(id).toMatch(/^virtual:taxonpages-page\/[0-9a-f]{12}\/about$/)
  })

  it('gives the same id to the same page and a new one when translations change', () => {
    const a = pageVirtualId('/p/about.md', { es: '/p/about.es.md' })

    expect(pageVirtualId('/p/about.md', { es: '/p/about.es.md' })).toBe(a)
    expect(pageVirtualId('/p/about.md', { es: '/p/about.es.md', pt: '/p/about.pt.md' })).not.toBe(a)
    expect(pageVirtualId('/q/about.md', { es: '/q/about.es.md' })).not.toBe(a)
  })

  it('fails with a clear message for an id it never issued', () => {
    const plugin = pageTranslationsPlugin()

    expect(() => plugin.load('\0virtual:taxonpages-page/000000000000/nope')).toThrow(/Unknown translated page/)
  })
})
