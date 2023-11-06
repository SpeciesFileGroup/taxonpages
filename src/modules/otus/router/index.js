import OtuIndex from '@/modules/otus/views/Index.vue'
import PageLayout from '@/modules/otus/views/PageLayout.vue'
import layouts from '../constants/layouts'

function makeChildrenRoutes() {
  const tabKeys = Object.keys(layouts || {})

  return tabKeys.map((tab) => ({
    path: tab,
    name: `otus-id-${tab}`,
    component: PageLayout,
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
    component: OtuIndex,
    redirect: {
      name: 'otus-id-overview'
    },
    children: makeChildrenRoutes()
  }
]
