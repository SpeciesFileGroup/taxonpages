<template>
  <span>{{ currentImage + 1 }}/{{ totalImages }}</span>
</template>

<script setup>
defineProps({
  currentImage: {
    type: Number,
    required: true
  },
  totalImages: {
    type: Number,
    required: true
  }
})
</script>