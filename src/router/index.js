import { 
  createRouter, 
  createWebHistory,
  createWebHashHistory
} from 'vue-router'

import otusRoutes from '@/modules/otus/router'
import dynamicRoutes from '~pages'
import routerConfiguration from '../../config/router.yml'

const { base_url, hash_mode } = routerConfiguration

const router = createRouter({
  history: hash_mode
    ? createWebHashHistory(base_url)
    : createWebHistory(base_url),

  routes: [
    ...dynamicRoutes,
    ...otusRoutes,
  ]
})

export default router