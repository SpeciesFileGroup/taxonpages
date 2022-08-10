<template>
  <VCardHeader class="border-t border-base-200 first:border-t-0">
    {{ title }}
  </VCardHeader>
  <VCardContent>
    <ul 
      v-for="(text, index) in textList"
      :key="index"
      class="pt-1 text-sm "
    >
      <li v-html="text" />
    </ul>
  </VCardContent>
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