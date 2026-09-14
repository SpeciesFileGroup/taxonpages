import { useRouter, useRoute } from 'vue-router'
import { watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { humanize } from '@/utils/strings'
import { localize } from '@/i18n/localize'

export function useChildrenRoutes() {
  const router = useRouter()
  const route = useRoute()
  const { locale } = useI18n()
  const data = ref()

  watch(
    [route, locale],
    () => {
      data.value = makeRoutes()
    },
    { immediate: true }
  )

  function makeRoutes() {
    const { children } = router
      .getRoutes()
      .find((route) => route.name === 'otus-id')

    return children.map(({ path, name, meta }) => ({
      // meta.label comes from taxa_page.yml, so it may carry a translation.
      // Resolved here rather than where the route is built: that runs at import
      // time, with no locale to resolve against.
      label:
        path && (localize(meta.label, locale.value, __APP_ENV__) || humanize(path)),
      path,
      name,
      meta
    }))
  }

  return data
}
