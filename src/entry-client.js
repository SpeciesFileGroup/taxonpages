import { createApp } from './main'
import { registerOnlyClientComponents } from '@/components/clientComponents'
import { registerGlobalComponents } from './components/globalComponents'
import { createHead } from '@unhead/vue/client'
import { schemaOrgPlugin } from '@/plugins/schemaOrg'
import { extractLocale } from '@/i18n/locale.js'
import { stripBase } from '@/utils/url'

const originUrl = window.location.origin
const storeInitialState = window.initialState

// The locale comes from the URL, resolved with the same function the server
// used. Deriving it rather than negotiating it again is what guarantees the
// client renders the same locale the server did.
const { locale } = extractLocale(
  stripBase(window.location.pathname, __APP_ENV__.base_url),
  __APP_ENV__
)

const { app, router, store } = createApp({ originUrl, locale })

const head = createHead({
  plugins: [
    schemaOrgPlugin(
      {
        host: originUrl
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
