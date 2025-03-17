<template>
  <component :is="currentLayout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from 'unhead'
import { loadUserLayouts } from './utils'
import ApplicationLayout from '@/layout/Application.vue'

const DEFAULT_LAYOUT = 'default'
const route = useRoute()
const userLayouts = loadUserLayouts()

const currentLayout = computed(() => {
  const layouts = {
    [DEFAULT_LAYOUT]: ApplicationLayout,
    ...userLayouts
  }

  return layouts[route.meta?.layout || DEFAULT_LAYOUT] || ApplicationLayout
})

useHead({
  title: __APP_ENV__.project_name,
  meta: __APP_ENV__.metadata
})
</script>
