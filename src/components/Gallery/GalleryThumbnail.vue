<template>
  <div 
    class="bg-white dark:bg-gray-800 flex flex-col justify-center cursor-pointer w-24 max-h-20 h-20 dark:border-gray-600 rounded-md border-2"
    :title="title"
  >
    <img 
      class="max-h-20 max-w-24 h-20 w-24 object-cover rounded"
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