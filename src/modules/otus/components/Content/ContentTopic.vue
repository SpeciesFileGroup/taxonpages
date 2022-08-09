<template>
  <div>
    <h2 class="text-sm font-medium flex">
      <IconDocument class="h-4 w-4 mr-1" />
      {{ title }}
    </h2>
    <ul 
      v-for="(text, index) in textList"
      :key="index"
      class="pt-1 pl-5"
    >
      <li v-html="text" />
    </ul>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },

  textList: {
    type: Array,
    required: true
  }
})
</script>