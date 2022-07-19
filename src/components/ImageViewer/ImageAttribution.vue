<template>
  <div>
    <p>{{ attribution.label }}</p>
  </div>
</template>

<script setup>

defineProps({
  attribution: {
    type: Object,
    default: () => ({})
  }
})
</script>
