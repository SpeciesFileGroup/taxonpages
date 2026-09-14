<template>
  <div class="tp-footer-citation pt-4 pb-2 break-words">
    {{ project_authors }}
    <ClientOnly>
      <span v-html="store.nextAuthor" />
    </ClientOnly>
    {{ project_citation }}.
    <ClientOnly>
      <span>{{
        $t('component.footer.retrieved_on', { date: currentDate })
      }}</span>
    </ClientOnly>
    <span v-if="currentUrl">
      {{ ' ' + $t('component.footer.at') }}
      <a
        class="text-footer-link underline"
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
import { useI18n } from 'vue-i18n'
import { localePath, stripLocale } from '@/i18n/locale'
import { useFooterStore } from '@/store'
const { project_authors, project_citation, project_url } = __APP_ENV__

const store = useFooterStore()
const currentDate = new Date().toISOString().split('T')[0]
const route = useRoute()
const { locale } = useI18n()

const currentUrl = computed(() => {
  const projectUrl = (project_url || '').replace(/\/$/, '')

  if (!projectUrl.length) {
    return ''
  }

  return (
    projectUrl +
    localePath(
      stripLocale(route.fullPath, __APP_ENV__),
      locale.value,
      __APP_ENV__
    )
  )
})
</script>
