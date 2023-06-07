<template>
  <ApplicationLayout>
    <router-view />
  </ApplicationLayout>
</template>

<script setup>
import { useHead } from 'unhead'
import { getMetaFromConfig } from '@/utils'
import ApplicationLayout from '@/layout/Application.vue'

const meta = getMetaFromConfig(__APP_ENV__)

useHead({
  title: __APP_ENV__.project_name,
  meta
})
</script>
