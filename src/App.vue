<template>
  <ApplicationLayout>
    <router-view />
  </ApplicationLayout>
</template>

<script setup>
import { useHead } from 'unhead'
import ApplicationLayout from '@/layout/Application.vue'

useHead({
  title: __APP_ENV__.project_name,
  meta: __APP_ENV__.metadata
})
</script>
