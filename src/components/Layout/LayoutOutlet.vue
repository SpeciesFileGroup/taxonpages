<template>
  <component
    :is="slot.component"
    v-for="(slot, index) in slots"
    :key="index"
  />
</template>

<script setup>
import { computed } from 'vue'
import { loadLayoutSlots } from '@/utils'

const registry = loadLayoutSlots()

const props = defineProps({
  region: {
    type: String,
    required: true
  }
})

const slots = computed(() => registry[props.region] || [])
</script>
