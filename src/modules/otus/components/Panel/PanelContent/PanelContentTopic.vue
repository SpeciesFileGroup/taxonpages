<template>
  <VCardHeader class="border-t border-base-muted first:border-t-0">
    {{ title }}
  </VCardHeader>
  <VCardContent class="panel-content-list">
    <div
      v-for="(text, index) in textList"
      :key="index"
      class="pt-1 text-sm"
      v-html="text"
    ></div>
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

<style>
.panel-content-list {
  ul {
    margin: 1rem 0;
    list-style: disc;
    margin-left: 1rem;
  }

  ol {
    list-style-type: decimal;
    margin-left: 1rem;
  }
}
</style>
