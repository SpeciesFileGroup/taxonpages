<template>
  <ApplicationLayout>
    <router-view />
  </ApplicationLayout>
</template>

<script setup>
import ApplicationLayout from '@/layout/Application.vue'
import { useHead } from 'unhead'
import { getMetaFromConfig } from '@/utils'
import { useRouter } from 'vue-router'
const meta = getMetaFromConfig(__APP_ENV__)

useHead({
  title: __APP_ENV__.project_name,
  meta
})
</script>
