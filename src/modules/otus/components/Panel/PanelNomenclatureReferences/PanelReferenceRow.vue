<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="[&>a]:break-all block"
      :title="reference"
      v-html="sanitizeAndLinkifyHtml(reference)"
    />
  </li>
</template>

<script setup>
import { sanitizeAndLinkifyHtml } from '@/utils'

defineProps({
  reference: {
    type: String,
    required: true
  }
})
</script>
