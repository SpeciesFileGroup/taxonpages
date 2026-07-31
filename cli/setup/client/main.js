import { createApp } from 'vue'
import App from './App.vue'
import SwModal from './components/SwModal.vue'
import PanelConfigEditor from './components/PanelConfigEditor.vue'
import './styles.css'

const app = createApp(App)

app.component('SwModal', SwModal)
app.component('SwPanelConfigEditor', PanelConfigEditor)

app.mount('#app')
