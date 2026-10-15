<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="[&>a]:break-all block"
      :title="stripHTML(reference.cached)"
      v-html="sanitizeAndLinkifyHtml(reference.cached)"
    />
  </li>
</template>

<script setup>
import { sanitizeAndLinkifyHtml } from '@/utils'
import { stripHTML } from '../../../utils'

defineProps({
  reference: {
    type: Object,
    required: true
  }
})
</script>
