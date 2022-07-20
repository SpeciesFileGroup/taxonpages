import { 
  createRouter, 
  createWebHistory,
  createWebHashHistory
} from 'vue-router'

import dynamicRoutes from '~pages'

const moduleRoutes = import.meta.globEager('@/modules/**/router/*.js')
const routerObjects = [].concat(...Object.values(moduleRoutes).map(route => route.default))
const { base_url, hash_mode } = __APP_ENV__

const router = createRouter({
  history: hash_mode
    ? createWebHashHistory(base_url)
    : createWebHistory(base_url),

  routes: [
    ...dynamicRoutes,
    ...routerObjects,
  ]
})

export default router