import { createApp } from './main'
import { registerOnlyClientComponents } from '@/components/clientComponents'
import { registerGlobalComponents } from './components/globalComponents'

const { app, router, store } = createApp()
const storeInitialState = window.initialState

if (storeInitialState) {
  store.state.value = storeInitialState
}

registerOnlyClientComponents(app)
registerGlobalComponents(app)

router.isReady().then(() => {
  app.mount('#app')
})
