import.meta.glob('@/assets/css/main.css', { eager: true })
import.meta.glob('../config/style/*.{scss,css}', { eager: true })

import App from './App.vue'
import SetupApp from './modules/setup/views/Index.vue'
import { SchemaOrgUnheadPlugin } from '@unhead/schema-org'
import { createHead } from 'unhead'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { createRouter } from './router'

export function createApp() {
  const { url, project_token, schema_host } = __APP_ENV__
  const isAPIConfigurationSet = url && project_token
  const app = createSSRApp(isAPIConfigurationSet ? App : SetupApp)
  const router = createRouter()
  const store = createPinia()
  const head = createHead({
    plugins: [
      SchemaOrgUnheadPlugin({ host: schema_host }, () => {
        const { meta, path } = router.currentRoute.value

        return {
          ...meta,
          path
        }
      })
    ]
  })

  app.use(router)
  app.use(store)

  return { app, router, store }
}
