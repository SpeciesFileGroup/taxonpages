import { createApp } from './main'
import { registerOnlyClientComponents } from '@/components/clientComponents'
import { registerGlobalComponents } from './components/globalComponents'

const originUrl = window.location.origin
const storeInitialState = window.initialState
const { app, router, store } = createApp({ originUrl })

if (storeInitialState) {
  store.state.value = storeInitialState
}

registerOnlyClientComponents(app)
registerGlobalComponents(app)

router.isReady().then(() => {
  app.mount('#app')
})
