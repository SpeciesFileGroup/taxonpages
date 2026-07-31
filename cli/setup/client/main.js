import { createApp } from 'vue'
import App from './App.vue'
import SwModal from './components/SwModal.vue'
import PanelConfigEditor from './components/PanelConfigEditor.vue'
import TranslatableField from './components/TranslatableField.vue'
import TranslatedText from './components/TranslatedText.vue'
import './styles.css'

const app = createApp(App)

// Registered globally so a custom editor from any source — core, a local
// module, or an npm package — can use them without resolving a path into the
// wizard's own directory.
app.component('SwModal', SwModal)
app.component('SwPanelConfigEditor', PanelConfigEditor)
app.component('SwTranslatableField', TranslatableField)
app.component('SwTranslatedText', TranslatedText)

app.mount('#app')
