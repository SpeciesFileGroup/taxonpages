import { useRouter, useRoute } from 'vue-router'
import { watch, ref } from 'vue'
import { humanize } from '@/utils/strings'

export function useChildrenRoutes() {
  const router = useRouter()
  const route = useRoute()
  const data = ref()

  watch(
    route,
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
      label: path && (meta.label || humanize(path)),
      path,
      name,
      meta
    }))
  }

  return data
}
