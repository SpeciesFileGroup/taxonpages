<template>
  <div 
    class="bg-white dark:bg-gray-800 flex flex-col justify-center cursor-pointer w-24 h-24 border dark:border-gray-700"
    :title="title"
  >
    <img 
      class="h-24 w-24 max-h-24 max-w-24 object-cover"
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