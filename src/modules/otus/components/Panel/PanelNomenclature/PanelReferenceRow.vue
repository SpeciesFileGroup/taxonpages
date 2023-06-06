<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="break-all block"
      :title="reference.cached"
      v-html="reference.cached"
    />
  </li>
</template>

<script setup>
defineProps({
  reference: {
    type: String,
    required: true
  }
})
</script>
