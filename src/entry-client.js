import { createApp } from './main'
import { registerOnlyClientComponents } from '@/components/clientComponents'
import { registerGlobalComponents } from './components/globalComponents'
import { createHead } from '@unhead/vue/client'
import { schemaOrgPlugin } from '@/plugins/schemaOrg'
import { localeFromLocation } from '@/i18n/locale.js'

const originUrl = window.location.origin
const storeInitialState = window.initialState

// The locale comes from the URL, by the same rules the server applies (both
// land in extractLocale). Deriving it rather than negotiating it again is what
// guarantees the client renders the same locale the server did.
const locale = localeFromLocation(window.location, __APP_ENV__)

const { app, router, store, i18n } = createApp({ originUrl, locale })

const head = createHead({
  plugins: [
    schemaOrgPlugin(
      {
        host: originUrl,
        getLocale: () => i18n.global.locale.value
      },
      () => {
        const route = router.currentRoute.value
        return {
          path: route.path,
          ...route.meta
        }
      }
    )
  ]
})

app.use(head)

if (storeInitialState) {
  store.state.value = storeInitialState
}

registerOnlyClientComponents(app)
registerGlobalComponents(app)

router.isReady().then(() => {
  app.mount('#app')
})
