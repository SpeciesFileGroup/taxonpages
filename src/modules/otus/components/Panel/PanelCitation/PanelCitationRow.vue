<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="break-all block"
      :title="citation.label"
      v-html="citation.label"
    />
    <span
      v-if="citation.type_label"
      class="ml-4 text-base-soft"
      v-html="citation.type_label"
    />
  </li>
</template>

<script setup>
defineProps({
  citation: {
    type: Object,
    required: true
  }
})
</script>
