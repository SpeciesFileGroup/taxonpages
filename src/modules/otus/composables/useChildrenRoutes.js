import { useRouter } from 'vue-router'
import { humanize, uncapitalize } from '@/utils/strings'

export default function useChildrenRoutes() {
  const router = useRouter()
  const { children } = router
    .getRoutes()
    .find((route) => route.name === 'otus-id')

  const makeLabel = (path, isUncapitalize) => {
    const label = humanize(path)

    return isUncapitalize ? uncapitalize(label) : label
  }

  return children.map(({ path, name, meta }) => ({
    label: path && makeLabel(path, meta.uncapitalize),
    path,
    name,
    meta
  }))
}
