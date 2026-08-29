export default [
  {
    name: 'dichotomous-key',
    path: '/key/:id/:couplet?',
    component: () => import('../KeyView.vue')
  }
]
