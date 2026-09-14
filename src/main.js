import.meta.glob('@/assets/css/main.css', { eager: true })
import.meta.glob('~/config/style/*.{scss,css}', { eager: true })

import App from './App.vue'
import SetupApp from '@/modules/setup/views/Index.vue'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { createRouter } from './router'
import { createI18n } from './i18n'
import { vueSetupHooks } from 'virtual:taxonpages-plugins'

export function createApp({ originUrl, locale } = {}) {
  const { url, project_token } = __APP_ENV__
  const isAPIConfigurationSet = url && project_token
  const app = createSSRApp(isAPIConfigurationSet ? App : SetupApp)
  const router = createRouter({ locale })
  const store = createPinia()
  const i18n = createI18n({ locale })

  app.use(router)
  app.use(store)
  app.use(i18n)

  // Apply vue setup hooks from discovered plugins. i18n is installed first so
  // plugins can translate their own strings.
  for (const setup of vueSetupHooks) {
    setup(app, { router, store, i18n })
  }

  return { app, router, store, i18n }
}
