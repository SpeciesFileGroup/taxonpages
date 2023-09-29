import { useRouter } from 'vue-router'
import { humanize } from '@/utils/strings'

export default function useChildrenRoutes() {
  const router = useRouter()
  const { children } = router
    .getRoutes()
    .find((route) => route.name === 'otus-id')

  return children.map(({ path, name, meta }) => ({
    label: path && humanize(path),
    path,
    name,
    meta
  }))
}
