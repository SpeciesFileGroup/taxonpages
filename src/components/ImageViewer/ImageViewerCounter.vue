<template>
  <span class="p-2 text-black dark:text-white opacity-50">{{ currentImage + 1 }}/{{ totalImages }}</span>
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