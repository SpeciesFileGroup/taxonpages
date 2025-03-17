<template>
  <div class="tp-footer-citation pt-4 pb-2 break-words">
    {{ project_authors }}
    <ClientOnly>
      <span v-html="store.nextAuthor" />
    </ClientOnly>
    {{ project_citation }}.
    <ClientOnly>
      <span>Retrieved on {{ currentDate }}</span>
    </ClientOnly>
    <span v-if="currentUrl">
      at
      <a
        class="text-secondary-color"
        :href="currentUrl"
      >
        {{ currentUrl }}
      </a>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFooterStore } from '@/store'
const { project_authors, project_citation, project_url, hash_mode } =
  __APP_ENV__

const store = useFooterStore()
const currentDate = new Date().toISOString().split('T')[0]
const route = useRoute()

const currentUrl = computed(() => {
  const projectUrl = (project_url || '').replace(/\/$/, '')

  if (!projectUrl.length) {
    return ''
  }

  return hash_mode
    ? projectUrl + '/#' + route.fullPath
    : projectUrl + route.fullPath
})
</script>
