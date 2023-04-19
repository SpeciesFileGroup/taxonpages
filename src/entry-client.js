import { createApp } from './main'
import { registerOnlyClientComponents } from '@/components/clientComponents'
import { registerGlobalComponents } from './components/globalComponents'
const { app, router } = createApp()

router.isReady().then(() => {
  registerOnlyClientComponents(app)
  registerGlobalComponents(app)
  app.mount('#app')
})
