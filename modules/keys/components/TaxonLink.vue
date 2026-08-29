<template>
  <span>
    <RouterLink
      :to="{ name: 'otus-id', params: { id } }"
      target="_blank"
      rel="noopener"
      class="italic text-base-content hover:underline hover:text-secondary"
    >{{ label }}</RouterLink><span
      v-if="validName"
      class="text-base-soft"
    > [= <i>{{ validName }}</i>]</span>
  </span>
</template>

<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  id: { type: [Number, String], required: true },
  label: { type: String, required: true }
})

const synonymy = inject('keySynonymy', { value: {} })
const validName = computed(() => synonymy.value?.[props.id]?.validName || '')
</script>
