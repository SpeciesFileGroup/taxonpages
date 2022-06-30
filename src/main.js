import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index.js'
import globalComponents from '@/components/globalComponents'
import '@/assets/css/main.scss'

console.log(globalComponents)
const app = createApp(App)

app.use(router)
globalComponents.register(app)
/* app.component("VCard", Card)
app.component("CardContent", CardContent)
app.component("CardHeader", CardHeader)
app.component("VSpinner", VSpinner) */
app.mount('#app')
