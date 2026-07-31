<template>
  <li
    class="py-2 last:border-0 truncate border-b border-base-border"
    :title="item.label"
  >
    <span
      class="cursor-pointer text-secondary"
      v-text="item.label"
      @click="() => emit('selected', item)"
    />
  </li>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['selected'])
</script>
