<template>
  <ApplicationLayout>
    <router-view />
  </ApplicationLayout>
</template>

<script setup>
import ApplicationLayout from '@/layout/Application.vue'
import { useHead, createHead } from 'unhead'
import { getMetaFromConfig } from '@/utils'

const head = createHead()
const meta = getMetaFromConfig(__APP_ENV__)

useHead({
  title: __APP_ENV__.project_name,
  meta
})
</script>
