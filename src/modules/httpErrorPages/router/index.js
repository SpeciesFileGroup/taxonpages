import internalError from '../view/500.vue'
import notFound from '../view/404.vue'

export default [
  {
    path: '/500',
    name: 'httpError500',
    component: internalError
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'httpError400',
    component: notFound
  }
]
