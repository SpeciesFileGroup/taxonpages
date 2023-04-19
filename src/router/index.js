import {
  createRouter as _createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory
} from 'vue-router'

import dynamicRoutes from '~pages'

const coreModuleRoutes = import.meta.globEager('@/modules/**/router/*.js', {
  import: 'default'
})
const userModuleRoutes = import.meta.globEager('#/modules/**/router/*.js', {
  import: 'default'
})
const moduleRoutes = [].concat(
  ...Object.values(coreModuleRoutes),
  ...Object.values(userModuleRoutes)
)
const { base_url, hash_mode } = __APP_ENV__

export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory('/test/')
      : false //hash_mode
      ? createWebHashHistory(base_url)
      : createWebHistory(base_url),

    routes: [...dynamicRoutes, ...moduleRoutes]
  })
}
