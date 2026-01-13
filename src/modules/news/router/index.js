export default [
  {
    name: 'news-index',
    path: '/news',
    component: () => import('../views/index.vue')
  },
  {
    name: 'news-id',
    path: '/news/:id',
    component: () => import('../views/id.vue')
  }
]
