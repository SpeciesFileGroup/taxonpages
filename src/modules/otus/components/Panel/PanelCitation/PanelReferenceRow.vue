<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="break-all block"
      :title="source"
      v-html="source"
    />
  </li>
</template>

<script setup>
defineProps({
  source: {
    type: String,
    required: true
  }
})
</script>
