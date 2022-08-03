<template>
  <div>
    <p v-html="source.label" />
  </div>
</template>

<script setup>

defineProps({
  source: {
    type: Object,
    default: () => ({})
  }
})
</script>
