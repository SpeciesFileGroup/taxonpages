import { createApp } from 'vue'
import App from './App.vue'
import SetupApp from './modules/setup/views/Index.vue'
import router from '@/router/index.js'
import globalComponents from '@/components/globalComponents'
import.meta.globEager('@/assets/css/main.css')
import.meta.globEager('../config/style/*.{scss,css}')

const isAPIConfigurationSet = __APP_ENV__.url && __APP_ENV__.project_token
let app

if (isAPIConfigurationSet) {
  app = createApp(App)
  app.use(router)
  globalComponents.register(app)
} else {
  app = createApp(SetupApp)
}

app.mount('#app')