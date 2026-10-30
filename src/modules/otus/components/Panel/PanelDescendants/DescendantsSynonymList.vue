<template>
  <ul class="synonyms">
    <li
      v-for="(synonym, index) in props.list"
      :key="synonym"
    >
      <span class="text-orange-500 mr-1">=</span>

      <RouterLink
        v-if="props.otuIds[index]"
        :to="{ name: 'otus-id', params: { id: props.otuIds[index] } }"
        v-html="synonym"
      />
      <span
        v-else
        v-html="synonym"
      />
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  list: {
    type: Array,
    required: true
  },

  otuIds: {
    type: Array,
    default: () => []
  }
})
</script>
