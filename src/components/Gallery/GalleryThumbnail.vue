<template>
  <div 
    class="ml-1 mr-1 mt-2 bg-white flex flex-col justify-center cursor-pointer w-24 h-24 border"
    :title="title"
  >
    <img 
      class="max-h-24 max-w-24"
      :src="image.thumb"
    >
  </div>
</template>

<script setup>

const props = defineProps({
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