import {
  createRouter as _createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory
} from 'vue-router'

import dynamicRoutes from '~pages'

const coreModuleRoutes = import.meta.glob('@/modules/**/router/*.js', {
  import: 'default',
  eager: true
})
const userModuleRoutes = import.meta.glob('#/modules/**/router/*.js', {
  import: 'default',
  eager: true
})

const { base_url, hash_mode } = __APP_ENV__

const moduleRoutes = [].concat(
  ...Object.values(coreModuleRoutes),
  ...Object.values(userModuleRoutes)
)

export const routes = [...dynamicRoutes, ...moduleRoutes]

function getHistory() {
  if (import.meta.env.SSR) {
    return createMemoryHistory(base_url)
  } else if (hash_mode) {
    return createWebHashHistory(base_url)
  } else {
    return createWebHistory(base_url)
  }
}

export function createRouter() {
  return _createRouter({
    history: getHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
      return to.hash
        ? { el: to.hash }
        : { top: 0 }
    }
  })
}
