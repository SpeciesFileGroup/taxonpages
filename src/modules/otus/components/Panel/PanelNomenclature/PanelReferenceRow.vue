<template>
  <li class="border-b border-base-muted p-3 px-5">
    <span
      class="break-all block"
      :title="reference"
      v-html="reference"
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
