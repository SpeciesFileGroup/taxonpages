export default [
  {
    path: '/500',
    name: 'httpError500',
    component: () => import('../view/500.vue'),
    meta: {
      statusCode: 500
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'httpError404',
    component: () => import('../view/404.vue'),
    meta: {
      statusCode: 404
    }
  }
]
