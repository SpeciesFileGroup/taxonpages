// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { loadRouter } from '../../helpers/app.js'

// Stands in for pages/about.md and pages/home.md
vi.mock('vue-router/auto-routes', () => ({
  routes: [
    { path: '/about', name: '/about', component: {} },
    { path: '/', name: '/home', alias: '/home', component: {} }
  ]
}))

const locales = { i18n: { default_locale: 'en', locales: ['en', 'es'] } }

describe('route table', () => {
  it('stays flat outside hash mode: the locale lives in the history base', async () => {
    const { routes } = await loadRouter(locales)

    expect(routes.map((r) => r.path)).toContain('/about')
    expect(routes.some((r) => r.path.includes(':locale'))).toBe(false)
  })

  it('stays flat in hash mode with a single locale', async () => {
    const { routes } = await loadRouter({ hash_mode: true })

    expect(routes.some((r) => r.path.includes(':locale'))).toBe(false)
  })

  it('nests every route under an optional locale segment in multi-locale hash mode', async () => {
    const { routes } = await loadRouter({ ...locales, hash_mode: true })

    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('/:locale(es)?')
    // Children must be relative, or they would ignore the locale parent
    expect(routes[0].children.every((r) => !r.path.startsWith('/'))).toBe(true)
    expect(routes[0].children.find((r) => r.name === '/home').alias).toBe('home')
  })
})

describe('createRouter', () => {
  it('uses the locale prefix as history base, so links stay in the locale', async () => {
    const { createRouter } = await loadRouter({ ...locales, base_url: '/site/' }, '/site/es/about')
    const router = createRouter({ locale: 'es' })

    expect(router.resolve('/about').href).toBe('/site/es/about')
    expect(createRouter({ locale: 'en' }).resolve('/about').href).toBe('/site/about')
  })

  it('matches locale-prefixed and unprefixed paths to the same route in hash mode', async () => {
    const { createRouter } = await loadRouter({ ...locales, hash_mode: true }, '/#/')
    const router = createRouter({ locale: 'es' })

    expect(router.resolve('/es/about')).toMatchObject({ name: '/about', params: { locale: 'es' } })
    expect(router.resolve('/about').name).toBe('/about')
    expect(router.resolve('/about').params.locale).toBeUndefined()
    expect(router.resolve('/es/otus/5')).toMatchObject({ params: { locale: 'es', id: '5' } })
    expect(router.resolve('/es/home').name).toBe('/home')
  })

  // The locale param is restricted to configured locales so it cannot swallow
  // an ordinary first segment.
  it('does not read an unconfigured first segment as a locale', async () => {
    const { createRouter } = await loadRouter({ ...locales, hash_mode: true }, '/#/')
    const route = createRouter().resolve('/fr/about')

    expect(route.params.locale).toBeUndefined()
    expect(route.name).toBe('httpError404')
  })
})
