import layouts from '../constants/layouts'

const tabKeys = Object.keys(layouts || {})

export const defaultTabRouteName = tabKeys.length
  ? `otus-id-${tabKeys[0]}`
  : undefined

function makeChildrenRoutes() {
  return tabKeys.map((tab) => ({
    path: tab,
    name: `otus-id-${tab}`,
    component: () => import('@/modules/otus/views/PageLayout.vue'),
    meta: {
      tab,
      rankGroup: layouts[tab].rankGroup,
      label: layouts[tab].label
    }
  }))
}

export default [
  {
    name: 'otus-id',
    path: '/otus/:id',
    component: () => import('@/modules/otus/views/Index.vue'),
    ...(defaultTabRouteName && { redirect: { name: defaultTabRouteName } }),
    children: makeChildrenRoutes()
  }
]
