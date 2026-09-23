// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SwitchLocale from '@/components/SwitchLocale.vue'
import { loadRouter } from '../../helpers/app.js'

vi.mock('vue-router/auto-routes', () => ({
  routes: [
    { path: '/about', name: '/about', component: {} },
    { path: '/', name: '/home', component: {} }
  ]
}))

const locales = { i18n: { default_locale: 'en', locales: ['en', 'es'] } }

let wrapper

afterEach(() => wrapper?.unmount())

/** Mount the switcher in an app at `url`, as the browser entry would. */
async function mountAt(config, url, locale) {
  const { createRouter } = await loadRouter(config, url)
  const router = createRouter({ locale })
  const i18n = createI18n({ legacy: false, locale, messages: { en: {}, es: {} }, missingWarn: false })

  // SwitchLocale reads __APP_ENV__ through useLocaleOptions at setup time,
  // after loadRouter has stubbed it.
  wrapper = mount(SwitchLocale, {
    attachTo: document.body,
    global: { plugins: [router, i18n], stubs: { IconLanguage: true } }
  })
  await router.isReady()

  return { wrapper, router }
}

async function openMenu(wrapper) {
  await wrapper.find('button').trigger('click')

  return Object.fromEntries(
    wrapper.findAll('[role="menuitem"]').map((a) => [
      a.attributes('hreflang'),
      { href: a.attributes('href'), current: a.attributes('aria-current') === 'true' }
    ])
  )
}

describe('SwitchLocale', () => {
  it('renders nothing on a single-locale site', async () => {
    const { wrapper } = await mountAt({}, '/about', 'en')

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('links to the same page, query and hash in every locale', async () => {
    const { wrapper } = await mountAt({ ...locales, base_url: '/site/' }, '/site/es/about?q=1#top', 'es')

    expect(await openMenu(wrapper)).toEqual({
      en: { href: '/site/about?q=1#top', current: false },
      es: { href: '/site/es/about?q=1#top', current: true }
    })
  })

  // The router builds these (fragment hrefs, relative to the document). The
  // locale must be swapped, never stacked: /es/es/about was a past bug.
  it('builds in-fragment links in hash mode without doubling the locale', async () => {
    const { wrapper } = await mountAt({ ...locales, hash_mode: true }, '/#/es/about?q=1', 'es')

    expect(await openMenu(wrapper)).toEqual({
      en: { href: '#/about?q=1', current: false },
      es: { href: '#/es/about?q=1', current: true }
    })
  })

  it('opens from the keyboard, focuses the first language, and closes on Escape', async () => {
    const { wrapper } = await mountAt(locales, '/about', 'en')
    const button = wrapper.find('button')

    await button.trigger('keydown', { key: 'ArrowDown' })
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('hreflang')).toBe('en'))
    expect(button.attributes('aria-expanded')).toBe('true')

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes when clicking elsewhere on the page', async () => {
    const { wrapper } = await mountAt(locales, '/about', 'en')
    await openMenu(wrapper)

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  // Under hash mode switching language is an in-app navigation: no page load
  // comes along to dismiss the menu.
  it('closes after an in-app navigation in hash mode', async () => {
    const { wrapper, router } = await mountAt({ ...locales, hash_mode: true }, '/#/about', 'en')
    await openMenu(wrapper)

    await router.push('/es/about')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
