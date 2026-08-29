<template>
  <VModal @close="$emit('close')">
    <template #header><div class="text-sm font-medium">Reference</div></template>
    <div class="px-4 pb-4 text-sm leading-relaxed [&_i]:italic" v-html="sanitizeAndLinkifyHtml(citation.full)" />
  </VModal>
</template>

<script setup>
import { sanitizeAndLinkifyHtml } from '@/utils'

defineProps({ citation: { type: Object, required: true } })
defineEmits(['close'])
</script>
