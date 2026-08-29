export default [
  {
    name: 'keys-index',
    path: '/keys',
    component: () => import('../KeysIndex.vue')
  },
  {
    name: 'dichotomous-key',
    path: '/key/:id/:couplet?',
    component: () => import('../KeyView.vue')
  }
]
