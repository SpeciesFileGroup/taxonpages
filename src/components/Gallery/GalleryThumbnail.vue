<template>
  <div 
    class="bg-white dark:bg-gray-800 flex flex-col justify-center cursor-pointer w-24 h-20 dark:border-gray-600 rounded border box-border"
    :title="title"
  >
    <img 
      class="max-h-24 max-w-24 h-24 w-24 object-cover rounded"
      :src="image.thumb"
    >
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