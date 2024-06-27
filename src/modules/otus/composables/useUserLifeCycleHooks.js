import { useRoute, useRouter } from 'vue-router'

const otuConfig = Object.values(
  import.meta.glob('/pages/otus.config.js', {
    eager: true,
    import: 'default'
  })
)[0]

export function useUserLifeCycles({ taxon, otu }) {
  const route = useRoute()
  const router = useRouter()
  const parameters = {
    router,
    route,
    taxon,
    otu
  }

  return {
    onCreatePage: () => otuConfig?.onCreatePage(parameters),
    onSSRCreatePage: () => otuConfig?.onSSRCreatePage(parameters)
  }
}
