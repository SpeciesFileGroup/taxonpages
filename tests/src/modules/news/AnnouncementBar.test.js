// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ClientOnly from '@/components/Ssr/ClientOnly.global.vue'
import { getAnnouncementKey } from '@/modules/news/composables/useDismissedAnnouncements.js'

const STORAGE_KEY = 'taxonpages:dismissed-announcements'

const config = {
  i18n: {
    default_locale: 'en',
    locales: ['en', 'es']
  },
  news_module: {
    announcements: [
      {
        message: {
          en: 'Maintenance tonight',
          es: 'Mantenimiento esta noche'
        }
      },
      {
        id: 'release',
        message: 'New release',
        url: 'https://x.org'
      }
    ]
  }
}

async function mountBar({ locale = 'en' } = {}) {
  vi.stubGlobal('__APP_ENV__', config)
  vi.resetModules()

  const { default: AnnouncementBar } =
    await import('@/modules/news/components/AnnouncementBar.vue')
  const i18n = createI18n({
    legacy: false,
    locale,
    messages: { en: {}, es: {} },
    missingWarn: false,
    fallbackWarn: false
  })
  const wrapper = mount(AnnouncementBar, {
    global: {
      plugins: [i18n],
      components: { ClientOnly },
      stubs: { IconClose: true }
    }
  })

  await wrapper.vm.$nextTick()
  return wrapper
}

const maintenanceKey = () =>
  getAnnouncementKey(config.news_module.announcements[0])

beforeEach(() => {
  localStorage.clear()
})

describe('AnnouncementBar', () => {
  it('shows the first announcement in the active locale', async () => {
    const wrapper = await mountBar({ locale: 'es' })

    expect(wrapper.text()).toContain('Mantenimiento esta noche')
    expect(wrapper.text()).toContain('1/2')
  })

  it('hides a dismissed announcement and remembers it across page loads', async () => {
    const wrapper = await mountBar()

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).not.toContain('Maintenance tonight')
    expect(wrapper.text()).toContain('New release')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([
      maintenanceKey()
    ])

    const reloaded = await mountBar()
    expect(reloaded.text()).not.toContain('Maintenance tonight')
  })

  it('keeps a dismissal when the reader switches language', async () => {
    const wrapper = await mountBar({ locale: 'en' })
    await wrapper.find('button').trigger('click')

    const other = await mountBar({ locale: 'es' })

    expect(other.text()).not.toContain('Mantenimiento esta noche')
  })

  it('forgets dismissals for announcements no longer configured', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(['release', 'removed-long-ago'])
    )

    await mountBar()

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(['release'])
  })

  it('renders nothing once every announcement is dismissed', async () => {
    const wrapper = await mountBar()

    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')

    expect(wrapper.find('a, span').exists()).toBe(false)
  })
})
