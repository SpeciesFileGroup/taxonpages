import {
  createRouter as _createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory
} from 'vue-router'

import dynamicRoutes from '~pages'

const coreModuleRoutes = import.meta.glob('@/modules/**/router/*.js', {
  import: 'default', eager: true
})
const userModuleRoutes = import.meta.glob('#/modules/**/router/*.js', {
  import: 'default', eager: true
})
const moduleRoutes = [].concat(
  ...Object.values(coreModuleRoutes),
  ...Object.values(userModuleRoutes)
)

const { base_url, hash_mode } = __APP_ENV__

export const routes = [...dynamicRoutes, ...moduleRoutes]


export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory('/')
      : createWebHistory(base_url),

    routes
  })
}
