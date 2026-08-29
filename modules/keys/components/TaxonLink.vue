<template>
  <RouterLink
    :to="{ name: 'otus-id', params: { id } }"
    target="_blank"
    rel="noopener"
    class="italic text-base-content hover:underline hover:text-secondary"
  >{{ label }}</RouterLink>
</template>

<script setup>
defineProps({
  id: { type: [Number, String], required: true },
  label: { type: String, required: true }
})
</script>
