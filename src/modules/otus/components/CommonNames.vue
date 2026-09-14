<template>
  <span>
    <template
      v-for="(item, index) in commonNames"
      :key="`${item.name}-${index}`"
    >
      <span v-if="index">; </span>
      <span :title="item.language || undefined">{{ item.name }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOtuStore } from '../store/store'
import { matchesLocale } from '@/i18n/languageTags'

const store = useOtuStore()
const { locale } = useI18n()

const commonNames = computed(() => {
  const names = store.taxonomy.commonNames ?? []

  return [...names].sort(
    (a, b) =>
      Number(matchesLocale(b.language, locale.value)) -
      Number(matchesLocale(a.language, locale.value))
  )
})
</script>
