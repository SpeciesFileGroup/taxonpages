import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index.js'
import '@/assets/css/main.scss'

import Card from '@/components/Card/Card.vue'
import CardContent from '@/components/Card/CardContent.vue'
import CardHeader from '@/components/Card/CardHeader.vue'
import VSpinner from '@/components/VSpinner.vue';


const app = createApp(App)

app.use(router)
app.component("VCard", Card)
app.component("CardContent", CardContent)
app.component("CardHeader", CardHeader)
app.component("VSpinner", VSpinner)
app.mount('#app')
