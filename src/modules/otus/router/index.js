import OtuIndex from '@/modules/otus/views/Index.vue'
import OtuOverview from '@/modules/otus/views/Overview.vue'
import OtuDistribution from '@/modules/otus/views/Distribution.vue'
import OtuTimeline from '@/modules/otus/views/Timeline.vue'

export default [{ 
  name: 'otus-id',
  path: '/otus/:id',
  component: OtuIndex,
  redirect: { 
    name: 'otus-id-overview' 
  },
  children: [
    {
      path: 'overview',
      name: 'otus-id-overview',
      component: OtuOverview,
    },
/*     {
      path: 'timeline',
      name: 'otus-id-timeline',
      component: OtuTimeline
    },
    {
      path: 'descendants',
      name: 'otus-id-descendants',
      component: OtuDistribution
    },
    {
      path: 'images',
      name: 'otus-id-images',
      component: OtuDistribution
    },
    {
      path: 'type_specimens',
      name: 'otus-id-type_specimens',
      component: OtuDistribution
    },
    {
      path: 'specimen_records',
      name: 'otus-id-specimen_records',
      component: OtuDistribution
    },
    {
      path: 'content',
      name: 'otus-id-content',
      component: OtuDistribution
    },
    {
      path: 'annotations',
      name: 'otus-id-annotations',
      component: OtuDistribution
    },
    {
      path: 'distribution',
      name: 'otus-id-distribution',
      component: OtuDistribution
    }, */
  ]
}]
