import internalError from '../view/500.vue'
import notFound from '../view/404.vue'

export default [
  {
    path: '/500',
    name: 'httpError500',
    component: internalError,
    meta: {
      statusCode: 500
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'httpError404',
    component: notFound,
    meta: {
      statusCode: 404
    }
  }
]
