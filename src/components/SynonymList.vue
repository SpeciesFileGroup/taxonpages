<template>
  <ul class="synonyms">
    <li
      v-for="synonym in props.list"
      :key="synonym"
    >
      <span class="text-orange-500 mr-1">=</span>
      <span v-html="synonym" />
    </li>
  </ul>
</template>

<script setup>

const props = defineProps({
  list: {
    type: Array,
    required: true
  }
})
</script>
