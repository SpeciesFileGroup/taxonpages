<template>
  <component
    :is="slot.component"
    v-for="(slot, index) in slots"
    :key="index"
    v-bind="{ ...context, ...slot.bind }"
  />
</template>

<script setup>
import { computed } from 'vue'
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

const registry = loadLayoutSlots()

const slots = computed(() => props.entries ?? registry[props.region] ?? [])
</script>
