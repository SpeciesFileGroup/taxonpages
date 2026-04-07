<template>
  <a
    v-if="isUrl"
    :href="value"
    target="_blank"
    rel="noopener"
    class="text-secondary underline break-all"
  >
    {{ value }}
  </a>
  <span
    v-else
    class="break-all"
  >
    {{ value }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    required: true
  }
})

const isUrl = computed(
  () => props.value && /^https?:\/\//.test(String(props.value).trim())
)
</script>
