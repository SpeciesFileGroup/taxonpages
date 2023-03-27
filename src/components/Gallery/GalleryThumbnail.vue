<template>
  <div
    class="bg-base-background flex flex-col justify-center cursor-pointer w-24 max-h-20 h-20 border-base-muted rounded-md border"
    :title="title"
  >
    <img
      class="max-h-20 max-w-24 h-20 w-24 object-contain rounded"
      :alt="title"
      :src="image.thumb"
    />
  </div>
</template>

<script setup>
defineProps({
  image: {
    type: Object,
    required: true
  },

  title: {
    type: String,
    default: undefined
  }
})
</script>
