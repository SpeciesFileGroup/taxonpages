import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index.js'
import globalComponents from '@/components/globalComponents'
import.meta.globEager('@/assets/css/main.css')
import.meta.globEager('../config/style/*.{scss,css}')

const app = createApp(App)

globalComponents.register(app)
app.use(router)
app.mount('#app')
