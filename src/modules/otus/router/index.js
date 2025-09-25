import layouts from '../constants/layouts'

function makeChildrenRoutes() {
  const tabKeys = Object.keys(layouts || {})

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
    redirect: {
      name: 'otus-id-overview'
    },
    children: makeChildrenRoutes()
  }
]
