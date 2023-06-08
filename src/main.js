import.meta.glob('@/assets/css/main.css', { eager: true })
import.meta.glob('../config/style/*.{scss,css}', { eager: true })

import App from './App.vue'
import SetupApp from '@/modules/setup/views/Index.vue'
import { schemaOrgPlugin } from '@/plugins/schemaOrg'
import { createHead } from 'unhead'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { createRouter } from './router'

export function createApp({ originUrl }) {
  const { url, project_token } = __APP_ENV__
  const isAPIConfigurationSet = url && project_token
  const app = createSSRApp(isAPIConfigurationSet ? App : SetupApp)
  const router = createRouter()
  const store = createPinia()
  const head = createHead({
    plugins: [
      schemaOrgPlugin(
        {
          host: originUrl
        },
        () => {
          const route = router.currentRoute.value
          return {
            path: route.path,
            ...route.meta
          }
        }
      )
    ]
  })

  app.use(router)
  app.use(store)

  return { app, router, store }
}
