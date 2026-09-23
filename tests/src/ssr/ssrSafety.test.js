import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createI18n } from 'vue-i18n'
import ClientOnly from '@/components/Ssr/ClientOnly.global.vue'

// Runs in the node environment: no window, document or storage, as on the
// SSR server. Anything touching them at import or render time throws here.

describe('SSR safety', () => {
  // Global components are registered on the server app, so every one of them
  // is imported by entry-server.js.
  const globalComponents = import.meta.glob('@/**/*.global.vue')

  it.each(Object.keys(globalComponents))('imports %s without browser globals', async (path) => {
    const mod = await globalComponents[path]()

    expect(mod.default).toBeTruthy()
  })

  it('imports the modules shared by the server and the browser', async () => {
    await expect(import('@/i18n/locale.js')).resolves.toBeTruthy()
    await expect(import('@/i18n/localize.js')).resolves.toBeTruthy()
    await expect(import('@/modules/news/composables/useDismissedAnnouncements.js')).resolves.toBeTruthy()
  })

  it('renders the image viewer, which listens to the document only on the client', async () => {
    const { default: ImageViewer } = await import('@/components/ImageViewer/ImageViewer.global.vue')
    const app = createSSRApp({
      render: () => h(ImageViewer, { index: 0, images: [{ original: '/a.jpg', depictions: [] }] })
    })
    app.config.globalProperties.$t = (key) => key
    app.config.warnHandler = () => {}

    await expect(renderToString(app)).resolves.toContain('/a.jpg')
  })

  it('renders a component that reads localStorage only on the client', async () => {
    vi.stubGlobal('__APP_ENV__', {
      news_module: { announcements: [{ id: 'a', message: 'Hello' }] }
    })
    vi.resetModules()
    const { default: AnnouncementBar } = await import('@/modules/news/components/AnnouncementBar.vue')

    const app = createSSRApp({ render: () => h(AnnouncementBar) })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missingWarn: false }))
    app.component('ClientOnly', ClientOnly)

    // ClientOnly renders its placeholder on the server; the announcement
    // appears after hydration.
    expect(await renderToString(app)).toBe('<div></div>')
  })
})
