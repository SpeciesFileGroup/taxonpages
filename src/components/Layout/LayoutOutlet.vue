<template>
  <component
    :is="slot.component"
    v-for="(slot, index) in slots"
    :key="index"
    v-bind="{ ...context, ...localizeBind(slot.bind) }"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { localizeDeep } from '@/i18n/localize'
import { loadLayoutSlots } from '@/utils'

const props = defineProps({
  region: {
    type: String,
    required: true
  },

  context: {
    type: Object,
    default: () => ({})
  },

  entries: {
    type: Array,
    default: null
  }
})

const { locale } = useI18n()
const registry = loadLayoutSlots()

const localizeBind = (bind) => localizeDeep(bind, locale.value, __APP_ENV__)

const slots = computed(() => props.entries ?? registry[props.region] ?? [])
</script>
