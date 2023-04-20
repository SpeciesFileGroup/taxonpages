/* import { createApp } from 'vue'
import App from './App.vue'
import SetupApp from './modules/setup/views/Index.vue'
import router from '@/router/index.js'
import globalComponents from '@/components/globalComponents'
import.meta.globEager('@/assets/css/main.css')
import.meta.globEager('../config/style/*.{scss,css}')

function initTaxonPagesApp() {
  const isAPIConfigurationSet = __APP_ENV__.url && __APP_ENV__.project_token
  const app = createApp(isAPIConfigurationSet ? App : SetupApp)

  if (isAPIConfigurationSet) {
    app.use(router)
    globalComponents.register(app)
  }

  return app
}

const app = initTaxonPagesApp()

app.mount('#app')
 */

import.meta.glob('@/assets/css/main.css', { eager: true })
import.meta.glob('../config/style/*.{scss,css}', { eager: true })

import App from './App.vue'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import { createRouter } from './router'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter()
  const store = createPinia()

  app.use(router)
  app.use(store)

  return { app, router, store }
}
