import { 
  createRouter, 
  createWebHistory,
  createWebHashHistory
} from 'vue-router'

import otusRoutes from '@/modules/otus/router'
import dynamicRoutes from '~pages'

const { base_url, hash_mode } = __APP_ENV__

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